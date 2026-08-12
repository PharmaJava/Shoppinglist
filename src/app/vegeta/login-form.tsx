"use client";

import { useActionState } from "react";
import { accederAction, type EstadoAcceso } from "./actions";

const INICIAL: EstadoAcceso = {};

export function LoginForm() {
  const [estado, enviar, enviando] = useActionState(accederAction, INICIAL);

  return (
    <form action={enviar} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-on-surface">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-12 rounded-card border border-border bg-surface px-4 text-on-surface outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-on-surface">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="min-h-12 rounded-card border border-border bg-surface px-4 text-on-surface outline-none focus:border-brand"
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm font-medium text-accent">
          {estado.error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="min-h-12 rounded-full bg-brand px-6 font-semibold text-brand-contrast disabled:opacity-60"
      >
        {enviando ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}
