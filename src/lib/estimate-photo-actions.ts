"use server";

import { db } from "@/db";
import { estimates, estimatePhotos } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireAccess } from "@/lib/auth";

export async function saveEstimatePhoto(opts: {
  estimateId: number;
  url: string;
  fileName: string;
  mimeType: string;
  caption?: string;
}) {
  const { orgId, id: userId } = await requireAccess("estimates");
  const [est] = await db
    .select({ id: estimates.id, publicToken: estimates.publicToken })
    .from(estimates)
    .where(and(eq(estimates.id, opts.estimateId), eq(estimates.orgId, orgId)))
    .limit(1);
  if (!est) throw new Error("Estimate not found");

  await db.insert(estimatePhotos).values({
    orgId,
    estimateId: opts.estimateId,
    url: opts.url,
    fileName: opts.fileName,
    mimeType: opts.mimeType,
    caption: opts.caption?.trim() || null,
    uploadedById: userId,
  });

  revalidatePath(`/estimates/${opts.estimateId}`);
  revalidatePath(`/estimate/${est.publicToken}`);
}

export async function deleteEstimatePhoto(formData: FormData) {
  const { orgId } = await requireAccess("estimates");
  const id = Number(formData.get("id"));
  const estimateId = Number(formData.get("estimateId"));
  const [photo] = await db
    .select()
    .from(estimatePhotos)
    .where(and(eq(estimatePhotos.id, id), eq(estimatePhotos.orgId, orgId)))
    .limit(1);
  if (!photo) return;
  try {
    await del([photo.url]);
  } catch (err) {
    console.error("Blob delete failed:", err);
  }
  await db.delete(estimatePhotos).where(eq(estimatePhotos.id, id));
  revalidatePath(`/estimates/${estimateId}`);
}
