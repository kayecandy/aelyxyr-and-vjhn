import { ViewTransition } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SigninClient from "./SigninClient";

export const metadata = { title: "Enter the Realm · Ælyxyr & Vjhn" };

export default async function SigninPage() {
  const session = await getSession();
  if (session) redirect("/orders");

  return (
    <ViewTransition>
      <SigninClient />
    </ViewTransition>
  );
}
