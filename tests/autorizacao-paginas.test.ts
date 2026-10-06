// Toda página da área logada precisa verificar a sessão no servidor (no próprio arquivo,
// não só no layout, que não re-renderiza a cada navegação). Páginas de /admin exigem ADMIN.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ_APP = join(__dirname, "..", "src", "app", "(app)");

const paginas = (readdirSync(RAIZ_APP, { recursive: true }) as string[])
  .filter((arquivo) => arquivo.endsWith(`page.tsx`))
  .map((arquivo) => ({
    rota: "/" + relative(RAIZ_APP, join(RAIZ_APP, arquivo)).split(sep).slice(0, -1).join("/"),
    codigo: readFileSync(join(RAIZ_APP, arquivo), "utf8"),
  }));

describe("autorização nas páginas", () => {
  it("encontra as páginas da área logada", () => {
    expect(paginas.length).toBeGreaterThan(10);
  });

  it.each(paginas.filter((p) => p.rota.startsWith("/admin")).map((p) => [p.rota, p.codigo]))(
    "%s chama exigirAdmin()",
    (_rota, codigo) => {
      expect(codigo).toMatch(/await exigirAdmin\(\)/);
    },
  );

  it.each(paginas.filter((p) => !p.rota.startsWith("/admin")).map((p) => [p.rota, p.codigo]))(
    "%s chama exigirUsuario() ou exigirAdmin()",
    (_rota, codigo) => {
      expect(codigo).toMatch(/await exigir(Usuario|Admin)\(\)/);
    },
  );
});
