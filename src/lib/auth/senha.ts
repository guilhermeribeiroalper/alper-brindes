import bcrypt from "bcryptjs";

const CUSTO = 12;

export function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO);
}

export function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// Hash de um valor aleatório, usado quando o e-mail não existe para que o
// tempo de resposta do login não revele se a conta existe.
let hashFicticio: Promise<string> | undefined;
export function obterHashFicticio(): Promise<string> {
  hashFicticio ??= bcrypt.hash(crypto.randomUUID(), CUSTO);
  return hashFicticio;
}
