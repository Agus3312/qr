import { Suspense } from "react";
import LoginForm from "@/app/login/login-form";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <Suspense fallback={<p>Cargando...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}