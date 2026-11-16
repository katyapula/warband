import { Mark } from "./Mark";
import { brand, fonts } from "./theme";

export const TAGLINE = "Play casual, dice hard";

/** Helmet, name and tagline, stacked. For the sign-in and About pages. */
export function BrandHero({ name = "Warband", as: Heading = "h1" }: { name?: string; as?: "h1" | "p" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
      <span style={{ color: brand.text }}>
        <Mark size={88} />
      </span>
      <Heading
        style={{
          margin: 0,
          fontFamily: fonts.display,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: brand.text,
        }}
      >
        {name}
      </Heading>
      <p style={{ margin: 0, fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase", color: brand.accent }}>
        {TAGLINE}
      </p>
    </div>
  );
}
