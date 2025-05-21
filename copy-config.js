const fs = require('fs');
const path = require('path');

// Define paths
const connectAppPath = path.join(__dirname, 'apps', 'connect');
const rootPath = __dirname;

// Copy tailwind.config.js from connect app to root
if (fs.existsSync(path.join(connectAppPath, 'tailwind.config.js'))) {
  const tailwindConfig = fs.readFileSync(
    path.join(connectAppPath, 'tailwind.config.js'), 
    'utf8'
  );
  
  fs.writeFileSync(
    path.join(rootPath, 'tailwind.config.js'),
    tailwindConfig,
    'utf8'
  );
  
  console.log('Copied tailwind.config.js to root');
} else {
  console.warn('Could not find tailwind.config.js in connect app');
}

// Copy postcss.config.js from connect app to root
if (fs.existsSync(path.join(connectAppPath, 'postcss.config.js'))) {
  const postcssConfig = fs.readFileSync(
    path.join(connectAppPath, 'postcss.config.js'), 
    'utf8'
  );
  
  fs.writeFileSync(
    path.join(rootPath, 'postcss.config.js'),
    postcssConfig,
    'utf8'
  );
  
  console.log('Copied postcss.config.js to root');
} else {
  console.warn('Could not find postcss.config.js in connect app');
}

// Create a simple root package.json if it doesn't exist
if (!fs.existsSync(path.join(rootPath, 'package.json'))) {
  const packageJson = {
    name: "obsidian-root",
    version: "1.0.0",
    private: true,
    dependencies: {
      tailwindcss: "^3.4.1",
      autoprefixer: "^10.4.16",
      postcss: "^8.4.32",
      "@tailwindcss/forms": "^0.5.7"
    }
  };
  
  fs.writeFileSync(
    path.join(rootPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  
  console.log('Created package.json in root with Tailwind dependencies');
} 