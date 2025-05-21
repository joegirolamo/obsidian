#!/bin/bash

echo "=== Starting Build Process ==="
echo "Current directory: $(pwd)"
echo "Listing files and directories:"
ls -la

# Check if apps/connect exists
if [ -d "apps/connect" ]; then
  echo "Found apps/connect directory"
  
  # Build packages
  if [ -d "packages/types" ]; then
    echo "Building types package..."
    cd packages/types
    npm install --no-audit --no-fund
    npm run build
    cd ../..
  fi
  
  if [ -d "packages/utils" ]; then
    echo "Building utils package..."
    cd packages/utils
    npm install --no-audit --no-fund
    npm run build
    cd ../..
  fi
  
  if [ -d "packages/ui" ]; then
    echo "Building UI package..."
    cd packages/ui
    npm install --no-audit --no-fund
    npm run build
    cd ../..
  fi
  
  # Build connect app
  cd apps/connect
  echo "Installing dependencies for connect app..."
  npm install --no-audit --no-fund
  
  echo "Generating Prisma client..."
  npx prisma generate
  
  echo "Building connect app..."
  npm run build
  
  echo "Build completed successfully!"
else
  echo "apps/connect directory not found!"
  exit 1
fi 