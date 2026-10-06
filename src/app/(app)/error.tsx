"use client";

import { useEffect } from "react";
import { estilos } from "@/components/ui";

export default function Erro({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-12 text-center">
      <h2 className="text-xl font-semibold">Algo deu errado</h2>
      <p className="mt-2 text-sm text-slate-600">
        Não foi possível concluir a operação. Tente novamente. Se o problema continuar, avise o administrador.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Código: {error.digest}</p>}
      <button onClick={() => retry()} className={`${estilos.botao} mt-6`}>
        Tentar novamente
      </button>
    </div>
  );
}
