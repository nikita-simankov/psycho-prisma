import { PrismaClient } from "@prisma/client";

const prismaClient = () => new PrismaClient();

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClient>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
