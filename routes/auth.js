"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const verification_1 = require("../verification");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.get('/google', verification_1.authenticate);
exports.authRouter.get('/google/callback', verification_1.authenticatedCallback);
//# sourceMappingURL=auth.js.map