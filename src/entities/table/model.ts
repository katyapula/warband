import { z } from "zod";

export const TABLE_NAME_MAX = 50;
export const TABLE_DESCRIPTION_MAX = 200;

/** What an admin submits when creating or editing a table. */
export const tableInputSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .trim()
    .min(1, { error: "Name is required." })
    .max(TABLE_NAME_MAX, { error: `Name must be at most ${TABLE_NAME_MAX} characters.` }),
  description: z
    .string()
    .trim()
    .max(TABLE_DESCRIPTION_MAX, {
      error: `Description must be at most ${TABLE_DESCRIPTION_MAX} characters.`,
    })
    .nullish()
    .transform((v) => v || null),
});

export type TableInput = z.infer<typeof tableInputSchema>;

export type TableInputResult =
  | { ok: true; data: TableInput }
  | { ok: false; fieldErrors: Partial<Record<keyof TableInput, string>> };

export function parseTableInput(raw: unknown): TableInputResult {
  const result = tableInputSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Partial<Record<keyof TableInput, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if ((field === "name" || field === "description") && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return { ok: false, fieldErrors };
}

/** Names compare case- and whitespace-insensitively ("Table 1" = " table 1 "). */
export function sameTableName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}
