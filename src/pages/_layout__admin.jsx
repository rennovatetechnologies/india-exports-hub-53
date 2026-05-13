import DashboardChrome from "@/components/dashboard/DashboardChrome";

export const metadata = { title: "Admin · VISTARA" };

export default function AdminLayout({ children }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}