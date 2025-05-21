#!/bin/bash

echo "=== Starting Vercel Build Process ==="
echo "Current directory: $(pwd)"
echo "Listing files and directories:"
ls -la

# Find the Next.js application - check current dir first, then common locations
if [ -f "next.config.js" ]; then
  echo "Found Next.js app in current directory"
  NEXT_APP_DIR="."
elif [ -f "apps/connect/next.config.js" ]; then
  echo "Found Next.js app in apps/connect directory"
  NEXT_APP_DIR="apps/connect"
elif [ -f "connect/next.config.js" ]; then
  echo "Found Next.js app in connect directory"
  NEXT_APP_DIR="connect"
elif [ -f "src/next.config.js" ]; then
  echo "Found Next.js app in src directory"
  NEXT_APP_DIR="src"
else
  echo "Looking for Next.js config file throughout directory..."
  NEXT_CONFIG_LOCATION=$(find . -name "next.config.js" -not -path "*/node_modules/*" | head -n 1)
  
  if [ -n "$NEXT_CONFIG_LOCATION" ]; then
    NEXT_APP_DIR=$(dirname "$NEXT_CONFIG_LOCATION")
    echo "Found Next.js app in $NEXT_APP_DIR"
  else
    echo "ERROR: Could not find Next.js app (next.config.js)"
    exit 1
  fi
fi

# Find the package directory locations
PACKAGES_DIR=""
if [ -d "packages" ]; then
  PACKAGES_DIR="packages"
elif [ -d "src/packages" ]; then
  PACKAGES_DIR="src/packages"
elif [ -d "$NEXT_APP_DIR/packages" ]; then
  PACKAGES_DIR="$NEXT_APP_DIR/packages"
elif [ -d "$NEXT_APP_DIR/src/packages" ]; then
  PACKAGES_DIR="$NEXT_APP_DIR/src/packages"
else
  echo "Warning: Could not find packages directory, but continuing..."
fi

# Set up output directory
OUTPUT_DIR="${NEXT_APP_DIR}/.next"
if [ "$NEXT_APP_DIR" = "." ]; then
  OUTPUT_DIR=".next"
fi
echo "Output directory will be: $OUTPUT_DIR"

# Build all packages if found
if [ -n "$PACKAGES_DIR" ]; then
  echo "=== Building packages in $PACKAGES_DIR ==="
  
  if [ -d "${PACKAGES_DIR}/types" ]; then
    echo "Building types package..."
    (cd "${PACKAGES_DIR}/types" && npm install --no-audit --no-fund && npm run build)
  fi
  
  if [ -d "${PACKAGES_DIR}/utils" ]; then
    echo "Building utils package..."
    (cd "${PACKAGES_DIR}/utils" && npm install --no-audit --no-fund && npm run build)
  fi
  
  if [ -d "${PACKAGES_DIR}/ui" ]; then
    echo "Building UI package..."
    (cd "${PACKAGES_DIR}/ui" && npm install --no-audit --no-fund && npm run build)
  fi
else
  echo "Warning: No packages found to build"
fi

# Build the Next.js app
echo "=== Building Next.js app in $NEXT_APP_DIR ==="
cd "$NEXT_APP_DIR" || exit 1

# Install dependencies
echo "Installing dependencies..."
npm install --no-audit --no-fund

# Generate Prisma client if schema exists
if [ -f "prisma/schema.prisma" ]; then
  echo "Generating Prisma client..."
  npx prisma generate
else
  echo "No Prisma schema found, skipping Prisma generation"
fi

# Build the Next.js app
echo "Building Next.js app..."
npm run build

echo "=== Build process completed ==="
echo "Output directory: $OUTPUT_DIR"

# Update Vercel configuration if needed
if [ "$NEXT_APP_DIR" != "." ]; then
  echo "Note: Please ensure vercel.json has outputDirectory set to: $OUTPUT_DIR"
fi

exit 0 