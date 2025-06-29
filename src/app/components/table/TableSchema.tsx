"use client";

import { Club, Table } from "@entities/types";
import useSWR from "swr";
import { fetcher } from "@entities/fetcher";

type TableSchemaProps = {
  club: Club;
};

export default function TableSchema({ club }: TableSchemaProps) {
  const { data: tables } = useSWR(`/api/clubs/${club.id}/tables`, fetcher);
  console.log(tables, club, "111");
  return (
    <div>
      <h2>{club.name}</h2>
      <ul>
        {tables?.map((table: Table) => (
          <li key={table.id}>
            {table.name} – {table.bookings.length ? "Booked" : "Available"}
            <button>Book</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
