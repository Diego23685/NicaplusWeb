import React, { useEffect, useState } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import { 
    FaShoppingCart, FaTrashAlt, FaWhatsapp, FaStore, 
    FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags 
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

type Seccion = 'inicio' | 'nosotros' | 'productos' | 'contacto';

export const Catalogo: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [verCarrito, setVerCarrito] = useState(false);
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('inicio');
    const [busqueda, setBusqueda] = useState('');

    const [idCatSeleccionada, setIdCatSeleccionada] = useState<number | null>(null);
    const [idJuegoSeleccionado, setIdJuegoSeleccionado] = useState<number | null>(null);

    const WHATSAPP_NUMERO = "50557379929"; 

    // Interceptor de movimiento para manipulación de coordenadas por hardware (CSS Variables)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { currentTarget, clientX, clientY } = e;
        currentTarget.style.setProperty('--mouse-x', `${clientX}px`);
        currentTarget.style.setProperty('--mouse-y', `${clientY}px`);
    };

    useEffect(() => {
        // Ejecución en paralelo óptima de endpoints utilizando nombres exactos de controladores
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

    return (
        <div className={styles.mainWrapper} onMouseMove={handleMouseMove}>
            
            {/* NAVBAR */}
            <header className={styles.navbar}>
                <div className={styles.navContainer}>
                    
                    <div className={styles.brandBlock} onClick={() => setSeccionActiva('inicio')}>
                        <div className={styles.brandIndicator} />
                        <span className={styles.brandText}>NICAPLUS</span>
                    </div>

                    <button 
                        className={styles.cartBtnMobile}
                        onClick={() => setVerCarrito(!verCarrito)} 
                    >
                        <FaShoppingCart size={13} /> ({totalCarritoItems})
                    </button>

                    <nav className={styles.navigation}>
                        {([
                            { id: 'inicio', label: 'Inicio', icon: <FaHome /> },
                            { id: 'nosotros', label: 'Nosotros', icon: <FaInfoCircle /> },
                            { id: 'productos', label: 'Tienda', icon: <FaStore /> },
                            { id: 'contacto', label: 'Ubicación', icon: <FaMapMarkerAlt /> }
                        ] as const).map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { setSeccionActiva(tab.id); if (tab.id === 'inicio') { setIdCatSeleccionada(null); setIdJuegoSeleccionado(null); } }} 
                                style={{
                                    color: seccionActiva === tab.id ? '#00ffd1' : '#94a3b8',
                                    borderBottom: seccionActiva === tab.id ? '3px solid #047688' : '3px solid transparent'
                                }}
                                className={styles.navTab}
                            >
                                {tab.icon} {tab.label}
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
                            className={styles.cartBtnDesktop}
                            onClick={() => setVerCarrito(!verCarrito)} 
                        >
                            <FaShoppingCart size={13} /> Carrito ({totalCarritoItems})
                        </button>
                    </div>

                </div>
            </header>

            {/* CONTENEDOR PRINCIPAL */}
            <main className={styles.mainContent}>
                <div className={`${styles.mainLayoutGrid} ${verCarrito ? styles.withCart : ''}`}>
                    
                    <div style={{ width: '100%', minWidth: 0 }}>
                        {seccionActiva === 'inicio' && <HeroInicio setSeccionActiva={setSeccionActiva} />}
                        {seccionActiva === 'nosotros' && <VistaNosotros />}
                        {seccionActiva === 'contacto' && <VistaContacto />}
                        
                        {seccionActiva === 'productos' && (
                            <div>
                                {/* SECTOR CATEGORÍAS */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 className={styles.sectionTitle}><FaTags /> Categorías de Inventario</h4>
                                    <div className={styles.selectorScrollRow}>
                                        <div 
                                            onClick={() => setIdCatSeleccionada(null)} 
                                            className={styles.selectorCardItem} 
                                            style={{ borderColor: idCatSeleccionada === null ? '#00ffd1' : 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className={styles.cardOverlay} style={{ background: 'rgba(0,0,0,0.85)' }} />
                                            <span className={styles.cardText} style={{ color: '#00ffd1' }}>⭐ Ver Todo</span>
                                        </div>
                                        {categorias.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => setIdCatSeleccionada(c.id)} 
                                                className={styles.selectorCardItem} 
                                                style={{ borderColor: idCatSeleccionada === c.id ? '#00ffd1' : 'rgba(255,255,255,0.05)' }}
                                            >
                                                {c.imagenUrl && <img src={c.imagenUrl} alt={c.nombre} className={styles.cardImage} />}
                                                <div className={styles.cardOverlay} />
                                                <span className={styles.cardText}>{c.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTOR JUEGOS */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 className={styles.sectionTitle}><FaGamepad /> Filtrar por Videojuego</h4>
                                    <div className={styles.selectorScrollRow}>
                                        <div 
                                            onClick={() => setIdJuegoSeleccionado(null)} 
                                            className={styles.selectorCardItem} 
                                            style={{ borderColor: idJuegoSeleccionado === null ? '#00ffd1' : 'rgba(255,255,255,0.05)' }}
                                        >
                                            <div className={styles.cardOverlay} style={{ background: 'rgba(0,0,0,0.85)' }} />
                                            <span className={styles.cardText} style={{ color: '#00ffd1' }}>🎮 Todos</span>
                                        </div>
                                        {juegos.map(j => (
                                            <div 
                                                key={j.id} 
                                                onClick={() => setIdJuegoSeleccionado(j.id)} 
                                                className={styles.selectorCardItem} 
                                                style={{ borderColor: idJuegoSeleccionado === j.id ? '#00ffd1' : 'rgba(255,255,255,0.05)' }}
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
                                
                                {/* GRID DE TARJETAS */}
                                <div className={styles.productsGrid}>
                                    {productosFiltrados.map(p => (
                                        <div key={p.id} className={styles.productCard}>
                                            <div className={styles.imageContainer}>
                                                {p.imagenUrl ? (
                                                    <img src={p.imagenUrl} alt={p.nombre} className={styles.productImage} />
                                                ) : (
                                                    <div className={styles.noImage}>SIN IMAGEN</div>
                                                )}
                                                <span 
                                                    className={styles.badge}
                                                    style={{ 
                                                        background: p.esDigital ? '#581c7e' : '#047688',
                                                        color: '#ffffff'
                                                    }}
                                                >
                                                    {p.esDigital ? "DIGITAL" : "FÍSICO"}
                                                </span>
                                            </div>
                                            <div className={styles.cardContent}>
                                                <div>
                                                    <h3 className={styles.productTitle}>{p.nombre}</h3>
                                                    <p className={styles.productDescription}>{p.descripcion}</p>
                                                </div>
                                                <div className={styles.priceRow}>
                                                    <span className={styles.price}>C$ {p.precioVenta}</span>
                                                    <button onClick={() => agregarAlCarrito(p)} className={styles.addBtn}>+ Añadir</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR DEL CARRITO */}
                    {verCarrito && (
                        <div className={styles.cartPanel}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}><FaShoppingCart /> Tu Orden</h3>
                                <button onClick={() => setVerCarrito(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                            </div>
                            
                            {carrito.length === 0 ? (
                                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '20px 0', textAlign: 'center' }}>Tu carrito está vacío.</p>
                            ) : (
                                <>
                                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                                        {carrito.map(item => (
                                            <div key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                                                <div style={{ paddingRight: '8px', overflow: 'hidden' }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: '600', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><span style={{ color: '#00ffd1' }}>{item.cantidad}x</span> {item.producto.nombre}</span>
                                                    <small style={{ color: '#64748b' }}>C$ {item.producto.precioVenta} c/u</small>
                                                </div>
                                                <button onClick={() => removerDelCarrito(item.producto.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}><FaTrashAlt size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                                            <span>Total:</span>
                                            <span style={{ color: '#00ffd1' }}>C$ {carrito.reduce((sum, item) => sum + (item.cantidad * item.producto.precioVenta), 0)}</span>
                                        </div>
                                    </div>
                                    
                                    <button onClick={enviarAWhatsApp} style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <FaWhatsapp size={16} /> Confirmar por WhatsApp
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className={styles.footer}>
                &copy; {new Date().getFullYear()} Venta de Celulares y Accesorios Nicaplus Gaming. Todos los derechos reservados.<br />
                <span style={{ color: '#475569' }}>León, Nicaragua.</span>
            </footer>
        </div>
    );
};