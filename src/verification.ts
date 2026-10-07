import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Database } from './database'
import { AuthenticatedRequest, UserJwtPayload } from './types'
import { OAuth2Client } from 'google-auth-library'
import { getUserID } from './utils'

require('dotenv').config();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

//---------------------------------------- 1. Redirect users to Google for login

export async function authenticate (_req: Request, res: Response) 
{
    try {
        const scope = ['openid', 'profile', 'email'];

        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline', // Generates a refresh token for extended access
            prompt: 'consent',     // Forces refresh token generation on re-auth
            scope,
            include_granted_scopes: true
        });

        res.redirect(302, authorizeUrl);
    }
    catch(err) {
        console.log(err);
    }
}


//---------------------------------------- 1. Redirect users to Google for login

export async function authenticatedCallback (req: Request, res: Response) 
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
            
            const user = await Database.findOneAndUpdate({ email: payload?.email }, {}, true); 

            // 2. Generate your own custom JWT app token (expires in 1 day)
            const appToken = jwt.sign(
                { userId: user?._id, email: user?.email }, 
                process.env.JWT_SECRET as string, 
                { expiresIn: '1d' }
            );

            // 3. Send the token securely to the client via an HTTP-only cookie
            res.cookie('session_token', appToken, {
                httpOnly: true, // Prevents XSS attacks from reading the token
                secure: process.env.NODE_ENV === 'production', // Requires HTTPS in production
                sameSite: 'lax'/* 'strict' */, /* 'none' */ // Prevents CSRF attacks  / 'lax' works perfectly if they share a root domain
                maxAge: 24 * 60 * 60 * 1000, // 1 day
                //domain: '.loregraded.com', 
            });
            
            if (process.env.NODE_ENV === 'development')
                console.log('Authenticated token: ', appToken)
            
            res.redirect(302, process.env.WEB_URL as string); //res.redirect(302, `${ process.env.WEB_URL }{tempToken}`); // Redirect to your app's frontend dashboard

        } catch (error) {
            res.status(500).send('Authentication failed.');
        }
    }  
    catch(err) {   
        console.log(err);
    }
}


//------------------------------------


export async function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) 
{
    const token = getToken(req);

    if (!token) 
        return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJwtPayload,
              account = await Database.findOne({ _id: getUserID(decoded.userId )});
                    
        if (account)
            req._id = account._id;
        else 
            return res.status(403).send('No account found to authorize.');

        next();
    } 
    catch (err) {
        console.log(err);
        return res.status(403).send('Invalid or expired token.');
    }
}


//----------------------------------------------


function getToken (req: AuthenticatedRequest) 
{
    //mobile token

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) 
        return req.headers.authorization.split(' ')[1];
    
    //fallback to cookies (web)

    else if (req.cookies && req.cookies.token) 
        return req.cookies.token;

    else 
        return null;
}


// export async function encryptPassword(password: string): Promise<string | null>
// {
//     try {
//         const passwordHash = await argon2.hash(password); 
//         return passwordHash;
//     }

//     catch(error) {
//         console.log(`Error encrypting password: ${ password }`, error);
//         return null;
//     }
// }