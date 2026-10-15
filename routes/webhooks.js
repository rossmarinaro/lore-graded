"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const webhooks_1 = require("../actions/webhooks");
exports.webhookRouter = (0, express_1.Router)();
exports.webhookRouter.post('/checkout-payment', webhooks_1.checkoutPaymentHook);
exports.webhookRouter.post('/game-payment', webhooks_1.gamePaymentHook);
//# sourceMappingURL=webhooks.js.map