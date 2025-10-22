import fs from 'fs';
import path from 'path';
import { query, testConnection, closePool } from './connection';

const runNewMigrations = async () => {
  try {
    console.log('🔄 Running new migrations...');

    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get migration files - use source directory
    const migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Get executed migrations
    const result = await query('SELECT filename FROM migrations ORDER BY id');
    const executedMigrations = result.rows.map((row: any) => row.filename);

    console.log('Executed migrations:', executedMigrations);

    // Run only new migrations (005 onwards)
    const newMigrations = migrationFiles.filter(file => 
      file >= '005_create_academic_years_table.sql' && 
      !executedMigrations.includes(file)
    );

    console.log('New migrations to run:', newMigrations);

    for (const file of newMigrations) {
      console.log(`📝 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute migration
      await query(sql);
      
      // Mark as executed
      await query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      
      console.log(`✅ Migration completed: ${file}`);
    }

    console.log('🎉 All new migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// CLI execution
if (require.main === module) {
  runNewMigrations()
    .then(() => {
      console.log('✅ New migration process completed');
      closePool();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ New migration process failed:', error);
      closePool();
      process.exit(1);
    });
}

export { runNewMigrations };