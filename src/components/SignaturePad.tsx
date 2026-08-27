"use client";

import { useRef, useState, useEffect } from "react";

// A touch/mouse signature pad. Produces a PNG data URL via onSaved(signature).
export default function SignaturePad({
  onSaved,
}: {
  onSaved: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [typed, setTyped] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");

  useEffect(() => {
    // size the canvas to its displayed box (crisp on retina)
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#0f172a";
    }
  }, [mode]);

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent) {
    drawing.current = true;
    lastPoint.current = pos(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d");
    const p = pos(e);
    const l = lastPoint.current ?? p;
    ctx?.beginPath();
    ctx?.moveTo(l.x, l.y);
    ctx?.lineTo(p.x, p.y);
    ctx?.stroke();
    lastPoint.current = p;
    if (!hasInk) setHasInk(true);
  }

  function end() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  }

  // Crop the canvas to just the ink (plus padding) so the stored signature
  // has no wide empty margins around it.
  function trimmedDataUrl(): string {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;
    for (let yy = 0; yy < height; yy++) {
      for (let xx = 0; xx < width; xx++) {
        const i = (yy * width + xx) * 4;
        const alpha = data[i + 3];
        const darkness = 255 - data[i]; // ink is dark
        if (alpha > 20 && darkness > 60) {
          found = true;
          if (xx < minX) minX = xx;
          if (xx > maxX) maxX = xx;
          if (yy < minY) minY = yy;
          if (yy > maxY) maxY = yy;
        }
      }
    }
    if (!found) return canvas.toDataURL("image/png");
    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    out.getContext("2d")!.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
    return out.toDataURL("image/png");
  }

  function save() {
    if (mode === "draw") {
      if (!hasInk) return;
      onSaved(trimmedDataUrl());
    } else {
      if (!typed.trim()) return;
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 200);
      ctx.fillStyle = "#0f172a";
      ctx.font = "italic 34px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typed.trim(), 300, 100);
      onSaved(canvas.toDataURL("image/png"));
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`rounded-md px-2.5 py-1 font-medium ${mode === "draw" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            Draw
          </button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`rounded-md px-2.5 py-1 font-medium ${mode === "type" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
          >
            Type
          </button>
        </div>
        {mode === "draw" && (
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {mode === "draw" ? (
        <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white">
          <canvas
            ref={canvasRef}
            className="h-40 w-full touch-none rounded-xl"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
          {!hasInk && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-slate-300">
              Sign here with your finger or mouse
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type your full name"
          className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center font-italic text-lg text-slate-800 outline-none focus:border-orange-400"
          style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
        />
      )}

      <button
        type="button"
        onClick={save}
        disabled={mode === "draw" ? !hasInk : !typed.trim()}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
      >
        Save Signature
      </button>
    </div>
  );
}
