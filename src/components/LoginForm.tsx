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
    <form action={onSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@igreja.org"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="senha" className="text-sm font-medium">
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
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <Button type="submit" className="mt-2">
        Entrar
      </Button>
    </form>
  );
}