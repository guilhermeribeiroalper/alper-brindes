import Image from "next/image";

/**
 * Logotipo oficial Alper, versão branca (com a tagline), para fundos na cor da marca.
 * Largura de 100px por decisão de produto (o design system pede mínimo de 200px). Não esticar nem recolorir.
 */
export function LogoAlper({ className = "", prioridade = false }: { className?: string; prioridade?: boolean }) {
  return (
    <Image
      src="/Logo-Alper-white.avif"
      alt="Alper — alta performance em seguros"
      width={515}
      height={224}
      priority={prioridade}
      // Servido como está: o otimizador converteria para JPEG e perderia a transparência.
      unoptimized
      className={`h-auto w-[100px] ${className}`}
    />
  );
}
