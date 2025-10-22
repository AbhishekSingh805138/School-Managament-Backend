"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNewMigrations = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
const runNewMigrations = async () => {
    try {
        console.log('🔄 Running new migrations...');
        const connected = await (0, connection_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        const migrationsDir = path_1.default.join(process.cwd(), 'src', 'database', 'migrations');
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        const result = await (0, connection_1.query)('SELECT filename FROM migrations ORDER BY id');
        const executedMigrations = result.rows.map((row) => row.filename);
        console.log('Executed migrations:', executedMigrations);
        const newMigrations = migrationFiles.filter(file => file >= '005_create_academic_years_table.sql' &&
            !executedMigrations.includes(file));
        console.log('New migrations to run:', newMigrations);
        for (const file of newMigrations) {
            console.log(`📝 Running migration: ${file}`);
            const filePath = path_1.default.join(migrationsDir, file);
            const sql = fs_1.default.readFileSync(filePath, 'utf8');
            await (0, connection_1.query)(sql);
            await (0, connection_1.query)('INSERT INTO migrations (filename) VALUES ($1)', [file]);
            console.log(`✅ Migration completed: ${file}`);
        }
        console.log('🎉 All new migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};
exports.runNewMigrations = runNewMigrations;
if (require.main === module) {
    runNewMigrations()
        .then(() => {
        console.log('✅ New migration process completed');
        (0, connection_1.closePool)();
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ New migration process failed:', error);
        (0, connection_1.closePool)();
        process.exit(1);
    });
}
//# sourceMappingURL=run-new-migrations.js.map