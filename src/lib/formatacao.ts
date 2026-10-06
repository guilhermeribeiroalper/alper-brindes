import { FUSO_EMPRESA } from "@/lib/datas";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarBRL(centavos: number): string {
  return brl.format(centavos / 100);
}

/** Data civil (guardada à meia-noite UTC) em dd/mm/aaaa. */
export function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(data);
}

/** Instante (ex.: criadaEm) em dd/mm/aaaa hh:mm no fuso da empresa. */
export function formatarDataHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_EMPRESA,
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export function formatarPrazo(minDias: number, maxDias: number): string {
  const sufixo = (n: number) => (n === 1 ? "dia" : "dias");
  return minDias === maxDias
    ? `${minDias} ${sufixo(minDias)}`
    : `${minDias} a ${maxDias} ${sufixo(maxDias)}`;
}

/**
 * Converte texto digitado em BRL ("1.234,56", "R$ 12,9", "15") em centavos.
 * Retorna null se não for um valor válido.
 */
export function brlParaCentavos(texto: string): number | null {
  const limpo = texto.replace(/R\$|\s/g, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(limpo)) return null;
  const [inteiros, decimais = ""] = limpo.replace(/\./g, "").split(",");
  return Number(inteiros) * 100 + Number(decimais.padEnd(2, "0"));
}

/** Centavos em texto editável no formato "1234,56". */
export function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}
