"use client";
import useSWR from "swr";
import { FETCH_URL } from "../constants";
import { fetcher } from "../../entities/fetcher";

export default function Page() {
  const { data, error, isLoading } = useSWR(`${FETCH_URL}users`, fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  console.log(data);
  return (
    <table>
      <tbody>
        {data.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
