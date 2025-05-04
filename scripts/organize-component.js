#!/usr/bin/env node
/**
 * This script helps organize components into the correct directory structure.
 * Usage: node scripts/organize-component.js <component-name> <category>
 * Where category is one of: admin, portal, shared, integrations
 */

const fs = require('fs');
const path = require('path');

const [,, componentName, category] = process.argv;

if (!componentName || !category) {
  console.error('Usage: node scripts/organize-component.js <component-name> <category>');
  console.error('Where category is one of: admin, portal, shared, integrations');
  process.exit(1);
}

const validCategories = ['admin', 'portal', 'shared', 'integrations'];
if (!validCategories.includes(category)) {
  console.error(`Invalid category: ${category}`);
  console.error('Valid categories are: admin, portal, shared, integrations');
  process.exit(1);
}

const sourceFile = path.join(process.cwd(), 'src', 'components', `${componentName}.tsx`);
const targetDir = path.join(process.cwd(), 'src', 'components', category);
const targetFile = path.join(targetDir, `${componentName}.tsx`);

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Source file does not exist: ${sourceFile}`);
  process.exit(1);
}

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Move the file
fs.copyFileSync(sourceFile, targetFile);
fs.unlinkSync(sourceFile);

console.log(`Successfully moved ${componentName} to ${category} category.`);

// Now find all imports of this component in the codebase and update them
console.log('Remember to update imports in files that use this component:');
console.log(`Old: import ${componentName} from '@/components/${componentName}'`);
console.log(`New: import ${componentName} from '@/components/${category}/${componentName}'`); 