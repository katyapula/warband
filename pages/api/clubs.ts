import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const clubs = await prisma.club.findMany();
  res.status(200).json(clubs);
}
