"use client";

import { useState } from "react";
import Image from "next/image";

const scrollbar =
  "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-amber-500/40";

export default function EventInfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full transition hover:brightness-110 active:scale-[0.99]"
      >
        <Image
          src="/icons/btn-event_info.png"
          alt="Event info"
          width={360}
          height={70}
          className="h-auto w-full"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          aria-modal="true"
          role="dialog"
          aria-label="The Bottomless Elixyr Covenant"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className={`relative z-10 w-full max-w-sm rounded border border-amber-500/50 bg-[#0d080d] px-6 py-7 shadow-[0_0_40px_rgba(180,120,0,0.18)] font-(family-name:--font-cinzel) text-amber-100 ${scrollbar} max-h-[85dvh] overflow-y-auto`}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 text-amber-400/60 transition hover:text-amber-300"
            >
              ✕
            </button>

            <h2 className="mb-1 text-center text-sm tracking-[0.3em] text-amber-300 drop-shadow-[0_0_8px_rgba(255,200,80,0.4)]">
              THE BOTTOMLESS ELIXYR COVENANT
            </h2>
            <p className="mb-5 text-center text-[9px] italic tracking-widest text-amber-200/60">
              Heed these sacred decrees before you sup from the endless chalice.
            </p>

            <ol className="space-y-4 text-[11px] leading-relaxed tracking-wide text-amber-100/90">
              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  I. THE MIRACLE RATE
                </span>
                For a single offering of ₱350, thy chalice shall be refilled without cease from the hour the revel begins until the final toll of midnight on the 13th day of December, in the year 2026. Not a drop more shall be owed — nor less.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  II. ELIXYR OF THE REALM
                </span>
                The Covenant covers the six featured non-alcoholic elixyrs of Ælyxyr &amp; Vjhn — the Nectyr of the Seraphæ, the Crimson Covenant, the Noctyrnum, and brethren of their ilk. Potions beyond the scroll are beyond the Covenant's blessing.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  III. ONE SOUL, ONE CHALICE
                </span>
                Each pass is bound to a single soul. The sharing of chalices between revelers is forbidden by ancient rite. Thou shalt not pass thy pass.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  IV. THE AGE OF RECKONING
                </span>
                Only those who have walked the mortal realm for eighteen summers or more may claim this Covenant. The gatekeepers shall require proof at the threshold.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  V. THE KEEPER'S DISCRETION
                </span>
                Should a reveler's spirit become… unruly — the Keepers of the Revel reserve the sacred right to seal that chalice, without recompense. Drink with dignity, as befits one who has entered these hallowed grounds.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  VI. THE COVENANT IS UNBREAKABLE
                </span>
                The pass is non-refundable and cannot be exchanged for coin once the Covenant is sealed. All sales are final, as all pacts with the arcane must be.
              </li>

              <li>
                <span className="block text-[9px] tracking-[0.25em] text-amber-400">
                  VII. SANCTIONED GROUNDS
                </span>
                The Covenant is valid only within the enchanted walls of Fernwood Gardens Tagaytay, on the singular night decreed. Beyond this place and time, the Covenant holds no power.
              </li>
            </ol>

            <p className="mt-6 text-center text-[9px] italic tracking-[0.2em] text-amber-200/50">
              By raising thy chalice, thou dost accept these terms in full.
              <br />
              Drink wisely. Drink responsibly. Drink endlessly.
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded border border-amber-500/50 py-2 text-[10px] tracking-widest text-amber-300 transition hover:border-amber-300 hover:bg-amber-400/10 active:scale-[0.98]"
            >
              I ACCEPT THE COVENANT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
