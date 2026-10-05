import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import { Database } from './database'
import { AuthenticatedRequest, UserJwtPayload } from './types'
import { OAuth2Client } from 'google-auth-library'


const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

//---------------------------------------- 1. Redirect users to Google for login

export async function authenticate (_req: Request, res: Response) {
    try {
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline', // Generates a refresh token for extended access
            prompt: 'consent',     // Forces refresh token generation on re-auth
            scope: [
                'openid',
                'profile',
                'email'
            ],
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
        const { code } = req.query;

        try {
            const { tokens } = await oAuth2Client.getToken(code as string);
            const ticket = await oAuth2Client.verifyIdToken({
                idToken: tokens.id_token as string,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            
            // 1. Look up or save user in your database
            // const user = await db.users.findOrCreate({ email: payload.email, name: payload.name });

            const user = await Database.findOneAndUpdate({ email: payload?.email }, {}, 1, 1, true); 

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
                sameSite: 'strict', // Prevents CSRF attacks  / 'lax' works perfectly if they share a root domain
                maxAge: 24 * 60 * 60 * 1000, // 1 day
                domain: '.loregraded.com', 
            });

            res.redirect(process.env.BASE_URL as string); //res.redirect(302, `${ process.env.BASE_URL }{tempToken}`); // Redirect to your app's frontend dashboard

        } catch (error) {
            res.status(500).send('Authentication failed.');
        }
    }
    catch(err) {
        console.log(err);
    }
}



//-----------------------------------------


export function verifyToken (req: AuthenticatedRequest, _res: Response, next: NextFunction)
{
    const authHeader = req.headers.authorization;
    
    if (authHeader !== undefined) 
    {
        const bearer = authHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;

        next();
    }
    else
        return {}
}


//------------------------------------


export const verifyCookie = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    try {
        const token = req.cookies.jwt;

        if (token)
        {
            try {

                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserJwtPayload,
                      account = await Database.findOne({ _id: decoded.userId });
                
                if (account)
                    req._id = account._id;

                next();
            }
            catch(error) {
                res.status(401).json({ message: `Not authorized. Token invalid: ${ error }` });
            }
        }
        else
            res.status(401).json({ message: 'Not authorized. No token.' });
    }

    catch(error) {
        res.status(500).json({ message: `There was a problem. ${ error }` });
    }
}


//----------------------------------------------


export const destroyCookie = (key: string, res: Response) => {
    res.cookie(key, '', { httpOnly: true, expires: new Date(0) }); 
}


//----------------------------------------------


export async function encryptPassword(password: string): Promise<string | null>
{
    try {
        const passwordHash = await argon2.hash(password); 
        return passwordHash;
    }

    catch(error) {
        console.log(`Error encrypting password: ${ password }`, error);
        return null;
    }
}