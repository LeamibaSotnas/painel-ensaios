'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";

interface LoginFormProps {
  erro?: string;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function LoginForm({ erro, onSubmit }: LoginFormProps) {
  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/90">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@igreja.org"
          className="bg-white/90 border-white/40 text-slate-800 placeholder:text-slate-400 focus-visible:ring-fuchsia-400/40"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium text-white/90">
          Senha
        </label>
        <PasswordInput
          id="senha"
          name="senha"
          required
          autoComplete="current-password"
        />
      </div>

      {erro && (
        <p className="rounded-xl border border-red-300/30 bg-red-900/30 px-3 py-2 text-sm text-red-200 backdrop-blur-sm">
          {erro}
        </p>
      )}

      <Button type="submit" className="mt-2 w-full">
        Entrar
      </Button>
    </form>
  );
}