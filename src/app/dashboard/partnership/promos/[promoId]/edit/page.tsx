import { redirect } from "next/navigation";

export default function EditPromoRoot() {
    redirect("/dashboard/airline/promos/[promoId]/edit/step-1");
}
