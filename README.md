# Obsidian - Business Analytics & Opportunity Platform

Obsidian is a comprehensive business analytics and opportunity management platform built with Next.js, featuring both an admin portal and client portal. It helps businesses track metrics, identify opportunities, and manage various integrations with marketing and analytics tools.

## Features

### Admin Portal
- **Business Profile Management**: Create and manage business profiles with detailed information
- **Scorecard**: Track and visualize business metrics and KPIs
- **Opportunities**: Generate and publish business growth opportunities
- **Tool Integrations**: Connect with various marketing and analytics tools:
  - Google Analytics
  - Google Ads
  - Meta Ads
  - Meta Page
  - LinkedIn Page
  - LinkedIn Ads
  - Shopify
  - Leadsie
- **Settings**: Configure application settings and user permissions

### Client Portal
- View published scorecards and metrics
- Access opportunities generated for their business
- Integrate with various marketing tools through a simplified interface

## Project Architecture

This project is set up as a monorepo with the following structure:

```
/
├── apps/
│   └── connect/        # Main Next.js application
│       ├── src/
│       │   ├── app/    # Next.js App Router
│       │   │   ├── admin/    # Admin portal routes
│       │   │   ├── api/      # API routes
│       │   │   ├── auth/     # Authentication routes
│       │   │   └── portal/   # Client portal routes
│       │   ├── components/   # React components
│       │   ├── lib/          # Utility libraries
│       │   └── types/        # TypeScript type definitions
│       └── prisma/           # Database schema and migrations
├── packages/           # Shared packages
│   ├── ui/             # UI components
│   ├── types/          # Type definitions
│   └── utils/          # Utilities
└── package.json        # Root package.json
```

> **Important**: All development should happen in the `/apps/connect` directory.

## Technology Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth and Credentials providers
- **Deployment**: Vercel with serverless functions

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or remote)

### Environment Variables
Create a `.env.local` file in the `apps/connect` directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/obsidian"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the database:
   ```bash
   cd apps/connect
   npx prisma generate
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User**: Authentication and user management
- **Business**: Business profiles and configuration
- **ClientPortal**: Client access to business data
- **Metric**: Business metrics and KPIs
- **Opportunity**: Growth opportunities for businesses
- **Tool**: Integration with external marketing tools

## Authentication

The application uses NextAuth.js for authentication with two providers:
- **Google OAuth**: For organization-based logins (configurable domains)
- **Credentials**: Email/password login

User roles include:
- **ADMIN**: Full access to the admin portal and all businesses
- **USER**: Access to assigned businesses and client portal

## Deployment on Vercel

### Prerequisites
- Vercel account
- PostgreSQL database (Vercel Postgres recommended)

### Environment Variables for Vercel
Set the following environment variables in your Vercel project:

```
# Database (if using Vercel Postgres, these are set automatically)
DATABASE_URL="your-postgres-connection-string"
DIRECT_URL="your-postgres-direct-connection-string"

# NextAuth
NEXTAUTH_URL="https://your-deployment-url.vercel.app"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Deployment Steps
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
3. Set the environment variables listed above
4. Deploy your application

After initial deployment, you'll need to run database migrations:
```bash
npx prisma db push --schema=./prisma/schema.prisma
```

## Serverless Considerations

When deploying to Vercel's serverless environment:
- The application is designed to work with Vercel's serverless functions
- Authentication uses a fallback mechanism for token-based authentication when session cookies don't work properly
- The database connection is optimized for serverless environments using Prisma's connection pooling

## Troubleshooting

### Common Issues
- **Authentication errors**: Ensure NEXTAUTH_URL and NEXTAUTH_SECRET are set correctly
- **Database connection issues**: Verify DATABASE_URL and DIRECT_URL are correct
- **API errors in production**: Check Vercel logs for detailed error information

## Development Roadmap

Future development plans include:
- Enhanced analytics dashboard
- Additional tool integrations
- Improved error handling and logging
- Performance optimizations for serverless environment

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
