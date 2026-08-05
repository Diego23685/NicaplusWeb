import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import detailStyles from '../assets/styles/CatalogoDetalle.module.css';
import { SidebarCatalogo } from '../components/catalogo/SidebarCatalogo';
import { 
    FaShoppingCart, FaStore, FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, 
    FaArrowLeft, FaSignOutAlt, FaBars, FaTimes, FaSignInAlt, FaChevronLeft, FaChevronRight, 
    FaHeadphones, FaLaptop, FaKeyboard, FaMouse, FaTv, FaPlug, FaFolderOpen, FaFacebook, FaInstagram,
    FaCheckCircle, FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';

// Importación de subcomponentes externos y hooks extraídos
import { useInteractiveCanvas } from '../components/hooks/useInteractiveCanvas';
import { VistaCarrito } from '../components/catalogo/VistaCarrito';
import { HeroInicio } from '../components/catalogo/HeroInicio';
import { VistaNosotros } from '../components/catalogo/VistaNosotros';
import { VistaContacto } from '../components/catalogo/VistaContacto';
import { Terminos } from './Terminos';

// Constante para el número de WhatsApp
const WHATSAPP_NUMERO = "50587870821";

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
  
  return <FaFolderOpen size={24} />;
};

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

type Seccion = 'inicio' | 'nosotros' | 'productos' | 'contacto' | 'carrito' | 'producto-detalle';

interface CatalogoProps {
    alIrAlLogin: () => void;
    cliente: any;
    alCerrarSesion: () => void;
    alIrAMiCuenta?: () => void;
}

/* ==========================================================================
      SUBCOMPONENTE INTERNO: DETALLE DE PRODUCTO
   ========================================================================== */
interface ProductoDetalleProps {
    producto: Producto;
    alVolver: () => void;
    alAgregarAlCarrito: (p: Producto, e?: React.MouseEvent) => void;
    cantidadEnCarrito: number;
}

const ProductoDetalle: React.FC<ProductoDetalleProps> = ({ 
    producto, 
    alVolver, 
    alAgregarAlCarrito,
    cantidadEnCarrito 
}) => {
    const hayStock = producto.esDigital || producto.stockActual > 0;

    return (
        <div className={`${detailStyles.detailViewContainer} ${styles.fadeEntrance}`}>
            <button className={detailStyles.backToStoreBtn} onClick={alVolver}>
                <FaArrowLeft /> Volver al catálogo
            </button>

            <div className={detailStyles.productDetailMainGrid}>
                <div className={detailStyles.detailImageSection}>
                    <span className={detailStyles.detailBadge} style={{ background: producto.esDigital ? '#581c7e' : '#047688' }}>
                        {producto.esDigital ? "ENTREGA DIGITAL" : "PRODUCTO FÍSICO"}
                    </span>
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className={detailStyles.detailMainImage} />
                    ) : (
                        <div className={detailStyles.detailNoImage}>SIN IMAGEN DE DISPOSITIVO</div>
                    )}
                </div>

                <div className={detailStyles.detailInfoSection}>
                    <h1 className={detailStyles.detailProductTitle}>{producto.nombre}</h1>
                    
                    <div className={detailStyles.detailPriceRow}>
                        <span className={detailStyles.detailPriceLabel}>Precio:</span>
                        <span className={detailStyles.detailPriceValue}>C$ {producto.precioVenta.toLocaleString('es-NI')}</span>
                    </div>

                    <div className={detailStyles.detailDivider} />

                    <div className={detailStyles.detailStockStatus}>
                        {hayStock ? (
                            <span className={detailStyles.stockAvailable}>
                                <FaCheckCircle /> Disponible {!producto.esDigital && `(${producto.stockActual} unidades en tienda)`}
                            </span>
                        ) : (
                            <span className={detailStyles.stockOut}>
                                <FaExclamationTriangle /> Agotado temporalmente
                            </span>
                        )}
                    </div>

                    <div className={detailStyles.detailDescriptionBox}>
                        <h4>Descripción del Producto</h4>
                        <p>{producto.descripcion}</p>
                    </div>

                    <div className={detailStyles.detailGarantiaBox}>
                        <div className={detailStyles.garantiaItem}>
                            <FaShieldAlt className={detailStyles.contactIcon} /> 
                            <div>
                                <h5>Garantía de Soporte Inmediato</h5>
                                <p>Procesamiento prioritario directo a tu WhatsApp.</p>
                            </div>
                        </div>
                    </div>

                    <div className={detailStyles.detailActionsRow}>
                        <button 
                            className={detailStyles.detailAddCartBtn}
                            disabled={!hayStock}
                            onClick={(e) => alAgregarAlCarrito(producto, e)}
                        >
                            <FaShoppingCart /> Añadir al carrito 
                            {cantidadEnCarrito > 0 && ` (${cantidadEnCarrito})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ==========================================================================
                          COMPONENTE PRINCIPAL
   ========================================================================== */
export const Catalogo: React.FC<CatalogoProps> = ({ alIrAlLogin, cliente, alCerrarSesion, alIrAMiCuenta }) => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('inicio');
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
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

    const catRowRef = useRef<HTMLDivElement | null>(null);
    const juegoRowRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Integración del Canvas Extrayendo la Lógica al Hook Personalizado
    useInteractiveCanvas(canvasRef);

    useEffect(() => {
        if (cliente) {
            setNombreCliente(cliente.nombre || cliente.Nombre || '');
            setTelefonoCliente(cliente.telefono || cliente.Telefono || '');
        }
    }, [cliente]);

    // Fetching Inicial de Catálogo
    useEffect(() => {
        setCargando(true);
        Promise.all([
            api.get('/products/catalogo'),
            api.get('/Categorias'),
            api.get('/juegos')
        ])
        .then(([p, c, j]) => {
            console.log("PRODUCTOS DESDE API:", p.data); // Inspect aquí los campos exacta de CategoriaId/categoriaId
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

    // Animación de partícula física voladora al carrito con manejo seguro del DOM
    const agregarAlCarrito = (producto: Producto, e?: React.MouseEvent) => {
        if (e) {
            const cartButton = document.querySelector(`.${styles.cartBtnDesk}`) || document.querySelector(`.${styles.cartBtnMobile}`);
            
            if (cartButton) {
                const rectBoton = e.currentTarget.getBoundingClientRect();
                const rectCarrito = cartButton.getBoundingClientRect();

                const flyElem = document.createElement('div');
                flyElem.className = styles.flyingParticle;
                
                if (producto.imagenUrl) {
                    flyElem.style.backgroundImage = `url(${producto.imagenUrl})`;
                }

                flyElem.style.left = `${rectBoton.left + rectBoton.width / 2 - 25}px`;
                flyElem.style.top = `${rectBoton.top + rectBoton.height / 2 - 25}px`;
                document.body.appendChild(flyElem);

                requestAnimationFrame(() => {
                    const xDiff = (rectCarrito.left + rectCarrito.width / 2) - (rectBoton.left + rectBoton.width / 2);
                    const yDiff = (rectCarrito.top + rectCarrito.height / 2) - (rectBoton.top + rectBoton.height / 2);

                    flyElem.style.transform = `translate(${xDiff}px, ${yDiff}px) scale(0.3)`;
                    flyElem.style.opacity = '0.2';
                });

                setTimeout(() => {
                    if (document.body.contains(flyElem)) {
                        flyElem.remove();
                    }
                    if (cartButton) {
                        cartButton.classList.add(styles.cartBumpAnimation);
                        setTimeout(() => cartButton.classList.remove(styles.cartBumpAnimation), 300);
                    }
                }, 800);
            }
        }

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
            mensaje += `🔹 *${item.cantidad}x* ${item.producto.nombre} (C$ ${item.producto.precioVenta.toLocaleString('es-NI')})\n`;
        });
        mensaje += `\n💰 *TOTAL A PAGAR: C$ ${totalPagar.toLocaleString('es-NI')}*`;
        
        window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMERO}&text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const productoPrincipal = useMemo<Producto | null>(() => {
        if (!Array.isArray(productos) || productos.length === 0) return null;
        return [...productos].sort((a, b) => b.precioVenta - a.precioVenta)[0];
    }, [productos]);

    const productosSecundarios = useMemo<Producto[]>(() => {
        if (!Array.isArray(productos) || productos.length < 3) return [];
        return [...productos].sort((a, b) => b.precioVenta - a.precioVenta).slice(1, 3);
    }, [productos]);

    const productosFiltrados = useMemo(() => {
        if (!Array.isArray(productos)) return [];

        // Buscamos el nombre de la categoría seleccionada a partir del ID
        const catSeleccionada = categorias.find(c => c.id === idCatSeleccionada);
        const nombreCatFiltro = catSeleccionada ? catSeleccionada.nombre.toLowerCase().trim() : null;

        // Buscamos el nombre del juego seleccionado a partir del ID
        const juegoSeleccionado = juegos.find(j => j.id === idJuegoSeleccionado);
        const nombreJuegoFiltro = juegoSeleccionado ? juegoSeleccionado.nombre.toLowerCase().trim() : null;

        return productos.filter((p: any) => {
            // 1. Coincidencia por búsqueda
            const nombreProd = (p.nombre || '').toLowerCase();
            const cumpleBusqueda = busqueda.trim() === '' || nombreProd.includes(busqueda.toLowerCase().trim());

            // 2. Coincidencia por Categoría (Comprara cadenas en minúsculas)
            const catProducto = (p.categoriaNombre || '').toLowerCase().trim();
            const cumpleCategoria = idCatSeleccionada === null || idCatSeleccionada === undefined
                ? true
                : (catProducto !== '' && catProducto === nombreCatFiltro);

            // 3. Coincidencia por Juego
            const juegoProducto = (p.juegoNombre || '').toLowerCase().trim();
            const cumpleJuego = idJuegoSeleccionado === null || idJuegoSeleccionado === undefined
                ? true
                : (juegoProducto !== '' && juegoProducto === nombreJuegoFiltro);

            return cumpleBusqueda && cumpleCategoria && cumpleJuego;
        });
    }, [productos, busqueda, idCatSeleccionada, idJuegoSeleccionado, categorias, juegos]);

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const manejarVerDetalle = (p: Producto) => {
        setProductoSeleccionado(p);
        setSeccionActiva('producto-detalle');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={styles.mainWrapper}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />

            {/* OVERLAY & SIDEBAR MÓVIL */}
            {menuAbierto && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] transition-opacity duration-300 lg:hidden"
                        onClick={() => setMenuAbierto(false)} 
                    />
                    <aside className={`fixed top-0 right-0 w-[280px] h-screen bg-[#0d0818]/98 backdrop-blur-xl z-[999] flex flex-col p-6 border-l-2 border-[#b002c2] shadow-2xl transition-transform duration-400 ease-out lg:hidden ${styles.sidebarMobile} ${styles.sidebarMobileAbierto}`}>
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
                </>
            )}

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
                            aria-label="Abrir carrito"
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
                            className={`${styles.cartBtnDesk} ${seccionActiva === 'carrito' ? styles.cartBtnActive : ''}`}
                            onClick={() => cambiarSeccion('carrito')} 
                        >
                            <FaShoppingCart size={14} /> 
                            <span>Carrito</span>
                            <span className={styles.cartBadgeCount}>{totalCarritoItems}</span>
                        </button>

                        {cliente ? (
                            <div className={styles.userAuthContainer}>
                                <button 
                                    onClick={alIrAMiCuenta} 
                                    className={styles.btnPerfilCliente}
                                    title={cliente.nombre || cliente.Nombre}
                                >
                                    👤 {(cliente.nombre || cliente.Nombre || 'Mi Cuenta').split(' ')[0]}
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
                            <div className={`${styles.fadeEntrance} ${styles.catalogoLayout}`}>
                                
                                {/* COLUMNA IZQUIERDA: COMPONENTE SIDEBAR */}
                                <SidebarCatalogo 
                                    busqueda={busqueda}
                                    setBusqueda={(val) => {
                                        setBusqueda(val);
                                        if(seccionActiva !== 'productos') setSeccionActiva('productos');
                                    }}
                                    categorias={categorias}
                                    idCatSeleccionada={idCatSeleccionada}
                                    setIdCatSeleccionada={setIdCatSeleccionada}
                                    juegos={juegos}
                                    idJuegoSeleccionado={idJuegoSeleccionado}
                                    setIdJuegoSeleccionado={setIdJuegoSeleccionado}
                                    obtenerIconoCategoria={obtenerIconoCategoria}
                                />

                                {/* COLUMNA DERECHA: BANNER PROMO + BURBUJAS DE FILTRO + CUADRÍCULA */}
                                <div className={styles.catalogoMainContent}>
                                    
                                    {/* SECCIÓN DE ANUNCIOS DINÁMICOS: SE OCULTA SI HAY UNA BÚSQUEDA ACTIVA */}
                                    {busqueda.trim() === '' && (
                                        <section className={styles.heroPromoSection}>
                                            {productoPrincipal ? (
                                                <div className={styles.mainPromoBanner}>
                                                    <div className={styles.promoBadge}>
                                                        {productoPrincipal.esDigital ? "DESTACADO DIGITAL" : "LO MÁS BUSCADO"}
                                                    </div>
                                                    <h2 className={styles.promoTitle} onClick={() => manejarVerDetalle(productoPrincipal)} style={{cursor: 'pointer'}}>
                                                        {productoPrincipal.nombre}
                                                    </h2>
                                                    <p className={styles.promoSubtitle}>{productoPrincipal.descripcion}</p>
                                                    <button 
                                                        className={styles.promoBtn} 
                                                        onClick={(e) => agregarAlCarrito(productoPrincipal, e)}
                                                    >
                                                        COMPRAR POR C$ {productoPrincipal.precioVenta.toLocaleString('es-NI')}
                                                    </button>
                                                    <div className={styles.promoGraphicOverlay} />
                                                    {productoPrincipal.imagenUrl && (
                                                        <img 
                                                            src={productoPrincipal.imagenUrl} 
                                                            alt={productoPrincipal.nombre} 
                                                            className={styles.promoAbsoluteImage}
                                                            onClick={() => manejarVerDetalle(productoPrincipal)}
                                                            style={{cursor: 'pointer'}}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className={styles.mainPromoBanner}>
                                                    <h2 className={styles.promoTitle}>Cargando Novedades...</h2>
                                                </div>
                                            )}

                                            <div className={styles.sidePromoContainer}>
                                                {productosSecundarios.map((prod: Producto, index: number) => (
                                                    <div 
                                                        key={prod.id} 
                                                        className={`${styles.sideBanner} ${index === 0 ? styles.sideBannerTop : styles.sideBannerBottom}`}
                                                    >
                                                        <div className={styles.sideBannerContent}>
                                                            <span className={styles.sideTag}>
                                                                {prod.esDigital ? "ENTREGA INMEDIATA" : "STOCK DISPONIBLE"}
                                                            </span>
                                                            <h3 onClick={() => manejarVerDetalle(prod)} style={{cursor: 'pointer'}}>
                                                                {prod.nombre}
                                                            </h3>
                                                            <p>¡Por solo C$ {prod.precioVenta.toLocaleString('es-NI')}!</p>
                                                            <button 
                                                                className={styles.sideLink} 
                                                                onClick={(e) => agregarAlCarrito(prod, e)}
                                                            >
                                                                Añadir al carrito
                                                            </button>
                                                        </div>
                                                        {prod.imagenUrl && (
                                                            <img 
                                                                src={prod.imagenUrl} 
                                                                alt={prod.nombre} 
                                                                className={styles.sideBannerImage} 
                                                                onClick={() => manejarVerDetalle(prod)}
                                                                style={{cursor: 'pointer'}}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* BURBUJAS (FILTROS RÁPIDOS DE CATEGORÍAS Y JUEGOS) */}
                                    <div className={styles.filterSectionContainer}>
                                        {/* Fila de Categorías en formato burbujas */}
                                        <div className={styles.filterRowWrapper}>
                                            <div className={styles.filterRowHeader}>
                                                <h3>Categorías</h3>
                                                <div className={styles.rowNavButtons}>
                                                    <button onClick={() => scrollRow(catRowRef, 'left')} aria-label="Desplazar categorías a la izquierda">
                                                        <FaChevronLeft />
                                                    </button>
                                                    <button onClick={() => scrollRow(catRowRef, 'right')} aria-label="Desplazar categorías a la derecha">
                                                        <FaChevronRight />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className={styles.categoryScrollRow} ref={catRowRef}>
                                                <div 
                                                    className={`${styles.categoryBubble} ${idCatSeleccionada === null ? styles.categoryBubbleActive : ''}`}
                                                    onClick={() => setIdCatSeleccionada(null)}
                                                >
                                                    <div className={styles.bubbleIcon}><FaTags /></div>
                                                    <span>Todas</span>
                                                </div>
                                                {categorias.map(cat => (
                                                    <div 
                                                        key={cat.id}
                                                        className={`${styles.categoryBubble} ${idCatSeleccionada === cat.id ? styles.categoryBubbleActive : ''}`}
                                                        onClick={() => {
                                                            // Al elegir una categoría, desactivar filtro por juego
                                                            setIdCatSeleccionada(cat.id);
                                                            setIdJuegoSeleccionado(null);
                                                        }}
                                                    >
                                                        <div className={styles.bubbleIcon}>
                                                            {cat.imagenUrl ? <img src={cat.imagenUrl} alt={cat.nombre} /> : obtenerIconoCategoria(cat.nombre)}
                                                        </div>
                                                        <span>{cat.nombre}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Fila de Juegos en formato burbujas */}
                                        {juegos.length > 0 && (
                                            <div className={styles.filterRowWrapper}>
                                                <div className={styles.filterRowHeader}>
                                                    <h3>Juegos</h3>
                                                    <div className={styles.rowNavButtons}>
                                                        <button onClick={() => scrollRow(juegoRowRef, 'left')} aria-label="Desplazar juegos a la izquierda">
                                                            <FaChevronLeft />
                                                        </button>
                                                        <button onClick={() => scrollRow(juegoRowRef, 'right')} aria-label="Desplazar juegos a la derecha">
                                                            <FaChevronRight />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className={styles.gameScrollRow} ref={juegoRowRef}>
                                                    <div 
                                                        className={`${styles.gameBubble} ${idJuegoSeleccionado === null ? styles.gameBubbleActive : ''}`}
                                                        onClick={() => setIdJuegoSeleccionado(null)}
                                                    >
                                                        <div className={styles.bubbleIcon}><FaGamepad /></div>
                                                        <span>Todos</span>
                                                    </div>
                                                    {juegos.map(juego => (
                                                        <div 
                                                            key={juego.id}
                                                            className={`${styles.gameBubble} ${idJuegoSeleccionado === juego.id ? styles.gameBubbleActive : ''}`}
                                                            onClick={() => {
                                                                // Al elegir un juego, desactivar filtro por categoría
                                                                setIdJuegoSeleccionado(juego.id);
                                                                setIdCatSeleccionada(null);
                                                            }}
                                                        >
                                                            <div className={styles.bubbleIcon}>
                                                                {juego.imagenUrl ? <img src={juego.imagenUrl} alt={juego.nombre} /> : <FaGamepad />}
                                                            </div>
                                                            <span>{juego.nombre}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* ENCABEZADO DE PRODUCTOS */}
                                    <div className={styles.productsHeader}>
                                        <h2 className={styles.productsHeaderTitle}>
                                            {busqueda.trim() !== '' ? `Resultados para "${busqueda}"` : 'Productos Destacados'}
                                        </h2>
                                    </div>
                                    
                                    {/* CUADRÍCULA DE PRODUCTOS FILTRADOS */}
                                    {productosFiltrados.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                                            <FaSearch size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                            <p>No se encontraron productos coincidentes.</p>
                                        </div>
                                    ) : (
                                        <div className={styles.productsGrid}>
                                            {productosFiltrados.map((prod: Producto) => (
                                                <div key={prod.id} className={styles.productCard}>
                                                    <div className={styles.imageWrapper} onClick={() => manejarVerDetalle(prod)} style={{cursor: 'pointer'}}>
                                                        <span className={styles.productBadge} style={{ background: prod.esDigital ? '#581c7e' : '#047688' }}>
                                                            {prod.esDigital ? "Digital" : "Físico"}
                                                        </span>
                                                        {prod.imagenUrl ? (
                                                            <img src={prod.imagenUrl} alt={prod.nombre} className={styles.productImage} />
                                                        ) : (
                                                            <div className={styles.noImagePlaceholder}>Nicaplus Tech</div>
                                                        )}
                                                    </div>
                                                    <div className={styles.productInfo}>
                                                        <h3 className={styles.productName} onClick={() => manejarVerDetalle(prod)} style={{cursor: 'pointer'}}>
                                                            {prod.nombre}
                                                        </h3>
                                                        <p className={styles.productDescription}>{prod.descripcion}</p>
                                                        <div className={styles.priceActionRow}>
                                                            <span className={styles.productPrice}>C$ {prod.precioVenta.toLocaleString('es-NI')}</span>
                                                            <button 
                                                                className={styles.addCartBtn}
                                                                disabled={!prod.esDigital && prod.stockActual <= 0}
                                                                onClick={(e) => agregarAlCarrito(prod, e)}
                                                                aria-label={`Añadir ${prod.nombre} al carrito`}
                                                            >
                                                                <FaShoppingCart />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}

                        {/* VISTA DE DETALLE DE PRODUCTO */}
                        {seccionActiva === 'producto-detalle' && productoSeleccionado && (
                            <ProductoDetalle 
                                producto={productoSeleccionado}
                                alVolver={() => setSeccionActiva('productos')}
                                alAgregarAlCarrito={agregarAlCarrito}
                                cantidadEnCarrito={carrito.find(item => item.producto.id === productoSeleccionado.id)?.cantidad || 0}
                            />
                        )}

                        {/* VISTA DEL CARRITO EXTRACTADA */}
                        {seccionActiva === 'carrito' && (
                            <VistaCarrito 
                                carrito={carrito}
                                totalPagar={totalPagar}
                                nombreCliente={nombreCliente}
                                setNombreCliente={setNombreCliente}
                                telefonoCliente={telefonoCliente}
                                setTelefonoCliente={setTelefonoCliente}
                                tipoEntrega={tipoEntrega}
                                setTipoEntrega={setTipoEntrega}
                                direccionCliente={direccionCliente}
                                setDireccionCliente={setDireccionCliente}
                                metodoPago={metodoPago}
                                setMetodoPago={setMetodoPago}
                                aceptoTerminos={aceptoTerminos}
                                setAceptoTerminos={setAceptoTerminos}
                                setVerModalTerminos={setVerModalTerminos}
                                cambiarCantidad={cambiarCantidad}
                                removerDelCarrito={removerDelCarrito}
                                cambiarSeccion={cambiarSeccion}
                                enviarAWhatsApp={enviarAWhatsApp}
                            />
                        )}
                    </div>
                )}
            </main>

            {/* FOOTER */}
            <footer className={styles.footer}>
                <div className={styles.footerContainer}>
                    <div className={styles.footerBrandColumn}>
                        <div className={styles.brandText}>Nicaplus Gaming</div>
                        <p className={styles.footerDescription}>
                            Tu plataforma gaming oficial. Todo lo que necesitas para potenciar tu experiencia setup con soporte inmediato.
                        </p>
                    </div>

                    <div className={styles.footerInfoColumn}>
                        <h4>Contacto</h4>
                        <div className={styles.footerInfoLink}>
                            <span>+505 8787-0821</span>
                        </div>
                        <div className={styles.footerInfoLink}>
                            <span>De la estatua de la madre 1c y media al norte, León, Nicaragua.</span>
                        </div>
                    </div>

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

                <div className={styles.footerBottomBar}>
                    <div>&copy; {new Date().getFullYear()} Venta de celulares y accesorios Nicaplus Gaming. Todos los derechos reservados.</div>
                </div>
            </footer>

            {verModalTerminos && <Terminos alCerrar={() => setVerModalTerminos(false)} />}
        </div>
    );
};