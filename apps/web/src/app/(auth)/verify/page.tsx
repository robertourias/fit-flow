"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendOtp } from "@/app/(auth)/actions";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const isSignup = searchParams.get("signup") === "true";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      otp,
      redirect: false,
    });

    if (!result?.ok) {
      setError("Código inválido ou expirado. Tente novamente.");
      setLoading(false);
      return;
    }

    // Fetch session to check hasOnboarded
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const hasOnboarded = session?.user?.hasOnboarded ?? false;

    if (isSignup || !hasOnboarded) {
      router.push("/onboarding");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleResend() {
    setResending(true);
    setResendSuccess(false);
    setError(null);

    const result = await resendOtp(email);
    setResending(false);

    if (result.success) {
      setResendSuccess(true);
      setOtp("");
    } else {
      setError(result.error ?? "Erro ao reenviar código.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold">Verificar email</h1>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="otp" className="text-sm font-medium">
            Código de verificação <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setOtp(val);
              setError(null);
            }}
            placeholder="000000"
            className="h-12 w-full rounded-m border border-input bg-background px-3 text-center text-xl tracking-[0.5em] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
          />
          {error && (
            <p role="alert" className="text-sm text-[var(--color-error-text)]">
              {error}
            </p>
          )}
          {resendSuccess && (
            <p role="status" className="text-sm text-[var(--color-success-text)]">
              Novo código enviado. Verifique seu email.
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading && <Loader2 className="animate-spin" />}
          Verificar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Não recebeu o código?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-primary underline underline-offset-4 hover:opacity-80 disabled:opacity-50"
        >
          {resending ? "Enviando..." : "Reenviar"}
        </button>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
