#!/usr/bin/env node
/**
 * This script fixes import paths to match the new component structure.
 * Usage: node scripts/fix-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Component mappings - where each component has been moved to
const componentMappings = {
  'Button': 'shared',
  'Card': 'shared',
  'EditBusinessModal': 'admin',
  'EditMetricModal': 'admin',
  'MetricWorkbook': 'admin',
  'Notification': 'shared',
  'ObsidianLogo': 'shared',
  'PublishToggle': 'shared',
  'Scorecard': 'admin',
  'ToolAccessRequests': 'admin'
};

// Find all TypeScript and TSX files
const findTsFiles = () => {
  try {
    const output = execSync('find src -type f -name "*.ts*" | grep -v "node_modules"', { encoding: 'utf-8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding TypeScript files:', error);
    return [];
  }
};

// Process a file to update imports
const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let newContent = content;

    // Update import statements
    Object.entries(componentMappings).forEach(([component, category]) => {
      const importRegex = new RegExp(`import (\\{?.+\\}?) from ['"]@/components/${component}['"]`, 'g');
      if (importRegex.test(newContent)) {
        modified = true;
        newContent = newContent.replace(
          importRegex, 
          `import $1 from '@/components/${category}/${component}'`
        );
      }
    });

    // If file was modified, write changes
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
};

// Main execution
console.log('Starting import path fixes...');
const files = findTsFiles();
let updatedCount = 0;

files.forEach(file => {
  processFile(file);
});

console.log(`Done! Fixed imports in multiple files.`);
console.log('Remember to check that the app still builds and functions correctly after these changes.'); 