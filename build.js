const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the root directory
const rootDir = __dirname;

// Function to execute commands and log output
function runCommand(command, cwd = rootDir) {
  console.log(`\n> Running command: ${command} in ${cwd}`);
  try {
    const output = execSync(command, { cwd, stdio: 'inherit' });
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
}

// Main build function
async function build() {
  console.log('Starting build process...');
  console.log(`Root directory: ${rootDir}`);
  
  // List directories
  console.log('\n> Current directory structure:');
  runCommand('ls -la');
  
  // Build packages
  console.log('\n> Building packages...');
  
  // Build types package
  console.log('\n> Building types package...');
  const typesResult = runCommand('npm run build', path.join(rootDir, 'packages/types'));
  if (!typesResult.success) {
    console.error('Failed to build types package');
    process.exit(1);
  }
  console.log('Types package built successfully');
  
  // Build utils package
  console.log('\n> Building utils package...');
  const utilsResult = runCommand('npm run build', path.join(rootDir, 'packages/utils'));
  if (!utilsResult.success) {
    console.error('Failed to build utils package');
    process.exit(1);
  }
  console.log('Utils package built successfully');
  
  // Build UI package
  console.log('\n> Building UI package...');
  const uiResult = runCommand('npm run build', path.join(rootDir, 'packages/ui'));
  if (!uiResult.success) {
    console.error('Failed to build UI package');
    process.exit(1);
  }
  console.log('UI package built successfully');
  
  // Install dependencies in connect app
  console.log('\n> Installing dependencies in connect app...');
  const connectInstallResult = runCommand('npm install --no-audit --no-fund', path.join(rootDir, 'apps/connect'));
  if (!connectInstallResult.success) {
    console.error('Failed to install dependencies in connect app');
    process.exit(1);
  }
  
  // Generate Prisma client
  console.log('\n> Generating Prisma client...');
  const prismaResult = runCommand('npx prisma generate', path.join(rootDir, 'apps/connect'));
  if (!prismaResult.success) {
    console.error('Failed to generate Prisma client');
    process.exit(1);
  }
  
  // Build connect app
  console.log('\n> Building connect app...');
  const connectBuildResult = runCommand('npm run build', path.join(rootDir, 'apps/connect'));
  if (!connectBuildResult.success) {
    console.error('Failed to build connect app');
    process.exit(1);
  }
  
  console.log('\n> Build completed successfully!');
}

// Run the build process
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 