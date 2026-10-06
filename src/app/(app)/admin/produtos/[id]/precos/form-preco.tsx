"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarPreco } from "@/actions/precos";
import { Alerta, Campo, estilos } from "@/components/ui";

export type PrecoEditavel = {
  id: string;
  fornecedorId: string;
  valorUnitario: string; // "12,50"
  quantidadeMinima: number;
  prazoEntregaDias: number;
  validadeEstimativa: string; // AAAA-MM-DD
  observacoes: string | null;
};

export function FormPreco({
  produtoId,
  fornecedores,
  preco,
  validadePadrao,
}: {
  produtoId: string;
  fornecedores: { id: string; nome: string; ativo: boolean }[];
  preco?: PrecoEditavel;
  validadePadrao: string;
}) {
  const [estado, acao, pendente] = useActionState(salvarPreco, undefined);
  const erros = estado?.errosCampo ?? {};
  const valor = (campo: keyof PrecoEditavel, padrao = "") =>
    estado?.valores?.[campo] ?? (preco ? String(preco[campo] ?? "") : padrao);

  if (fornecedores.length === 0) {
    return (
      <Alerta tipo="aviso">
        Nenhum fornecedor ativo.{" "}
        <Link href="/admin/fornecedores/novo" className={estilos.link}>
          Cadastre um fornecedor
        </Link>{" "}
        antes de registrar preços.
      </Alerta>
    );
  }

  return (
    // O React limpa o formulário após a action; em caso de erro, os valores voltam em estado.valores.
    <form action={acao} className="grid gap-4 sm:grid-cols-3">
      <input type="hidden" name="produtoId" value={produtoId} />
      {preco && <input type="hidden" name="id" value={preco.id} />}
      {estado?.erro && (
        <div className="sm:col-span-3">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      {estado?.sucesso && (
        <div className="sm:col-span-3">
          <Alerta tipo="sucesso">{estado.sucesso}</Alerta>
        </div>
      )}
      <Campo rotulo="Fornecedor" nome="fornecedorId" erros={erros.fornecedorId}>
        <select id="fornecedorId" name="fornecedorId" required defaultValue={valor("fornecedorId")} className={estilos.input}>
          <option value="" disabled>
            Selecione…
          </option>
          {fornecedores.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
              {!f.ativo && " (inativo)"}
            </option>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Valor unitário (R$)" nome="valorUnitario" erros={erros.valorUnitario}>
        <input
          id="valorUnitario"
          name="valorUnitario"
          inputMode="decimal"
          placeholder="0,00"
          required
          defaultValue={valor("valorUnitario")}
          className={estilos.input}
          aria-invalid={!!erros.valorUnitario}
        />
      </Campo>
      <Campo rotulo="Quantidade mínima" nome="quantidadeMinima" erros={erros.quantidadeMinima}>
        <input
          id="quantidadeMinima"
          name="quantidadeMinima"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={valor("quantidadeMinima", "1")}
          className={estilos.input}
          aria-invalid={!!erros.quantidadeMinima}
        />
      </Campo>
      <Campo rotulo="Prazo de entrega (dias)" nome="prazoEntregaDias" erros={erros.prazoEntregaDias}>
        <input
          id="prazoEntregaDias"
          name="prazoEntregaDias"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={valor("prazoEntregaDias")}
          className={estilos.input}
          aria-invalid={!!erros.prazoEntregaDias}
        />
      </Campo>
      <Campo rotulo="Estimativa válida até" nome="validadeEstimativa" erros={erros.validadeEstimativa}>
        <input
          id="validadeEstimativa"
          name="validadeEstimativa"
          type="date"
          required
          defaultValue={valor("validadeEstimativa", validadePadrao)}
          className={estilos.input}
          aria-invalid={!!erros.validadeEstimativa}
        />
      </Campo>
      <Campo rotulo="Observações" nome="observacoes" erros={erros.observacoes}>
        <input id="observacoes" name="observacoes" defaultValue={valor("observacoes")} className={estilos.input} />
      </Campo>
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Salvando…" : preco ? "Salvar alterações" : "Adicionar preço"}
        </button>
        {preco && (
          <Link href={`/admin/produtos/${produtoId}/precos`} className={estilos.botaoSecundario}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
