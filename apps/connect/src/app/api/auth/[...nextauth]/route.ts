import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "next-auth";

// Immediately log environment variables for debugging
console.log('=====================================');
console.log('NextAuth setup - Environment check:');
console.log('GOOGLE_CLIENT_ID length:', process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.length : 0);
console.log('GOOGLE_CLIENT_SECRET length:', process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.length : 0);
console.log('=====================================');

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

// Debug environment info (without exposing actual values)
console.log('===== AUTH CONFIGURATION DEBUG =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('======================================');

// Only in development, append an error handler to the config
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction && !process.env.NEXTAUTH_SECRET) {
  console.error("Error: NEXTAUTH_SECRET missing in production environment");
  console.log('Available env variables:', Object.keys(process.env).join(', '));
}

// Allowed email domains for Google login
const allowedDomains = ['vokal.io']; // Change this to your organization's domain

// Determine the callback URL based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const baseUrl = isDevelopment 
  ? 'http://localhost:3000' 
  : process.env.NEXTAUTH_URL;

// Validate baseUrl is available in production
if (!isDevelopment && !baseUrl) {
  console.error('WARNING: NEXTAUTH_URL is not set in production environment');
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          redirect_uri: `${baseUrl}/api/auth/callback/google`
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Authorize called with credentials:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials');
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        console.log('User found:', user ? 'yes' : 'no');

        if (!user || !user.password) {
          console.log('User not found or no password');
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow signin if using credentials provider (username/password)
      if (account?.provider === 'credentials') {
        return true;
      }
      
      // For Google sign-in, check if email domain is allowed
      if (account?.provider === 'google' && user.email) {
        const emailDomain = user.email.split('@')[1];
        if (allowedDomains.includes(emailDomain)) {
          // The role will be set by the JWT callback, no need to update here
          // as the user might not exist in the database yet
          return true;
        }
        console.log(`Sign-in attempt from unauthorized domain: ${emailDomain}`);
        return false; // Block sign-in for non-allowed domains
      }
      
      return false; // Block sign-in for other providers by default
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback:', { user, token, isNewUser: !!account });
      
      // If this is a new sign-in
      if (user) {
        token.role = user.role || 'USER';
        token.id = user.id;
        
        // If this is a Google sign-in from an allowed domain, set role to ADMIN
        if (account?.provider === 'google' && user.email) {
          const emailDomain = user.email.split('@')[1];
          if (allowedDomains.includes(emailDomain)) {
            token.role = 'ADMIN';
            
            // Try to update the user's role in the database if the user exists
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: 'ADMIN' }
              });
              console.log(`Updated user ${user.id} to ADMIN role`);
            } catch (error) {
              // User might not exist in the database yet, which is fine
              // The adapter will create it with the default role
              console.log('Could not update user role, may be a new user:', error);
            }
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Error page to show authentication errors
  },
  debug: isProduction ? false : true,
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 