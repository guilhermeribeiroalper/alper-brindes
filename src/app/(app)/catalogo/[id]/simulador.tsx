"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { simularEstimativa } from "@/actions/catalogo";
import { adicionarAoCarrinho } from "@/actions/carrinho";
import { ResultadoEstimativa } from "@/components/estimativa";
import { Alerta, estilos } from "@/components/ui";
import type { Estimativa } from "@/lib/regras/estimativa";

export function Simulador({
  produtoId,
  quantidadeInicial,
  estimativaInicial,
}: {
  produtoId: string;
  quantidadeInicial: number;
  estimativaInicial: Estimativa;
}) {
  const [quantidade, setQuantidade] = useState(String(quantidadeInicial));
  const [estimativa, setEstimativa] = useState(estimativaInicial);
  const [calculando, iniciarCalculo] = useTransition();
  const ultimaRequisicao = useRef(0);
  const quantidadeCalculada = useRef(String(estimativaInicial.quantidade));
  const [estadoCarrinho, adicionar, adicionando] = useActionState(adicionarAoCarrinho, undefined);

  // Recalcula no servidor após uma breve pausa na digitação. O cálculo fica no servidor
  // para que os preços por fornecedor nunca cheguem ao navegador.
  useEffect(() => {
    if (quantidade === quantidadeCalculada.current) return;
    const temporizador = setTimeout(() => {
      const requisicao = ++ultimaRequisicao.current;
      iniciarCalculo(async () => {
        const resultado = await simularEstimativa(produtoId, Number(quantidade || 0));
        if (requisicao === ultimaRequisicao.current) {
          quantidadeCalculada.current = quantidade;
          setEstimativa(resultado);
        }
      });
    }, 300);
    return () => clearTimeout(temporizador);
  }, [quantidade, produtoId]);

  const quantidadeValida = /^\d+$/.test(quantidade) && Number(quantidade) >= 1;

  return (
    <form action={adicionar} className="space-y-4">
      <input type="hidden" name="produtoId" value={produtoId} />
      <input type="hidden" name="quantidade" value={quantidade} />
      <div>
        <label htmlFor="quantidade-simulador" className="block text-sm font-medium text-on-surface">
          Quantidade
        </label>
        <div className="mt-1 flex items-center gap-3">
          <input
            id="quantidade-simulador"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={`${estilos.input} w-40`}
          />
          {calculando && <span className="text-xs text-on-surface-muted">Calculando…</span>}
        </div>
      </div>

      <div className={calculando ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <ResultadoEstimativa estimativa={estimativa} />
      </div>

      {estadoCarrinho?.erro && <Alerta tipo="erro">{estadoCarrinho.erro}</Alerta>}
      {estadoCarrinho?.sucesso && (
        <Alerta tipo="sucesso">
          {estadoCarrinho.sucesso}{" "}
          <Link href="/minha-solicitacao" className="font-medium underline">
            Ver minha solicitação
          </Link>
        </Alerta>
      )}

      <button type="submit" disabled={!quantidadeValida || adicionando} className={`${estilos.botao} w-full sm:w-auto`}>
        {adicionando ? "Adicionando…" : "Adicionar à solicitação"}
      </button>
    </form>
  );
}
