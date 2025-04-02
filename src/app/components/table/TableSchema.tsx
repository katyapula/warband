"use client";

import { dayString, Table } from "@entities/types";
import { Dayjs } from "dayjs";

type TableSchemaProps = {
  date: dayString;
  tables: Table[];
};

export default function TableSchema({ date, tables }: TableSchemaProps) {
  return <div></div>;
}
