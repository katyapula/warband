"use client";
import { Tabs, TabsProps } from "antd";

export default function TabsComponent({}: TabsProps) {
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Warband",
      children: "Content of Tab Pane 1",
    },
    {
      key: "2",
      label: "Legacy",
      children: "Content of Tab Pane 2",
    },
  ];

  return <Tabs items={items} centered />;
}
