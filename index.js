"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const database_1 = require("./database");
const auth_1 = require("./routes/auth");
const main_1 = require("./main");
const verification_1 = require("./verification");
const api_1 = require("./routes/api");
const rateLimiter_1 = require("./rateLimiter");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ origin: [process.env.WEB_URL, process.env.API_URL], credentials: true }));
app.use('./app/', rateLimiter_1.rateLimiter);
app.use('/api2/auth', auth_1.authRouter);
app.use('/api2/api', verification_1.verifyAuth, api_1.apiRouter);
app.get('/', (_req, res) => res.status(200).send('Welcome to Loregraded'));
database_1.Database.init().then(() => app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    (0, main_1.main)();
}))
    .catch(err => {
    console.error(err);
    process.exit(-1);
});
//# sourceMappingURL=index.js.map