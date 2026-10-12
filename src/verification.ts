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

//------------------------------------


export async function verifyAuth(req: Request, res: Response, next: NextFunction) 
{
    const token = getToken(req); 

    if (!token) 
        return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJwtPayload,
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
            const ticket = await oAuth2Client.verifyIdToken({ idToken: tokens.id_token as string, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            
            if (!payload || !payload.email) 
                throw new Error('Invalid token payload');
            
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
                process.env.JWT_SECRET as string, 
                { expiresIn: '5m'/* '1d' */ }
            );

            // 3. Send the token securely to the client via an HTTP-only cookie

            const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

            // res.cookie('session_id', appToken, {
            //     // 🌟 FIX: Added the leading dot to explicitly share across root and subdomains
            //     domain: isProd ? '.loregraded.com' : undefined, 
            //     httpOnly: true,
            //     secure: true, // 🌟 FIX: Always keep secure true since Render uses HTTPS
            //     // 🌟 FIX: Changed 'none' to 'lax' for secure first-party subdomain sharing
            //     sameSite: isProd ? 'lax' : 'none', 
            //     path: '/'
            // }).status(200);
            
            if (!isProd)
                console.log('Authenticated token: ', token);
            
            return res.redirect(302, `${ process.env.WEB_URL }?token=${ token }` /* process.env.WEB_URL as string */); //res.redirect(302, `${ process.env.WEB_URL }{tempToken}`); // Redirect to your app's frontend dashboard
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


