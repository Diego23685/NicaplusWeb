import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import { 
    FaShoppingCart, FaTrashAlt, FaWhatsapp, FaStore, 
    FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, 
    FaArrowLeft, FaMinus, FaPlus, FaBars, FaTimes
} from 'react-icons/fa';

import { HeroInicio } from '../components/catalogo/HeroInicio';
import { VistaNosotros } from '../components/catalogo/VistaNosotros';
import { VistaContacto } from '../components/catalogo/VistaContacto';

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

export const Catalogo: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('inicio');
    const [busqueda, setBusqueda] = useState('');
    const [menuAbierto, setMenuAbierto] = useState(false); // Estado para el Sidebar Móvil

    const [idCatSeleccionada, setIdCatSeleccionada] = useState<number | null>(null);
    const [idJuegoSeleccionado, setIdJuegoSeleccionado] = useState<number | null>(null);

    const WHATSAPP_NUMERO = "50557379929"; 

    // --- EFECTO INTERACTIVO DE PARTICULAS (CURSOR RATÓN) ---
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
            setCarrito([...carrito, { producto, carrot: 1, cantidad: 1 }]);
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

    const enviarAWhatsApp = () => {
        if (carrito.length === 0) return;
        let mensaje = `✨ *NUEVA ORDEN - NICAPLUS GAMING* ✨\n\n`;
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

    // Array de navegación reutilizable tanto en Desktop como en Sidebar móvil
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
        setMenuAbierto(false); // Cierra automáticamente el sidebar al cambiar de vista
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
                </nav>
            </aside>

            {/* NAVBAR */}
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    
                    <div className={styles.brandBlock} onClick={() => cambiarSeccion('inicio')}>
                        <div className={styles.brandIndicator} />
                        <span className={styles.brandText}>NICAPLUS GAMING</span>
                    </div>

                    {/* CONTROLES MÓVILES (CARRITO + HAMBURGUESA) */}
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

                    {/* NAVEGACIÓN DESKTOP */}
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
                            <div className={styles.filterSection}>
                                <h4 className={styles.sectionTitle}><FaTags /> Categorías de Inventario</h4>
                                <div className={styles.selectorScrollRow}>
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
                            </div>

                            <div className={styles.filterSection}>
                                <h4 className={styles.sectionTitle}><FaGamepad /> Filtrar por Videojuego</h4>
                                <div className={styles.selectorScrollRow}>
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
                                        <div className={`${styles.summaryRow} ${styles.totalRowView}`}><span>Total:</span><span className={styles.totalColor}>C$ {totalPagar}</span></div>
                                        <button onClick={enviarAWhatsApp} className={styles.finalCheckoutBtn}><FaWhatsapp size={18} /> Procesar vía WhatsApp</button>
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
        </div>
    );
};