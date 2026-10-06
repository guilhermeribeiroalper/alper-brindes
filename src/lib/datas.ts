// Datas "civis" (sem hora) são guardadas à meia-noite UTC do dia escolhido.
// "Hoje" é sempre calculado no fuso da empresa.
export const FUSO_EMPRESA = "America/Sao_Paulo";

/** Data civil de hoje no fuso da empresa, à meia-noite UTC. */
export function hojeCivil(agora: Date = new Date()): Date {
  // en-CA formata como AAAA-MM-DD.
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_EMPRESA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Soma dias a uma data civil. */
export function somarDias(data: Date, dias: number): Date {
  const nova = new Date(data);
  nova.setUTCDate(nova.getUTCDate() + dias);
  return nova;
}

/** Converte "AAAA-MM-DD" (valor de <input type="date">) em data civil. */
export function dataCivilDeIso(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Converte data civil em "AAAA-MM-DD" para <input type="date">. */
export function dataCivilParaIso(data: Date): string {
  return data.toISOString().slice(0, 10);
}
