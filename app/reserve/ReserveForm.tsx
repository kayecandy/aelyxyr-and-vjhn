"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { reserve, type ReserveState } from "./actions";

const UNIT_PRICE = 350;
const MAX_PASSES = 20;
// Logical width the form is laid out at; it zooms to fit the dark area of the background.
const DESIGN_WIDTH = 400;
const MIN_ZOOM = 0.75;

// Placeholder details until the real accounts are provided.
const PAYMENT = {
  gcash: {
    label: "GCash",
    img: { src: "/icons/btn-gcash.png", width: 251, height: 86 },
    qr: "/qr-gcash3.png",
    qrFull: "/qr-gcash-full.png",
    lines: ["Account name: ACCOUNT NAME", "Number: 09XX XXX XXXX"],
  },
  bpi: {
    label: "BPI Transfer",
    img: { src: "/icons/btn-bpi.png", width: 250, height: 85 },
    qr: "/qr-bpi2.png",
    qrFull: "/qr-bpi-full.png",
    lines: ["Account name: ACCOUNT NAME", "Account number: XXXX-XXXX-XX"],
  },
} as const;

const field =
  "w-full rounded border border-amber-500/60 bg-black/50 px-2 py-1.5 text-xs text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300";
const label = "mb-0.5 block text-[9px] tracking-widest text-amber-200";

function Errors({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-0.5 text-[10px] text-red-300">{errors[0]}</p> : null;
}

// Positioned over the dark panel of /bg-form.png (percentages measured from the artwork).
function Panel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setZoom(Math.max(MIN_ZOOM, el.clientWidth / DESIGN_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute overflow-y-auto overflow-x-hidden"
      style={{ left: "24%", width: "52%", top: "25.5%", height: "53.5%" }}
    >
      <div style={{ zoom }}>{children}</div>
    </div>
  );
}

export default function ReserveForm() {
  const [state, action, pending] = useActionState<ReserveState, FormData>(reserve, {
    status: "idle",
  });
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<keyof typeof PAYMENT>("gcash");
  const [hoveredMethod, setHoveredMethod] = useState<keyof typeof PAYMENT | null>(null);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  if (state.status === "success") {
    return (
      <Panel>
        <section className="p-2 text-center">
          <h2 className="text-lg tracking-widest text-amber-300">YOUR CHALICE AWAITS</h2>
          <p className="mt-1 text-[9px] tracking-widest text-amber-200/80">
            ORDER RECEIVED · PENDING PAYMENT CONFIRMATION
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.qrDataUrl}
            alt="Your QR password"
            width={170}
            height={170}
            className="mx-auto my-2 rounded bg-white p-1.5"
          />
          <p className="text-[9px] tracking-widest text-amber-200">USERNAME</p>
          <p className="mb-1 text-base text-amber-100">{state.username}</p>
          <p className="text-[9px] tracking-widest text-amber-200">PASSWORD (QR SECRET)</p>
          <p className="mb-2 break-all font-mono text-[11px] text-amber-100">{state.secret}</p>
          <a
            href={state.qrDataUrl}
            download={`aelyxyr-vjhn-${state.username}.png`}
            className="inline-block rounded-full border border-amber-400/80 px-4 py-1.5 text-[10px] tracking-widest text-amber-200 hover:bg-amber-400/10"
          >
            DOWNLOAD QR
          </a>
          <p className="mt-2 text-[10px] text-red-300">
            Save this now. It is shown only once and is needed to log in next time.
          </p>
        </section>
      </Panel>
    );
  }

  const fe = state.status === "error" ? state.fieldErrors : undefined;
  const total = quantity * UNIT_PRICE;
  const setQty = (n: number) => setQuantity(Math.min(MAX_PASSES, Math.max(1, n)));

  return (
    <Panel>
      <form action={action} className="space-y-2 px-1 pb-1 text-center">
        {state.status === "error" && state.message && (
          <p className="rounded border border-red-400/50 bg-red-950/50 p-1.5 text-xs text-red-200">
            {state.message}
          </p>
        )}

        <Image
          src="/icons/title-form-name.png"
          alt="Who seeketh entry?"
          width={378}
          height={76}
          className="mx-auto h-auto w-[85%]"
        />

        <div>
          <label className={label} htmlFor="username">USERNAME</label>
          <input id="username" name="username" required autoComplete="username" className={field} />
          <Errors errors={fe?.username} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label} htmlFor="firstName">FIRST NAME</label>
            <input id="firstName" name="firstName" required autoComplete="given-name" placeholder="First Name" className={field} />
            <Errors errors={fe?.firstName} />
          </div>
          <div>
            <label className={label} htmlFor="lastName">LAST NAME</label>
            <input id="lastName" name="lastName" required autoComplete="family-name" placeholder="Last Name" className={field} />
            <Errors errors={fe?.lastName} />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="email">EMAIL (OPTIONAL)</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="yourname@example.com" className={field} />
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
            placeholder="09XX XXX XXXX"
            className={field}
          />
          <Errors errors={fe?.contactNumber} />
        </div>
        <br />
        

        <Image
          src="/icons/title-form-quantity.png"
          alt="How many souls accompany thee?"
          width={514}
          height={70}
          className="h-auto w-full"
        />

        <div className="grid grid-cols-2 items-center gap-2">
          <div className="relative min-w-0">
            <p className={`${label} absolute -top-5.5 left-0 mb-0`}>NUMBER OF PASSES</p>
            <input type="hidden" name="quantity" value={quantity} />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Fewer passes"
                onClick={() => setQty(quantity - 1)}
                className="h-9 w-9 shrink-0 transition hover:brightness-125 active:scale-95"
              >
                <Image src="/icons/btn-minus.png" alt="" width={36} height={36} className="h-full w-full" />
              </button>
              <span className="relative block min-w-0 flex-1">
                <Image
                  src="/icons/title-form-pass.png"
                  alt=""
                  width={137}
                  height={57}
                  className="h-auto w-full"
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm tracking-widest">
                  {quantity} {quantity === 1 ? "PASS" : "PASSES"}
                </span>
              </span>
              <button
                type="button"
                aria-label="More passes"
                onClick={() => setQty(quantity + 1)}
                className="h-9 w-9 shrink-0 transition hover:brightness-125 active:scale-95"
              >
                <Image src="/icons/btn-plus.png" alt="" width={36} height={36} className="h-full w-full" />
              </button>
            </div>
          </div>
          <div className="relative min-w-0">
            <Image
              src="/icons/title-form-total.png"
              alt="Total offering"
              width={253}
              height={105}
              className="h-auto w-full"
            />
            <p
              aria-live="polite"
              className="absolute inset-x-[22%] top-[48%] text-center text-3xl leading-none text-[#ffc678]"
            >
              ₱{total.toLocaleString()}
            </p>
          </div>
        </div>

        <br />


        <Image
          src="/icons/title-form-payment.png"
          alt="Choose thy patronage"
          width={537}
          height={52}
          className="h-auto w-full"
        />

        <fieldset>
          <legend className="sr-only">Payment method</legend>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PAYMENT) as (keyof typeof PAYMENT)[]).map((key) => (
              <label
                key={key}
                className="cursor-pointer"
                style={{
                  opacity: method === key ? 1 : hoveredMethod === key ? 0.8 : 0.5,
                  transition: "opacity 300ms ease",
                }}
                onMouseEnter={() => setHoveredMethod(key)}
                onMouseLeave={() => setHoveredMethod(null)}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={key}
                  checked={method === key}
                  onChange={() => setMethod(key)}
                  className="sr-only"
                />
                <Image
                  src={PAYMENT[key].img.src}
                  alt={PAYMENT[key].label}
                  width={PAYMENT[key].img.width}
                  height={PAYMENT[key].img.height}
                  className="h-auto w-full"
                />
              </label>
            ))}
          </div>
          <div className="mt-2 text-center text-amber-100">
            <br />

            {"qr" in PAYMENT[method] && (() => {
              const p = PAYMENT[method] as { qr: string; qrFull: string; label: string };
              return (
                <>
                  <Image
                    src={p.qr}
                    alt={`${p.label} QR code`}
                    width={0}
                    height={0}
                    sizes="220px"
                    className="mx-auto block rounded h-auto"
                    style={{ width: "min(220px, 100%)" }}
                  />
                  <a
                    href={p.qrFull}
                    download
                    className="mt-3 inline-block rounded border border-amber-500/60 px-4 py-1.5 text-[9px] tracking-widest text-amber-300 transition hover:border-amber-300 hover:bg-amber-400/10 active:scale-[0.98]"
                  >
                    Download QR
                  </a>
                </>
              );
            })()}

            <br />

          </div>
        </fieldset>

        <br />


        <div>
          <Image
            src="/icons/title-form-proof_of_payment.png"
            alt="Present thy carnival token"
            width={532}
            height={155}
            className="h-auto w-full"
          />
          <label
            htmlFor="proof"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-amber-500/60 bg-black/40 py-8 transition hover:border-amber-300 hover:brightness-110"
          >
            {filePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={filePreview} alt={fileName} className="w-[85%] rounded object-contain" />
                <span className="mt-2 text-[9px] tracking-widest text-amber-400/70 hover:text-amber-300">
                  Offer a different relic
                </span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="mb-1 h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M4.75 17.5A2.75 2.75 0 0 0 7.5 20.25h9A2.75 2.75 0 0 0 19.25 17.5" />
                </svg>
                <span className="text-xs tracking-wide text-amber-200">Click to choose file</span>
                <span className="text-[9px] text-amber-200/40">No file selected</span>
              </>
            )}
          </label>
          <input
            id="proof"
            name="proof"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setFileName(file?.name ?? "");
              setFilePreview(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return file ? URL.createObjectURL(file) : null;
              });
            }}
            className="sr-only"
          />
          <Errors errors={fe?.proof} />
        </div>

        <br />


        <button
          type="submit"
          disabled={pending}
          aria-label="Join the revel"
          className="block w-4/5 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 mx-auto"
        >
          <Image src="/icons/btn-join.png" alt="" width={457} height={79} className="h-auto w-full" />
        </button>
      </form>
    </Panel>
  );
}
