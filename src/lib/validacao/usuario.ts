import * as z from "zod";

export const esquemaLogin = z.object({
  email: z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase(),
  senha: z.string().min(1, { error: "Informe a senha." }),
});

const senha = z
  .string()
  .min(8, { error: "A senha deve ter pelo menos 8 caracteres." })
  .max(128, { error: "A senha deve ter no máximo 128 caracteres." });

export const esquemaNovoUsuario = z.object({
  nome: z.string().trim().min(2, { error: "Informe o nome." }),
  email: z.email({ error: "Informe um e-mail válido." }).trim().toLowerCase(),
  departamento: z.string().trim().min(2, { error: "Informe o departamento." }),
  perfil: z.enum(["ADMIN", "SOLICITANTE"], { error: "Selecione o perfil." }),
  senha,
});

export const esquemaRedefinirSenha = z.object({
  usuarioId: z.string().min(1),
  senha,
});
