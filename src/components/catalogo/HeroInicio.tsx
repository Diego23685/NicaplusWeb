import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Sparkles, ShoppingBag, Folder, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight, MonitorPlay, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface DiapositivaShow {
  id: number;
  tag: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
}

export const HeroInicio: React.FC<HeroInicioProps> = ({ setSeccionActiva }) => {
  const [productoHero, setProductoHero] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [slideActivo, setSlideActivo] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const sliderRef = useRef<HTMLDivElement>(null);

  const diapositivas: DiapositivaShow[] = [
    {
      id: 0,
      tag: 'MONEDAS Y PASES',
      titulo: 'Juegos Digitales',
      descripcion: 'Recargas inmediatas de Free Fire, Blood Strike, Call of Duty y tus títulos móviles favoritos sin salir de casa.',
      imagenUrl: 'https://www.recargasrm.com/imagenes/portada/principal-todos.png'
    },
    {
      id: 1,
      tag: 'HARDWARE PREMIUM',
      titulo: 'Consolas de Última Generación',
      descripcion: 'Siente el verdadero poder gaming. Disponibilidad total en consolas PlayStation, Nintendo Switch y Xbox.',
      imagenUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 2,
      tag: 'AUDIO Y CONTROL',
      titulo: 'Periféricos de Alto Rendimiento',
      descripcion: 'Headsets premium con audio espacial, controles competitivos y teclados mecánicos para una precisión milimétrica.',
      imagenUrl: 'https://www.mielectro.es/blog/wp-content/uploads/2024/10/Mejores-perifericos-gaming.jpg'
    },
    {
      id: 3,
      tag: 'ENTRETENIMIENTO',
      titulo: 'Streaming & Licencias',
      descripcion: 'Cuentas oficiales de tus plataformas favoritas, TV Sticks y Webcams para transmitir tus partidas en vivo.',
      imagenUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkKgrdWwTACrbcjpEUjP5Mm5jY3-vEqeYoEglenNN37aQ60fUFovLDCp8&s=10'
    }
  ];

  // Autoplay inteligente interrumpible
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setSlideActivo((prev) => (prev + 1) % diapositivas.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, diapositivas.length]);

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
      .catch((err) => console.error('Error en Dashboard Hero:', err))
      .finally(() => setLoading(false));
  }, []);

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
      {/* SECCIÓN HERO PRINCIPAL */}
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
                <span className={styles.statLabel}>Garantías</span>
              </div>
            </div>
          </header>

          {/* LADO DERECHO */}
          <div className={styles.destacadoSection}>
            {!loading && productoHero && (
              <>
                <h2 className={styles.destacadoTitle}>// PRODUCTO DESTACADO</h2>
                <div className={styles.heroProductCard} onMouseMove={handleMouseMove}>
                  <div className={styles.cursorGlow} />
                  <div className={styles.productImgContainer}>
                    <img
                      className={styles.productImg}
                      src={productoHero.imagenUrl || 'https://via.placeholder.com/400'}
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

      {/* SHOWCASE INTERACTIVO TIPO GAMING OS (SIN SCROLL DRIVEN) */}
      <section 
        className={styles.interactiveShowcaseSection}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={styles.showcaseCard}>
          {/* Fondo Dinámico con Parallax y Zoom */}
          <div className={styles.showcaseBgWrapper}>
            <AnimatePresence mode="wait">
              <motion.img
                key={slideActivo}
                src={diapositivas[slideActivo].imagenUrl}
                alt={diapositivas[slideActivo].titulo}
                className={styles.showcaseBgImgActive}
                initial={{ opacity: 0, scale: 1.1, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />
            </AnimatePresence>
            <div className={styles.showcaseOverlay} />
            <div className={styles.showcaseGridDecoration} />
          </div>

          {/* Contenido Principal */}
          <div className={styles.showcaseContentGrid}>
            <div className={styles.showcaseLeft}>
              <div className={styles.showcaseHeader}>
                <MonitorPlay className={styles.showcaseIcon} />
                <span>CATÁLOGO DESTACADO</span>
                <button 
                  className={styles.pauseBtn} 
                  onClick={() => setIsPaused(!isPaused)}
                  title={isPaused ? "Reanudar rotación" : "Pausar rotación"}
                >
                  {isPaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
              </div>

              <div className={styles.textFrame}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideActivo}
                    initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={styles.textSlideActive}
                  >
                    <span className={styles.slideTag}>
                      // {diapositivas[slideActivo].tag}
                    </span>

                    <h2 className={styles.slideTitle}>
                      {diapositivas[slideActivo].titulo}
                    </h2>

                    <p className={styles.slideDesc}>
                      {diapositivas[slideActivo].descripcion}
                    </p>

                    <button
                      onClick={() => setSeccionActiva('productos')}
                      className={styles.slideBtn}
                    >
                      Explorar esta Línea <ArrowRight size={16} />
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Selector Lateral de Pestañas (Estilo Dashboard Consola) */}
            <div className={styles.showcaseTabsRight}>
              {diapositivas.map((slide) => {
                const isActive = slideActivo === slide.id;
                return (
                  <button
                    key={slide.id}
                    className={`${styles.tabCard} ${isActive ? styles.tabCardActive : ''}`}
                    onClick={() => setSlideActivo(slide.id)}
                  >
                    <div className={styles.tabInfo}>
                      <span className={styles.tabNumber}>0{slide.id + 1}</span>
                      <span className={styles.tabTitle}>{slide.titulo}</span>
                    </div>

                    {/* Barra de Progreso de Autoplay */}
                    {isActive && (
                      <motion.div
                        className={styles.tabProgressBar}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isPaused ? 1 : 1 }}
                        transition={{ 
                          duration: isPaused ? 0 : 6, 
                          ease: 'linear',
                          repeat: 0
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CATEGORÍAS POPULARES */}
      {categorias.length > 0 && (
        <section className={styles.sectionContainer}>
          <h3 className={styles.sectionHeading}>
            <Folder style={{ color: '#047688', height: '1.3rem', width: '1.3rem' }} />
            Categorías Populares
          </h3>
          <div className={styles.categoriesPillGrid}>
            {categorias.slice(0, 10).map((cat) => (
              <div
                key={cat.id}
                className={styles.categoryPill}
                onMouseMove={handleMouseMove}
                onClick={() => setSeccionActiva('productos')}
              >
                <div className={styles.cursorGlow} />
                <div className={styles.pillGlassBg} />
                {cat.imagenUrl && (
                  <img src={cat.imagenUrl} alt={cat.nombre} className={styles.pillImageBg} />
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
              <button className={styles.controlBtn} onClick={() => scroll('left')} aria-label="Anterior">
                <ChevronLeft size={18} />
              </button>
              <button className={styles.controlBtn} onClick={() => scroll('right')} aria-label="Siguiente">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className={styles.sliderOuterContainer}>
            <div className={styles.sliderWrapper} ref={sliderRef}>
              {juegos.map((juego) => (
                <div key={juego.id} className={styles.gameCard} onClick={() => setSeccionActiva('productos')}>
                  {juego.imagenUrl && (
                    <img src={juego.imagenUrl} alt={juego.nombre} className={styles.gameBackground} />
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