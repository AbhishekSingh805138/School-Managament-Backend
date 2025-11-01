import { query, closePool } from './connection';
import fs from 'fs/promises';
import path from 'path';

async function runSingleMigration(filename: string) {
  try {
    console.log(`🔄 Running migration: ${filename}`);
    
    const migrationPath = path.join(__dirname, 'migrations', filename);
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    await query(sql);
    
    // Record migration
    await query(
      'INSERT INTO migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      [filename]
    );
    
    console.log(`✅ Migration completed: ${filename}`);
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    throw error;
  } finally {
    await closePool();
  }
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Please provide a migration filename');
  console.log('Usage: ts-node src/database/run-single-migration.ts 019_create_files_table.sql');
  process.exit(1);
}

runSingleMigration(filename);
