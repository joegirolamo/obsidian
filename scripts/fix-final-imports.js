#!/usr/bin/env node
/**
 * This script fixes the final import issues:
 * 1. @obsidian/ui imports
 * 2. AdminNav's ObsidianLogo import
 * Usage: node scripts/fix-final-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Process the AdminNav component to fix its ObsidianLogo import
const fixAdminNavImport = () => {
  const adminNavPath = path.join(process.cwd(), 'src', 'components', 'admin', 'AdminNav.tsx');
  
  if (fs.existsSync(adminNavPath)) {
    let content = fs.readFileSync(adminNavPath, 'utf-8');
    
    // Fix ObsidianLogo import
    if (content.includes('import ObsidianLogo from')) {
      content = content.replace(
        "import ObsidianLogo from './ObsidianLogo'",
        "import ObsidianLogo from '../shared/ObsidianLogo'"
      );
      
      fs.writeFileSync(adminNavPath, content, 'utf-8');
      console.log('Fixed ObsidianLogo import in AdminNav component');
    }
  }
};

// Find files with @obsidian/ui imports and fix them
const fixObsidianUIImports = () => {
  try {
    // Find files with @obsidian/ui imports
    const output = execSync('grep -r "@obsidian/ui" --include="*.tsx" src', { encoding: 'utf-8' });
    const lines = output.split('\n').filter(Boolean);
    
    const processedFiles = new Set();
    
    for (const line of lines) {
      const match = line.match(/^([^:]+):/);
      if (match) {
        const filePath = match[1];
        
        if (processedFiles.has(filePath)) continue;
        processedFiles.add(filePath);
        
        let content = fs.readFileSync(filePath, 'utf-8');
        let modified = false;
        
        // Replace @obsidian/ui/ComponentName with correct import
        if (content.includes('@obsidian/ui/Button')) {
          content = content.replace(
            /import .* from ['"]@obsidian\/ui\/Button['"]/g,
            "import Button from '@/components/shared/Button'"
          );
          modified = true;
        }
        
        if (content.includes('@obsidian/ui/Card')) {
          content = content.replace(
            /import .* from ['"]@obsidian\/ui\/Card['"]/g,
            "import Card from '@/components/shared/Card'"
          );
          modified = true;
        }
        
        // Add more component replacements as needed
        
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf-8');
          console.log(`Fixed @obsidian/ui imports in: ${filePath}`);
        }
      }
    }
  } catch (error) {
    // It's okay if grep fails (no matches)
    console.log('No @obsidian/ui imports found or error during search');
  }
};

// Main execution
console.log('Starting final import fixes...');

// Fix AdminNav's ObsidianLogo import
fixAdminNavImport();

// Fix @obsidian/ui imports
fixObsidianUIImports();

console.log('Done! Fixed final import issues.');
console.log('Remember to check that the app still builds and functions correctly after these changes.'); 