"use server";

import { db } from "@/db";
import { demoRequests } from "@/db/schema";

function str(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}

// Public action — anyone can submit a pricing/demo request from the marketing site.
export async function submitDemoRequest(
  _prev: { success?: boolean; error?: string } | undefined,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const name = str(formData.get("name"));
  const email = str(formData.get("email"));
  const company = str(formData.get("company"));
  const phone = str(formData.get("phone"));
  const trade = str(formData.get("trade"));
  const message = str(formData.get("message"));
  const website = str(formData.get("website"));

  if (website) {
    return { success: true };
  }

  if (!name || !email) {
    return { error: "Please provide your name and email." };
  }
  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  await db.insert(demoRequests).values({
    name,
    email,
    company: company || null,
    phone: phone || null,
    trade: trade || null,
    message: message || null,
  });

  return { success: true };
}
