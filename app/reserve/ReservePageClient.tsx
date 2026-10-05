"use client";
import { useState } from "react";
import Link from "next/link";
import ParallaxBackground from "./ParallaxBackground";
import ReserveForm from "./ReserveForm";

// Swap these paths when the success artwork is ready.
const BG_FORM    = "/bg-form.png";
const BG_SUCCESS = "/bg-checkout_success.png";

export default function ReservePageClient() {
  const [success, setSuccess] = useState(false);

  return (
    <div className="relative flex flex-1 justify-center overflow-hidden bg-black font-(family-name:--font-cinzel) text-amber-100">
      {/* Default background */}
      <ParallaxBackground
        src={BG_FORM}
        style={{
          inset: "-16px",
          filter: "blur(8px)",
          opacity: success ? 0 : 1,
          transition: "opacity 1000ms ease",
        }}
      />

      {/* Success background — fades in on success */}
      <ParallaxBackground
        src={BG_SUCCESS}
        style={{
          inset: "-16px",
          filter: "blur(8px)",
          opacity: success ? 1 : 0,
          transition: "opacity 1000ms ease",
        }}
      />

      <main
        className="relative aspect-[2/3] w-[90%] min-w-[750px] self-start sm:w-4/5 md:w-3/5"
        style={{
          backgroundImage: `url(${success ? BG_SUCCESS : BG_FORM})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="sr-only">Reserve Thy Chalice</h1>
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-[5%] top-[2.5%] h-[3%] w-[10%]"
        />
        <ReserveForm onSuccess={() => setSuccess(true)} />
      </main>
    </div>
  );
}
