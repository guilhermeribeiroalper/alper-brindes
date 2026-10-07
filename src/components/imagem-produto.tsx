import { imagemPadraoProduto } from "@/lib/imagens";

/**
 * Foto do produto (URL externa cadastrada pelo admin). Sem foto, mostra uma imagem
 * ilustrativa padrão, sinalizada como tal.
 */
export function ImagemProduto({
  id,
  url,
  nome,
  className = "",
}: {
  id: string;
  url: string | null;
  nome: string;
  className?: string;
}) {
  const ilustrativa = !url;
  return (
    <div className={`relative overflow-hidden bg-surface-alt ${className}`}>
      {/* <img> em vez de next/image: as URLs cadastradas são de domínios arbitrários. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url ?? imagemPadraoProduto(id)}
        alt={ilustrativa ? "" : nome}
        loading="lazy"
        className="size-full object-cover"
      />
      {ilustrativa && (
        <span className="absolute bottom-2 left-2 rounded-sm bg-surface-brand/85 px-2 py-0.5 text-[11px] font-semibold text-on-brand">
          Imagem ilustrativa
        </span>
      )}
    </div>
  );
}
