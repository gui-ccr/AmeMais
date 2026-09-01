import { ImageResponse } from "next/og";

export const alt = "AmeMais — Proteção Animal em Teófilo Otoni";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          backgroundColor: "#faf6ef",
          backgroundImage:
            "radial-gradient(circle at 15% 15%, #f3ead9 0%, #faf6ef 45%), radial-gradient(circle at 90% 85%, #f0c9a8 0%, transparent 40%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: "50%",
            backgroundColor: "#b4543f",
            color: "#ffffff",
            fontSize: 72,
          }}
        >
          🐾
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            color: "#2e2a26",
          }}
        >
          AmeMais
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#5c554c",
            maxWidth: 780,
            textAlign: "center",
          }}
        >
          Proteção animal em Teófilo Otoni · MG
        </div>
      </div>
    ),
    { ...size },
  );
}
