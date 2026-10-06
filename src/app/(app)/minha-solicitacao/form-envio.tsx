"use client";

import { useActionState } from "react";
import { enviarSolicitacao } from "@/actions/solicitacoes";
import { Alerta, Campo, estilos } from "@/components/ui";

export function FormEnvio({
  departamentoPadrao,
  dataMinima,
  bloqueado,
}: {
  departamentoPadrao: string;
  dataMinima: string;
  bloqueado: boolean;
}) {
  const [estado, acao, pendente] = useActionState(enviarSolicitacao, undefined);
  const erros = estado?.errosCampo ?? {};
  const valores = estado?.valores ?? {};

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-2">
      {estado?.erro && (
        <div className="sm:col-span-2">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      <Campo rotulo="Departamento" nome="departamento" erros={erros.departamento}>
        <input
          id="departamento"
          name="departamento"
          required
          defaultValue={valores.departamento ?? departamentoPadrao}
          className={estilos.input}
          aria-invalid={!!erros.departamento}
        />
      </Campo>
      <Campo rotulo="Data em que precisa dos brindes" nome="dataNecessaria" erros={erros.dataNecessaria}>
        <input
          id="dataNecessaria"
          name="dataNecessaria"
          type="date"
          min={dataMinima}
          required
          defaultValue={valores.dataNecessaria}
          className={estilos.input}
          aria-invalid={!!erros.dataNecessaria}
        />
      </Campo>
      <div className="sm:col-span-2">
        <Campo rotulo="Justificativa" nome="justificativa" erros={erros.justificativa} ajuda="Ex.: evento, campanha, público e quantidade de pessoas.">
          <textarea
            id="justificativa"
            name="justificativa"
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            defaultValue={valores.justificativa}
            className={estilos.input}
            aria-invalid={!!erros.justificativa}
          />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pendente || bloqueado} className={estilos.botao}>
          {pendente ? "Enviando…" : "Enviar solicitação"}
        </button>
      </div>
    </form>
  );
}
