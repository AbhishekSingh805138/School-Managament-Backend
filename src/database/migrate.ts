import fs from 'fs';
import path from 'path';
import { query, testConnection, closePool } from './connection';

// Migration tracking table
const createMigrationsTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  await query(sql);
};

// Get executed migrations
const getExecutedMigrations = async (): Promise<string[]> => {
  const result = await query('SELECT filename FROM migrations ORDER BY id');
  return result.rows.map((row: any) => row.filename);
};

// Mark migration as executed
const markMigrationExecuted = async (filename: string) => {
  await query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
};

// Run migrations
const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Create migrations table
    await createMigrationsTable();

    // Get migration files - check both src and dist directories
    let migrationsDir = path.join(__dirname, 'migrations');

    // If running from dist, check src directory instead
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations');
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`📝 Running migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Execute migration
        await query(sql);
        
        // Mark as executed
        await markMigrationExecuted(file);
        
        console.log(`✅ Migration completed: ${file}`);
      } else {
        console.log(`⏭️  Migration already executed: ${file}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// CLI execution
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed');
      closePool();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      closePool();
      process.exit(1);
    });
}

export { runMigrations };
