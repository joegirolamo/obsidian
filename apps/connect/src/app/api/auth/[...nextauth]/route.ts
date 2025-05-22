import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

// Debug environment variables
console.log('===== AUTH CONFIGURATION DEBUG =====');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('======================================');

// Verify we have a secret
if (!process.env.NEXTAUTH_SECRET) {
  console.error("CRITICAL ERROR: NEXTAUTH_SECRET is missing");
  throw new Error("NEXTAUTH_SECRET environment variable is required for production. Please add it to your environment variables.");
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
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
    async jwt({ token, user }) {
      console.log('JWT callback:', { user, token });
      if (user) {
        token.role = user.role;
        token.id = user.id;
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
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 