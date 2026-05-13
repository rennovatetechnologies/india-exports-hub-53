import DashboardChrome from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "Dashboard · VISTARA",
};

export default function DashboardLayout({ children }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}