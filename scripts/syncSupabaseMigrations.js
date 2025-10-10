#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const prismaMigrationsDir = path.join(projectRoot, 'prisma', 'migrations');
const supabaseMigrationsDir = path.join(projectRoot, 'supabase', 'migrations');

function readMigrationEntries() {
  if (!fs.existsSync(prismaMigrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(prismaMigrationsDir)
    .map((name) => {
      const migrationDir = path.join(prismaMigrationsDir, name);
      let stats;
      try {
        stats = fs.statSync(migrationDir);
      } catch (err) {
        return null;
      }

      if (!stats.isDirectory()) {
        return null;
      }

      const sqlPath = path.join(migrationDir, 'migration.sql');
      if (!fs.existsSync(sqlPath)) {
        return null;
      }

      return {
        name,
        sqlPath,
        mtime: stats.mtimeMs,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.mtime - b.mtime);
}

function ensureSupabaseDirectory() {
  if (!fs.existsSync(supabaseMigrationsDir)) {
    fs.mkdirSync(supabaseMigrationsDir, { recursive: true });
  }
}

function copyMigrationFiles() {
  ensureSupabaseDirectory();

  const migrations = readMigrationEntries();
  if (!migrations.length) {
    console.log('No Prisma migrations found to copy.');
    return { copied: 0, skipped: 0 };
  }

  let copied = 0;
  let skipped = 0;

  migrations.forEach(({ name, sqlPath }) => {
    const destinationFilename = `${name}.sql`;
    const destinationPath = path.join(supabaseMigrationsDir, destinationFilename);
    const sourceContents = fs.readFileSync(sqlPath, 'utf8');

    if (fs.existsSync(destinationPath)) {
      const destinationContents = fs.readFileSync(destinationPath, 'utf8');
      if (destinationContents === sourceContents) {
        skipped += 1;
        return;
      }

      const error = new Error(
        `Supabase migration ${destinationFilename} already exists with different content.`
      );
      error.code = 'MISMATCHED_MIGRATION';
      throw error;
    }

    fs.writeFileSync(destinationPath, sourceContents, 'utf8');
    copied += 1;
    console.log(`Copied Prisma migration to Supabase: ${destinationFilename}`);
  });

  if (copied === 0) {
    console.log('Supabase migrations are already up to date.');
  }

  return { copied, skipped };
}

if (require.main === module) {
  try {
    copyMigrationFiles();
  } catch (error) {
    console.error('Failed to sync Prisma migrations to Supabase:', error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  copyMigrationFiles,
};
