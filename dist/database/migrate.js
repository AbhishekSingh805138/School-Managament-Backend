"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const createMigrationsTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
    await (0, connection_1.query)(sql);
};
const getExecutedMigrations = async () => {
    const result = await (0, connection_1.query)('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map((row) => row.filename);
};
const markMigrationExecuted = async (filename) => {
    await (0, connection_1.query)('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
};
const runMigrations = async () => {
    try {
        console.log('🔄 Starting database migrations...');
        const connected = await (0, connection_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        await createMigrationsTable();
        let migrationsDir = path_1.default.join(__dirname, 'migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            migrationsDir = path_1.default.join(process.cwd(), 'src', 'database', 'migrations');
        }
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        const executedMigrations = await getExecutedMigrations();
        for (const file of migrationFiles) {
            if (!executedMigrations.includes(file)) {
                console.log(`📝 Running migration: ${file}`);
                const filePath = path_1.default.join(migrationsDir, file);
                const sql = fs_1.default.readFileSync(filePath, 'utf8');
                await (0, connection_1.query)(sql);
                await markMigrationExecuted(file);
                console.log(`✅ Migration completed: ${file}`);
            }
            else {
                console.log(`⏭️  Migration already executed: ${file}`);
            }
        }
        console.log('🎉 All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};
exports.runMigrations = runMigrations;
if (require.main === module) {
    runMigrations()
        .then(() => {
        console.log('✅ Migration process completed');
        (0, connection_1.closePool)();
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Migration process failed:', error);
        (0, connection_1.closePool)();
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map