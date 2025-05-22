#!/bin/bash

echo "=== Starting Build Process ==="
echo "Current directory: $(pwd)"

# Ensure NextAuth environment variables are set
echo "=== Checking environment variables ==="
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "WARNING: NEXTAUTH_SECRET environment variable is missing"
  echo "You may need to set this for authentication to work properly"
fi

if [ -z "$NEXTAUTH_URL" ]; then
  echo "WARNING: NEXTAUTH_URL environment variable is missing"
fi

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