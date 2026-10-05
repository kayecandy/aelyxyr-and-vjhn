"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIT_PRICE = 350;
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
  quantity: z.coerce.number().int().min(1).max(20),
  paymentMethod: z.enum(["gcash", "bpi"]),
});

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
    quantity: formData.get("quantity"),
    paymentMethod: formData.get("paymentMethod"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

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
      return { status: "error", fieldErrors: { username: ["Username is already taken"] } };
    }
    console.error("customer insert failed", customerError);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const proofPath = `${customer.id}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await db.storage
    .from("payment-proofs")
    .upload(proofPath, proof, { contentType: proof.type });

  const { error: orderError } = uploadError
    ? { error: uploadError }
    : await db.from("orders").insert({
        customer_id: customer.id,
        quantity: data.quantity,
        unit_price: UNIT_PRICE,
        total: data.quantity * UNIT_PRICE,
        payment_method: data.paymentMethod,
        proof_path: proofPath,
      });

  if (orderError) {
    console.error("order failed", orderError);
    // Roll back so the username can be reused.
    if (!uploadError) await db.storage.from("payment-proofs").remove([proofPath]);
    await db.from("customers").delete().eq("id", customer.id);
    return { status: "error", message: "Something went wrong. Please try again." };
  }

  const qrDataUrl = await QRCode.toDataURL(secret, { margin: 2, width: 320 });
  return { status: "success", username: data.username, secret, qrDataUrl };
}
