import type { Viewport } from "next";
import Link from "next/link";
import ReserveForm from "./ReserveForm";
import ParallaxBackground from "./ParallaxBackground";

export const metadata = { title: "Reserve thy chalice · Ælyxyr & Vjhn" };

export const viewport: Viewport = {
  width: 750,
  initialScale: 1,
};

export default function ReservePage() {
  return (
    <div className="relative flex flex-1 justify-center overflow-hidden bg-black font-(family-name:--font-cinzel) text-amber-100">
      <ParallaxBackground />
      <main
        className="relative aspect-[2/3] w-[90%] min-w-[750px] self-start sm:w-4/5 md:w-3/5"
        style={{ backgroundImage: "url(/bg-form.png)", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <h1 className="sr-only">Reserve Thy Chalice</h1>
        <Link
          href="/"
          aria-label="Back"
          className="absolute left-[5%] top-[2.5%] h-[3%] w-[10%]"
        />
        <ReserveForm />
      </main>
    </div>
  );
}
