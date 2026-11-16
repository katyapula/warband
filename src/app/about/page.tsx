import { getClubSettings } from "@/entities/club/repository";

export const metadata = { title: "About · Warband" };

export default async function AboutPage() {
  const { info } = await getClubSettings();

  return (
    <main style={{ maxWidth: 720 }}>
      <h1>{info.name}</h1>
      {info.location && <p>{info.location}</p>}
      {info.description ? (
        // Plain text; keep the admin's line breaks.
        <p style={{ whiteSpace: "pre-line" }}>{info.description}</p>
      ) : (
        <p>No description yet.</p>
      )}
    </main>
  );
}
