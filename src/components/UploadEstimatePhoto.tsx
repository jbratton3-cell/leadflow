"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { saveEstimatePhoto } from "@/lib/estimate-photo-actions";

export default function UploadEstimatePhoto({ estimateId }: { estimateId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const router = useRouter();

  async function handleUpload() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/file-upload",
        });
        await saveEstimatePhoto({
          estimateId,
          url: blob.url,
          fileName: file.name,
          mimeType: file.type || "image/jpeg",
          caption,
        });
      }
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError((err as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption (optional) — e.g. Hail damage, north slope"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-400"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
          capture="environment"
          multiple
          className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={busy}
          className="shrink-0 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload photos"}
        </button>
      </div>
      <p className="text-[11px] text-slate-400">
        On a phone this opens the camera. Photos show on the customer estimate so they don’t have to get on the roof.
      </p>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
