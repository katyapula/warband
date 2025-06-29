"use client";
import { Tabs } from "antd";
import TableSchema from "./TableSchema";
import useSWR from "swr";
import { Club, dayString } from "@entities/types";
import { fetcher } from "@entities/fetcher";

type TabsComponentProps = {
  date: dayString;
};

export default function TabsComponent({ date }: TabsComponentProps) {
  const { data: clubs, error, isLoading } = useSWR("/api/clubs", fetcher);

  const clubsItems = clubs?.map((club: Club) => ({
    key: club.id,
    label: club.name,
    children: <TableSchema date={date} club={club} />,
  }));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <Tabs items={clubsItems} centered />;
}
