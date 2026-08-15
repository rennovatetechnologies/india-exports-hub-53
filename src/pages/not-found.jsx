import FallbackScreen from "@/components/FallbackScreen";

export default function NotFoundPage({ compact = false }) {
  return <FallbackScreen kind="not-found" compact={compact} />;
}
