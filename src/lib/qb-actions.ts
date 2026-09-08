"use server";

import { requireAccess } from "@/lib/auth";
import { disconnectQb } from "@/lib/quickbooks";
import { revalidatePath } from "next/cache";

export async function disconnectQbAction() {
  const user = await requireAccess("settings");
  await disconnectQb(user.orgId);
  revalidatePath("/settings");
}
