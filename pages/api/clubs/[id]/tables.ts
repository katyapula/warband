import { prisma } from "../../prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  const tables = await prisma.table.findMany({
    where: { clubId: String(id) },
    include: {
      bookings: {
        where: { approved: true },
      },
    },
  });

  res.status(200).json(tables);
}
