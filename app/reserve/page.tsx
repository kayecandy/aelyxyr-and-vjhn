import Link from "next/link";
import ReserveForm from "./ReserveForm";

export const metadata = { title: "Reserve my chalice · Ælyxyr & Vjhn" };

export default function ReservePage() {
  return (
    <div className="relative flex flex-1 justify-center overflow-hidden bg-black font-[family-name:var(--font-cinzel)] text-amber-100">
      <div
        aria-hidden
        className="fixed inset-0 scale-110 blur-[2px]"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <main className="relative w-full max-w-lg px-4 py-8 lg:max-w-2xl">
        <Link href="/" className="text-xs tracking-widest text-amber-300 hover:text-amber-100">
          ‹ BACK
        </Link>
        <h1 className="mt-4 text-center text-3xl tracking-[0.15em] text-amber-300">
          RESERVE MY CHALICE
        </h1>
        <p className="mb-6 text-center text-xs tracking-widest text-amber-200/80">
          THE MIRACLE RATE · ₱350 PER PASS
        </p>
        <ReserveForm />
      </main>
    </div>
  );
}
