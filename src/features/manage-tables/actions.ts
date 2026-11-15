"use server";

import { revalidatePath } from "next/cache";
import { parseTableInput, sameTableName, type TableInput } from "@/entities/table/model";
import {
  createTable,
  findTableNames,
  setTableActive,
  updateTable,
} from "@/entities/table/repository";
import { AuthError, requireAdmin } from "@/shared/lib/auth/session";

export type TableActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof TableInput, string>> };

const NOT_FOUND = "This table no longer exists. Reload the page.";

async function guard(): Promise<TableActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}

async function validate(
  raw: unknown,
  excludeId?: string,
): Promise<{ ok: true; data: TableInput } | Extract<TableActionResult, { ok: false }>> {
  const parsed = parseTableInput(raw);
  if (!parsed.ok)
    return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.fieldErrors };

  const taken = (await findTableNames()).some(
    (t) => t.id !== excludeId && sameTableName(t.name, parsed.data.name),
  );
  if (taken) {
    const error = "A table with this name already exists.";
    return { ok: false, error, fieldErrors: { name: error } };
  }
  return parsed;
}

function refresh() {
  revalidatePath("/admin/tables");
  revalidatePath("/");
}

export async function createTableAction(raw: unknown): Promise<TableActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const input = await validate(raw);
  if (!input.ok) return input;

  await createTable(input.data);
  refresh();
  return { ok: true };
}

export async function updateTableAction(id: string, raw: unknown): Promise<TableActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const input = await validate(raw, id);
  if (!input.ok) return input;

  if (!(await updateTable(id, input.data))) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true };
}

/** Deactivate hides a table from booking; its bookings stay as they are. */
export async function setTableActiveAction(
  id: string,
  isActive: boolean,
): Promise<TableActionResult> {
  const denied = await guard();
  if (denied) return denied;

  if (!(await setTableActive(id, isActive))) return { ok: false, error: NOT_FOUND };
  refresh();
  return { ok: true };
}
