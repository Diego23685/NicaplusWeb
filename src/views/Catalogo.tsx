import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import { 
    FaShoppingCart, FaTrashAlt, FaWhatsapp, FaStore, 
    FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, 
    FaArrowLeft, FaMinus, FaPlus, FaSignOutAlt, FaBars, FaTimes, FaUser, FaPhone, FaTruck, FaMoneyBillWave, FaSignInAlt,
    FaChevronLeft, FaChevronRight, FaHeadphones, FaLaptop, FaKeyboard, FaMouse, FaTv, FaPlug, FaFolderOpen, FaFacebook, FaInstagram,
} from 'react-icons/fa';

// Diccionario de iconos según el nombre de la categoría
const obtenerIconoCategoria = (nombre = '') => {
  const n = nombre.toLowerCase();
  if (n.includes('consola') || n.includes('juego')) return <FaGamepad size={24} />;
  if (n.includes('audio') || n.includes('headset') || n.includes('audifono')) return <FaHeadphones size={24} />;
  if (n.includes('pc') || n.includes('laptop')) return <FaLaptop size={24} />;
  if (n.includes('teclado')) return <FaKeyboard size={24} />;
  if (n.includes('mouse') || n.includes('raton')) return <FaMouse size={24} />;
  if (n.includes('pantalla') || n.includes('monitor')) return <FaTv size={24} />;
  if (n.includes('accesorio') || n.includes('cable')) return <FaPlug size={24} />;
  
  // Icono por defecto en caso de no coincidir, pero en versión neón estilizada
  return <FaFolderOpen size={24} />;
};

import { HeroInicio } from '../components/catalogo/HeroInicio';
import { VistaNosotros } from '../components/catalogo/VistaNosotros';
import { VistaContacto } from '../components/catalogo/VistaContacto';
import { Terminos } from './Terminos';

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precioVenta: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    categoriaId?: number;
    juegoId?: number;
}

interface Categoria {
    id: number;
    nombre: string;
    imagenUrl?: string;
}

interface Juego {
    id: number;
    nombre: string;
    imagenUrl: string;
}

interface ItemCarrito {
    producto: Producto;
    cantidad: number;
}

type Seccion = 'inicio' | 'nosotros' | 'productos' | 'contacto' | 'carrito';

interface CatalogoProps {
    alIrAlLogin: () => void;
    cliente: any;
    alCerrarSesion: () => void;
    alIrAMiCuenta?: () => void;
}

export const Catalogo: React.FC<CatalogoProps> = ({ alIrAlLogin, cliente, alCerrarSesion, alIrAMiCuenta }) => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('inicio');
    const [busqueda, setBusqueda] = useState('');
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [cargando, setCargando] = useState(true);

    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [verModalTerminos, setVerModalTerminos] = useState(false);

    const [idCatSeleccionada, setIdCatSeleccionada] = useState<number | null>(null);
    const [idJuegoSeleccionado, setIdJuegoSeleccionado] = useState<number | null>(null);

    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [direccionCliente, setDireccionCliente] = useState('');
    const [tipoEntrega, setTipoEntrega] = useState('Envío a domicilio');
    const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');

    const WHATSAPP_NUMERO = "50587870821";

    const catRowRef = useRef<HTMLDivElement | null>(null);
    const juegoRowRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Auto-rellenar datos si el cliente ya está autenticado
    useEffect(() => {
        if (cliente) {
            setNombreCliente(cliente.nombre || cliente.Nombre || '');
            setTelefonoCliente(cliente.telefono || cliente.Telefono || '');
        }
    }, [cliente]);

    // Canvas Interactivo Optimizado
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let ancho = (canvas.width = window.innerWidth);
        let alto = (canvas.height = window.innerHeight);

        const mouse = { x: ancho / 2, y: alto / 2, targetX: ancho / 2, targetY: alto / 2 };
        let particulas: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }> = [];
        const colores = ['#b002c2', '#047688', '#a855f7', '#0e7490'];

        const manejarRedimension = () => {
            ancho = canvas.width = window.innerWidth;
            alto = canvas.height = window.innerHeight;
        };

        const manejarMovimiento = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };

        window.addEventListener('resize', manejarRedimension);
        window.addEventListener('mousemove', manejarMovimiento);

        let idAnimacion: number;

        const animar = () => {
            ctx.clearRect(0, 0, ancho, alto);
            mouse.x += (mouse.targetX - mouse.x) * 0.1;
            mouse.y += (mouse.targetY - mouse.y) * 0.1;

            if (Math.random() < 0.35 && particulas.length < 100) {
                particulas.push({
                    x: mouse.x,
                    y: mouse.y,
                    vx: (Math.random() - 0.5) * 1.8,
                    vy: (Math.random() - 0.5) * 1.8,
                    alpha: 1,
                    size: Math.random() * 2.5 + 1,
                    color: colores[Math.floor(Math.random() * colores.length)]
                });
            }

            for (let i = particulas.length - 1; i >= 0; i--) {
                const p = particulas[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.016;

                if (p.alpha <= 0) {
                    particulas.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.restore();
            }

            idAnimacion = requestAnimationFrame(animar);
        };

        animar();

        return () => {
            window.removeEventListener('resize', manejarRedimension);
            window.removeEventListener('mousemove', manejarMovimiento);
            cancelAnimationFrame(idAnimacion);
        };
    }, []);

    // API Fetching
    useEffect(() => {
        setCargando(true);
        Promise.all([
            api.get('/products/catalogo'),
            api.get('/Categorias'),
            api.get('/juegos')
        ])
        .then(([p, c, j]) => {
            setProductos(p.data || []);
            setCategorias(c.data || []);
            setJuegos(j.data || []);
        })
        .catch(err => console.error("Error comercial:", err))
        .finally(() => setCargando(false));
    }, []);

    const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const { scrollLeft, clientWidth } = ref.current;
            const scrollAmount = clientWidth * 0.7;
            ref.current.scrollTo({
                left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const agregarAlCarrito = (producto: Producto) => {
        setCarrito(prevCarrito => {
            const existe = prevCarrito.find(item => item.producto.id === producto.id);
            if (existe) {
                if (!producto.esDigital && producto.stockActual <= existe.cantidad) {
                    alert("Límite de existencias alcanzado en tienda.");
                    return prevCarrito;
                }
                return prevCarrito.map(item =>
                    item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            return [...prevCarrito, { producto, cantidad: 1 }];
        });
    };

    const cambiarCantidad = (id: number, delta: number) => {
        setCarrito(prevCarrito => 
            prevCarrito.map(item => {
                if (item.producto.id === id) {
                    const nuevaCantidad = item.cantidad + delta;
                    if (nuevaCantidad < 1) return item;
                    if (!item.producto.esDigital && item.producto.stockActual < nuevaCantidad) {
                        alert("Límite de existencias alcanzado.");
                        return item;
                    }
                    return { ...item, cantidad: nuevaCantidad };
                }
                return item;
            })
        );
    };

    const removerDelCarrito = (id: number) => {
        setCarrito(prev => prev.filter(item => item.producto.id !== id));
    };

    const enviarAWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (carrito.length === 0) return;
        if (!aceptoTerminos) return alert("Debes aceptar los Términos y Condiciones.");
        if (!nombreCliente.trim() || !telefonoCliente.trim()) return alert("Ingresa nombre y teléfono.");
        if (tipoEntrega === 'Envío a domicilio' && !direccionCliente.trim()) return alert("Ingresa tu dirección.");

        let mensaje = `✨ *NUEVA ORDEN - NICAPLUS GAMING* ✨\n\n👤 *CLIENTE*\n▪️ *Nombre:* ${nombreCliente.trim()}\n▪️ *Teléfono:* ${telefonoCliente.trim()}\n▪️ *Entrega:* ${tipoEntrega}\n`;
        if (tipoEntrega === 'Envío a domicilio') mensaje += `📍 *Dirección:* ${direccionCliente.trim()}\n`;
        mensaje += `💳 *Pago:* ${metodoPago}\n\n🛒 *DETALLE*\n`;

        carrito.forEach(item => {
            mensaje += `🔹 *${item.cantidad}x* ${item.producto.nombre} (C$ ${item.producto.precioVenta})\n`;
        });
        mensaje += `\n💰 *TOTAL A PAGAR: C$ ${totalPagar}*`;
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    // ==========================================================================
    // HOOKS DE ANUNCIOS DINÁMICOS EXTRAÍDOS AL NIVEL SUPERIOR (CORREGIDO)
    // ==========================================================================
    
    // 1. Banner Principal: El producto de mayor precio
    const productoPrincipal = useMemo<Producto | null>(() => {
        if (productos.length === 0) return null;
        return [...productos].sort((a, b) => b.precioVenta - a.precioVenta)[0];
    }, [productos]);

    // 2. Banners Secundarios: El segundo y tercer producto
    const productosSecundarios = useMemo<Producto[]>(() => {
        if (productos.length < 3) return [];
        return [...productos].sort((a, b) => b.precioVenta - a.precioVenta).slice(1, 3);
    }, [productos]);

    // Filtros de la cuadrícula de productos
    const productosFiltrados = useMemo(() => {
        return productos.filter(p => {
            const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const cumpleCategoria = idCatSeleccionada ? p.categoriaId === idCatSeleccionada : true;
            const cumpleJuego = idJuegoSeleccionado ? p.juegoId === idJuegoSeleccionado : true;
            return cumpleBusqueda && cumpleCategoria && cumpleJuego;
        });
    }, [productos, busqueda, idCatSeleccionada, idJuegoSeleccionado]);

    const totalCarritoItems = useMemo(() => carrito.reduce((sum, i) => sum + i.cantidad, 0), [carrito]);
    const totalPagar = useMemo(() => carrito.reduce((sum, item) => sum + (item.cantidad * item.producto.precioVenta), 0), [carrito]);

    const itemsNavegacion = [
        { id: 'inicio', label: 'Inicio', icon: <FaHome /> },
        { id: 'nosotros', label: 'Nosotros', icon: <FaInfoCircle /> },
        { id: 'productos', label: 'Tienda', icon: <FaStore /> },
        { id: 'contacto', label: 'Ubicación', icon: <FaMapMarkerAlt /> }
    ] as const;

    const cambiarSeccion = (id: Seccion) => {
        setSeccionActiva(id);
        if (id === 'inicio') {
            setIdCatSeleccionada(null);
            setIdJuegoSeleccionado(null);
        }
        setMenuAbierto(false);
    };

    return (
        <div className={styles.mainWrapper}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />

            {/* OVERLAY & SIDEBAR MÓVIL */}
            <div className={`${styles.sidebarOverlay} ${menuAbierto ? styles.sidebarOverlayVisible : ''}`} onClick={() => setMenuAbierto(false)} />
            <aside className={`${styles.sidebarMobile} ${menuAbierto ? styles.sidebarMobileAbierto : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.brandText}>MENÚ</span>
                    <button className={styles.closeMenuBtn} onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
                        <FaTimes size={20} />
                    </button>
                </div>
                <nav className={styles.sidebarNavList}>
                    {itemsNavegacion.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => cambiarSeccion(tab.id)}
                            className={`${styles.sidebarNavTab} ${seccionActiva === tab.id ? styles.sidebarNavTabActivo : ''}`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                    <div className={styles.sidebarAuthDivider} />
                    {cliente ? (
                        <div className={styles.sidebarUserBlock}>
                            <button onClick={() => { alIrAMiCuenta?.(); setMenuAbierto(false); }} className={styles.sidebarNavTab}>
                                👤 <span>{cliente.nombre || cliente.Nombre || 'Mi Cuenta'}</span>
                            </button>
                            <button onClick={() => { alCerrarSesion(); setMenuAbierto(false); }} className={`${styles.sidebarNavTab} ${styles.sidebarBtnSalir}`}>
                                <FaSignOutAlt /> <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => { alIrAlLogin(); setMenuAbierto(false); }} className={styles.sidebarNavTab}>
                            <FaSignInAlt /> <span>Iniciar Sesión</span>
                        </button>
                    )}
                </nav>
            </aside>

            {/* NAVBAR */}
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    <div className={styles.brandBlock} onClick={() => cambiarSeccion('inicio')}>
                        <div className={styles.brandIndicator} />
                        <span className={styles.brandText}>NICAPLUS GAMING</span>
                    </div>

                    <div className={styles.mobileActionsBlock}>
                        <button 
                            className={`${styles.cartBtnMobile} ${seccionActiva === 'carrito' ? styles.cartBtnActive : ''}`}
                            onClick={() => cambiarSeccion('carrito')} 
                        >
                            <FaShoppingCart size={14} /> 
                            <span className={styles.cartBadgeCount}>{totalCarritoItems}</span>
                        </button>
                        <button className={styles.hamburgerBtn} onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
                            <FaBars size={18} />
                        </button>
                    </div>

                    <nav className={styles.navigation}>
                        {itemsNavegacion.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => cambiarSeccion(tab.id)} 
                                className={`${styles.navTab} ${seccionActiva === tab.id ? styles.navTabActivo : ''}`}
                            >
                                {tab.icon} <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className={styles.searchAndCartBlock}>
                        <div className={styles.searchWrapper}>
                            <FaSearch className={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Buscar en la tienda..."
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    if(seccionActiva !== 'productos') setSeccionActiva('productos');
                                }}
                                className={styles.searchInput}
                            />
                        </div>
                        
                        <button 
                            className={`${styles.cartBtnDesktop} ${seccionActiva === 'carrito' ? styles.cartBtnActive : ''}`}
                            onClick={() => cambiarSeccion('carrito')} 
                        >
                            <FaShoppingCart size={14} /> 
                            <span>Carrito</span>
                            <span className={styles.cartBadgeCount}>{totalCarritoItems}</span>
                        </button>

                        {cliente ? (
                            <div className={styles.userAuthContainer}>
                                <button onClick={alIrAMiCuenta} className={styles.btnPerfilCliente}>
                                    👤 {cliente.nombre || cliente.Nombre || 'Mi Cuenta'}
                                </button>
                                <button onClick={alCerrarSesion} className={styles.btnSalir}>Salir</button>
                            </div>
                        ) : (
                            <div className={styles.userAuthContainer}>
                                <button onClick={alIrAlLogin} className={styles.btnIngresar}>Ingresar</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* CUERPO PRINCIPAL */}
            <main className={styles.mainContent}>
                {cargando ? (
                    <div className={styles.skeletonContainer}>
                        <div className={styles.spinner} />
                        <p>Cargando catálogo gamer...</p>
                    </div>
                ) : (
                    <div className={styles.viewContainer}>
                        {seccionActiva === 'inicio' && <HeroInicio setSeccionActiva={setSeccionActiva} />}
                        {seccionActiva === 'nosotros' && <VistaNosotros />}
                        {seccionActiva === 'contacto' && <VistaContacto />}
                        
                        {seccionActiva === 'productos' && (
                            <div className={styles.fadeEntrance}>
                                
                                {/* ==========================================================================
                                SECCIÓN DE ANUNCIOS DINÁMICOS DESDE LA API
                                ========================================================================== */}
                                <section className={styles.heroPromoSection}>
                                    {/* Banner Principal Izquierda */}
                                    {productoPrincipal ? (
                                        <div className={styles.mainPromoBanner}>
                                            <div className={styles.promoBadge}>
                                                {productoPrincipal.esDigital ? "DESTACADO DIGITAL" : "LO MÁS BUSCADO"}
                                            </div>
                                            <h2 className={styles.promoTitle}>{productoPrincipal.nombre}</h2>
                                            <p className={styles.promoSubtitle}>{productoPrincipal.descripcion}</p>
                                            <button 
                                                className={styles.promoBtn} 
                                                onClick={() => agregarAlCarrito(productoPrincipal)}
                                            >
                                                COMPRAR POR C$ {productoPrincipal.precioVenta}
                                            </button>
                                            <div className={styles.promoGraphicOverlay} />
                                            {productoPrincipal.imagenUrl && (
                                                <img 
                                                    src={productoPrincipal.imagenUrl} 
                                                    alt="" 
                                                    className={styles.promoAbsoluteImage}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className={styles.mainPromoBanner}>
                                            <h2 className={styles.promoTitle}>Cargando Novedades...</h2>
                                        </div>
                                    )}

                                    {/* Banners Secundarios Derecha */}
                                    <div className={styles.sidePromoContainer}>
                                        {productosSecundarios.map((prod: Producto, index: number) => (
                                            <div 
                                                key={prod.id} 
                                                className={`${styles.sideBanner} ${index === 0 ? styles.sideBannerTop : styles.sideBannerBottom}`}
                                            >
                                                <div 
                                                    key={prod.id} 
                                                    className={`${styles.sideBanner} ${index === 0 ? styles.sideBannerTop : styles.sideBannerBottom}`}
                                                >
                                                    <div className={styles.sideBannerContent}>
                                                        <span className={styles.sideTag}>
                                                            {prod.esDigital ? "ENTREGA INMEDIATA" : "STOCK DISPONIBLE"}
                                                        </span>
                                                        <h3>{prod.nombre}</h3>
                                                        <p>¡Por solo C$ {prod.precioVenta}!</p>
                                                        <button 
                                                            className={styles.sideLink} 
                                                            onClick={() => agregarAlCarrito(prod)}
                                                        >
                                                            Añadir al carrito
                                                        </button>
                                                    </div>

                                                    {/* AGREGAMOS LA IMAGEN DE FONDO AQUÍ */}
                                                    {prod.imagenUrl && (
                                                        <img 
                                                            src={prod.imagenUrl} 
                                                            alt="" 
                                                            className={styles.sideBannerImage} 
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {productosSecundarios.length === 0 && (
                                            <div className={styles.sideBanner}>
                                                <p>Explora nuestro catálogo abajo</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* ==========================================================================
                                                        SECCIÓN DE CATEGORÍAS EN BURBUJAS CIRCULARES
                                ========================================================================== */}
                                <section className={styles.filterSection} aria-label="Categorías">
                                    <div className={styles.filterSectionHeader}>
                                        <h3 className={styles.sectionTitle}><FaTags size={14} /> Categorías</h3>
                                        <div className={styles.filterSliderControls}>
                                            <button className={styles.filterControlBtn} onClick={() => scrollRow(catRowRef, 'left')} aria-label="Deslizar izquierda"><FaChevronLeft size={10} /></button>
                                            <button className={styles.filterControlBtn} onClick={() => scrollRow(catRowRef, 'right')} aria-label="Deslizar derecha"><FaChevronRight size={10} /></button>
                                        </div>
                                    </div>
                                    <div className={styles.filterOuterContainer}>
                                        <div className={styles.selectorScrollRow} ref={catRowRef}>
                                            {/* Burbuja de "Todas las Categorías" con Icono Neon */}
                                            <div 
                                                onClick={() => setIdCatSeleccionada(null)} 
                                                className={`${styles.selectorCardItem} ${idCatSeleccionada === null ? styles.selectorActivo : ''}`}
                                            >
                                                <div className={`${styles.cardImagePlaceholder} ${styles.allOverlay}`}>
                                                    <FaTags size={22} className={styles.categoryNeonIcon} />
                                                </div>
                                                <span className={styles.cardText}>Todas</span>
                                            </div>

                                            {/* Mapeo Dinámico de Categorías */}
                                            {categorias.map(c => (
                                                <div 
                                                    key={c.id} 
                                                    onClick={() => setIdCatSeleccionada(c.id)} 
                                                    className={`${styles.selectorCardItem} ${idCatSeleccionada === c.id ? styles.selectorActivo : ''}`}
                                                >
                                                    {c.imagenUrl ? (
                                                        <img src={c.imagenUrl} alt="" className={styles.cardImage} />
                                                    ) : (
                                                        <div className={styles.cardImagePlaceholder}>
                                                            <div className={styles.categoryNeonIcon}>
                                                                {obtenerIconoCategoria(c.nombre)}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={styles.cardOverlay} />
                                                    <span className={styles.cardText}>{c.nombre}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.filterFade} />
                                    </div>
                                </section>

                                {/* ==========================================================================
                                NUEVA SECCIÓN DE JUEGOS EN BURBUJAS CIRCULARES (RECUPERADA)
                                ========================================================================== */}
                                <section className={styles.filterSection} aria-label="Juegos">
                                    <div className={styles.filterSectionHeader}>
                                        <h3 className={styles.sectionTitle}><FaGamepad size={14} /> Filtrar por Juego</h3>
                                        <div className={styles.filterSliderControls}>
                                            <button className={styles.filterControlBtn} onClick={() => scrollRow(juegoRowRef, 'left')} aria-label="Deslizar izquierda"><FaChevronLeft size={10} /></button>
                                            <button className={styles.filterControlBtn} onClick={() => scrollRow(juegoRowRef, 'right')} aria-label="Deslizar derecha"><FaChevronRight size={10} /></button>
                                        </div>
                                    </div>
                                    <div className={styles.filterOuterContainer}>
                                        <div className={styles.selectorScrollRow} ref={juegoRowRef}>
                                            <div 
                                                onClick={() => setIdJuegoSeleccionado(null)} 
                                                className={`${styles.selectorCardItem} ${idJuegoSeleccionado === null ? styles.selectorActivo : ''}`}
                                            >
                                                <div className={`${styles.cardImagePlaceholder} ${styles.allOverlay}`}>🎮</div>
                                                <span className={styles.cardText}>Todos los Juegos</span>
                                            </div>
                                            {juegos.map(j => (
                                                <div 
                                                    key={j.id} 
                                                    onClick={() => setIdJuegoSeleccionado(j.id)} 
                                                    className={`${styles.selectorCardItem} ${idJuegoSeleccionado === j.id ? styles.selectorActivo : ''}`}
                                                >
                                                    {j.imagenUrl ? (
                                                        <img src={j.imagenUrl} alt="" className={styles.cardImage} />
                                                    ) : (
                                                        <div className={styles.cardImagePlaceholder}>👾</div>
                                                    )}
                                                    <div className={styles.cardOverlay} />
                                                    <span className={styles.cardText}>{j.nombre}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.filterFade} />
                                    </div>
                                </section>

                                {/* CUADRÍCULA DE PRODUCTOS DESTACADOS */}
                                <div className={styles.productsHeader}>
                                    <h2 className={styles.productsHeaderTitle}>Productos Destacados</h2>
                                </div>
                                
                                <div className={styles.productsGrid}>
                                    {productosFiltrados.map(p => {
                                        const itemEnCarrito = carrito.find(item => item.producto.id === p.id);
                                        return (
                                            <article key={p.id} className={styles.productCard}>
                                                <div className={styles.imageContainer} onClick={() => agregarAlCarrito(p)}>
                                                    {p.imagenUrl ? (
                                                        <img src={p.imagenUrl} alt={p.nombre} className={styles.productImage} loading="lazy" />
                                                    ) : (
                                                        <div className={styles.noImage}>SIN IMAGEN</div>
                                                    )}
                                                    <span className={styles.badge} style={{ background: p.esDigital ? '#581c7e' : '#047688' }}>
                                                        {p.esDigital ? "DIGITAL" : "FÍSICO"}
                                                    </span>
                                                </div>
                                                <div className={styles.cardContent}>
                                                    <div className={styles.infoWrapper}>
                                                        <h3 className={styles.productTitle}>{p.nombre}</h3>
                                                        <p className={styles.productDescription}>{p.descripcion}</p>
                                                    </div>
                                                    <div className={styles.priceRow}>
                                                        <span className={styles.price}>C$ {p.precioVenta}</span>
                                                        {itemEnCarrito ? (
                                                            <div className={styles.cartQtyControlsGlobal}>
                                                                <button onClick={() => itemEnCarrito.cantidad === 1 ? removerDelCarrito(p.id) : cambiarCantidad(p.id, -1)} className={styles.qtyBtn}>
                                                                    {itemEnCarrito.cantidad === 1 ? '🗑️' : '-'}
                                                                </button>
                                                                <span className={styles.qtyValue}>{itemEnCarrito.cantidad}</span>
                                                                <button onClick={() => agregarAlCarrito(p)} className={styles.qtyBtn}>+</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => agregarAlCarrito(p)} className={styles.addBtn}>+ Añadir</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* VISTA DEL CARRITO */}
                        {seccionActiva === 'carrito' && (
                            <div className={`${styles.cartViewContainer} ${styles.fadeEntrance}`}>
                                <div className={styles.cartViewHeader}>
                                    <button className={styles.backToStoreBtn} onClick={() => cambiarSeccion('productos')}>
                                        <FaArrowLeft /> Volver a la tienda
                                    </button>
                                    <h2 className={styles.cartViewTitle}>Tu Carrito de Compras</h2>
                                </div>

                                {carrito.length === 0 ? (
                                    <div className={styles.emptyCartView}>
                                        <div className={styles.emptyIconCircle}><FaShoppingCart size={32} /></div>
                                        <h3>Tu carrito está vacío</h3>
                                        <button className={styles.exploreBtn} onClick={() => cambiarSeccion('productos')}>Explorar Productos</button>
                                    </div>
                                ) : (
                                    <div className={styles.cartMainGrid}>
                                        <div className={styles.cartItemsContainer}>
                                            {carrito.map(item => (
                                                <div key={item.producto.id} className={styles.cartItemCard}>
                                                    <div className={styles.cartItemImgThum}>
                                                        {item.producto.imagenUrl ? <img src={item.producto.imagenUrl} alt="" /> : <div className={styles.cartNoImg}>🎮</div>}
                                                    </div>
                                                    <div className={styles.cartItemDetails}>
                                                        <div className={styles.cartItemMeta}>
                                                            <h4>{item.producto.nombre}</h4>
                                                            <span className={item.producto.esDigital ? styles.tagDig : styles.tagFis}>{item.producto.esDigital ? "Digital" : "Físico"}</span>
                                                        </div>
                                                        <p className={styles.cartItemPriceUnit}>U: C$ {item.producto.precioVenta}</p>
                                                    </div>
                                                    <div className={styles.cartQtyControls}>
                                                        <button onClick={() => cambiarCantidad(item.producto.id, -1)} className={styles.qtyBtn}><FaMinus size={10} /></button>
                                                        <span className={styles.qtyValue}>{item.cantidad}</span>
                                                        <button onClick={() => cambiarCantidad(item.producto.id, 1)} className={styles.qtyBtn}><FaPlus size={10} /></button>
                                                    </div>
                                                    <div className={styles.cartItemSubtotalBlock}><span className={styles.itemSubtotalText}>C$ {item.cantidad * item.producto.precioVenta}</span></div>
                                                    <button onClick={() => removerDelCarrito(item.producto.id)} className={styles.deleteItemBtn} aria-label="Eliminar ítem"><FaTrashAlt size={14} /></button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={styles.cartSummaryCard}>
                                            <h3>Resumen de Pedido</h3>
                                            <div className={styles.summaryRow}><span>Subtotal</span><span>C$ {totalPagar}</span></div>
                                            <div className={styles.dividerSummary} />
                                            
                                            <form onSubmit={enviarAWhatsApp} className={styles.billingForm}>
                                                <h4 className={styles.formTitle}>Datos de Entrega</h4>
                                                
                                                <div className={styles.inputGroup}>
                                                    <label><FaUser /> Nombre Completo *</label>
                                                    <input type="text" required placeholder="Ej: Juan Pérez" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
                                                </div>

                                                <div className={styles.inputGroup}>
                                                    <label><FaPhone /> Teléfono *</label>
                                                    <input type="tel" required placeholder="Ej: 88888888" value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} />
                                                </div>

                                                <div className={styles.inputGroup}>
                                                    <label><FaTruck /> Tipo de Entrega</label>
                                                    <select value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                                                        <option value="Envío a domicilio">Envío a domicilio</option>
                                                        <option value="Retiro en sucursal (León)">Retiro en tienda (León)</option>
                                                        <option value="Envío digital (Email/WhatsApp)">Entrega Inmediata (Digital)</option>
                                                    </select>
                                                </div>

                                                {tipoEntrega === "Envío a domicilio" && (
                                                    <div className={styles.inputGroup}>
                                                        <label><FaMapMarkerAlt /> Dirección Exacta *</label>
                                                        <textarea required placeholder="Barrio, dirección exacta..." value={direccionCliente} onChange={(e) => setDireccionCliente(e.target.value)} />
                                                    </div>
                                                )}

                                                <div className={styles.inputGroup}>
                                                    <label><FaMoneyBillWave /> Método de Pago</label>
                                                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                                        <option value="Transferencia Bancaria">Transferencia (LAFISE / BANPRO)</option>
                                                        <option value="Efectivo">Efectivo (Contra Entrega)</option>
                                                        <option value="Billetera Digital">Puntos BAC / KASH / Tigo Money</option>
                                                    </select>
                                                </div>

                                                <div className={styles.dividerSummary} />
                                                <div className={`${styles.summaryRow} ${styles.totalRowView}`}>
                                                    <span>Total:</span>
                                                    <span className={styles.totalColor}>C$ {totalPagar}</span>
                                                </div>

                                                <div className={styles.termsCheckboxGroup}>
                                                    <input 
                                                        type="checkbox" 
                                                        id="term_check"
                                                        checked={aceptoTerminos}
                                                        onChange={(e) => setAceptoTerminos(e.target.checked)}
                                                    />
                                                    <label htmlFor="term_check">
                                                        Acepto los {' '}
                                                        <button type="button" onClick={() => setVerModalTerminos(true)}>
                                                            términos y condiciones
                                                        </button>
                                                    </label>
                                                </div>

                                                <button type="submit" className={styles.finalCheckoutBtn}>
                                                    <FaWhatsapp size={18} /> Procesar vía WhatsApp
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ==========================================================================
                          FOOTER / PIE DE PÁGINA PREMIUM
            ========================================================================== */}
            <footer className={styles.footer}>
                <div className={styles.footerContainer}>
                    {/* Columna 1: Sobre la marca */}
                    <div className={styles.footerBrandColumn}>
                        <div className={styles.brandText}>Nicaplus Gaming</div>
                        <p className={styles.footerDescription}>
                            Tu plataforma gaming oficial. Todo lo que necesitas para potenciar tu experiencia setup con soporte inmediato.
                        </p>
                    </div>

                    {/* Columna 2: Datos de Contacto */}
                    <div className={styles.footerInfoColumn}>
                        <h4>Contacto</h4>
                        <div className={styles.footerInfoLink}>
                            <FaWhatsapp size={14} className={styles.contactIcon} />
                            <span>+505 8787-0821</span> {/* Cambia por tu número real */}
                        </div>
                        <div className={styles.footerInfoLink}>
                            <FaMapMarkerAlt size={14} className={styles.contactIcon} />
                            <span>De la estatua de la madre 1c y media al norte, León, Nicaragua.</span>
                        </div>
                    </div>

                    {/* Columna 3: Redes Sociales */}
                    <div className={styles.footerSocialColumn}>
                        <h4>Síguenos</h4>
                        <div className={styles.socialIconsRow}>
                            <a href="https://www.facebook.com/profile.php?id=100088876057372" target="_blank" rel="noopener noreferrer" className={styles.socialIconBtn} aria-label="Facebook">
                                <FaFacebook size={18} />
                            </a>
                            <a href="https://www.instagram.com/nicaplusgaming?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className={styles.socialIconBtn} aria-label="Instagram">
                                <FaInstagram size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Línea inferior de derechos reservados */}
                <div className={styles.footerBottomBar}>
                    <div>&copy; {new Date().getFullYear()} Venta de celulares y accesorios Nicaplus Gaming. Todos los derechos reservados.</div>
                </div>
            </footer>

            {verModalTerminos && <Terminos alCerrar={() => setVerModalTerminos(false)} />}
        </div>
    );
};