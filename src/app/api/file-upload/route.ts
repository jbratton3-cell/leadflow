import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSessionUser } from "@/lib/auth";

// Signs a short-lived direct-upload token so the browser can upload scan files
// straight to Vercel Blob storage (bypassing serverless request-size limits).
// Only authenticated CRM users may obtain tokens.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await getSessionUser();
        if (!user) {
          throw new Error("Not authenticated");
        }
        return {
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
          allowedContentTypes: [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/heic",
          ],
          maximumSizeInBytes: 20 * 1024 * 1024, // 20 MB per file
        };
      },
      onUploadCompleted: async () => {
        // DB row is recorded by the client calling saveDocument afterwards.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload not allowed" },
      { status: 403 }
    );
  }
}
