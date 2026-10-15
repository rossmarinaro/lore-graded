"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserID = getUserID;
const mongodb_1 = require("mongodb");
function getUserID(id) {
    let rawId = id;
    if (typeof rawId === 'string' && rawId.includes('ObjectId')) {
        const match = rawId.match(/[0-9a-fA-F]{24}/);
        rawId = match ? match[0] : rawId;
    }
    return typeof rawId === 'string' ? new mongodb_1.ObjectId(rawId.trim()) : rawId;
}
//# sourceMappingURL=utils.js.map