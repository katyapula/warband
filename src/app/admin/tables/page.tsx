import { listTables } from "@/entities/table/repository";
import { TablesManager } from "@/features/manage-tables/TablesManager";
import { requireAdminPage } from "@/shared/lib/auth/session";

export const metadata = { title: "Tables · Warband admin" };

export default async function AdminTablesPage() {
  await requireAdminPage("/admin/tables");
  const tables = await listTables();
  return <TablesManager tables={tables} />;
}
