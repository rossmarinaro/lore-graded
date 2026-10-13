require('dotenv').config();

import jwt from 'jsonwebtoken'

import { Request, Response, NextFunction } from 'express'
import { Database } from './database'
import { UserJwtPayload } from './types/types'
import { OAuth2Client } from 'google-auth-library'
import { getUserID } from './utils'

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


//----------------------------------------------


function getToken (req: Request): string | null
{
    //mobile token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token ? 'Retrieving token...' : 'No token present in header.');
        return token ?? null;
    }

    //fallback to cookies (web)

    else if (req.cookies && req.cookies.session_id)  {
        console.log('Retrieving cookies...');
        return req.cookies.session_id;
    }

    //none

    else {
        console.log('No token or cookies present.');
        return null;
    }
}


//----------------------------------------

// const CHATGPT_CLIENT_ID = 'chatgpt_client_123';
// const CHATGPT_CLIENT_SECRET = 'chatgpt_super_secret_456';
// // You get this exact URL from the ChatGPT Custom GPT Action configuration screen:
// const CHATGPT_REDIRECT_URI = 'https://openai.com'; 
// Temporary in-memory stores (Use Redis or MongoDB in production!)
const authCodes = new Map();
const accessTokens = new Map();

function redirectToChatGPT(req: Request, res: Response) 
{
  // 1. Explicitly check if oauthState exists first

  if (!req.session.oauthState) 
    return res.status(400).send('Authentication state missing or expired.');

  // 2. TypeScript now safely knows oauthState is defined
  const { state, redirect_uri } = req.session.oauthState;
  
  const authorizationCode = 'code_' + Math.random().toString(36).substring(2);
  authCodes.set(authorizationCode, { userId: req.session.userId });

  delete req.session.oauthState;

  res.redirect(`${redirect_uri}?code=${authorizationCode}&state=${state}`);
}


//------------------------------------


export async function verifyAuth(req: Request, res: Response, next: NextFunction) 
{
    const token = getToken(req); 

    if (!token) 
        return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.LORE_RENDER_JWT_SECRET as string) as UserJwtPayload,
              account = await Database.findOne(process.env.MONGODB_COLLECTION as string, { _id: getUserID(decoded.userId )});
                
        if (!account) 
            return res.status(403).send('No account found to authorize.');
        
        req._id = account._id;

        next();
    } 
    catch (error) {
        console.error('verifyAuth::Error: ', error);
        return res.status(403).send('Invalid or expired token.');
    }
}


//------------------------------------


export async function refreshToken(_req: Request, _res: Response) 
{
    console.log('Token refresh.');
}


//---------------------------------------- 1. Redirect users to Google for login


export async function authenticate (_req: Request, res: Response) 
{
    try {
        const scope = ['openid', 'profile', 'email'];

        const googleAuthUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline', // Generates a refresh token for extended access
            prompt: 'consent',     // Forces refresh token generation on re-auth
            scope,
            include_granted_scopes: true
        });

        res.redirect(302, googleAuthUrl);
    }
    catch(error) {
        console.error('authenticate::Error: ', error);
        res.status(500).send('Authentication failed.');
    }

    // const { client_id, redirect_uri, state } = req.query;

    // // Validate the request from ChatGPT
    // if (client_id !== process.env.CHATGPT_CLIENT_ID || redirect_uri !== process.env.CHATGPT_REDIRECT_URI) 
    //     return res.status(400).send('Invalid client parameters.');

    // // Save parameters to session memory
    // req.session.oauthState = { 
    //     state: state as string, 
    //     redirect_uri: redirect_uri as string 
    // };

    // // 🔥 USE CASE 1: Instant Single Sign-On
    // if (req.session.userId) 
    //     return redirectToChatGPT(req, res); // Skips the login page entirely!

    // const scope = ['openid', 'profile', 'email'];
    // // If not logged in, pass them along to Google Sign-In
    // const googleAuthUrl = oAuth2Client.generateAuthUrl({
    //     access_type: 'offline', // Generates a refresh token for extended access
    //     prompt: 'consent',     // Forces refresh token generation on re-auth
    //     scope,
    //     include_granted_scopes: true
    // });

    // res.redirect(googleAuthUrl);
}


//----------------------------------------- ChatGPT Token Exchange Endpoint


export function authToken(req: Request, res: Response)
{
  const { grant_type, code, client_id, client_secret } = req.body;

  if (client_id !== process.env.CHATGPT_CLIENT_ID || client_secret !== process.env.CHATGPT_CLIENT_SECRET) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  if (grant_type === 'authorization_code') {
    const sessionData = authCodes.get(code);
    if (!sessionData) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // Generate a secure access token for ChatGPT to use
    const accessToken = 'gpt_' + Math.random().toString(36).substring(2);
    accessTokens.set(accessToken, { userId: sessionData.userId });
    
    // Clean up temporary code
    authCodes.delete(code);

    // Return token to ChatGPT
    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
}


//---------------------------------------- 1. Redirect users to Google for login

export async function authenticatedCallback(req: Request, res: Response) 
{
    try {
        const { error, code } = req.query;

        if (error || !code) 
            return res.status(401).send('Auth handshake failed.');
        
        try {

            const { tokens } = await oAuth2Client.getToken(code as string);
            
            oAuth2Client.setCredentials(tokens);

            const ticket = await oAuth2Client.verifyIdToken({ idToken: tokens.id_token as string, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();

            if (!payload || !payload.email) 
                throw new Error('Invalid token payload');

            // Log user into Render session
            req.session.userId = payload.sub; // Unique Google User ID
            req.session.email = payload.email;

            // Check if the user originally came from ChatGPT

            if (req.session.oauthState) 
                return redirectToChatGPT(req, res);
            
            const projection = { email: 1 };
          
            const user = await Database.findOneAndUpdate(
                process.env.MONGODB_COLLECTION as string,
                { email: payload?.email }, 
                {}, 
                projection, 
                true
            ); 

            // 2. Generate your own custom JWT app token (expires in 1 day)
            const token = jwt.sign(
                { userId: user?._id, email: user?.email }, 
                process.env.LORE_RENDER_JWT_SECRET as string, 
                { expiresIn: '15m'/* '1d' */ }
            );

            // 3. Send the token securely to the client via an HTTP-only cookie

            const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

            res.cookie('session_id', token, {
                // 🌟 FIX: Added the leading dot to explicitly share across root and subdomains
                domain: isProd ? '.loregraded.com' : undefined, 
                httpOnly: true,
                secure: true, // 🌟 FIX: Always keep secure true since Render uses HTTPS
                // 🌟 FIX: Changed 'none' to 'lax' for secure first-party subdomain sharing
                sameSite: isProd ? 'lax' : 'none', 
                path: '/'
            }).status(200);
            
            if (!isProd)
                console.log('Authenticated token: ', token);
            
            return res.redirect(302, `${ process.env.WEB_URL }?token=${ token }`); 
        } 
        catch (error) {
            res.status(403).send('Authentication failed.');
        }
    }  
    catch(error) {   
        console.error('authenticatedCallback::Error: ', error);
        res.status(500).send('Authentication failed.');
    }
}


