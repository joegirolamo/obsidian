#!/bin/bash

echo "=== Starting Build Process ==="
echo "Current directory: $(pwd)"

# Build packages
echo "Building packages..."
if [ -d "packages/types" ]; then
  cd packages/types
  npm install --no-audit --no-fund
  npm run build
  cd ../..
fi

if [ -d "packages/utils" ]; then
  cd packages/utils
  npm install --no-audit --no-fund
  npm run build
  cd ../..
fi

if [ -d "packages/ui" ]; then
  cd packages/ui
  npm install --no-audit --no-fund
  npm run build
  cd ../..
fi

# Now build the connect app
echo "Building connect app..."
cd apps/connect

# Make sure we're using an explicit tailwind version
echo "Installing dependencies specifically for connect app..."
npm install --no-audit --no-fund
rm -rf node_modules/tailwindcss
npm install --save tailwindcss@3.3.0 autoprefixer@10.4.16 postcss@8.4.32 @tailwindcss/forms@0.5.7
npm list tailwindcss

# Generate Prisma client
npx prisma generate

# Build the app
npm run build

echo "Build completed successfully!" 