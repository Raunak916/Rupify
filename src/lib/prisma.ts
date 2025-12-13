import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient
}//because global or window object are not affected by hot reload 

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
/*
-It first checks if a Prisma Client already exists on the global object (to avoid creating multiple instances, which can cause problems in development).
-If it doesn’t exist, it creates a new Prisma Client.
-In development mode (not production), it saves the Prisma Client to the global object so it can be reused.
-Finally, it exports this prisma instance for use in your app.
*/ 