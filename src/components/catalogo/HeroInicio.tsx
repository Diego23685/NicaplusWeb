import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        // Promise.all despacha las peticiones en paralelo. 
        // Al usar tu instancia 'api', las rutas resuelven a /api/products/catalogo, /api/Categorias y /api/juegos automáticamente.
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
        .catch(err => console.error("Error en el fetch del Dashboard Hero:", err))
        .finally(() => setLoading(false));
    }, []);

    return (
        <div className={styles.heroWrapper}>
            
            {/* ENCABEZADO PRINCIPAL */}
            <header className={styles.heroHeader}>
                <h1 className={styles.titulo}>
                    Todo lo que necesitas para tu<br />
                    <span style={{ color: '#6d28d9' }}>experiencia gaming</span>
                </h1>
                <p className={styles.subtitulo}>
                    Consolas, accesorios, licencias digitales y tecnología con entrega rápida y soporte técnico especializado.
                </p>
                
                <div className={styles.btnGroup}>
                    <button onClick={() => setSeccionActiva('productos')} className={styles.btnPrimary}>
                        Comprar ahora
                    </button>
                    <button onClick={() => setSeccionActiva('productos')} className={styles.btnSecondary}>
                        Explorar catálogo
                    </button>
                </div>

                {/* MÉTRICAS */}
                <div className={styles.statsRow}>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>500+</span>
                        <span className={styles.statLabel}>Productos</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>20+</span>
                        <span className={styles.statLabel}>Categorías</span>
                    </div>
                    <div className={styles.statBox}>
                        <span className={styles.statNum}>100%</span>
                        <span className={styles.statLabel}>Pago seguro</span>
                    </div>
                </div>
            </header>

            {/* PRODUCTO DESTACADO DINÁMICO */}
            {!loading && productoHero && (
                <section className={styles.destacadoSection}>
                    <h2 className={styles.destacadoTitle}>// PRODUCTO DESTACADO</h2>
                    <div className={styles.heroProductCard}>
                        <div className={styles.productMeta}>
                            <span className={styles.tagDestacado}>Lanzamiento Reciente</span>
                            <h3 className={styles.productName}>{productoHero.nombre}</h3>
                            <p className={styles.productDesc}>{productoHero.descripcion}</p>
                            <span className={styles.stockBadge}>
                                ⚡ Stock disponible: {productoHero.stockActual} unidades
                            </span>
                            <h4 className={styles.productPrice}>C$ {productoHero.precioVenta}</h4>
                            <button onClick={() => setSeccionActiva('productos')} className={styles.btnBuy}>
                                Comprar ahora
                            </button>
                        </div>
                        <div className={styles.productImgContainer}>
                            <img 
                                className={styles.productImg} 
                                src={productoHero.imagenUrl || "https://via.placeholder.com/400"} 
                                alt={productoHero.nombre} 
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* SECCIÓN CATEGORÍAS POPULARES */}
            {categorias.length > 0 && (
                <section className={styles.sectionContainer}>
                    <h3 className={styles.sectionHeading}>Categorías Populares</h3>
                    <div className={styles.tagsGrid}>
                        {categorias.slice(0, 8).map(cat => (
                            <div 
                                key={cat.id} 
                                className={styles.tagItem}
                                onClick={() => setSeccionActiva('productos')}
                            >
                                {/* Si la categoría tiene imagen en la API, la renderiza de fondo */}
                                {cat.imagenUrl && (
                                    <img 
                                        src={cat.imagenUrl} 
                                        alt={cat.nombre} 
                                        className={styles.tagBackground} 
                                    />
                                )}
                                {/* Capa de contraste */}
                                <div className={styles.tagOverlay} />
                                
                                {/* Texto por encima de todo */}
                                <span className={styles.tagText}>{cat.nombre}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* SECCIÓN JUEGOS POPULARES */}
            {juegos.length > 0 && (
                <section className={styles.sectionContainer}>
                    <h3 className={styles.sectionHeading}>Juegos Populares</h3>
                    <div className={styles.sliderWrapper}>
                        {juegos.map(juego => (
                            <div 
                                key={juego.id} 
                                className={styles.gameCard}
                                onClick={() => setSeccionActiva('productos')}
                            >
                                {/* Si el juego tiene imagen, la renderizamos de fondo */}
                                {juego.imagenUrl && (
                                    <img 
                                        src={juego.imagenUrl} 
                                        alt={juego.nombre} 
                                        className={styles.gameBackground} 
                                    />
                                )}
                                {/* Capa oscura superpuesta para que el texto siga siendo legible */}
                                <div className={styles.gameOverlay} />
                                
                                <div className={styles.gameContent}>
                                    <span className={styles.gameIcon}>🎮</span>
                                    <h4 className={styles.gameName}>{juego.nombre}</h4>
                                    <span className={styles.gameMeta}>Items disponibles</span>
                                    <div className={styles.gameBtn}>Ver productos</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
};