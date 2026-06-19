import { redirect } from "next/navigation";

export default function LegacyBetikaUsersRedirect() {
  redirect("/betika/parieurs");
}
