/**
 * @module db/prisma
 * @description This file creates and exports a singleton instance of the Prisma client.
 * The Prisma client provides typesafe access to the database based on the schema defined in prisma/schema.prisma.
 * This singleton pattern ensures we reuse the same database connection throughout the application.
 */

import { PrismaClient } from '@prisma/client'

// Declare global to extend PrismaClient for additional properties
declare global {
  var prisma: PrismaClient | undefined
}

/**
 * Configure Prisma client with:
 * - Log levels appropriate for environment
 * - Connection timeout settings
 * - Pool settings
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    // Add connection timeout options for better stability
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

/**
 * A singleton instance of the Prisma client for database interactions.
 * Ensures that in development we don't create a new connection on every HMR (Hot Module Replacement)
 * Import this instance when database access is needed throughout the application.
 */
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Add a connection health check helper method
export async function checkPrismaConnection() {
  try {
    // Simple query to check the connection
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Prisma connection error:', error)
    // Try to reconnect
    try {
      await prisma.$connect()
      return true
    } catch (reconnectError) {
      console.error('Failed to reconnect to database:', reconnectError)
      return false
    }
  }
} 
