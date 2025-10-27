"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
nimport;
{
    asyncHandler;
}
from;
'../middleware/errorHandler';
nimport;
{
    AuditLogger;
}
from;
'../middleware/auditLogger';
nimport;
{
    z;
}
from;
'zod';
n;
n;
n;
nconst;
GetAuditLogsSchema = z.object({ n, userId: z.string().optional(), n, eventType: z.string().optional(), n, startDate: z.string().datetime().optional(), n, endDate: z.string().datetime().optional(), n, limit: z.coerce.number().min(1).max(1000).default(100), n, page: z.coerce.number().min(1).default(1), n });
n;
n;
nexport;
const getAuditLogs = asyncHandler(async (req, res) => { n; });
//# sourceMappingURL=auditController.js.map