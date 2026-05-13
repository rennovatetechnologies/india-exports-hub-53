import Footer from "@/components/Footer";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "VISTARA — Export Products From Anywhere To Everywhere",
  description:
    "VISTARA by New India Export — the premium export consultancy & workflow automation platform. Plans, KYC, DGFT, ICEGATE and shipment tracking in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased"
        suppressHydrationWarning
      >
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
