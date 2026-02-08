// Prisma client - requires DATABASE_URL and prisma generate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PrismaClient: any;
try {
  // Dynamic import to prevent build errors when Prisma client is not generated
  PrismaClient = require('@prisma/client').PrismaClient;
} catch {
  console.warn('Prisma client not generated. Run: npx prisma generate');
}

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any | undefined;
};

export const prisma = PrismaClient
  ? globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
