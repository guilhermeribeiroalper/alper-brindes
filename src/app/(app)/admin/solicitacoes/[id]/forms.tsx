"use client";

import { useActionState } from "react";
import { aprovarSolicitacao, cancelarSolicitacaoAdmin } from "@/actions/solicitacoes";
import { Alerta, Campo, estilos } from "@/components/ui";

export function FormAprovacao({
  solicitacaoId,
  fornecedores,
  clickupConfigurado,
}: {
  solicitacaoId: string;
  fornecedores: { id: string; nome: string }[];
  clickupConfigurado: boolean;
}) {
  const [estado, acao, pendente] = useActionState(aprovarSolicitacao, undefined);
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
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Aprovando…" : "Aprovar solicitação"}
        </button>
        <p className="text-xs text-on-surface-muted">
          {clickupConfigurado
            ? "Ao aprovar, uma tarefa com os brindes é criada no ClickUp."
            : "Integração com o ClickUp não configurada: a aprovação será registrada e a tarefa poderá ser criada depois."}
        </p>
      </div>
    </form>
  );
}

export function FormCancelamentoAdmin({ solicitacaoId }: { solicitacaoId: string }) {
  const [estado, acao, pendente] = useActionState(cancelarSolicitacaoAdmin, undefined);
  const erros = estado?.errosCampo ?? {};

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="id" value={solicitacaoId} />
      {estado?.erro && <Alerta tipo="erro">{estado.erro}</Alerta>}
      <Campo
        rotulo="Motivo do cancelamento"
        nome="motivo"
        erros={erros.motivo}
        ajuda="Visível para o solicitante."
      >
        <textarea
          id="motivo"
          name="motivo"
          rows={3}
          required
          minLength={5}
          maxLength={1000}
          defaultValue={estado?.valores?.motivo}
          className={estilos.input}
          aria-invalid={!!erros.motivo}
        />
      </Campo>
      <button type="submit" disabled={pendente} className={estilos.botaoPerigo}>
        {pendente ? "Cancelando…" : "Cancelar solicitação"}
      </button>
    </form>
  );
}
