import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon: matches the in-app LogoMark — forest-green circle with a serif
// italic "A" in cream. Rendered at request time by Next.js.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#2C4A47",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FBF9F4",
          fontSize: 22,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontWeight: 500,
          letterSpacing: -1,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
