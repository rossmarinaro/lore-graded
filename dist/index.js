"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./config/express");
const express_2 = __importDefault(require("express"));
express_1.app.use(express_2.default.json());
express_1.app.get('/', (_req, res) => {
    res.json({ message: 'Hello from Express with TypeScript!' });
});
express_1.app.listen(express_1.PORT, () => {
    console.log(`Server is running on http://localhost:${express_1.PORT}`);
});
//# sourceMappingURL=index.js.map