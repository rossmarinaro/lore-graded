"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("./config/express");
const endpoints_1 = require("./endpoints");
express_1.app.use(express_1.express.json());
express_1.app.use('/api', endpoints_1.router);
express_1.app.get('/test', (_req, res) => {
    res.json({ message: 'Hello from Express with TypeScript!' });
});
express_1.app.listen(express_1.PORT, () => {
    console.log(`Server is running on http://localhost:${express_1.PORT}`);
});
//# sourceMappingURL=index.js.map