"use client";

import { useFormStatus } from "react-dom";
import { estilos } from "@/components/ui";

export function BotaoEnviar({
  children,
  pendente = "Salvando…",
  variante = "botao",
  className = "",
}: {
  children: React.ReactNode;
  pendente?: string;
  variante?: "botao" | "botaoSecundario" | "botaoPerigo" | "botaoPequeno";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${estilos[variante]} ${className}`}>
      {pending ? pendente : children}
    </button>
  );
}
