const fs = require('fs');
const path = require('path');

// Define the connect app path
const connectAppPath = path.join(__dirname, 'apps', 'connect');
const rootPath = __dirname;

// Create a new Vercel configuration
const vercelConfig = {
  "buildCommand": `cd ${path.relative(rootPath, connectAppPath)} && npm install && npx prisma generate && npm run build`,
  "outputDirectory": `${path.relative(rootPath, connectAppPath)}/.next`,
  "framework": "nextjs",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
};

// Write the configuration to the root directory
fs.writeFileSync(
  path.join(rootPath, 'vercel.json'),
  JSON.stringify(vercelConfig, null, 2),
  'utf8'
);

console.log('Successfully created vercel.json in root directory');

// Also create a vercel.json in the connect app directory
fs.writeFileSync(
  path.join(connectAppPath, 'vercel.json'),
  JSON.stringify({
    "buildCommand": "npm install && npx prisma generate && npm run build",
    "outputDirectory": ".next",
    "framework": "nextjs"
  }, null, 2),
  'utf8'
);

console.log('Successfully created vercel.json in connect app directory'); 