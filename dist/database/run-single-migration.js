"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function runSingleMigration(filename) {
    try {
        console.log(`🔄 Running migration: ${filename}`);
        const migrationPath = path_1.default.join(__dirname, 'migrations', filename);
        const sql = await promises_1.default.readFile(migrationPath, 'utf-8');
        await (0, connection_1.query)(sql);
        await (0, connection_1.query)('INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [filename]);
        console.log(`✅ Migration completed: ${filename}`);
    }
    catch (error) {
        console.error(`❌ Migration failed:`, error);
        throw error;
    }
    finally {
        await (0, connection_1.closePool)();
    }
}
const filename = process.argv[2];
if (!filename) {
    console.error('❌ Please provide a migration filename');
    console.log('Usage: ts-node src/database/run-single-migration.ts 019_create_files_table.sql');
    process.exit(1);
}
runSingleMigration(filename);
//# sourceMappingURL=run-single-migration.js.map