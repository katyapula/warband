"use client";

import { Club, dayString } from "@entities/types";

type TableSchemaProps = {
  date: dayString;
  club: Club;
};

export default function TableSchema({ date, club }: TableSchemaProps) {
  console.log(date, club, "111");
  return <div></div>;
}
