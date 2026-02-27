import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b1620 0%, #11212D 45%, #253745 100%)",
          color: "#FFFFFF",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Aagam AI
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 36,
            color: "#CCD0CF",
            maxWidth: 900,
          }}
        >
          Inventory intelligence for modern supply chains
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 24,
            color: "#9BA8AB",
          }}
        >
          Forecast. Optimize. Act faster.
        </div>
      </div>
    ),
    size
  );
}
