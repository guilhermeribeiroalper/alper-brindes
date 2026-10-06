import * as z from "zod";

/** Estado devolvido pelas Server Actions usadas com useActionState. */
export type EstadoForm =
  | {
      erro?: string;
      sucesso?: string;
      errosCampo?: Record<string, string[] | undefined>;
    }
  | undefined;

export function errosDeValidacao(erro: z.ZodError): EstadoForm {
  return {
    erro: "Verifique os campos destacados.",
    errosCampo: z.flattenError(erro).fieldErrors as Record<string, string[] | undefined>,
  };
}

/** Converte "" de campos de formulário em undefined (campos opcionais). */
export const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const id = z.string().min(1);
