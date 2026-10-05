"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { reserve, checkUsername, checkEmail, getItems, type ReserveState, type Item } from "./actions";

const MAX_PER_ITEM = 20;
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

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

// Template dimensions (qr-login-full.png): 1023 × 1537
// QR placeholder white box: x=416, y=712, 147×147
// "TRAVELER'S NAME" label template text: y≈895
// "SECRET SIGIL" label template text: y≈1093
const CARD = {
  qr:     { x: 430, y: 712, size: 147 },
  name:   { y: 930 },
  secret: { y: 1000 },
  cx:     511,
  w:      1023,
  h:      1537,
};

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function downloadCard(username: string, qrDataUrl: string, secret: string) {
  const [template, qr] = await Promise.all([
    loadImage("/qr-login-full.png"),
    loadImage(qrDataUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width  = CARD.w;
  canvas.height = CARD.h;
  const ctx = canvas.getContext("2d")!;

  // Draw full template
  ctx.drawImage(template, 0, 0);

  // Draw white background then QR image into the placeholder
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD.qr.x, CARD.qr.y, CARD.qr.size, CARD.qr.size);
  ctx.drawImage(qr, CARD.qr.x, CARD.qr.y, CARD.qr.size, CARD.qr.size);

  // Draw username (large, centred)
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "#ffe8b0";
  ctx.font         = "bold 38px 'Cinzel', serif";
  ctx.fillText(username.toUpperCase(), CARD.cx, CARD.name.y);

  // Draw secret (smaller monospace, may wrap)
  ctx.fillStyle = "rgba(255, 220, 160, 0.85)";
  ctx.font      = "20px 'Courier New', monospace";
  const maxW = 520;
  // manually wrap at ~38 chars to stay within panel
  const chunk = 38;
  const lines: string[] = [];
  for (let i = 0; i < secret.length; i += chunk) lines.push(secret.slice(i, i + chunk));
  lines.forEach((line, i) =>
    ctx.fillText(line, CARD.cx, CARD.secret.y + i * 26, maxW)
  );

  const dataUrl = canvas.toDataURL("image/png");

  // iOS Safari ignores the download attribute — open in a new tab so the user
  // can long-press → Save to Photos.
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    window.open(dataUrl, "_blank");
    return;
  }

  const a = document.createElement("a");
  a.href     = dataUrl;
  a.download = `aelyxyr-vjhn-${username}.png`;
  a.click();
}

export default function ReserveForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, setState] = useState<ReserveState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [fading, setFading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<keyof typeof PAYMENT>("gcash");

  useEffect(() => {
    getItems().then((data) => {
      setItems(data);
      const initial: Record<string, number> = {};
      data.forEach((item) => { initial[item.id] = 0; });
      setItemQtys(initial);
    });
  }, []);
  const [hoveredMethod, setHoveredMethod] = useState<keyof typeof PAYMENT | null>(null);
  const [fileName, setFileName] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<UsernameStatus>("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorBarRef = useRef<HTMLDivElement>(null);

  const fe = state.status === "error" ? state.fieldErrors : undefined;
  const total = items.reduce((sum, item) => sum + item.price * (itemQtys[item.id] ?? 0), 0);
  const setItemQty = (id: string, n: number) =>
    setItemQtys((prev) => ({ ...prev, [id]: Math.min(MAX_PER_ITEM, Math.max(0, n)) }));

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setUsernameStatus("checking");
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(async () => {
      if (!value) { setUsernameStatus("idle"); return; }
      const status = await checkUsername(value);
      setUsernameStatus(status);
    }, 500);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!value) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    if (emailTimer.current) clearTimeout(emailTimer.current);
    emailTimer.current = setTimeout(async () => {
      const status = await checkEmail(value);
      setEmailStatus(status);
    }, 500);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await reserve(state, new FormData(e.currentTarget));
    setPending(false);
    if (result.status === "success") {
      setFading(true);
      setTimeout(() => {
        setState(result);
        setFading(false);
        onSuccess?.();
      }, 450);
    } else {
      setState(result);
      if (result.status === "error") {
        setTimeout(() => errorBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
  }

  const content = state.status === "success" ? (
    <section className="flex flex-col items-center gap-3 px-2 py-4 text-center">
      <Image
        src="/icons/title-order_success.png"
        alt="Thy Chalice Standeth Ready"
        width={505}
        height={86}
        className="h-auto w-full"
      />


      <div className="w-full rounded border border-amber-500/40 bg-amber-950/40 px-3 py-2.5 mb-4.5">
        <p className="text-[11px] font-semibold tracking-widest text-amber-300">
          ⚠ HEED THIS WELL
        </p>
        <p className="mt-1 text-[11px] italic leading-relaxed text-amber-200/90">
          The Sigil Revealeth Itself But Once.<br />
          Guard It Closely — Lest Entry Be Denied Upon Thy Return.
        </p>
        <br></br>
        <p className="mt-1.5 text-[11px] italic leading-relaxed text-amber-200/90">
          Share Not This Seal With Another Soul — Whosoever Bears It May Claim Thy Chalice In Thy Stead.
        </p>
      </div>



      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={state.qrDataUrl}
        alt="Your QR code"
        width={180}
        height={180}
        className="rounded bg-white p-2"
      />

      <div>
        <p className="text-[10px] tracking-[0.25em] text-amber-200/60">TRAVELER&apos;S NAME</p>
        <p className="text-xl tracking-widest text-amber-100">{state.username.toUpperCase()}</p>
      </div>

      <div className="w-full">
        <p className="text-[10px] tracking-[0.25em] text-amber-200/60">SECRET SIGIL</p>
        <p className="break-all font-mono text-[11px] text-amber-100/90">{state.secret}</p>
      </div>

      <button
        type="button"
        onClick={() => state.status === "success" && downloadCard(state.username, state.qrDataUrl, state.secret)}
        className="mt-1 block transition hover:brightness-110 active:scale-[0.99]"
      >
        <Image
          src="/icons/btn-download_qr_login.png"
          alt="Claim Thy Seal – Download QR"
          width={382}
          height={70}
          className="h-auto w-full max-w-[280px]"
        />
      </button>

      <br></br>

            <p className="text-[11px] leading-relaxed tracking-[0.15em] text-amber-200/80">
        Thy reservation hath been sealed in the annals.<br />
        Enter the realm with thy sigil to track thy offering.
      </p>


      <div className="w-full pt-3">
        <Image
          src="/icons/title-order_success_footer.png"
          alt="The Same Vintage. Greater Wonders."
          width={535}
          height={184}
          className="mx-auto h-auto w-[90%]"
        />
      </div>


      



      
    </section>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-2 px-1 pb-1 text-center">
        {state.status === "error" && (state.message || fe) && (
          <div
            ref={errorBarRef}
            className="rounded border border-red-400/60 bg-red-950/70 px-3 py-2 text-left text-[10px] tracking-wide text-red-200"
          >
            <p className="mb-0.5 font-semibold uppercase tracking-widest text-red-300">
              {state.message ?? "Please fix the errors below before continuing."}
            </p>
            {fe && Object.entries(fe).map(([k, errs]) =>
              errs?.map((e, i) => <p key={`${k}-${i}`} className="opacity-80">· {e}</p>)
            )}
          </div>
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
          <input
            id="username"
            name="username"
            required
            autoComplete="username"
            onChange={handleUsernameChange}
            className={field}
          />
          {usernameStatus === "checking" && (
            <p className="mt-0.5 text-[10px] text-amber-300/60">Checking…</p>
          )}
          {usernameStatus === "available" && (
            <p className="mt-0.5 text-[10px] text-green-400">Username is available</p>
          )}
          {usernameStatus === "taken" && (
            <p className="mt-0.5 text-[10px] text-red-300">Username is already taken</p>
          )}
          {usernameStatus === "error" && (
            <p className="mt-0.5 text-[10px] text-red-300">Could not check availability — please refresh and try again</p>
          )}
          {usernameStatus === "idle" && <Errors errors={fe?.username} />}
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
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="yourname@example.com"
            onChange={handleEmailChange}
            className={field}
          />
          {emailStatus === "checking" && (
            <p className="mt-0.5 text-[10px] text-amber-300/60">Checking…</p>
          )}
          {emailStatus === "available" && (
            <p className="mt-0.5 text-[10px] text-green-400">Email is available</p>
          )}
          {emailStatus === "taken" && (
            <p className="mt-0.5 text-[10px] text-red-300">Email is already registered</p>
          )}
          {emailStatus === "error" && (
            <p className="mt-0.5 text-[10px] text-red-300">Could not check availability — please refresh and try again</p>
          )}
          {emailStatus === "idle" && <Errors errors={fe?.email} />}
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

        {/* Hidden fields — one per item, carries qty to server */}
        {items.map((item) => (
          <input key={item.id} type="hidden" name={`qty_${item.id}`} value={itemQtys[item.id] ?? 0} />
        ))}
        {fe?.items && <p className="text-[10px] text-red-300">{fe.items[0]}</p>}

        <div className="grid grid-cols-2 items-center gap-2">
          <div className="relative min-w-0">
            <p className={`${label} absolute -top-5.5 left-0 mb-0`}>NUMBER OF PASSES</p>
            {(() => {
              const item = items[0];
              const qty = item ? (itemQtys[item.id] ?? 0) : 0;
              return (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Fewer passes"
                    onClick={() => item && setItemQty(item.id, qty - 1)}
                    className="h-9 w-9 shrink-0 transition hover:brightness-125 active:scale-95"
                  >
                    <Image src="/icons/btn-minus.png" alt="" width={36} height={36} className="h-full w-full" />
                  </button>
                  <span className="relative block min-w-0 flex-1">
                    <Image src="/icons/title-form-pass.png" alt="" width={137} height={57} className="h-auto w-full" />
                    <span className="absolute inset-0 flex items-center justify-center text-sm tracking-widest">
                      {qty} {qty === 1 ? "PASS" : "PASSES"}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="More passes"
                    onClick={() => item && setItemQty(item.id, qty + 1)}
                    className="h-9 w-9 shrink-0 transition hover:brightness-125 active:scale-95"
                  >
                    <Image src="/icons/btn-plus.png" alt="" width={36} height={36} className="h-full w-full" />
                  </button>
                </div>
              );
            })()}
          </div>
          <div className="relative min-w-0">
            <Image src="/icons/title-form-total.png" alt="Total offering" width={253} height={105} className="h-auto w-full" />
            <p aria-live="polite" className="absolute inset-x-[22%] top-[48%] text-center text-3xl leading-none text-[#ffc678]">
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
  );

  return (
    <>
      {/* Loading overlay — covers the viewport while the server action runs */}
      {pending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b060b]/80 backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loading-fairy4.webp" alt="" aria-hidden width={220} height={220} />
        </div>
      )}

      <Panel>
        <div
          style={{
            opacity: fading ? 0 : 1,
            transition: "opacity 400ms ease",
          }}
        >
          {content}
        </div>
      </Panel>
    </>
  );
}
