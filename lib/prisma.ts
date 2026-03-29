// lib/prisma.ts
import { PrismaClient } from '@/prisma/generated/client'
import { PrismaPg } from "@prisma/adapter-pg";

// Create a global variable to avoid multiple Prisma Client instances in development
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Initialize the Prisma client using its default engine which automatically
// reads from the database file specified in the schema.prisma
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

// Ensure we only use one Prisma instance in production
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma