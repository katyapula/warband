import { listTables } from "@/entities/table/repository";
import { TablesManager } from "@/features/manage-tables/TablesManager";
import { requireAdmin } from "@/shared/lib/auth/session";

export const metadata = { title: "Tables · Warband admin" };

export default async function AdminTablesPage() {
  await requireAdmin();
  const tables = await listTables();
  return <TablesManager tables={tables} />;
}
