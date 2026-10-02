import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'
import { Database } from './database';

interface AuthenticatedRequest extends Request {
  token?: string;
  _id?: string;
}

export interface UserJwtPayload extends jwt.JwtPayload {
    userId: string;
}

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

                const decoded = jwt.verify(token, process.env.JWT_RESET_EMAIL as string) as UserJwtPayload,
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

export const destroyCookie = (key: string, res: Response) => {
    res.cookie(key, '', { httpOnly: true, expires: new Date(0) }); 
}

