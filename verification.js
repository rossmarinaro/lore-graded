"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = verifyAuth;
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
        console.log(token ? 'Retrieving token...' : 'No token present in header.');
        return token ?? null;
    }
    else if (req.cookies && req.cookies.token) {
        console.log('Retrieving cookies...');
        return req.cookies.token;
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET), account = await database_1.Database.findOne(process.env.MONGODB_COLLECTION, { _id: (0, utils_1.getUserID)(decoded.userId) });
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
async function authenticate(_req, res) {
    try {
        const scope = ['openid', 'profile', 'email'];
        const googleAuthUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope,
            include_granted_scopes: true
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
        const { error, code } = req.query;
        if (error || !code)
            return res.status(401).send('Auth handshake failed.');
        try {
            const { tokens } = await oAuth2Client.getToken(code);
            const ticket = await oAuth2Client.verifyIdToken({ idToken: tokens.id_token, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            if (!payload || !payload.email)
                throw new Error('Invalid token payload');
            const projection = { email: 1 };
            const user = await database_1.Database.findOneAndUpdate(process.env.MONGODB_COLLECTION, { email: payload?.email }, {}, projection, true);
            const appToken = jsonwebtoken_1.default.sign({ userId: user?._id, email: user?.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            res.cookie('session_token', appToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
                domain: 'loregraded.com'
            });
            if (process.env.NODE_ENV !== 'production')
                console.log('Authenticated token: ', appToken);
            res.redirect(302, process.env.WEB_URL);
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