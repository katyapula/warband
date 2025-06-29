"use client";
import { Tabs } from "antd";
import TableSchema from "./TableSchema";
import useSWR from "swr";
import { Club } from "@entities/types";
import { fetcher } from "@entities/fetcher";

export default function TabsComponent() {
  const { data: clubs } = useSWR("/api/clubs", fetcher);

  const clubsItems = clubs?.map((club: Club) => ({
    key: club.id,
    label: club.name,
    children: <TableSchema club={club} />,
  }));

  return <Tabs items={clubsItems} centered />;
}
