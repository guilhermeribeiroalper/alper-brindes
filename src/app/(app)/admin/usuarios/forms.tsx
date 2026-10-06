"use client";

import { useActionState } from "react";
import { criarUsuario, redefinirSenha } from "@/actions/usuarios";
import { Alerta, Campo, estilos } from "@/components/ui";

export function FormNovoUsuario() {
  const [estado, acao, pendente] = useActionState(criarUsuario, undefined);
  const erros = estado?.errosCampo ?? {};

  return (
    // key força limpar os campos depois de criar com sucesso
    <form key={estado?.sucesso} action={acao} className="grid gap-4 sm:grid-cols-2">
      {estado?.erro && (
        <div className="sm:col-span-2">
          <Alerta tipo="erro">{estado.erro}</Alerta>
        </div>
      )}
      {estado?.sucesso && (
        <div className="sm:col-span-2">
          <Alerta tipo="sucesso">{estado.sucesso}</Alerta>
        </div>
      )}
      <Campo rotulo="Nome" nome="nome" erros={erros.nome}>
        <input id="nome" name="nome" required className={estilos.input} aria-invalid={!!erros.nome} />
      </Campo>
      <Campo rotulo="E-mail" nome="email" erros={erros.email}>
        <input id="email" name="email" type="email" required className={estilos.input} aria-invalid={!!erros.email} />
      </Campo>
      <Campo rotulo="Departamento" nome="departamento" erros={erros.departamento}>
        <input
          id="departamento"
          name="departamento"
          required
          className={estilos.input}
          aria-invalid={!!erros.departamento}
        />
      </Campo>
      <Campo rotulo="Perfil" nome="perfil" erros={erros.perfil}>
        <select id="perfil" name="perfil" defaultValue="SOLICITANTE" className={estilos.input}>
          <option value="SOLICITANTE">Solicitante</option>
          <option value="ADMIN">Admin</option>
        </select>
      </Campo>
      <Campo rotulo="Senha inicial" nome="senha" erros={erros.senha} ajuda="Mínimo de 8 caracteres.">
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={estilos.input}
          aria-invalid={!!erros.senha}
        />
      </Campo>
      <div className="flex items-end">
        <button type="submit" disabled={pendente} className={estilos.botao}>
          {pendente ? "Criando…" : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}

export function FormRedefinirSenha({ usuarioId }: { usuarioId: string }) {
  const [estado, acao, pendente] = useActionState(redefinirSenha, undefined);
  const erro = estado?.errosCampo?.senha?.[0] ?? estado?.erro;

  return (
    <details>
      <summary className="cursor-pointer text-xs text-marca-600 hover:underline">Redefinir senha</summary>
      <form action={acao} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="usuarioId" value={usuarioId} />
        <label className="sr-only" htmlFor={`senha-${usuarioId}`}>
          Nova senha
        </label>
        <input
          id={`senha-${usuarioId}`}
          name="senha"
          type="password"
          autoComplete="new-password"
          placeholder="Nova senha (mín. 8)"
          minLength={8}
          required
          className={`${estilos.input} py-1`}
        />
        <button type="submit" disabled={pendente} className={estilos.botaoPequeno}>
          {pendente ? "Salvando…" : "Salvar senha"}
        </button>
        {erro && !estado?.sucesso && <p className="text-xs text-red-600">{erro}</p>}
        {estado?.sucesso && <p className="text-xs text-emerald-700">{estado.sucesso}</p>}
      </form>
    </details>
  );
}
