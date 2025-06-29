import { prisma } from "./prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const clubs = await prisma.club.findMany();
  res.status(200).json(clubs);
}
