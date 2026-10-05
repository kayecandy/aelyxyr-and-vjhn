"use client";

import { useActionState, useState } from "react";
import { reserve, type ReserveState } from "./actions";

const UNIT_PRICE = 350;

// Placeholder details until the real accounts are provided.
const PAYMENT = {
  gcash: { label: "GCash", lines: ["Account name: ACCOUNT NAME", "Number: 09XX XXX XXXX"] },
  bpi: {
    label: "BPI transfer",
    lines: ["Account name: ACCOUNT NAME", "Account number: XXXX-XXXX-XX"],
  },
} as const;

const field =
  "w-full rounded border border-amber-500/50 bg-black/60 px-3 py-2 text-sm text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300";
const label = "mb-1 block text-[11px] tracking-widest text-amber-200";

function Errors({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1 text-xs text-red-300">{errors[0]}</p> : null;
}

export default function ReserveForm() {
  const [state, action, pending] = useActionState<ReserveState, FormData>(reserve, {
    status: "idle",
  });
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<keyof typeof PAYMENT>("gcash");

  if (state.status === "success") {
    return (
      <section className="rounded-lg border border-amber-500/60 bg-black/70 p-6 text-center">
        <h2 className="text-xl tracking-widest text-amber-300">YOUR CHALICE AWAITS</h2>
        <p className="mt-2 text-xs tracking-widest text-amber-200/80">
          ORDER RECEIVED · PENDING PAYMENT CONFIRMATION
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={state.qrDataUrl}
          alt="Your QR password"
          width={240}
          height={240}
          className="mx-auto my-4 rounded bg-white p-2"
        />
        <p className="text-xs tracking-widest text-amber-200">USERNAME</p>
        <p className="mb-2 text-lg text-amber-100">{state.username}</p>
        <p className="text-xs tracking-widest text-amber-200">PASSWORD (QR SECRET)</p>
        <p className="mb-4 break-all font-mono text-sm text-amber-100">{state.secret}</p>
        <a
          href={state.qrDataUrl}
          download={`aelyxyr-vjhn-${state.username}.png`}
          className="inline-block rounded-full border border-amber-400/80 px-5 py-2 text-xs tracking-widest text-amber-200 hover:bg-amber-400/10"
        >
          DOWNLOAD QR
        </a>
        <p className="mt-4 text-xs text-red-300">
          Save this now. It is shown only once and is needed to log in next time.
        </p>
      </section>
    );
  }

  const fe = state.status === "error" ? state.fieldErrors : undefined;
  const total = quantity * UNIT_PRICE;

  return (
    <form action={action} className="space-y-4 rounded-lg border border-amber-500/60 bg-black/70 p-5">
      {state.status === "error" && state.message && (
        <p className="rounded border border-red-400/50 bg-red-950/50 p-2 text-sm text-red-200">
          {state.message}
        </p>
      )}

      <div>
        <label className={label} htmlFor="username">USERNAME</label>
        <input id="username" name="username" required autoComplete="username" className={field} />
        <Errors errors={fe?.username} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="firstName">FIRST NAME</label>
          <input id="firstName" name="firstName" required autoComplete="given-name" className={field} />
          <Errors errors={fe?.firstName} />
        </div>
        <div>
          <label className={label} htmlFor="lastName">LAST NAME</label>
          <input id="lastName" name="lastName" required autoComplete="family-name" className={field} />
          <Errors errors={fe?.lastName} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="email">EMAIL (OPTIONAL)</label>
        <input id="email" name="email" type="email" autoComplete="email" className={field} />
        <Errors errors={fe?.email} />
      </div>

      <div>
        <label className={label} htmlFor="contactNumber">CONTACT NUMBER</label>
        <input
          id="contactNumber"
          name="contactNumber"
          type="tel"
          required
          autoComplete="tel"
          placeholder="09171234567"
          className={field}
        />
        <Errors errors={fe?.contactNumber} />
      </div>

      <div>
        <label className={label} htmlFor="quantity">NUMBER OF PASSES</label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={20}
          value={quantity}
          onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
          className={field}
        />
        <p className="mt-1 text-sm text-amber-300">Total: ₱{total.toLocaleString()}</p>
      </div>

      <fieldset>
        <legend className={label}>PAYMENT METHOD</legend>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(PAYMENT) as (keyof typeof PAYMENT)[]).map((key) => (
            <label
              key={key}
              className={`cursor-pointer rounded border px-3 py-2 text-center text-sm ${
                method === key
                  ? "border-amber-300 bg-amber-400/10 text-amber-100"
                  : "border-amber-500/40 text-amber-200/70"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={key}
                checked={method === key}
                onChange={() => setMethod(key)}
                className="sr-only"
              />
              {PAYMENT[key].label}
            </label>
          ))}
        </div>
        <div className="mt-3 rounded border border-amber-500/30 bg-black/50 p-3 text-xs leading-6 text-amber-100">
          <p className="tracking-widest text-amber-300">TRANSFER ₱{total.toLocaleString()} TO:</p>
          {PAYMENT[method].lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="proof">PROOF OF PAYMENT (JPG, PNG, WEBP, PDF · MAX 5MB)</label>
        <input
          id="proof"
          name="proof"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className={`${field} file:mr-3 file:rounded file:border-0 file:bg-amber-400/20 file:px-3 file:py-1 file:text-amber-100`}
        />
        <Errors errors={fe?.proof} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border-2 border-amber-400/80 bg-gradient-to-b from-[#7a1025] to-[#3a0711] py-3 tracking-[0.2em] text-amber-200 transition hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "SEALING YOUR ORDER..." : "PLACE ORDER"}
      </button>
    </form>
  );
}
