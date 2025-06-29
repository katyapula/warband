import { prisma } from "./prisma";
import type { NextApiResponse } from "next";

export default async function handler(res: NextApiResponse) {
  const clubs = await prisma.club.findMany();
  res.status(200).json(clubs);
}
