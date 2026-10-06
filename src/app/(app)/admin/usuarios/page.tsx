import { db } from "@/lib/db";
import { exigirAdmin } from "@/lib/auth/guards";
import { alterarAtivoUsuario, alterarPerfilUsuario } from "@/actions/usuarios";
import { BotaoEnviar } from "@/components/botao-enviar";
import { EstadoVazio, Selo, Titulo, estilos } from "@/components/ui";
import { formatarDataHora } from "@/lib/formatacao";
import { FormNovoUsuario, FormRedefinirSenha } from "./forms";

export const metadata = { title: "Usuários · Catálogo de Brindes" };

export default async function PaginaUsuarios() {
  const admin = await exigirAdmin();
  const usuarios = await db.usuario.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, email: true, departamento: true, perfil: true, ativo: true, criadoEm: true },
  });

  return (
    <>
      <Titulo>Usuários</Titulo>

      <details className={`${estilos.cartao} mb-6 p-4`}>
        <summary className="cursor-pointer font-medium">Novo usuário</summary>
        <div className="mt-4">
          <FormNovoUsuario />
        </div>
      </details>

      {usuarios.length === 0 ? (
        <EstadoVazio titulo="Nenhum usuário cadastrado." />
      ) : (
        <div className={`${estilos.cartao} overflow-x-auto`}>
          <table className={estilos.tabela}>
            <thead className="bg-slate-50">
              <tr>
                <th className={estilos.th}>Nome</th>
                <th className={estilos.th}>Departamento</th>
                <th className={estilos.th}>Perfil</th>
                <th className={estilos.th}>Situação</th>
                <th className={estilos.th}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const proprio = u.id === admin.id;
                return (
                  <tr key={u.id} className={u.ativo ? "" : "bg-slate-50 text-slate-500"}>
                    <td className={estilos.td}>
                      <p className="font-medium">
                        {u.nome} {proprio && <span className="text-xs text-slate-500">(você)</span>}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                      <p className="text-xs text-slate-400">Criado em {formatarDataHora(u.criadoEm)}</p>
                    </td>
                    <td className={estilos.td}>{u.departamento}</td>
                    <td className={estilos.td}>
                      {proprio ? (
                        <Selo cor="azul">Admin</Selo>
                      ) : (
                        <form action={alterarPerfilUsuario} className="flex items-center gap-2">
                          <input type="hidden" name="usuarioId" value={u.id} />
                          <label className="sr-only" htmlFor={`perfil-${u.id}`}>
                            Perfil de {u.nome}
                          </label>
                          <select
                            id={`perfil-${u.id}`}
                            name="perfil"
                            defaultValue={u.perfil}
                            className={`${estilos.input} w-auto py-1`}
                          >
                            <option value="SOLICITANTE">Solicitante</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <BotaoEnviar variante="botaoPequeno" pendente="…">
                            Salvar
                          </BotaoEnviar>
                        </form>
                      )}
                    </td>
                    <td className={estilos.td}>
                      {u.ativo ? <Selo cor="verde">Ativo</Selo> : <Selo>Inativo</Selo>}
                    </td>
                    <td className={`${estilos.td} space-y-2`}>
                      {!proprio && (
                        <form action={alterarAtivoUsuario}>
                          <input type="hidden" name="usuarioId" value={u.id} />
                          <input type="hidden" name="ativo" value={String(!u.ativo)} />
                          <BotaoEnviar variante="botaoPequeno" pendente="…">
                            {u.ativo ? "Desativar" : "Ativar"}
                          </BotaoEnviar>
                        </form>
                      )}
                      <FormRedefinirSenha usuarioId={u.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
