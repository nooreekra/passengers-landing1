import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function PartnershipLayout({ children }: { children: React.ReactNode }) {
    const role = cookies().get("role")?.value;
    if (role !== "Partnership") redirect("/");
    return <>{children}</>;
}
