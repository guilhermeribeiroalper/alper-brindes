import * as z from "zod";
import { brlParaCentavos } from "@/lib/formatacao";
import { dataCivilDeIso } from "@/lib/datas";
import { textoOpcional } from "@/lib/validacao/comum";

const emailOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || z.email().safeParse(v).success, { error: "Informe um e-mail válido." })
  .optional()
  .transform((v) => (v ? v.toLowerCase() : null));

const urlOpcional = z
  .string()
  .trim()
  .refine(
    (v) => {
      if (v === "") return true;
      try {
        const url = new URL(v);
        return url.protocol === "https:" || url.protocol === "http:";
      } catch {
        return false;
      }
    },
    { error: "Informe uma URL iniciada por http:// ou https://." },
  )
  .optional()
  .transform((v) => (v ? v : null));

export const esquemaFornecedor = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome do fornecedor." }),
  contatoNome: textoOpcional,
  contatoEmail: emailOpcional,
  contatoTelefone: textoOpcional,
  observacoes: textoOpcional,
});

export const esquemaProduto = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome do produto." }),
  descricao: textoOpcional,
  categoria: z.string().trim().min(2, { error: "Informe a categoria." }),
  imagemUrl: urlOpcional,
});

const inteiro = (rotulo: string, minimo: number) =>
  z.coerce
    .number({ error: `Informe ${rotulo}.` })
    .int({ error: `${rotulo[0].toUpperCase()}${rotulo.slice(1)} deve ser um número inteiro.` })
    .min(minimo, { error: `O mínimo para ${rotulo} é ${minimo}.` })
    .max(1_000_000, { error: `Valor muito alto para ${rotulo}.` });

export const esquemaPreco = z.object({
  fornecedorId: z.string().min(1, { error: "Selecione o fornecedor." }),
  valorUnitario: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const centavos = brlParaCentavos(v);
      if (centavos === null || centavos <= 0) {
        ctx.addIssue({ code: "custom", message: "Informe um valor maior que zero, ex.: 12,50." });
        return z.NEVER;
      }
      return centavos;
    }),
  quantidadeMinima: inteiro("a quantidade mínima", 1),
  prazoEntregaDias: inteiro("o prazo de entrega", 0),
  validadeEstimativa: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data de validade." })
    .transform(dataCivilDeIso),
  observacoes: textoOpcional,
});
