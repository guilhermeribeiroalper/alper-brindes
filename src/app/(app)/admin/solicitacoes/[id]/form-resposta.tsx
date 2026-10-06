"use client";

import { useActionState } from "react";
import { responderSolicitacao } from "@/actions/solicitacoes";
import { Alerta, Campo, estilos } from "@/components/ui";

export function FormResposta({
  solicitacaoId,
  fornecedores,
}: {
  solicitacaoId: string;
  fornecedores: { id: string; nome: string }[];
}) {
  const [estado, acao, pendente] = useActionState(responderSolicitacao, undefined);
  const erros = estado?.errosCampo ?? {};
  const valores = estado?.valores ?? {};

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="id" value={solicitacaoId} />
      {estado?.erro && (
        <div className="sm:col-span-3">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      <Campo rotulo="Valor total final (R$)" nome="valorTotalFinal" erros={erros.valorTotalFinal}>
        <input
          id="valorTotalFinal"
          name="valorTotalFinal"
          inputMode="decimal"
          placeholder="0,00"
          required
          defaultValue={valores.valorTotalFinal}
          className={estilos.input}
          aria-invalid={!!erros.valorTotalFinal}
        />
      </Campo>
      <Campo rotulo="Fornecedor escolhido (opcional)" nome="fornecedorEscolhidoId" erros={erros.fornecedorEscolhidoId}>
        <select
          id="fornecedorEscolhidoId"
          name="fornecedorEscolhidoId"
          defaultValue={valores.fornecedorEscolhidoId ?? ""}
          className={estilos.input}
        >
          <option value="">Não informar</option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Prazo de entrega (dias)" nome="prazoEntregaDias" erros={erros.prazoEntregaDias}>
        <input
          id="prazoEntregaDias"
          name="prazoEntregaDias"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={valores.prazoEntregaDias}
          className={estilos.input}
          aria-invalid={!!erros.prazoEntregaDias}
        />
      </Campo>
      <div className="sm:col-span-3">
        <Campo
          rotulo="Observações para o solicitante"
          nome="observacoes"
          erros={erros.observacoes}
          ajuda="Visível para o solicitante. O fornecedor escolhido não é mostrado a ele."
        >
          <textarea id="observacoes" name="observacoes" rows={3} defaultValue={valores.observacoes} className={estilos.input} />
        </Campo>
      </div>
      <div className="sm:col-span-3">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Registrando…" : "Registrar resposta"}
        </button>
      </div>
    </form>
  );
}
