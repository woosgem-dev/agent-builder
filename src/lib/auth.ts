import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Store GitHub-specific data
      if (account?.provider === 'github' && profile) {
        const githubProfile = profile as { login?: string; avatar_url?: string; id?: number };
        
        // Update user with GitHub data if needed
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            username: githubProfile.login || user.name || 'unknown',
            avatarUrl: githubProfile.avatar_url || user.image,
            githubId: String(githubProfile.id),
          },
          create: {
            id: user.id,
            email: user.email,
            username: githubProfile.login || user.name || 'unknown',
            avatarUrl: githubProfile.avatar_url || user.image,
            githubId: String(githubProfile.id),
          },
        });
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
