# Obsidian

Obsidian is a platform for digital marketing analytics and management.

## Project Architecture

The project is structured as follows:

```
obsidian/
├── src/                    # All source code
│   ├── app/                # Next.js app router routes
│   │   ├── admin/          # Admin area routes
│   │   ├── portal/         # Client portal routes
│   │   ├── api/            # API routes
│   │   └── auth/           # Auth related routes
│   ├── components/         # Shared components
│   │   ├── admin/          # Admin-specific components
│   │   ├── portal/         # Portal-specific components
│   │   ├── shared/         # Components used in both areas
│   │   └── integrations/   # Third-party integration components
│   ├── lib/                # Utility libraries
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles
│   └── types/              # TypeScript type definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── package.json
└── tsconfig.json
```

## Development

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Directory Structure

- `admin`: Admin interface for managing businesses, metrics, and content
- `portal`: Client portal for accessing business insights and tools
- `api`: API endpoints for data exchange
- `auth`: Authentication and authorization routes

## Component Organization

Components are organized into the following categories:
- `admin`: Components exclusively used in the admin interface
- `portal`: Components exclusively used in the client portal
- `shared`: Components used in both admin and portal areas
- `integrations`: Components for third-party integrations like Google Analytics, Meta Ads, etc.

## Packages

The project uses the following key packages:
- Next.js for the framework
- Prisma for database ORM
- NextAuth for authentication
- TailwindCSS for styling

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
