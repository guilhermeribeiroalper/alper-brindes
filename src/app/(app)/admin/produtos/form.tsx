"use client";

import Link from "next/link";
import { useActionState } from "react";
import { salvarProduto } from "@/actions/produtos";
import { Alerta, Campo, estilos } from "@/components/ui";

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  imagemUrl: string | null;
};

export function FormProduto({ produto, categorias }: { produto?: Produto; categorias: string[] }) {
  const [estado, acao, pendente] = useActionState(salvarProduto, undefined);
  const erros = estado?.errosCampo ?? {};
  const valor = (campo: keyof Produto) => estado?.valores?.[campo] ?? produto?.[campo] ?? "";

  return (
    <form action={acao} className={`${estilos.cartao} grid gap-4 p-6 sm:grid-cols-2`}>
      {produto && <input type="hidden" name="id" value={produto.id} />}
      {estado?.erro && (
        <div className="sm:col-span-2">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      <Campo rotulo="Nome" nome="nome" erros={erros.nome}>
        <input id="nome" name="nome" required defaultValue={valor("nome")} className={estilos.input} aria-invalid={!!erros.nome} />
      </Campo>
      <Campo rotulo="Categoria" nome="categoria" erros={erros.categoria} ajuda="Escolha uma existente ou digite uma nova.">
        <input
          id="categoria"
          name="categoria"
          list="categorias"
          required
          defaultValue={valor("categoria")}
          className={estilos.input}
          aria-invalid={!!erros.categoria}
        />
        <datalist id="categorias">
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>
      <div className="sm:col-span-2">
        <Campo rotulo="Descrição" nome="descricao" erros={erros.descricao}>
          <textarea id="descricao" name="descricao" rows={3} defaultValue={valor("descricao")} className={estilos.input} />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <Campo rotulo="URL da imagem (opcional)" nome="imagemUrl" erros={erros.imagemUrl} ajuda="Endereço público da foto, ex.: https://…">
          <input
            id="imagemUrl"
            name="imagemUrl"
            type="url"
            defaultValue={valor("imagemUrl")}
            className={estilos.input}
            aria-invalid={!!erros.imagemUrl}
          />
        </Campo>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Salvando…" : produto ? "Salvar" : "Salvar e cadastrar preços"}
        </button>
        <Link href="/admin/produtos" className={estilos.botaoSecundario}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
