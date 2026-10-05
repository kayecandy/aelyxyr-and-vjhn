import { ViewTransition } from "react";
import type { Viewport } from "next";
import ReservePageClient from "./ReservePageClient";

export const metadata = { title: "Reserve thy chalice · Ælyxyr & Vjhn" };

export const viewport: Viewport = {
  width: 750,
  initialScale: 1,
};

export default function ReservePage() {
  return (
    <ViewTransition>
      <ReservePageClient />
    </ViewTransition>
  );
}
