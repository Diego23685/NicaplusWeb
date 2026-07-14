import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import { 
    FaShoppingCart, FaTrashAlt, FaWhatsapp, FaStore, 
    FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, 
    FaArrowLeft, FaMinus, FaPlus, FaSignOutAlt, FaBars, FaTimes, FaUser, FaPhone, FaTruck, FaMoneyBillWave, FaSignInAlt,
    FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

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

    const [aceptoTerminos, setAceptoTerminos] = useState(false);
    const [verModalTerminos, setVerModalTerminos] = useState(false);

    const [idCatSeleccionada, setIdCatSeleccionada] = useState<number | null>(null);
    const [idJuegoSeleccionado, setIdJuegoSeleccionado] = useState<number | null>(null);

    // --- ESTADOS PARA FACTURACIÓN Y ENVÍO ---
    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [direccionCliente, setDireccionCliente] = useState('');
    const [tipoEntrega, setTipoEntrega] = useState('Envío a domicilio');
    const [metodoPago, setMetodoPago] = useState('Transferencia Bancaria');

    const WHATSAPP_NUMERO = "50587870821";

    // --- REFS PARA LOS DESPLAZAMIENTOS HORIZONTALES ---
    const catRowRef = useRef<HTMLDivElement | null>(null);
    const juegoRowRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let ancho = (canvas.width = window.innerWidth);
        let alto = (canvas.height = window.innerHeight);

        const mouse = { x: ancho / 2, y: alto / 2, targetX: ancho / 2, targetY: alto / 2 };
        const particulas: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }> = [];
        const colores = ['#b002c2', '#047688', '#a855f7', '#0e7490'];

        const manejarRedimension = () => {
            if (!canvas) return;
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

            if (Math.random() < 0.35) {
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

            const gradiente = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 100);
            gradiente.addColorStop(0, 'rgba(176, 2, 194, 0.06)');
            gradiente.addColorStop(0.6, 'rgba(4, 118, 136, 0.02)');
            gradiente.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
            ctx.fill();

            idAnimacion = requestAnimationFrame(animar);
        };

        animar();

        return () => {
            window.removeEventListener('resize', manejarRedimension);
            window.removeEventListener('mousemove', manejarMovimiento);
            cancelAnimationFrame(idAnimacion);
        };
    }, []);

    useEffect(() => {
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
        .catch(err => console.error("Error cargando base de datos comercial:", err));
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
        const existe = carrito.find(item => item.producto.id === producto.id);
        if (existe) {
            if (!producto.esDigital && producto.stockActual <= existe.cantidad) {
                alert("Límite de existencias alcanzado.");
                return;
            }
            setCarrito(carrito.map(item =>
                item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
            ));
        } else {
            setCarrito([...carrito, { producto, cantidad: 1 }]);
        }
    };

    const cambiarCantidad = (id: number, delta: number) => {
        setCarrito(carrito.map(item => {
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
        }));
    };

    const removerDelCarrito = (id: number) => {
        setCarrito(carrito.filter(item => item.producto.id !== id));
    };

    const enviarAWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (carrito.length === 0) return;

        if (!aceptoTerminos) {
            alert("Debes aceptar los Términos y Condiciones antes de confirmar tu pedido.");
            return;
        }

        if (!nombreCliente.trim() || !telefonoCliente.trim()) {
            alert("Por favor ingresa tu nombre y teléfono para procesar el pedido.");
            return;
        }
        
        if (tipoEntrega === 'Envío a domicilio' && !direccionCliente.trim()) {
            alert("Por favor ingresa tu dirección para realizar el envío.");
            return;
        }

        let mensaje = `✨ *NUEVA ORDEN - NICAPLUS GAMING* ✨\n\n`;
        mensaje += `👤 *DATOS DEL CLIENTE*\n`;
        mensaje += `▪️ *Nombre:* ${nombreCliente.trim()}\n`;
        mensaje += `▪️ *Teléfono:* ${telefonoCliente.trim()}\n`;
        mensaje += `▪️ *Tipo de Entrega:* ${tipoEntrega}\n`;
        if (tipoEntrega === 'Envío a domicilio') {
            mensaje += `📍 *Dirección:* ${direccionCliente.trim()}\n`;
        }
        mensaje += `💳 *Método de Pago:* ${metodoPago}\n\n`;

        mensaje += `🛒 *DETALLE DEL PEDIDO*\n`;
        carrito.forEach(item => {
            mensaje += `🔹 *${item.cantidad}x* ${item.producto.nombre}\n` +
                       `   Precio Unit: C$ ${item.producto.precioVenta} | Subtotal: C$ ${item.cantidad * item.producto.precioVenta}\n\n`;
        });

        const total = carrito.reduce((sum, item) => sum + (item.cantidad * item.producto.precioVenta), 0);
        mensaje += `💰 *TOTAL A PAGAR: C$ ${total}*\n`;
        
        window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const productosFiltrados = productos.filter(p => {
        const cumpleBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const cumpleCategoria = idCatSeleccionada ? p.categoriaId === idCatSeleccionada : true;
        const cumpleJuego = idJuegoSeleccionado ? p.juegoId === idJuegoSeleccionado : true;
        return cumpleBusqueda && cumpleCategoria && cumpleJuego;
    });

    const totalCarritoItems = carrito.reduce((sum, i) => sum + i.cantidad, 0);
    const totalPagar = carrito.reduce((sum, item) => sum + (item.cantidad * item.producto.precioVenta), 0);

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

            {/* SIDEBAR MÓVIL */}
            <div className={`${styles.sidebarOverlay} ${menuAbierto ? styles.sidebarOverlayVisible : ''}`} onClick={() => setMenuAbierto(false)} />
            <aside className={`${styles.sidebarMobile} ${menuAbierto ? styles.sidebarMobileAbierto : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.brandText}>MENÚ</span>
                    <button className={styles.closeMenuBtn} onClick={() => setMenuAbierto(false)}>
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

                    <div className={styles.sidebarAuthDivider} style={{ margin: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    
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
                            <FaSignInAlt /> <span>Iniciar Sesión / Registrarse</span>
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
                        
                        <button className={styles.hamburgerBtn} onClick={() => setMenuAbierto(true)}>
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
                                <button onClick={alCerrarSesion} className={styles.btnSalir}>
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <div className={styles.userAuthContainer}>
                                <button onClick={alIrAlLogin} className={styles.btnIngresar}>
                                    Ingresar
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </header>

            {/* CONTENEDOR PRINCIPAL */}
            <main className={styles.mainContent}>
                <div className={styles.viewContainer}>
                    {seccionActiva === 'inicio' && <HeroInicio setSeccionActiva={setSeccionActiva} />}
                    {seccionActiva === 'nosotros' && <VistaNosotros />}
                    {seccionActiva === 'contacto' && <VistaContacto />}
                    
                    {/* VISTA TIENDA */}
                    {seccionActiva === 'productos' && (
                        <div className={styles.fadeEntrance}>
                            
                            {/* CATEGORÍAS POPULARES CON CONTROLES */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h4 className={styles.sectionTitle}><FaTags /> Categorías de Inventario</h4>
                                    <div className={styles.filterSliderControls}>
                                        <button type="button" className={styles.filterControlBtn} onClick={() => scrollRow(catRowRef, 'left')}><FaChevronLeft size={12} /></button>
                                        <button type="button" className={styles.filterControlBtn} onClick={() => scrollRow(catRowRef, 'right')}><FaChevronRight size={12} /></button>
                                    </div>
                                </div>
                                <div className={styles.filterOuterContainer}>
                                    <div className={styles.selectorScrollRow} ref={catRowRef}>
                                        <div 
                                            onClick={() => setIdCatSeleccionada(null)} 
                                            className={`${styles.selectorCardItem} ${idCatSeleccionada === null ? styles.selectorActivo : ''}`}
                                        >
                                            <div className={`${styles.cardOverlay} ${styles.allOverlay}`} />
                                            <span className={styles.cardTextActive}>⭐ Ver Todo</span>
                                        </div>
                                        {categorias.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => setIdCatSeleccionada(c.id)} 
                                                className={`${styles.selectorCardItem} ${idCatSeleccionada === c.id ? styles.selectorActivo : ''}`}
                                            >
                                                {c.imagenUrl && <img src={c.imagenUrl} alt={c.nombre} className={styles.cardImage} />}
                                                <div className={styles.cardOverlay} />
                                                <span className={styles.cardText}>{c.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.filterFade} />
                                </div>
                            </div>

                            {/* FILTRAR POR VIDEOJUEGO CON CONTROLES */}
                            <div className={styles.filterSection}>
                                <div className={styles.filterSectionHeader}>
                                    <h4 className={styles.sectionTitle}><FaGamepad /> Filtrar por Videojuego</h4>
                                    <div className={styles.filterSliderControls}>
                                        <button type="button" className={styles.filterControlBtn} onClick={() => scrollRow(juegoRowRef, 'left')}><FaChevronLeft size={12} /></button>
                                        <button type="button" className={styles.filterControlBtn} onClick={() => scrollRow(juegoRowRef, 'right')}><FaChevronRight size={12} /></button>
                                    </div>
                                </div>
                                <div className={styles.filterOuterContainer}>
                                    <div className={styles.selectorScrollRow} ref={juegoRowRef}>
                                        <div 
                                            onClick={() => setIdJuegoSeleccionado(null)} 
                                            className={`${styles.selectorCardItem} ${idJuegoSeleccionado === null ? styles.selectorActivo : ''}`}
                                        >
                                            <div className={`${styles.cardOverlay} ${styles.allOverlay}`} />
                                            <span className={styles.cardTextActive}>🎮 Todos</span>
                                        </div>
                                        {juegos.map(j => (
                                            <div 
                                                key={j.id} 
                                                onClick={() => setIdJuegoSeleccionado(j.id)} 
                                                className={`${styles.selectorCardItem} ${idJuegoSeleccionado === j.id ? styles.selectorActivo : ''}`}
                                            >
                                                {j.imagenUrl && <img src={j.imagenUrl} alt={j.nombre} className={styles.cardImage} />}
                                                <div className={styles.cardOverlay} />
                                                <span className={styles.cardText}>{j.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.filterFade} />
                                </div>
                            </div>

                            <div className={styles.productsHeader}>
                                <h2 className={styles.productsHeaderTitle}>
                                    Productos Disponibles ({productosFiltrados.length})
                                </h2>
                            </div>
                            
                            <div className={styles.productsGrid}>
                                {productosFiltrados.map(p => {
                                    const itemEnCarrito = carrito.find(item => item.producto.id === p.id);
                                    return (
                                        <div key={p.id} className={styles.productCard}>
                                            <div 
                                                className={styles.imageContainer} 
                                                onClick={() => agregarAlCarrito(p)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {p.imagenUrl ? (
                                                    <img src={p.imagenUrl} alt={p.nombre} className={styles.productImage} />
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
                                                        <div className={styles.cartQtyControls} style={{ margin: 0 }}>
                                                            <button onClick={() => itemEnCarrito.cantidad === 1 ? removerDelCarrito(p.id) : cambiarCantidad(p.id, -1)} className={styles.qtyBtn}>
                                                                {itemEnCarrito.cantidad === 1 ? <FaTrashAlt size={10} style={{ color: '#ef4444' }} /> : <FaMinus size={10} />}
                                                            </button>
                                                            <span className={styles.qtyValue}>{itemEnCarrito.cantidad}</span>
                                                            <button onClick={() => cambiarCantidad(p.id, 1)} className={styles.qtyBtn}>
                                                                <FaPlus size={10} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => agregarAlCarrito(p)} className={styles.addBtn}>+ Añadir</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
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
                                                    {item.producto.imagenUrl ? <img src={item.producto.imagenUrl} alt={item.producto.nombre} /> : <div className={styles.cartNoImg}>🎮</div>}
                                                </div>
                                                <div className={styles.cartItemDetails}>
                                                    <div className={styles.cartItemMeta}>
                                                        <h4>{item.producto.nombre}</h4>
                                                        <span className={item.producto.esDigital ? styles.tagDig : styles.tagFis}>{item.producto.esDigital ? "Digital" : "Físico"}</span>
                                                    </div>
                                                    <p className={styles.cartItemPriceUnit}>Precio unitario: C$ {item.producto.precioVenta}</p>
                                                </div>
                                                <div className={styles.cartQtyControls}>
                                                    <button onClick={() => cambiarCantidad(item.producto.id, -1)} className={styles.qtyBtn}><FaMinus size={10} /></button>
                                                    <span className={styles.qtyValue}>{item.cantidad}</span>
                                                    <button onClick={() => cambiarCantidad(item.producto.id, 1)} className={styles.qtyBtn}><FaPlus size={10} /></button>
                                                </div>
                                                <div className={styles.cartItemSubtotalBlock}><span className={styles.itemSubtotalText}>C$ {item.cantidad * item.producto.precioVenta}</span></div>
                                                <button onClick={() => removerDelCarrito(item.producto.id)} className={styles.deleteItemBtn}><FaTrashAlt size={14} /></button>
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
                                                <input 
                                                    type="text" 
                                                    required 
                                                    placeholder="Ej: Juan Pérez" 
                                                    value={nombreCliente} 
                                                    onChange={(e) => setNombreCliente(e.target.value)} 
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label><FaPhone /> Teléfono de Contacto *</label>
                                                <input 
                                                    type="tel" 
                                                    required 
                                                    placeholder="Ej: 88888888" 
                                                    value={telefonoCliente} 
                                                    onChange={(e) => setTelefonoCliente(e.target.value)} 
                                                />
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
                                                    <label><FaMapMarkerAlt /> Dirección de Envío *</label>
                                                    <textarea 
                                                        required
                                                        placeholder="Dirección exacta de tu casa u oficina..." 
                                                        value={direccionCliente} 
                                                        onChange={(e) => setDireccionCliente(e.target.value)} 
                                                    />
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

                                            {/* CASILLA DE TÉRMINOS Y CONDICIONES */}
                                            <div className={styles.termsCheckboxGroup} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '15px 0' }}>
                                                <input 
                                                    type="checkbox" 
                                                    id="term_check"
                                                    checked={aceptoTerminos}
                                                    onChange={(e) => setAceptoTerminos(e.target.checked)}
                                                    style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#b002c2' }}
                                                />
                                                <label htmlFor="term_check" style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer', lineHeight: '1.3' }}>
                                                    Acepto los {' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setVerModalTerminos(true)}
                                                        style={{ background: 'transparent', border: 'none', color: '#b002c2', padding: 0, font: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                                                    >
                                                        términos y condiciones
                                                    </button>
                                                    {' '} de Nicaplus Gaming.
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
            </main>

            <footer className={styles.footer}>
                <div>&copy; {new Date().getFullYear()} Nicaplus Gaming. Todos los derechos reservados.</div>
                <div className={styles.footerLocation}>León, Nicaragua.</div>
            </footer>

            {/* MODAL DE TÉRMINOS Y CONDICIONES CORREGIDO */}
            {verModalTerminos && (
                <Terminos alCerrar={() => setVerModalTerminos(false)} />
            )}
        </div>
    );
};