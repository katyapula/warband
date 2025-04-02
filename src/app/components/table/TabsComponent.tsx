"use client";
import { Tabs, TabsProps } from "antd";
import TableSchema from "./TableSchema";
import useSWR from "swr";
import { fetcher } from "@entities/fetcher";
import { dayString, Table } from "@entities/types";

type TabsComponentProps = {
  date: dayString;
};

export default function TabsComponent({ date }: TabsComponentProps) {
  const {
    data: reservations,
    error,
    isLoading,
  } = useSWR(
    "https://67c20a5e61d8935867e53e07.mockapi.io/reservations",
    fetcher,
  );

  const warbandTables = reservations?.filter(
    (table: Table) => table.club === "black",
  );
  const legacyTables = reservations?.filter(
    (table: Table) => table.club === "teal",
  );

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Warband",
      children: <TableSchema date={date} tables={warbandTables} />,
    },
    {
      key: "2",
      label: "Legacy",
      children: <TableSchema date={date} tables={legacyTables} />,
    },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <Tabs items={items} centered />;
}
