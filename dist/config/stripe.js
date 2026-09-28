"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is missing from environment variables');
}
exports.stripe = new stripe_1.default(secretKey, {
    apiVersion: '2026-08-26.dahlia',
});
//# sourceMappingURL=stripe.js.map