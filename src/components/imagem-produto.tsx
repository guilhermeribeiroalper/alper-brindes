/** Foto do produto (URL externa cadastrada pelo admin) ou um marcador com as iniciais. */
export function ImagemProduto({ url, nome, className = "" }: { url: string | null; nome: string; className?: string }) {
  if (!url) {
    const iniciais = nome
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
    return (
      <div
        className={`grafismo-claro flex items-center justify-center bg-surface-alt font-display text-3xl font-bold text-brand-navy ${className}`}
        aria-hidden
      >
        {iniciais}
      </div>
    );
  }
  // <img> em vez de next/image: as URLs são de domínios arbitrários cadastrados pelo admin.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={nome} loading="lazy" className={`bg-surface-alt object-cover ${className}`} />;
}
