"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSession } from "@/lib/session";

export type SigninState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function signin(
  _prev: SigninState,
  formData: FormData,
): Promise<SigninState> {
  const username = (formData.get("username") as string | null)?.trim().toLowerCase() ?? "";
  const secret   = (formData.get("secret")   as string | null)?.trim() ?? "";

  if (!username || !secret) {
    return { status: "error", message: "Both username and QR code are required." };
  }

  const secretHash = createHash("sha256").update(secret).digest("hex");

  try {
    const db = createAdminClient();
    const { data: customer } = await db
      .from("customers")
      .select("id, secret_hash")
      .eq("username", username)
      .maybeSingle();

    if (!customer || customer.secret_hash !== secretHash) {
      return { status: "error", message: "Invalid username or QR code. Please try again." };
    }

    await createSession(customer.id);
  } catch {
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  redirect("/orders");
}
