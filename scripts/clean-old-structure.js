#!/usr/bin/env node
/**
 * This script cleans up the old directory structure by:
 * 1. Copying any missing files from apps/connect to the new structure
 * 2. Removing the apps/connect directory
 * Usage: node scripts/clean-old-structure.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to create directory if it doesn't exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Function to copy migrations if they don't exist in the destination
const migratePrismaMigrations = () => {
  const sourceMigrationsDir = path.join(process.cwd(), 'apps', 'connect', 'prisma', 'migrations');
  const destMigrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  
  // Ensure the destination directory exists
  ensureDirectoryExists(destMigrationsDir);

  // Get all migration directories
  const migrations = fs.readdirSync(sourceMigrationsDir);
  
  // Copy each migration that doesn't already exist in the destination
  let migrationsCount = 0;
  migrations.forEach(migration => {
    const sourceMigrationDir = path.join(sourceMigrationsDir, migration);
    const destMigrationDir = path.join(destMigrationsDir, migration);
    
    // Skip if not a directory
    if (!fs.statSync(sourceMigrationDir).isDirectory()) {
      return;
    }
    
    // Copy migration directory if it doesn't exist
    if (!fs.existsSync(destMigrationDir)) {
      execSync(`cp -r "${sourceMigrationDir}" "${destMigrationDir}"`);
      migrationsCount++;
      console.log(`Copied migration: ${migration}`);
    }
  });
  
  // Copy migration_lock.toml if it doesn't exist
  const sourceLockFile = path.join(sourceMigrationsDir, 'migration_lock.toml');
  const destLockFile = path.join(destMigrationsDir, 'migration_lock.toml');
  
  if (fs.existsSync(sourceLockFile) && !fs.existsSync(destLockFile)) {
    fs.copyFileSync(sourceLockFile, destLockFile);
    console.log('Copied migration_lock.toml');
  }
  
  return migrationsCount;
};

// Main execution
console.log('Starting cleanup of old directory structure...');

// Step 1: Migrate Prisma migrations
const migrationsCount = migratePrismaMigrations();
console.log(`Migrated ${migrationsCount} Prisma migrations`);

// Step 2: Check for any other files that might need to be preserved
// We can add more specific file migrations here if needed

// Step 3: Remove the apps/connect directory
if (fs.existsSync(path.join(process.cwd(), 'apps', 'connect'))) {
  console.log('Removing old apps/connect directory...');
  console.log('NOTE: This action is commented out for safety. Uncomment the line below to actually delete the directory.');
  // execSync('rm -rf apps/connect');
  console.log('To remove the directory, run: rm -rf apps/connect');
}

console.log('Done! Old directory structure has been addressed.');
console.log('Remember to check that the app still builds and functions correctly after these changes.'); 