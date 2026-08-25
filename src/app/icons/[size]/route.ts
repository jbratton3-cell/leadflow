import React from "react";
import { ImageResponse } from "next/og";

export const runtime = "edge";

function getIconSize(value: string): number {
  const size = Number(value);
  return size === 192 || size === 512 ? size : 512;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await params;
  const size = getIconSize(rawSize);
  const url = new URL(req.url);
  const maskable = url.searchParams.get("maskable") === "1";

  const outerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: `${Math.round(size * (maskable ? 0.12 : 0.08))}px`,
  } as const;

  const innerStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: `${Math.round(size * (maskable ? 0.24 : 0.18))}px`,
    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    color: "white",
    fontSize: `${Math.round(size * 0.5)}px`,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  } as const;

  const image = React.createElement(
    "div",
    { style: outerStyle },
    React.createElement("div", { style: innerStyle }, "L")
  );

  return new ImageResponse(image, {
    width: size,
    height: size,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
