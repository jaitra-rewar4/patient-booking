import type { PrismaClient } from "@prisma/client";
import { makePrismaClient } from "@/lib/prisma-client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
