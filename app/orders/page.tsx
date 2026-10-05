import { redirect } from "next/navigation";
import { ViewTransition } from "react";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { signout } from "./actions";

export const metadata = { title: "Thy Chalice · Ælyxyr & Vjhn" };

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  items: { id: string; name: string };
};

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
};

type Customer = {
  id: string;
  username: string;
  first_name: string;
};

async function getData(customerId: string): Promise<{ customer: Customer; orders: Order[] } | null> {
  try {
    const db = createAdminClient();
    const [{ data: customer }, { data: orders }] = await Promise.all([
      db.from("customers").select("id, username, first_name").eq("id", customerId).single(),
      db
        .from("orders")
        .select(`id, status, total, created_at, order_items(id, quantity, unit_price, items(id, name))`)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false }),
    ]);
    if (!customer) return null;
    return { customer, orders: (orders ?? []) as unknown as Order[] };
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-900/60 px-2 py-0.5 text-[8px] tracking-widest text-green-300 ring-1 ring-green-500/40">
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_#4ade80]" />
        CONFIRMED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/40 px-2 py-0.5 text-[8px] tracking-widest text-amber-300 ring-1 ring-amber-500/30">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      PENDING
    </span>
  );
}

function InventorySlot({ itemName, status }: { itemName: string; status: string }) {
  const confirmed = status === "confirmed";
  return (
    <div
      className={[
        "relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded p-2 text-center",
        "border bg-black/60",
        confirmed
          ? "border-green-500/40 shadow-[inset_0_0_12px_rgba(74,222,128,0.06)]"
          : "border-amber-500/30 shadow-[inset_0_0_12px_rgba(251,191,36,0.04)]",
      ].join(" ")}
    >
      {/* Chalice icon */}
      <svg
        viewBox="0 0 24 24"
        className={`h-8 w-8 ${confirmed ? "text-green-400/80" : "text-amber-400/60"}`}
        fill="currentColor"
      >
        <path d="M6 2h12l-1.5 7A5 5 0 0 1 12 13a5 5 0 0 1-4.5-4L6 2zm6 11v5m-3 2h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="9" r="3" opacity="0.3" />
      </svg>
      <p className="text-[8px] leading-tight tracking-widest text-amber-100/70">{itemName.toUpperCase()}</p>
      <StatusBadge status={status} />
    </div>
  );
}

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/signin");

  const result = await getData(session.id);
  if (!result) redirect("/signin");

  const { customer, orders } = result;

  // Expand order_items × quantity into individual slots
  const slots: { key: string; itemName: string; status: string }[] = [];
  for (const order of orders) {
    for (const oi of order.order_items) {
      for (let i = 0; i < oi.quantity; i++) {
        slots.push({
          key: `${oi.id}-${i}`,
          itemName: oi.items.name,
          status: order.status,
        });
      }
    }
  }

  return (
    <ViewTransition>
      <div className="flex min-h-screen flex-col bg-[#0b060b] px-4 py-8 font-(family-name:--font-cinzel) text-amber-100">
        <div className="mx-auto w-full max-w-lg space-y-6">

          {/* Header */}
          <div className="text-center">
            <p className="text-[9px] tracking-[0.4em] text-amber-300/50">ÆLYXYR &amp; VJHN</p>
            <h1 className="mt-1 text-xl tracking-widest">Thy Inventory</h1>
            <p className="mt-0.5 text-[10px] tracking-widest text-amber-200/40">
              {customer.first_name.toUpperCase()} · @{customer.username}
            </p>
          </div>

          {/* Inventory grid */}
          {slots.length === 0 ? (
            <div className="rounded border border-amber-500/20 bg-black/40 py-12 text-center">
              <p className="text-[11px] tracking-widest text-amber-200/40">No items found</p>
            </div>
          ) : (
            <div className="rounded border border-amber-500/20 bg-black/30 p-3">
              <p className="mb-3 text-[8px] tracking-[0.3em] text-amber-300/40">
                INVENTORY — {slots.length} {slots.length === 1 ? "PASS" : "PASSES"}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <InventorySlot key={slot.key} itemName={slot.itemName} status={slot.status} />
                ))}
              </div>
            </div>
          )}

          {/* Orders summary */}
          <div className="space-y-2">
            <p className="text-[8px] tracking-[0.3em] text-amber-300/40">ORDER HISTORY</p>
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded border border-amber-500/20 bg-black/30 px-3 py-2"
              >
                <div>
                  <StatusBadge status={order.status} />
                  <p className="mt-1 text-[9px] text-amber-200/40">
                    {new Date(order.created_at).toLocaleDateString("en-PH", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm text-amber-100">₱{order.total.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <form action={signout}>
            <button
              type="submit"
              className="w-full text-center text-[9px] tracking-widest text-amber-200/30 hover:text-amber-200/60"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </ViewTransition>
  );
}
