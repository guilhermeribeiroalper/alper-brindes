import * as z from "zod";

/** Estado devolvido pelas Server Actions usadas com useActionState. */
export type EstadoForm =
  | {
      erro?: string;
      sucesso?: string;
      errosCampo?: Record<string, string[] | undefined>;
      /** Valores enviados, para repreencher o formulário (o React limpa o form após a action). */
      valores?: Record<string, string>;
    }
  | undefined;

/** Campos de texto enviados, sem os internos do Next e sem senhas. */
export function valoresDoForm(formData: FormData): Record<string, string> {
  const valores: Record<string, string> = {};
  for (const [chave, valor] of formData) {
    if (typeof valor === "string" && !chave.startsWith("$ACTION") && !/senha/i.test(chave)) valores[chave] = valor;
  }
  return valores;
}

export function errosDeValidacao(erro: z.ZodError, formData: FormData): EstadoForm {
  return {
    erro: "Verifique os campos destacados.",
    errosCampo: z.flattenError(erro).fieldErrors as Record<string, string[] | undefined>,
    valores: valoresDoForm(formData),
  };
}

/** Campo de texto opcional: "" ou ausente vira null (assim o update também limpa o valor). */
export const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

export const id = z.string().min(1);
