"use client";

import { useRef, useState } from "react";
import { signin, type SigninState } from "./actions";
import jsQR from "jsqr";

const field =
  "w-full rounded border border-amber-500/60 bg-black/50 px-3 py-2 text-sm text-amber-50 outline-none placeholder:text-amber-200/30 focus:border-amber-300";
const label = "mb-1 block text-[9px] tracking-widest text-amber-200";

export default function SigninClient() {
  const [state, setState]     = useState<SigninState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [secret, setSecret]   = useState("");
  const [qrFile, setQrFile]   = useState<string | null>(null);
  const [qrError, setQrError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function decodeQR(file: File) {
    setQrError("");
    const url = URL.createObjectURL(file);
    setQrFile(url);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setSecret(code.data);
        setQrError("");
      } else {
        setSecret("");
        setQrError("Could not read QR code. Try uploading a clearer image.");
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("secret", secret);
    const result = await signin(state, fd);
    setPending(false);
    setState(result);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b060b] px-4 font-(family-name:--font-cinzel) text-amber-100">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center">
          <p className="text-[10px] tracking-[0.4em] text-amber-300/60">ÆLYXYR &amp; VJHN</p>
          <h1 className="mt-2 text-2xl tracking-widest">Enter the Realm</h1>
          <p className="mt-1 text-[10px] tracking-widest text-amber-200/50">
            Present thy sigil to claim thy chalice
          </p>
        </div>

        {state.status === "error" && (
          <div className="rounded border border-red-400/50 bg-red-950/60 px-4 py-2.5 text-center text-[11px] text-red-300">
            {state.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={label} htmlFor="username">TRAVELER&apos;S NAME</label>
            <input
              id="username"
              name="username"
              required
              autoComplete="username"
              placeholder="your_username"
              className={field}
            />
          </div>

          <div>
            <p className={label}>THY QR SIGIL</p>
            {/* Hidden field — populated by QR decode */}
            <input type="hidden" name="secret" value={secret} />

            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-amber-500/50 bg-black/40 py-6 transition hover:border-amber-300"
              onClick={() => fileRef.current?.click()}
            >
              {qrFile ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrFile} alt="QR preview" className="h-24 w-24 object-contain" />
                  {secret ? (
                    <span className="text-[10px] tracking-widest text-green-400">✓ Sigil decoded</span>
                  ) : (
                    <span className="text-[10px] tracking-widest text-amber-300/60">Decoding…</span>
                  )}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <path strokeLinecap="round" d="M14 14h2m4 0h-2m0 0v2m0 4v-2m-4 2h4m0-4h2" />
                  </svg>
                  <span className="text-xs tracking-wide text-amber-200/70">Upload your QR card</span>
                  <span className="text-[9px] text-amber-200/30">Tap to choose image</span>
                </>
              )}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) decodeQR(f);
              }}
            />
            {qrError && <p className="mt-1 text-[10px] text-red-300">{qrError}</p>}
          </div>

          <button
            type="submit"
            disabled={pending || !secret}
            className="w-full rounded border border-amber-500/60 bg-amber-950/40 py-2.5 text-xs tracking-[0.3em] text-amber-200 transition hover:border-amber-300 hover:bg-amber-400/10 active:scale-[0.98] disabled:opacity-40"
          >
            {pending ? "ENTERING…" : "ENTER THE FEAST"}
          </button>
        </form>

        <p className="text-center text-[9px] tracking-widest text-amber-200/30">
          Don&apos;t have a reservation?{" "}
          <a href="/reserve" className="text-amber-400/60 underline hover:text-amber-300">
            Claim thy chalice
          </a>
        </p>
      </div>
    </div>
  );
}
