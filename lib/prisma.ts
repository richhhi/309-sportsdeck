// lib/prisma.ts
import { PrismaClient } from '@/prisma/generated/client'
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // On Vercel serverless, each function instance should use a minimal pool.
  // Aiven does not provide a built-in PgBouncer endpoint, so we limit
  // connections here to avoid exhausting the database connection limit.
  const url = new URL(connectionString)
  url.searchParams.set('connection_limit', '1')
  url.searchParams.set('pool_timeout', '10')

  const adapter = new PrismaPg({ connectionString: url.toString() })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

// Fix: assign unconditionally so the singleton is reused in both dev and prod.
// In dev this prevents new clients on every hot-reload.
// In prod (Vercel) this reuses the client across invocations within the same
// warm function instance.
export const prisma = globalThis.prisma ?? createPrismaClient()
globalThis.prisma = prisma