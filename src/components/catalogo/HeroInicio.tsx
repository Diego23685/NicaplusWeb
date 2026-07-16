import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Sparkles, ShoppingBag, Folder, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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

  // Función para el efecto de luz neón que sigue al cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
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
        <div className={styles.ambientLightViolet} />
        <div className={styles.ambientLightCyan} />

        <div className={styles.heroGrid}>
          {/* LADO IZQUIERDO */}
          <header className={styles.heroHeader}>
            <div className={styles.badgeSubli}>
              <Sparkles className={styles.sparkleIcon} />
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
                  <ShieldCheck className={styles.shieldIcon} />
                  100%
                </span>
                <span className={styles.statLabel}>Garantía segura</span>
              </div>
            </div>
          </header>

          {/* LADO DERECHO */}
          <div className={styles.destacadoSection}>
            {!loading && productoHero && (
              <>
                <h2 className={styles.destacadoTitle}>// PRODUCTO DESTACADO</h2>
                <div 
                  className={styles.heroProductCard}
                  onMouseMove={handleMouseMove}
                >
                  {/* Luz de cursor integrada también en la tarjeta del producto */}
                  <div className={styles.cursorGlow} />
                  
                  <div className={styles.productImgContainer}>
                    <img
                      className={styles.productImg}
                      src={productoHero.imagenUrl || "https://via.placeholder.com/400"}
                      alt={productoHero.nombre}
                    />
                    <div className={styles.imgGlowEffect} />
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

      {/* SECCIÓN CATEGORÍAS (REDISEÑADA A BOTONES COMPACTOS) */}
      {categorias.length > 0 && (
        <section className={styles.sectionContainer}>
          <h3 className={styles.sectionHeading}>
            <Folder style={{ color: '#047688', height: '1.3rem', width: '1.3rem' }} />
            Categorías Populares
          </h3>
          <div className={styles.categoriesPillGrid}>
            {categorias.slice(0, 10).map(cat => (
              <div
                key={cat.id}
                className={styles.categoryPill}
                onMouseMove={handleMouseMove}
                onClick={() => setSeccionActiva('productos')}
              >
                {/* Capas para crear el efecto de vidrio, desenfoque y luz de cursor */}
                <div className={styles.cursorGlow} />
                <div className={styles.pillGlassBg} />
                
                {cat.imagenUrl && (
                  <img
                    src={cat.imagenUrl}
                    alt={cat.nombre}
                    className={styles.pillImageBg}
                  />
                )}
                <span className={styles.pillText}>{cat.nombre}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN JUEGOS POPULARES */}
      {juegos.length > 0 && (
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeaderWithControls}>
            <h3 className={styles.sectionHeadingNoMargin}>
              <Gamepad2 style={{ color: '#b002c2', height: '1.3rem', width: '1.3rem' }} />
              Juegos Populares
            </h3>
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
                    <div className={styles.gameBtn}>
                      Ver productos <ArrowRight size={14} className={styles.arrowIcon} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.sliderFade} />
          </div>
        </section>
      )}
    </div>
  );
};