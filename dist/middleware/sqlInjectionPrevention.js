"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventSQLInjection = void 0;
const errorHandler_1 = require("./errorHandler");
const suspiciousPattern = /(--|;|\/\*|\*\/|\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|EXEC)\b)/i;
const preventSQLInjection = (req, res, next) => {
    try {
        const payloads = [req.query, req.params, req.body];
        for (const p of payloads) {
            if (p && JSON.stringify(p).match(suspiciousPattern)) {
                throw new errorHandler_1.AppError('Potential SQL injection detected', 401, 'SQLI_DETECTED');
            }
        }
        next();
    }
    catch (e) {
        next(e);
    }
};
exports.preventSQLInjection = preventSQLInjection;
//# sourceMappingURL=sqlInjectionPrevention.js.map