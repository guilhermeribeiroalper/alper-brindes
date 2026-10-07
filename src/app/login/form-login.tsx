"use client";

import { useActionState } from "react";
import { entrar } from "@/actions/auth";
import { Alerta, Campo, estilos } from "@/components/ui";

export function FormLogin() {
  const [estado, acao, pendente] = useActionState(entrar, undefined);
  return (
    <form action={acao} className="space-y-5">
      {estado?.erro && <Alerta tipo="erro">{estado.erro}</Alerta>}
      <Campo rotulo="E-mail" nome="email">
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={estado?.valores?.email} className={estilos.input} />
      </Campo>
      <Campo rotulo="Senha" nome="senha">
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={estilos.input}
        />
      </Campo>
      <button type="submit" disabled={pendente} className={`${estilos.botao} w-full py-2.5`}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
