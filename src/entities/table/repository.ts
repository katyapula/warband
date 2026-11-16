import "server-only";
import { prisma } from "@/shared/lib/prisma";
import type { TableInput } from "./model";

export type TableRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

const select = { id: true, name: true, description: true, isActive: true } as const;

/** All tables, active first, then by name. */
export function listTables(): Promise<TableRow[]> {
  return prisma.table.findMany({ select, orderBy: [{ isActive: "desc" }, { name: "asc" }] });
}

export function findTableNames(): Promise<{ id: string; name: string }[]> {
  return prisma.table.findMany({ select: { id: true, name: true } });
}

export function createTable(input: TableInput): Promise<TableRow> {
  return prisma.table.create({ data: input, select });
}

/** Returns null when the table does not exist. */
export async function updateTable(id: string, input: TableInput): Promise<TableRow | null> {
  const { count } = await prisma.table.updateMany({ where: { id }, data: input });
  return count ? prisma.table.findUnique({ where: { id }, select }) : null;
}

/** Returns null when the table does not exist. */
export async function setTableActive(id: string, isActive: boolean): Promise<TableRow | null> {
  const { count } = await prisma.table.updateMany({ where: { id }, data: { isActive } });
  return count ? prisma.table.findUnique({ where: { id }, select }) : null;
}

/** Tables shown on the day view: active ones, by name. */
export function listActiveTables(): Promise<{ id: string; name: string; description: string | null }[]> {
  return prisma.table.findMany({
    where: { isActive: true },
    select: { id: true, name: true, description: true },
    orderBy: { name: "asc" },
  });
}
