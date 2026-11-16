import { DayView } from "@/widgets/day-view/DayView";

// Reads the session and "today" on every request.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { date } = await searchParams;
  return <DayView dateParam={date} />;
}
