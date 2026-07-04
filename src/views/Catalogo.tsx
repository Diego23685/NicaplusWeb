import React, { useEffect, useState } from 'react';
import api from '../services/api';
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

    useEffect(() => {
        api.get('/products/catalogo').then(res => setProductos(res.data)).catch(err => console.error(err));
        api.get('/categorias').then(res => setCategorias(res.data)).catch(err => console.error(err));
        api.get('/juegos').then(res => setJuegos(res.data)).catch(err => console.error(err));
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
        <div style={{ fontFamily: "'Segoe UI', Roboto, sans-serif", background: '#080c14', color: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* INYECCIÓN DE MEDIA QUERIES ULTRA-RESPONSIVAS */}
            <style>{`
                .nav-header-container { display: grid; grid-template-columns: auto 1fr auto; max-width: 1400px; margin: 0 auto; padding: 0 20px; alignItems: center; height: 65px; gap: 20px; }
                .main-layout-grid { display: grid; grid-template-columns: 1fr; gap: 24px; width: 100%; }
                .selector-scroll-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; WebkitOverflowScrolling: touch; }
                .selector-card-item { flex: 0 0 145px; height: 80px; background: #121826; border: 1px solid #1f293d; border-radius: 8px; cursor: pointer; position: relative; overflow: hidden; display: flex; alignItems: center; justifyContent: center; transition: all 0.2s ease; }
                .cart-floating-btn-mobile { display: none; }
                
                @media (min-width: 1024px) {
                    .main-layout-grid.with-cart { grid-template-columns: 1.4fr 400px !important; }
                }

                @media (max-width: 1023px) {
                    .nav-header-container { grid-template-columns: 1fr; height: auto; padding: 15px; text-align: center; gap: 12px; }
                    .header-brand-block { display: flex; justify-content: space-between; width: 100%; align-items: center; }
                    .header-navigation { width: 100%; justify-content: center; overflow-x: auto; padding-bottom: 4px; }
                    .header-search-block { width: 100%; max-width: none !important; }
                    .cart-floating-btn-mobile { display: flex !important; }
                    .cart-desktop-btn { display: none !important; }
                    .selector-card-item { flex: 0 0 120px; height: 70px; }
                }
            `}</style>

            {/* NAVBAR RESPONSIVE NATIVO */}
            <header style={{ background: 'rgba(17, 22, 34, 0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 1000 }}>
                <div className="nav-header-container">
                    
                    {/* Logotipo y Carrito Móvil */}
                    <div className="header-brand-block">
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={() => setSeccionActiva('inicio')}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ffd1', boxShadow: '0 0 10px #00ffd1' }} />
                            <span style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '1px' }}>NICAPLUS</span>
                        </div>
                        <button 
                            className="cart-floating-btn-mobile"
                            onClick={() => setVerCarrito(!verCarrito)} 
                            style={{ background: '#581c7e', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                        >
                            <FaShoppingCart size={13} /> ({totalCarritoItems})
                        </button>
                    </div>

                    {/* Menú de Navegación */}
                    <nav className="header-navigation" style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'center' }}>
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
                                    background: 'transparent', border: 'none',
                                    color: seccionActiva === tab.id ? '#00ffd1' : '#94a3b8',
                                    fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: '0 12px',
                                    height: '45px', borderBottom: seccionActiva === tab.id ? '3px solid #047688' : '3px solid transparent',
                                    display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                }}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Buscador y Carrito Escritorio */}
                    <div className="header-search-block" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                            <FaSearch style={{ position: 'absolute', left: '14px', color: '#64748b', fontSize: '0.85rem' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar en la tienda..."
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    if(seccionActiva !== 'productos') setSeccionActiva('productos');
                                }}
                                style={{ width: '100%', padding: '10px 14px 10px 38px', background: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <button 
                            className="cart-desktop-btn"
                            onClick={() => setVerCarrito(!verCarrito)} 
                            style={{ background: '#581c7e', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                            <FaShoppingCart size={13} /> Carrito ({totalCarritoItems})
                        </button>
                    </div>

                </div>
            </header>

            {/* CUERPO DE TRABAJO */}
            <main style={{ maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '20px', flex: 1, boxSizing: 'border-box' }}>
                <div className={`main-layout-grid ${verCarrito ? 'with-cart' : ''}`}>
                    
                    {/* VISTAS DE NAVEGACIÓN */}
                    <div style={{ width: '100%', minWidth: 0 }}>
                        {seccionActiva === 'inicio' && <HeroInicio setSeccionActiva={setSeccionActiva} />}
                        {seccionActiva === 'nosotros' && <VistaNosotros />}
                        {seccionActiva === 'contacto' && <VistaContacto />}
                        
                        {seccionActiva === 'productos' && (
                            <div>
                                {/* CATEGORÍAS */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><FaTags /> Categorías de Inventario</h4>
                                    <div className="selector-scroll-row">
                                        <div onClick={() => setIdCatSeleccionada(null)} className="selector-card-item" style={{ border: idCatSeleccionada === null ? '2px solid #00ffd1' : '1px solid #1f293d' }}>
                                            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1 }} />
                                            <span style={{ zIndex: 2, fontSize: '0.8rem', fontWeight: 'bold', color: '#00ffd1' }}>⭐ Ver Todo</span>
                                        </div>
                                        {categorias.map(c => (
                                            <div key={c.id} onClick={() => setIdCatSeleccionada(c.id)} className="selector-card-item" style={{ border: idCatSeleccionada === c.id ? '2px solid #00ffd1' : '1px solid #1f293d' }}>
                                                {c.imagenUrl && <img src={c.imagenUrl} alt={c.nombre} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(11, 15, 25, 0.75)', zIndex: 1 }} />
                                                <span style={{ zIndex: 2, fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', padding: '0 6px' }}>{c.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* VIDEOJUEGOS */}
                                <div style={{ marginBottom: '24px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><FaGamepad /> Filtrar por Videojuego</h4>
                                    <div className="selector-scroll-row">
                                        <div onClick={() => setIdJuegoSeleccionado(null)} className="selector-card-item" style={{ border: idJuegoSeleccionado === null ? '2px solid #00ffd1' : '1px solid #1f293d' }}>
                                            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', zIndex: 1 }} />
                                            <span style={{ zIndex: 2, fontSize: '0.8rem', fontWeight: 'bold', color: '#00ffd1' }}>🎮 Todos</span>
                                        </div>
                                        {juegos.map(j => (
                                            <div key={j.id} onClick={() => setIdJuegoSeleccionado(j.id)} className="selector-card-item" style={{ border: idJuegoSeleccionado === j.id ? '2px solid #00ffd1' : '1px solid #1f293d' }}>
                                                {j.imagenUrl && <img src={j.imagenUrl} alt={j.nombre} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(11, 15, 25, 0.7)', zIndex: 1 }} />
                                                <span style={{ zIndex: 2, fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', padding: '0 6px' }}>{j.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CONTEO */}
                                <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#047688', margin: 0 }}>
                                        Productos Disponibles ({productosFiltrados.length})
                                    </h2>
                                </div>
                                
                                {/* GRID DE PRODUCTOS */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                                    {productosFiltrados.map(p => (
                                        <div key={p.id} style={{ background: '#111622', border: '1px solid #1e293b', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box' }}>
                                            <div style={{ width: '100%', height: '200px', background: '#090d16', position: 'relative', borderBottom: '1px solid #1e293b' }}>
                                                {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem', color: '#4b5563' }}>SIN IMAGEN</div>}
                                                <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '0.6rem', padding: '3px 6px', background: p.esDigital ? '#581c7e' : '#047688', borderRadius: '4px', fontWeight: 'bold' }}>{p.esDigital ? "DIGITAL" : "FÍSICO"}</span>
                                            </div>
                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, gap: '12px' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '0.9rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#f8fafc' }}>{p.nombre}</h3>
                                                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0, height: '32px', overflow: 'hidden', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.descripcion}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', marginTop: 'auto' }}>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>C$ {p.precioVenta}</span>
                                                    <button onClick={() => agregarAlCarrito(p)} style={{ background: 'transparent', color: '#00ffd1', border: '1px solid #047688', padding: '5px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}>+ Añadir</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PANEL CARRITO (MUTABLE GRID) */}
                    {verCarrito && (
                        <div style={{ background: '#111622', borderRadius: '8px', padding: '20px', border: '1px solid #1e293b', height: 'fit-content', boxSizing: 'border-box', position: 'sticky', top: '85px' }}>
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
            <footer style={{ background: '#111622', borderTop: '1px solid #1e293b', padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                &copy; {new Date().getFullYear()} Nicaplus Gaming & Tech. Todos los derechos reservados.<br />
                <span style={{ color: '#475569' }}>León, Nicaragua.</span>
            </footer>
        </div>
    );
};