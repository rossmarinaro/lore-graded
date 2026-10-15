"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = verifyAuth;
exports.refreshToken = refreshToken;
exports.authenticate = authenticate;
exports.authenticatedCallback = authenticatedCallback;
require('dotenv').config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./database");
const google_auth_library_1 = require("google-auth-library");
const utils_1 = require("./utils");
const oAuth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
function getToken(req) {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token ? `Retrieving token: ${token}` : 'No token present in header.');
        return token ?? null;
    }
    else if (req.cookies && req.cookies.session_id) {
        console.log('Retrieving cookies: ', req.cookies);
        return req.cookies.session_id;
    }
    else {
        console.log('No token or cookies present.');
        return null;
    }
}
async function verifyAuth(req, res, next) {
    const token = getToken(req);
    if (!token)
        return res.status(401).send('Access denied. No token provided.');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.CROSS_SERVICE_SECRET), account = await database_1.Database.findOne(process.env.MONGODB_COLLECTION, { _id: (0, utils_1.getUserID)(decoded.userId) });
        if (!account) {
            console.log('account not verified: ', decoded.userId);
            return res.status(403).send('No account found to authorize.');
        }
        else
            console.log('account verified: ', account._id);
        req.id = account._id;
        next();
    }
    catch (error) {
        console.error('verifyAuth::Error: ', error);
        return res.status(403).send('Invalid or expired token.');
    }
}
async function refreshToken(_req, _res) {
    console.log('Token refresh.');
}
async function authenticate(req, res) {
    const { redirect_uri, state } = req.query;
    try {
        const googleStatePayload = Buffer.from(JSON.stringify({
            redirect_uri,
            state,
            isGptFlow: !!redirect_uri
        })).toString('base64');
        const scope = ['openid', 'profile', 'email'];
        const googleAuthUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope,
            include_granted_scopes: true,
            state: googleStatePayload
        });
        res.redirect(302, googleAuthUrl);
    }
    catch (error) {
        console.error('authenticate::Error: ', error);
        res.status(500).send('Authentication failed.');
    }
}
async function authenticatedCallback(req, res) {
    try {
        const { error, code, state } = req.query;
        if (error || !code || !state)
            return res.status(401).send('Auth handshake failed.');
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            const ticket = await oAuth2Client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            if (!payload || !payload.email)
                throw new Error('Invalid token payload');
            const projection = { email: 1 };
            const user = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { email: payload?.email }, {}, projection, true);
            const token = jsonwebtoken_1.default.sign({ userId: user?._id, email: user?.email }, process.env.CROSS_SERVICE_SECRET, { expiresIn: '15m' });
            const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
            res.cookie('session_id', token, {
                domain: isProd ? '.loregraded.com' : undefined,
                httpOnly: true,
                secure: true,
                sameSite: isProd ? 'lax' : 'none',
                path: '/'
            }).status(200);
            if (!isProd)
                console.log('Authenticated token: ', token);
            return res.redirect(302, `${process.env.WEB_URL}?token=${token}`);
        }
        catch (error) {
            res.status(403).send('Authentication failed.');
        }
    }
    catch (error) {
        console.error('authenticatedCallback::Error: ', error);
        res.status(500).send('Authentication failed.');
    }
}
//# sourceMappingURL=verification.js.map