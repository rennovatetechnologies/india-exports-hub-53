import { Navigate } from "react-router-dom";
import AuthGuard from "@/components/AuthGuard";

/** @deprecated Prefer `<AuthGuard area="staff">`. Kept for older imports. */
export default function AdminProtectedRoute({ children }) {
  return <AuthGuard area="staff">{children}</AuthGuard>;
}

/** Redirect bare /admin hits that somehow skip the layout guard. */
export function AdminRootRedirect() {
  return <Navigate to="/admin" replace />;
}
