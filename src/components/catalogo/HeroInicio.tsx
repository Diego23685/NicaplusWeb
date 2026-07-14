import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Sparkles, ShoppingBag, Folder, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import styles from './HeroInicio.module.css';

interface HeroInicioProps {
  setSeccionActiva: (seccion: 'inicio' | 'nosotros' | 'productos' | 'contacto') => void;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockActual: number;
  imagenUrl: string;
}

interface Categoria {
  id: number;
  nombre: string;
  imagenUrl: string;
}

interface Juego {
  id: number;
  nombre: string;
  imagenUrl: string;
}

export const HeroInicio: React.FC<HeroInicioProps> = ({ setSeccionActiva }) => {
  const [productoHero, setProductoHero] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Referencia para controlar el scroll del slider de juegos
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get('/products/catalogo'),
      api.get('/Categorias'),
      api.get('/juegos')
    ])
      .then(([p, c, j]) => {
        if (p.data && p.data.length > 0) {
          setProductoHero(p.data[0]);
        }
        setCategorias(c.data || []);
        setJuegos(j.data || []);
      })
      .catch(err => console.error("Error en Dashboard Hero:", err))
      .finally(() => setLoading(false));
  }, []);

  // Función para mover el scroll horizontalmente
  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      // Desplazar el 80% del ancho visible para mantener contexto de la última tarjeta
      const scrollAmount = clientWidth * 0.8; 
      sliderRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.heroWrapper}>
      
      <section className={styles.heroSection}>
        <div className={styles.decorativeGrid} />

        <div className={styles.heroGrid}>
          {/* LADO IZQUIERDO: TEXTOS Y MÉTRICAS HORIZONTALES */}
          <header className={styles.heroHeader}>
            <div className={styles.badgeSubli}>
              <Sparkles style={{ height: '0.85rem', width: '0.85rem', color: '#b002c2' }} />
              <span>Plataforma Gaming Oficial</span>
            </div>

            <h1 className={styles.titulo}>
              Todo lo que necesitas para tu<br />
              <span className={styles.textGradient}>experiencia gaming</span>
            </h1>
            
            <p className={styles.subtitulo}>
              Consolas, accesorios de última generación, licencias digitales y componentes de hardware premium con soporte inmediato.
            </p>

            <div className={styles.btnGroup}>
              <button onClick={() => setSeccionActiva('productos')} className={styles.btnPrimary}>
                <ShoppingBag style={{ height: '1.1rem', width: '1.1rem' }} />
                Comprar ahora
              </button>
              <button onClick={() => setSeccionActiva('productos')} className={styles.btnSecondary}>
                Explorar catálogo
              </button>
            </div>

            {/* MÉTRICAS EN FILA */}
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statNum}>500+</span>
                <span className={styles.statLabel}>Productos premium</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>20+</span>
                <span className={styles.statLabel}>Categorías</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statNum}>
                  <ShieldCheck style={{ display: 'inline', height: '1.4rem', width: '1.4rem', color: '#047688', marginRight: '4px', verticalAlign: 'middle' }} />
                  100%
                </span>
                <span className={styles.statLabel}>Garantía segura</span>
              </div>
            </div>
          </header>

          {/* LADO DERECHO: TARJETA DE PRODUCTO COMPLETA */}
          <div className={styles.destacadoSection}>
            {!loading && productoHero && (
              <>
                <h2 className={styles.destacadoTitle}>// PRODUCTO DESTACADO</h2>
                <div className={styles.heroProductCard}>
                  
                  <div className={styles.productImgContainer}>
                    <img
                      className={styles.productImg}
                      src={productoHero.imagenUrl || "https://via.placeholder.com/400"}
                      alt={productoHero.nombre}
                    />
                  </div>

                  <div className={styles.productMeta}>
                    <span className={styles.tagDestacado}>Lanzamiento Reciente</span>
                    <h3 className={styles.productName}>{productoHero.nombre}</h3>
                    <p className={styles.productDesc}>{productoHero.descripcion}</p>
                  </div>

                  <div className={styles.productFooter}>
                    <div className={styles.priceWrapper}>
                      <span className={styles.stockBadge}>⚡ Disponibles: {productoHero.stockActual}u</span>
                      <h4 className={styles.productPrice}>C$ {productoHero.precioVenta}</h4>
                    </div>
                    <button onClick={() => setSeccionActiva('productos')} className={styles.btnBuy}>
                      Adquirir artículo
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN CATEGORÍAS (Se mantiene en cuadrícula que no requiere scroll) */}
      {categorias.length > 0 && (
        <section className={styles.sectionContainer}>
          <h3 className={styles.sectionHeading}>
            <Folder style={{ color: '#047688', height: '1.3rem', width: '1.3rem' }} />
            Categorías Populares
          </h3>
          <div className={styles.tagsGrid}>
            {categorias.slice(0, 8).map(cat => (
              <div
                key={cat.id}
                className={styles.tagItem}
                onClick={() => setSeccionActiva('productos')}
              >
                {cat.imagenUrl && (
                  <img
                    src={cat.imagenUrl}
                    alt={cat.nombre}
                    className={styles.tagBackground}
                  />
                )}
                <div className={styles.tagOverlay} />
                <span className={styles.tagText}>{cat.nombre}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN JUEGOS POPULARES MEJORADA */}
      {juegos.length > 0 && (
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderWithControls}>
            <h3 className={styles.sectionHeadingNoMargin}>
              <Gamepad2 style={{ color: '#b002c2', height: '1.3rem', width: '1.3rem' }} />
              Juegos Populares
            </h3>
            {/* Controles de navegación visibles solo en pantallas grandes */}
            <div className={styles.sliderControls}>
              <button 
                className={styles.controlBtn} 
                onClick={() => scroll('left')} 
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                className={styles.controlBtn} 
                onClick={() => scroll('right')} 
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className={styles.sliderOuterContainer}>
            <div className={styles.sliderWrapper} ref={sliderRef}>
              {juegos.map(juego => (
                <div
                  key={juego.id}
                  className={styles.gameCard}
                  onClick={() => setSeccionActiva('productos')}
                >
                  {juego.imagenUrl && (
                    <img
                      src={juego.imagenUrl}
                      alt={juego.nombre}
                      className={styles.gameBackground}
                    />
                  )}
                  <div className={styles.gameOverlay} />
                  
                  <div className={styles.gameContent}>
                    <span className={styles.gameIcon}>🎮</span>
                    <h4 className={styles.gameName}>{juego.nombre}</h4>
                    <span className={styles.gameMeta}>Items e insignias</span>
                    <div className={styles.gameBtn}>Ver productos →</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Gradiente sutil al final para denotar que hay más contenido */}
            <div className={styles.sliderFade} />
          </div>
        </section>
      )}

    </div>
  );
};