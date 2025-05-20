# Vercel Deployment Guide

This guide explains how to deploy the Obsidian application to Vercel along with a Postgres database.

## Prerequisites

- A Vercel account
- A GitHub repository containing your code

## Database Setup

The easiest database setup for this application is to use Vercel Postgres, which is a fully managed Postgres database service integrated with Vercel.

### Setting up Vercel Postgres

1. Go to your Vercel dashboard
2. Select your project
3. Navigate to the "Storage" tab
4. Click on "Connect Database"
5. Select "Postgres" as the database type
6. Choose your preferred region and plan
7. Create the database

Vercel will automatically add the following environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING` (used as `DIRECT_URL` in our configuration)
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

You'll need to add one more environment variable:
- `DATABASE_URL`: Set this to the same value as `POSTGRES_URL`
- `DIRECT_URL`: Set this to the same value as `POSTGRES_URL_NON_POOLING`

## Environment Variables

In addition to the database variables, you'll need to set the following environment variables in your Vercel project settings:

```
# Next Auth
NEXTAUTH_URL="https://your-deployment-url.vercel.app"
NEXTAUTH_SECRET="a-long-random-string"

# AI Provider
OPENAI_API_KEY="your-openai-api-key"
```

## Deployment

### Option 1: Deploy from GitHub

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - Framework Preset: Next.js
   - Build Command: Leave as default
   - Output Directory: Leave as default
   - Install Command: Leave as default
3. Deploy your application

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to set up and deploy your project

## Database Migrations

After your first deployment, you'll need to run database migrations to create the necessary tables. You can do this through the Vercel console:

1. Go to your project in the Vercel dashboard
2. Click on "Settings" -> "Environmental Variables"
3. Make sure all the database-related variables are set correctly
4. Go to "Deployments" tab and click on the latest deployment
5. Open the "Functions" tab and click on "Connect to Shell"
6. Run: `npx prisma db push --schema=./prisma/schema.prisma`

## Troubleshooting

### Build Errors

If you encounter TypeScript errors during build:

1. Check that all package dependencies are correctly installed
2. Verify that the environment variables are properly set
3. Try running `npx prisma generate` locally to ensure your Prisma schema is valid

### Database Connection Issues

If your application can't connect to the database:

1. Verify that the `DATABASE_URL` and `DIRECT_URL` environment variables are correctly set
2. Check that your IP address is allowed in Vercel Postgres access controls
3. Ensure that your Postgres instance is running and accessible

## Maintenance

- Monitor your database usage in the Vercel dashboard
- Set up regular database backups
- Consider adding database monitoring tools

---

This deployment configuration ensures that your application can be deployed and scaled efficiently on Vercel's platform. 