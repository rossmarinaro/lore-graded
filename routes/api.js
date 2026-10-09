"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const marketplace_1 = require("../actions/marketplace");
const main_1 = require("../actions/main");
exports.apiRouter = (0, express_1.Router)();
exports.apiRouter.post('/logout', main_1.logout);
exports.apiRouter.post('/sync-users', main_1.syncUsers);
exports.apiRouter.post('/submit-order', main_1.submitOrderToQueue);
exports.apiRouter.post('/checkout', main_1.checkout);
exports.apiRouter.post('/seller/onboard', marketplace_1.marketplaceOnboard);
exports.apiRouter.post('/webhooks', main_1.webhook);
//# sourceMappingURL=api.js.map