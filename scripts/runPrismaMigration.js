#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const { copyMigrationFiles } = require('./syncSupabaseMigrations');

const projectRoot = path.resolve(__dirname, '..');

function runPrismaMigrate() {
  const args = process.argv.slice(2);
  const prismaArgs = ['prisma', 'migrate', 'dev', ...args];
  const child = spawn('npx', prismaArgs, {
    stdio: 'inherit',
    cwd: projectRoot,
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
      return;
    }

    try {
      copyMigrationFiles();
    } catch (error) {
      console.error('Failed to copy Prisma migration to Supabase:', error.message);
      process.exit(1);
    }
  });
}

runPrismaMigrate();
