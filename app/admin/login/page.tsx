import { Suspense } from "react";
import AdminLoginPage from "./login-client";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
