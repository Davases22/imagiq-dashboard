"use client";

import { useMemo } from "react";

/** De dónde se sirve la tienda. Se sobreescribe por entorno para apuntar a staging. */
const URL_WEB =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ||
  "https://www.imagiq.com";

interface Props {
  /** codigo_market de los productos activos, en el orden configurado. */
  codigos: string[];
  /** Cuántas tarjetas pinta realmente la home. */
  cupos: number;
}

/**
 * Vista previa de una franja de la home.
 *
 * Embebe la ruta /preview/franja-home de la tienda, que renderiza los
 * ProductCard REALES. Antes esto era una réplica de la tarjeta hecha aquí, y
 * una réplica se desincroniza en cuanto la tarjeta de la web cambia — lo que
 * se quiere comprobar es cómo va a quedar de verdad, no un parecido.
 *
 * Como viene de otro dominio, el contenido no se puede medir desde aquí: la
 * altura va fija y holgada para que entren las tarjetas completas.
 */
export function PreviewFranja({ codigos, cupos }: Props) {
  const src = useMemo(() => {
    const lista = codigos.slice(0, cupos).join(",");
    return `${URL_WEB}/preview/franja-home?codigos=${encodeURIComponent(lista)}`;
  }, [codigos, cupos]);

  if (codigos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sin productos fijados: la franja se llena sola con los de la categoría.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border bg-white">
        <iframe
          // La key fuerza recarga al cambiar de pestaña o de orden: sin esto el
          // iframe conserva el src viejo y la vista previa miente.
          key={src}
          src={src}
          title="Vista previa de la franja"
          className="h-[620px] w-full border-0"
          loading="lazy"
          // Sin allow-same-origin: la vista previa no necesita leer nada de
          // este dominio, y así no puede tocar la sesión del dashboard.
          sandbox="allow-scripts"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Render real de la tienda. Los cambios se reflejan al guardarlos; la home
        pública puede tardar hasta un minuto más por su caché.
      </p>
    </div>
  );
}
