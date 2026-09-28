"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.app = exports.express = void 0;
const express_1 = __importDefault(require("express"));
exports.express = express_1.default;
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
exports.PORT = PORT;
//# sourceMappingURL=express.js.map