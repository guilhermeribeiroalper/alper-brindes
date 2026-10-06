import { describe, expect, it } from "vitest";
import { hojeCivil, somarDias } from "@/lib/datas";
import { brlParaCentavos, formatarBRL, formatarData, normalizarBusca } from "@/lib/formatacao";

describe("datas civis no fuso da empresa", () => {
  it("hoje é calculado em America/Sao_Paulo", () => {
    // 02:00 UTC de 1º/jan ainda é 31/dez em São Paulo (UTC-3).
    expect(hojeCivil(new Date("2026-01-01T02:00:00Z")).toISOString()).toBe("2025-12-31T00:00:00.000Z");
    expect(hojeCivil(new Date("2026-01-01T04:00:00Z")).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("formata em dd/mm/aaaa sem deslocar o dia", () => {
    expect(formatarData(new Date("2030-01-31T00:00:00Z"))).toBe("31/01/2030");
    expect(formatarData(somarDias(new Date("2026-02-27T00:00:00Z"), 2))).toBe("01/03/2026");
  });
});

describe("valores em BRL", () => {
  it.each([
    ["12,50", 1250],
    ["1.234,5", 123450],
    ["R$ 18,90", 1890],
    ["15", 1500],
    ["0,05", 5],
  ])("%s → %d centavos", (texto, centavos) => {
    expect(brlParaCentavos(texto)).toBe(centavos);
  });

  it.each(["abc", "12,345", "1,2,3", "", "-5"])("rejeita %j", (texto) => {
    expect(brlParaCentavos(texto)).toBeNull();
  });

  it("formata centavos como moeda brasileira", () => {
    expect(formatarBRL(123450).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});

describe("busca", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizarBusca("Squeeze TÉRMICO")).toBe("squeeze termico");
  });
});
