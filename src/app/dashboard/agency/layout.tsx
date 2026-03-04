import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
    const role = cookies().get("role")?.value;
    if (role !== "TravelAgency") redirect("/dashboard/agency");
    return <>{children}</>;
}
