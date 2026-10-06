"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarFornecedor } from "@/actions/fornecedores";
import { Alerta, Campo, estilos } from "@/components/ui";

type Fornecedor = {
  id: string;
  nome: string;
  contatoNome: string | null;
  contatoEmail: string | null;
  contatoTelefone: string | null;
  observacoes: string | null;
};

export function FormFornecedor({ fornecedor }: { fornecedor?: Fornecedor }) {
  const [estado, acao, pendente] = useActionState(salvarFornecedor, undefined);
  const erros = estado?.errosCampo ?? {};
  const valor = (campo: keyof Fornecedor) => estado?.valores?.[campo] ?? fornecedor?.[campo] ?? "";

  return (
    <form action={acao} className={`${estilos.cartao} grid gap-4 p-6 sm:grid-cols-2`}>
      {fornecedor && <input type="hidden" name="id" value={fornecedor.id} />}
      {estado?.erro && (
        <div className="sm:col-span-2">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      <div className="sm:col-span-2">
        <Campo rotulo="Nome" nome="nome" erros={erros.nome}>
          <input id="nome" name="nome" required defaultValue={valor("nome")} className={estilos.input} aria-invalid={!!erros.nome} />
        </Campo>
      </div>
      <Campo rotulo="Nome do contato" nome="contatoNome" erros={erros.contatoNome}>
        <input id="contatoNome" name="contatoNome" defaultValue={valor("contatoNome")} className={estilos.input} />
      </Campo>
      <Campo rotulo="E-mail do contato" nome="contatoEmail" erros={erros.contatoEmail}>
        <input
          id="contatoEmail"
          name="contatoEmail"
          type="email"
          defaultValue={valor("contatoEmail")}
          className={estilos.input}
          aria-invalid={!!erros.contatoEmail}
        />
      </Campo>
      <Campo rotulo="Telefone do contato" nome="contatoTelefone" erros={erros.contatoTelefone}>
        <input
          id="contatoTelefone"
          name="contatoTelefone"
          type="tel"
          defaultValue={valor("contatoTelefone")}
          className={estilos.input}
        />
      </Campo>
      <div className="sm:col-span-2">
        <Campo rotulo="Observações" nome="observacoes" erros={erros.observacoes}>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            defaultValue={valor("observacoes")}
            className={estilos.input}
          />
        </Campo>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Salvando…" : "Salvar"}
        </button>
        <Link href="/admin/fornecedores" className={estilos.botaoSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
