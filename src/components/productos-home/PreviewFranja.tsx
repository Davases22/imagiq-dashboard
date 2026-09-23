"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** De dónde se sirve la tienda. Se sobreescribe por entorno para apuntar a staging. */
const URL_WEB =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ||
  "https://www.imagiq.com";

/**
 * Ancho con el que se renderiza la franja dentro del iframe.
 *
 * Es el mismo max-width que usa la home (1440). El iframe se pinta a ese ancho
 * y luego se escala para que quepa: si en cambio se dejara al ancho real del
 * panel (~1000px), la web caería en su diseño de tablet y mostraría dos
 * tarjetas por fila en vez de cuatro, que es justo lo que se quiere comprobar.
 */
const ANCHO_ESCRITORIO = 1440;

/**
 * Alto del lienzo antes de escalar. La tarjeta de la web es alta: imagen,
 * selector de color, de capacidad, precio con su ahorro y los botones. Con
 * menos que esto el precio queda cortado por abajo.
 */
const ALTO_ESCRITORIO = 820;

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
 * ProductCard REALES. Una réplica hecha aquí se desincronizaría en cuanto la
 * tarjeta de la web cambiara, y lo que se quiere comprobar es cómo va a quedar
 * de verdad.
 *
 * Sin atributo sandbox a propósito. Con sandbox="allow-scripts" el documento
 * queda con origen opaco y la tienda revienta al arrancar: sus proveedores
 * (sesión, carrito, analítica) leen cookie y localStorage, y ahí eso lanza
 * SecurityError. Tampoco hace falta: al ser otro dominio, la política de mismo
 * origen ya impide que esta página toque el dashboard.
 */
export function PreviewFranja({ codigos, cupos }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);

  const src = useMemo(() => {
    const lista = codigos.slice(0, cupos).join(",");
    return `${URL_WEB}/preview/franja-home?codigos=${encodeURIComponent(lista)}`;
  }, [codigos, cupos]);

  // El panel cambia de ancho al plegar el menú lateral o al redimensionar, así
  // que la escala se recalcula en vez de fijarse una sola vez.
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;

    const medir = () => {
      const ancho = el.clientWidth;
      if (ancho > 0) setEscala(Math.min(1, ancho / ANCHO_ESCRITORIO));
    };

    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (codigos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Sin productos fijados: la franja se llena sola con los de la categoría.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={contenedor}
        className="overflow-hidden rounded-lg border bg-white"
        // El alto se reduce en la misma proporción que el contenido escalado;
        // si se dejara fijo quedaría una franja blanca debajo.
        style={{ height: ALTO_ESCRITORIO * escala }}
      >
        <iframe
          // La key fuerza recarga al cambiar de pestaña o de orden: sin esto el
          // iframe conserva el src viejo y la vista previa miente.
          key={src}
          src={src}
          title="Vista previa de la franja"
          loading="lazy"
          className="border-0"
          style={{
            width: ANCHO_ESCRITORIO,
            height: ALTO_ESCRITORIO,
            transform: `scale(${escala})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Render real de la tienda a tamaño de escritorio, reducido para que quepa.
        Los cambios se reflejan al guardarlos; la home pública puede tardar hasta
        un minuto más por su caché.
      </p>
    </div>
  );
}
