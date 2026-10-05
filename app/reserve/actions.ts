"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PROOF_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,24}$/, "3-24 characters: letters, numbers, _ or ."),
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.union([z.literal(""), z.string().trim().email("Invalid email")]),
  contactNumber: z
    .string()
    .trim()
    .regex(/^(\+63|0)9\d{9}$/, "Use a PH mobile number, e.g. 09171234567"),
  paymentMethod: z.enum(["gcash", "bpi"]),
});

const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

export async function getItems(): Promise<Item[]> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("items")
      .select("id, name, description, price")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function checkUsername(
  raw: string,
): Promise<"available" | "taken" | "invalid" | "error"> {
  const username = raw.trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return "invalid";
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("customers")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    return data ? "taken" : "available";
  } catch {
    return "error";
  }
}

export async function checkEmail(
  raw: string,
): Promise<"available" | "taken" | "invalid" | "error"> {
  const email = raw.trim().toLowerCase();
  if (!email) return "available";
  if (!EMAIL_RE.test(email)) return "invalid";
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("customers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    return data ? "taken" : "available";
  } catch {
    return "error";
  }
}

export type ReserveState =
  | { status: "idle" }
  | { status: "error"; message?: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; username: string; secret: string; qrDataUrl: string };

export async function reserve(
  _prev: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  const parsed = schema.safeParse({
    username: formData.get("username"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") ?? "",
    contactNumber: formData.get("contactNumber"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Extract item quantities submitted as qty_{itemId} fields
  const itemQtys: Record<string, number> = {};
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("qty_")) {
      const qty = parseInt(val as string, 10);
      if (!isNaN(qty) && qty > 0) itemQtys[key.slice(4)] = qty;
    }
  }
  if (Object.keys(itemQtys).length === 0) {
    return { status: "error", fieldErrors: { items: ["Select at least one item"] } };
  }

  const proof = formData.get("proof");
  if (!(proof instanceof File) || proof.size === 0) {
    return { status: "error", fieldErrors: { proof: ["Upload your proof of payment"] } };
  }
  const ext = PROOF_TYPES[proof.type];
  if (!ext) {
    return { status: "error", fieldErrors: { proof: ["Use a JPG, PNG, WEBP or PDF file"] } };
  }
  if (proof.size > MAX_PROOF_BYTES) {
    return { status: "error", fieldErrors: { proof: ["File must be 5MB or smaller"] } };
  }

  const db = createAdminClient();

  // Fetch prices from DB — never trust client-submitted prices
  const { data: items } = await db
    .from("items")
    .select("id, price")
    .in("id", Object.keys(itemQtys))
    .eq("is_active", true);

  if (!items?.length) {
    return { status: "error", message: "No valid items selected. Please try again." };
  }

  const total = items.reduce((sum, item) => sum + item.price * (itemQtys[item.id] ?? 0), 0);

  const secret = randomBytes(24).toString("base64url");
  const secretHash = createHash("sha256").update(secret).digest("hex");

  const { data: customer, error: customerError } = await db
    .from("customers")
    .insert({
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email || null,
      contact_number: data.contactNumber,
      secret_hash: secretHash,
    })
    .select("id")
    .single();

  if (customerError) {
    if (customerError.code === "23505") {
      if (customerError.details?.includes("email")) {
        return { status: "error", fieldErrors: { email: ["Email is already registered"] } };
      }
      return { status: "error", fieldErrors: { username: ["Username is already taken"] } };
    }
    console.error("customer insert failed", customerError);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const proofPath = `${customer.id}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from("payment-proofs")
    .upload(proofPath, proof, { contentType: proof.type });

  const { data: order, error: orderError } = uploadError
    ? { data: null, error: uploadError }
    : await db
        .from("orders")
        .insert({
          customer_id: customer.id,
          total,
          payment_method: data.paymentMethod,
          proof_path: proofPath,
        })
        .select("id")
        .single();

  if (orderError || !order) {
    console.error("order failed", orderError);
    if (!uploadError) await db.storage.from("payment-proofs").remove([proofPath]);
    await db.from("customers").delete().eq("id", customer.id);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const { error: itemsError } = await db.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      item_id: item.id,
      quantity: itemQtys[item.id],
      unit_price: item.price,
    })),
  );

  if (itemsError) {
    console.error("order_items failed", itemsError);
    await db.storage.from("payment-proofs").remove([proofPath]);
    await db.from("orders").delete().eq("id", order.id); // cascades order_items
    await db.from("customers").delete().eq("id", customer.id);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const qrDataUrl = await QRCode.toDataURL(secret, { margin: 2, width: 320 });
  return { status: "success", username: data.username, secret, qrDataUrl };
}
