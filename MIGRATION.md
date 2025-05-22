# Codebase Restructuring Guide

This document outlines the changes made to restructure the Obsidian codebase from a multi-app structure to a single app architecture.

## Major Changes

1. **Directory Structure**
   - Moved from `/apps/connect/src` to `/src` at the root
   - Removed the unnecessary "connect" app layer
   - Organized components into logical categories

2. **Component Organization**
   - Components are now organized by their usage:
     - `admin`: Components used in the admin interface
     - `portal`: Components used in the client portal
     - `shared`: Components used in both areas
     - `integrations`: Components for third-party integrations

3. **Configuration Files**
   - Updated package.json to include all dependencies
   - Updated tsconfig.json paths for the new structure
   - Ensured Next.js configuration works with the new structure

## Import Path Changes

If you encounter import errors, you'll need to update import paths according to the following patterns:

- Old: `import Component from '@/components/Component'`
- New: `import Component from '@/components/shared/Component'`

OR

- Old: `import Component from '@/components/Component'`
- New: `import Component from '@/components/admin/Component'`

Depending on where the component was moved.

## Path Mapping

The `@/` alias still maps to the `src/` directory, so most imports should work with minimal changes. The major difference is the additional path segment for the component category.

## Known Issues

- You may need to clear the Next.js cache with `npm run dev -- --no-cache` if you experience strange build errors
- Some paths in the .next directory might reference old file locations until a full rebuild is done

## Future Work

1. Continue to refine component organization as the application grows
2. Create a more structured approach to shared UI components
3. Consider implementing a component library for common UI elements 

## Structure Cleanup (May 2024)

We recently performed a structural cleanup of the codebase:

1. **Removed deprecated `/src` directory**
   - All code from the root `/src` directory has been migrated to `/apps/connect/src`
   - A backup of the original `/src` directory is preserved in `/src_backup`
   - The path mapping in tsconfig.json has been updated to reflect this change

2. **Simplified deployment configuration**
   - Removed unnecessary rewrites from vercel.json
   - Updated build scripts to focus on the single app architecture

3. **Clarified documentation**
   - Updated README.md to accurately reflect the current project structure
   - Added this section to MIGRATION.md to track the changes

All development should now happen in the `/apps/connect` directory structure to maintain consistency 