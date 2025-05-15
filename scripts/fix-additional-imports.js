#!/usr/bin/env node
/**
 * This script fixes additional import issues:
 * 1. References to packages/utils
 * 2. References to packages/ui components
 * 3. Special cases like AdminNav
 * Usage: node scripts/fix-additional-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    // Fix package/utils imports
    if (newContent.includes('packages/utils')) {
      modified = true;
      newContent = newContent.replace(
        /import \{ (.*?) \} from ['"](.*)packages\/utils['"];?/g, 
        'import { $1 } from "@obsidian/utils";'
      );
    }
    
    // Fix packages/ui components imports
    if (newContent.includes('packages/ui/src/components')) {
      modified = true;
      newContent = newContent.replace(
        /import (.*?) from ['"](.*)packages\/ui\/src\/components\/(.*?)['"];?/g, 
        'import $1 from "@obsidian/ui/$3";'
      );
    }
    
    // Fix AdminNav import
    if (newContent.includes("import AdminNav from '@/components/AdminNav'")) {
      modified = true;
      newContent = newContent.replace(
        "import AdminNav from '@/components/AdminNav'",
        "import AdminNav from '@/components/admin/AdminNav'"
      );
    }
    
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
console.log('Starting fix for additional import issues...');
const files = findTsFiles();

files.forEach(file => {
  processFile(file);
});

console.log('Done! Fixed additional import issues.');
console.log('Remember to check that the app still builds and functions correctly after these changes.'); 