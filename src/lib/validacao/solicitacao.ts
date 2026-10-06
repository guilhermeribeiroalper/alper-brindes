import * as z from "zod";
import { brlParaCentavos } from "@/lib/formatacao";
import { dataCivilDeIso, hojeCivil } from "@/lib/datas";
import { textoOpcional } from "@/lib/validacao/comum";

export const esquemaEnvio = z.object({
  departamento: z.string().trim().min(2, { error: "Informe o departamento." }),
  dataNecessaria: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data em que precisa dos brindes." })
    .transform(dataCivilDeIso)
    .refine((data) => data.getTime() >= hojeCivil().getTime(), { error: "A data necessária não pode estar no passado." }),
  justificativa: z
    .string()
    .trim()
    .min(10, { error: "Descreva a justificativa (mínimo de 10 caracteres)." })
    .max(2000, { error: "A justificativa deve ter no máximo 2.000 caracteres." }),
});

export const esquemaResposta = z.object({
  valorTotalFinal: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const centavos = brlParaCentavos(v);
      if (centavos === null || centavos <= 0) {
        ctx.addIssue({ code: "custom", message: "Informe o valor total final, ex.: 2.350,00." });
        return z.NEVER;
      }
      return centavos;
    }),
  fornecedorEscolhidoId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  prazoEntregaDias: z.coerce
    .number({ error: "Informe o prazo de entrega." })
    .int({ error: "O prazo deve ser um número inteiro de dias." })
    .min(0, { error: "O prazo não pode ser negativo." })
    .max(3650, { error: "Prazo muito longo." }),
  observacoes: textoOpcional,
});
