import React, { useEffect, useState, useRef } from 'react';
import { Gamepad2, Sparkles, ShoppingBag, Folder, ShieldCheck, ChevronLeft, ChevronRight, ArrowRight, MonitorPlay } from 'lucide-react';
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
  
  // Estado para rastrear qué "diapositiva" está activa en el scroll
  const [slideActivo, setSlideActivo] = useState<number>(0);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Lógica del Observador de Intersección para cambiar las diapositivas fluidamente al hacer scroll
  useEffect(() => {
    // Un pequeño delay asegura que los nodos existan en el DOM antes de instanciar el Observer
    const timer = setTimeout(() => {
      const elementos = document.querySelectorAll(`.${styles.scrollTriggerZone}`);
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = parseInt(entry.target.getAttribute('data-slide-id') || '0', 10);
            setSlideActivo(id);
          }
        });
      }, {
        root: null,
        rootMargin: "0px",
        threshold: 0.3 // Más sensible: se activa cuando entra el 30% de la zona de scroll
      });

      elementos.forEach(el => observer.observe(el));
      
      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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
      {/* SECCIÓN HERO ORIGINAL */}
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

      {/* NUEVO: GRAN ESPECTÁCULO (SCROLL SHOWCASE PRESENTATION) */}
      <section ref={containerRef} className={styles.showcaseContainer}>
        {/* El contenedor Sticky mantiene la escena fija mientras el usuario scrollea */}
        <div className={styles.stickyScene}>
          
          {/* Fondo Dinámico tipo diapositiva */}
          <div className={styles.showcaseBgWrapper}>
            {diapositivas.map((slide) => (
              <img
                key={slide.id}
                src={slide.imagenUrl}
                alt={slide.titulo}
                className={`${styles.showcaseBgImg} ${slideActivo === slide.id ? styles.slideImgActive : ''}`}
              />
            ))}
            <div className={styles.showcaseOverlay} />
            <div className={styles.showcaseGridDecoration} />
          </div>

          {/* Contenido de la Presentación */}
          <div className={styles.showcaseContentGrid}>
            <div className={styles.showcaseLeft}>
              <div className={styles.showcaseHeader}>
                <MonitorPlay className={styles.showcaseIcon} />
                <span>NUESTRO STOCK AL DETALLE</span>
              </div>
              
              <div className={styles.textSliderFrame}>
                {diapositivas.map((slide) => (
                  <div
                    key={slide.id}
                    className={`${styles.textSlide} ${slideActivo === slide.id ? styles.textSlideActive : ''}`}
                  >
                    <span className={styles.slideTag}>// {slide.tag}</span>
                    <h2 className={styles.slideTitle}>{slide.titulo}</h2>
                    <p className={styles.slideDesc}>{slide.descripcion}</p>
                    <button onClick={() => setSeccionActiva('productos')} className={styles.slideBtn}>
                      Explorar esta Línea <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Indicadores visuales de diapositiva (Puntos de progreso derecho) */}
            <div className={styles.showcaseRight}>
              <div className={styles.progressTrack}>
                {diapositivas.map((slide) => (
                  <div
                    key={slide.id}
                    className={`${styles.progressDot} ${slideActivo === slide.id ? styles.dotActive : ''}`}
                    onClick={() => {
                      const trigger = document.querySelector(`[data-slide-id="${slide.id}"]`);
                      trigger?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span className={styles.dotNumber}>0{slide.id + 1}</span>
                    <div className={styles.dotLine} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Zonas de control de scroll invisibles que manejan el avance de las diapositivas */}
        <div className={styles.scrollTriggersContainer}>
          {diapositivas.map((slide) => (
            <div
              key={slide.id}
              className={styles.scrollTriggerZone}
              data-slide-id={slide.id}
            />
          ))}
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
            {categorias.slice(0, 10).map(cat => (
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
              {juegos.map(juego => (
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