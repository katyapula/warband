import { getClubSettings } from "@/entities/club/repository";
import { BrandHero } from "@/shared/ui/BrandHero";
import { brand } from "@/shared/ui/theme";

export const metadata = { title: "About · Warband" };

const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

export default async function AboutPage() {
  const { info } = await getClubSettings();

  return (
    <main style={{ maxWidth: "65ch", margin: "24px auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <BrandHero name={info.name} />
      {info.location && (
        <p style={{ margin: 0, textAlign: "center" }}>
          <a href={mapsUrl(info.location)} target="_blank" rel="noopener noreferrer">
            📍 {info.location}
          </a>
        </p>
      )}
      <section
        style={{
          padding: "20px 24px",
          background: brand.surface,
          border: `1px solid ${brand.line}`,
          borderRadius: 12,
          lineHeight: 1.6,
        }}
      >
        {info.description ? (
          // Plain text; keep the admin's line breaks.
          <p style={{ margin: 0, whiteSpace: "pre-line" }}>{info.description}</p>
        ) : (
          <p style={{ margin: 0, color: brand.muted }}>No description yet.</p>
        )}
      </section>
    </main>
  );
}
