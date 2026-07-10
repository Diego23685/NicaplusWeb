import React, { useEffect, useState } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import { 
    FaShoppingCart, FaTrashAlt, FaWhatsapp, FaStore, 
    FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, FaArrowLeft, FaMinus, FaPlus
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

    const [idCatSeleccionada, setIdCatSeleccionada] = useState<number | null>(null);
    const [idJuegoSeleccionado, setIdJuegoSeleccionado] = useState<number | null>(null);

    const WHATSAPP_NUMERO = "50557379929"; 

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

    return (
        <div className={styles.mainWrapper}>
            
            {/* NAVBAR */}
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    
                    <div className={styles.brandBlock} onClick={() => setSeccionActiva('inicio')}>
                        <div className={styles.brandIndicator} />
                        <span className={styles.brandText}>NICAPLUS</span>
                    </div>

                    <button 
                        className={`${styles.cartBtnMobile} ${seccionActiva === 'carrito' ? styles.cartBtnActive : ''}`}
                        onClick={() => setSeccionActiva('carrito')} 
                    >
                        <FaShoppingCart size={14} /> 
                        <span className={styles.cartBadgeCount}>{totalCarritoItems}</span>
                    </button>

                    <nav className={styles.navigation}>
                        {([
                            { id: 'inicio', label: 'Inicio', icon: <FaHome /> },
                            { id: 'nosotros', label: 'Nosotros', icon: <FaInfoCircle /> },
                            { id: 'productos', label: 'Tienda', icon: <FaStore /> },
                            { id: 'contacto', label: 'Ubicación', icon: <FaMapMarkerAlt /> }
                        ] as const).map(tab => {
                            const isActivo = seccionActiva === tab.id;
                            return (
                                <button 
                                    key={tab.id}
                                    onClick={() => { 
                                        setSeccionActiva(tab.id); 
                                        if (tab.id === 'inicio') { 
                                            setIdCatSeleccionada(null); 
                                            setIdJuegoSeleccionado(null); 
                                        } 
                                    }} 
                                    className={`${styles.navTab} ${isActivo ? styles.navTabActivo : ''}`}
                                >
                                    {tab.icon} <span>{tab.label}</span>
                                </button>
                            );
                        })}
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
                            onClick={() => setSeccionActiva('carrito')} 
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
                    
                    {/* VISTA CATÁLOGO/TIENDA */}
                    {seccionActiva === 'productos' && (
                        <div className={styles.fadeEntrance}>
                            {/* SECTOR CATEGORÍAS */}
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

                            {/* SECTOR JUEGOS */}
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
                                    // Verificamos si este producto específico ya se encuentra en el carrito
                                    const itemEnCarrito = carrito.find(item => item.producto.id === p.id);

                                    return (
                                        <div key={p.id} className={styles.productCard}>
                                            {/* Foto clickeable que añade directo al carrito */}
                                            <div 
                                                className={styles.imageContainer} 
                                                onClick={() => agregarAlCarrito(p)}
                                                style={{ cursor: 'pointer' }}
                                                title="Haga clic en la imagen para añadir al carrito"
                                            >
                                                {p.imagenUrl ? (
                                                    <img src={p.imagenUrl} alt={p.nombre} className={styles.productImage} />
                                                ) : (
                                                    <div className={styles.noImage}>SIN IMAGEN</div>
                                                )}
                                                <span 
                                                    className={styles.badge}
                                                    style={{ 
                                                        background: p.esDigital ? '#581c7e' : '#047688',
                                                    }}
                                                >
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
                                                    
                                                    {/* Control dinámico de botones: Selector si ya existe, botón simple si no */}
                                                    {itemEnCarrito ? (
                                                        <div className={styles.cartQtyControls} style={{ margin: 0 }}>
                                                            <button 
                                                                onClick={() => {
                                                                    if (itemEnCarrito.cantidad === 1) {
                                                                        removerDelCarrito(p.id);
                                                                    } else {
                                                                        cambiarCantidad(p.id, -1);
                                                                    }
                                                                }} 
                                                                className={styles.qtyBtn}
                                                            >
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

                    {/* VISTA DEL CARRITO COMPLETO */}
                    {seccionActiva === 'carrito' && (
                        <div className={`${styles.cartViewContainer} styles.fadeEntrance`}>
                            <div className={styles.cartViewHeader}>
                                <button className={styles.backToStoreBtn} onClick={() => setSeccionActiva('productos')}>
                                    <FaArrowLeft /> Volver a la tienda
                                </button>
                                <h2 className={styles.cartViewTitle}>Tu Carrito de Compras</h2>
                                <p className={styles.cartViewSubtitle}>Revisa tus artículos antes de procesar el pedido mediante WhatsApp.</p>
                            </div>

                            {carrito.length === 0 ? (
                                <div className={styles.emptyCartView}>
                                    <div className={styles.emptyIconCircle}>
                                        <FaShoppingCart size={32} />
                                    </div>
                                    <h3>Tu carrito está vacío</h3>
                                    <p>Parece que aún no has añadido productos a tu orden.</p>
                                    <button className={styles.exploreBtn} onClick={() => setSeccionActiva('productos')}>
                                        Explorar Productos
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.cartMainGrid}>
                                    
                                    {/* LISTA DE ITEMS */}
                                    <div className={styles.cartItemsContainer}>
                                        {carrito.map(item => (
                                            <div key={item.producto.id} className={styles.cartItemCard}>
                                                <div className={styles.cartItemImgThum}>
                                                    {item.producto.imagenUrl ? (
                                                        <img src={item.producto.imagenUrl} alt={item.producto.nombre} />
                                                    ) : (
                                                        <div className={styles.cartNoImg}>🎮</div>
                                                    )}
                                                </div>
                                                
                                                <div className={styles.cartItemDetails}>
                                                    <div className={styles.cartItemMeta}>
                                                        <h4>{item.producto.nombre}</h4>
                                                        <span className={item.producto.esDigital ? styles.tagDig : styles.tagFis}>
                                                            {item.producto.esDigital ? "Digital" : "Físico"}
                                                        </span>
                                                    </div>
                                                    <p className={styles.cartItemPriceUnit}>Precio unitario: C$ {item.producto.precioVenta}</p>
                                                </div>

                                                {/* CONTROLADOR DE CANTIDADES EN LA VISTA COMPLETA */}
                                                <div className={styles.cartQtyControls}>
                                                    <button onClick={() => cambiarCantidad(item.producto.id, -1)} className={styles.qtyBtn}>
                                                        <FaMinus size={10} />
                                                    </button>
                                                    <span className={styles.qtyValue}>{item.cantidad}</span>
                                                    <button onClick={() => cambiarCantidad(item.producto.id, 1)} className={styles.qtyBtn}>
                                                        <FaPlus size={10} />
                                                    </button>
                                                </div>

                                                <div className={styles.cartItemSubtotalBlock}>
                                                    <span className={styles.itemSubtotalText}>C$ {item.cantidad * item.producto.precioVenta}</span>
                                                </div>

                                                <button onClick={() => removerDelCarrito(item.producto.id)} className={styles.deleteItemBtn} title="Eliminar producto">
                                                    <FaTrashAlt size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* RESUMEN DE PAGO */}
                                    <div className={styles.cartSummaryCard}>
                                        <h3>Resumen de Pedido</h3>
                                        <div className={styles.summaryRow}>
                                            <span>Subtotal productos</span>
                                            <span>C$ {totalPagar}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span>Método de entrega</span>
                                            <span className={styles.deliveryHighlight}>Coordinación Directa</span>
                                        </div>
                                        <div className={styles.dividerSummary} />
                                        <div className={`${styles.summaryRow} ${styles.totalRowView}`}>
                                            <span>Total Estimado:</span>
                                            <span className={styles.totalColor}>C$ {totalPagar}</span>
                                        </div>

                                        <button onClick={enviarAWhatsApp} className={styles.finalCheckoutBtn}>
                                            <FaWhatsapp size={18} /> Procesar Pedido vía WhatsApp
                                        </button>
                                        <p className={styles.checkoutDisclaimer}>
                                            Serás redirigido a WhatsApp para validar disponibilidad de stock y coordinar el pago / entrega con un asesor.
                                        </p>
                                    </div>

                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className={styles.footer}>
                <div>&copy; {new Date().getFullYear()} Nicaplus Gaming. Todos los derechos reservados.</div>
                <div className={styles.footerLocation}>León, Nicaragua.</div>
            </footer>
        </div>
    );
};