import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AirlineLayout({ children }: { children: React.ReactNode }) {
    const role = cookies().get("role")?.value;
    if (role !== "Airline") redirect("/dashboard/airline");
    return <>{children}</>;
}
