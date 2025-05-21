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
npm install --no-audit --no-fund
npm install -D tailwindcss@3.4.1 autoprefixer@10.4.16 postcss@8.4.32 @tailwindcss/forms@0.5.7
npx prisma generate
npm run build

echo "Build completed successfully!" 