"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const node_schedule_1 = __importDefault(require("node-schedule"));
function main() {
    const rule = '45 19 * * 0';
    const job = node_schedule_1.default.scheduleJob('sunday-drop-cron', rule, () => {
        console.log(`Scheduled job: ${job.name} completed.`);
    });
    console.log(`Scheduled job: ${job.name} initiated.`);
}
//# sourceMappingURL=main.js.map