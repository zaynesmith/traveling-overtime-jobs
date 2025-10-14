const fs = require('fs');
const path = require('path');

const prismaMigrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
const supabaseMigrationsDir = path.join(__dirname, '..', 'supabase', 'supabase', 'migrations');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function filesAreIdentical(fileA, fileB) {
  const contentA = fs.readFileSync(fileA);
  const contentB = fs.readFileSync(fileB);
  return contentA.equals(contentB);
}

function main() {
  if (!fs.existsSync(prismaMigrationsDir)) {
    console.log('No Prisma migrations directory found. Nothing to sync.');
    return;
  }

  ensureDir(supabaseMigrationsDir);

  const migrationDirs = fs
    .readdirSync(prismaMigrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (migrationDirs.length === 0) {
    console.log('No Prisma migrations detected.');
    return;
  }

  let copiedCount = 0;
  const skipped = [];

  migrationDirs.forEach((dirName) => {
    const sourceFile = path.join(prismaMigrationsDir, dirName, 'migration.sql');
    if (!fs.existsSync(sourceFile)) {
      return;
    }

    const targetFile = path.join(supabaseMigrationsDir, `${dirName}.sql`);

    if (fs.existsSync(targetFile)) {
      if (filesAreIdentical(sourceFile, targetFile)) {
        skipped.push(`${dirName} (already synced)`);
        return;
      }

      throw new Error(
        `Supabase migration file ${targetFile} already exists with different contents. ` +
          'Please resolve the conflict manually before rerunning the migration sync.'
      );
    }

    fs.copyFileSync(sourceFile, targetFile);
    copiedCount += 1;
    console.log(`Copied ${sourceFile} -> ${targetFile}`);
  });

  if (copiedCount === 0) {
    console.log('Supabase migrations already up to date.');
  } else {
    console.log(`Copied ${copiedCount} migration${copiedCount === 1 ? '' : 's'} to Supabase directory.`);
  }

  if (skipped.length > 0) {
    console.log('Skipped migrations:', skipped.join(', '));
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
