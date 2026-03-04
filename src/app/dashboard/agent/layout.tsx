import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const role = cookies().get("role")?.value;
    if (role !== "TravelAgent") redirect("/dashboard/agent");
    return <>{children}</>;
}
