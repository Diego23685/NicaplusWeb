import React, { useEffect, useState, useRef, useMemo } from 'react';
import api from '../services/api';
import styles from '../components/catalogo/Catalogo.module.css';
import detailStyles from '../assets/styles/CatalogoDetalle.module.css';
import { SidebarCatalogo } from '../components/catalogo/SidebarCatalogo';
import { 
    FaShoppingCart, FaStore, FaMapMarkerAlt, FaHome, FaInfoCircle, FaSearch, FaGamepad, FaTags, 
    FaArrowLeft, FaSignOutAlt, FaBars, FaTimes, FaSignInAlt, FaChevronLeft, FaChevronRight, 
    FaHeadphones, FaLaptop, FaKeyboard, FaMouse, FaTv, FaPlug, FaFolderOpen, FaFacebook, FaInstagram,
    FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaInfo, FaPalette
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

export interface VariacionProducto {
    id: number;
    productoPadreId: number;
    sku?: string;
    color?: string;
    almacenamiento?: string;
    ram?: string;
    talla?: string;
    nombreVariacion: string;
    precioVenta: number;
    precioCosto?: number;
    stockActual: number;
    stockMinimo?: number;
    imagenUrl?: string;
    estado?: string;
}

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precioVenta: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    categoriaId?: number;
    juegoId?: number;
    tieneVariaciones?: boolean;
    variaciones?: VariacionProducto[];
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

export interface ItemCarrito {
    producto: Producto;
    variacionSeleccionada?: VariacionProducto | null;
    cantidad: number;
}

type Seccion = 'inicio' | 'nosotros' | 'productos' | 'contacto' | 'carrito' | 'producto-detalle';

interface CatalogoProps {
    alIrAlLogin: () => void;
    cliente: any;
    alCerrarSesion: () => void;
    alIrAMiCuenta?: () => void;
}

interface Notificacion {
    mensaje: string;
    tipo: 'error' | 'advertencia' | 'exito' | 'info';
}

// Función auxiliar para calcular rango o precio base
const calcularRangoPrecios = (p: Producto): string => {
    if (!p.tieneVariaciones || !p.variaciones || p.variaciones.length === 0) {
        return `C$ ${p.precioVenta.toLocaleString('es-NI')}`;
    }
    const precios = p.variaciones.map(v => v.precioVenta).filter(pr => pr > 0);
    if (precios.length === 0) return `C$ ${p.precioVenta.toLocaleString('es-NI')}`;

    const min = Math.min(...precios);
    const max = Math.max(...precios);

    if (min === max) return `C$ ${min.toLocaleString('es-NI')}`;
    return `Desde C$ ${min.toLocaleString('es-NI')}`;
};

/* ==========================================================================
      SUBCOMPONENTE INTERNO: DETALLE DE PRODUCTO
   ========================================================================== */
interface ProductoDetalleProps {
    producto: Producto;
    alVolver: () => void;
    alAgregarAlCarrito: (p: Producto, variacion?: VariacionProducto | null, e?: React.MouseEvent) => void;
    carrito: ItemCarrito[];
}

const ProductoDetalle: React.FC<ProductoDetalleProps> = ({ 
    producto, 
    alVolver, 
    alAgregarAlCarrito,
    carrito 
}) => {
    const tieneVars = Boolean(producto.tieneVariaciones && producto.variaciones && producto.variaciones.length > 0);
    const [varSeleccionada, setVarSeleccionada] = useState<VariacionProducto | null>(
        tieneVars ? producto.variaciones![0] : null
    );

    const precioActual = varSeleccionada ? varSeleccionada.precioVenta : producto.precioVenta;
    const stockActual = varSeleccionada ? varSeleccionada.stockActual : producto.stockActual;
    const hayStock = producto.esDigital || stockActual > 0;

    const cantidadEnCarrito = useMemo(() => {
        const item = carrito.find(i => 
            i.producto.id === producto.id && 
            (varSeleccionada ? i.variacionSeleccionada?.id === varSeleccionada.id : !i.variacionSeleccionada)
        );
        return item?.cantidad || 0;
    }, [carrito, producto.id, varSeleccionada]);

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
                    {(varSeleccionada?.imagenUrl || producto.imagenUrl) ? (
                        <img src={varSeleccionada?.imagenUrl || producto.imagenUrl} alt={producto.nombre} className={detailStyles.detailMainImage} />
                    ) : (
                        <div className={detailStyles.detailNoImage}>SIN IMAGEN DE DISPOSITIVO</div>
                    )}
                </div>

                <div className={detailStyles.detailInfoSection}>
                    <h1 className={detailStyles.detailProductTitle}>{producto.nombre}</h1>
                    
                    <div className={detailStyles.detailPriceRow}>
                        <span className={detailStyles.detailPriceLabel}>Precio:</span>
                        <span className={detailStyles.detailPriceValue}>C$ {precioActual.toLocaleString('es-NI')}</span>
                    </div>

                    {/* SELECTOR DE VARIACIONES / PRESENTACIONES */}
                    {tieneVars && (
                        <div style={{ margin: '14px 0', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#38bdf8', fontWeight: 800, marginBottom: '8px' }}>
                                <FaPalette /> Selecciona una presentación / opción:
                            </label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {producto.variaciones!.map(v => {
                                    const activa = varSeleccionada?.id === v.id;
                                    const sinStock = !producto.esDigital && v.stockActual <= 0;
                                    return (
                                        <button
                                            key={v.id}
                                            type="button"
                                            disabled={sinStock}
                                            onClick={() => setVarSeleccionada(v)}
                                            style={{
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: activa ? '2px solid #38bdf8' : '1px solid #334155',
                                                background: activa ? '#0284c7' : sinStock ? '#1e293b' : '#0f172a',
                                                color: sinStock ? '#64748b' : '#fff',
                                                cursor: sinStock ? 'not-allowed' : 'pointer',
                                                fontSize: '0.85rem',
                                                fontWeight: activa ? 800 : 600,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '2px',
                                                opacity: sinStock ? 0.45 : 1
                                            }}
                                        >
                                            <span>{v.nombreVariacion}</span>
                                            <small style={{ fontSize: '0.75rem', color: activa ? '#fff' : '#38bdf8' }}>
                                                {sinStock ? 'Agotado' : `C$ ${v.precioVenta.toLocaleString('es-NI')}`}
                                            </small>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={detailStyles.detailDivider} />

                    <div className={detailStyles.detailStockStatus}>
                        {hayStock ? (
                            <span className={detailStyles.stockAvailable}>
                                <FaCheckCircle /> Disponible {!producto.esDigital && `(${stockActual} unidades en tienda)`}
                            </span>
                        ) : (
                            <span className={detailStyles.stockOut} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
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
                            onClick={(e) => alAgregarAlCarrito(producto, varSeleccionada, e)}
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
    const [seccionActiva, setSeccionActiva] = useState<Seccion>('productos');
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

    const [notificacion, setNotificacion] = useState<Notificacion | null>(null);

    const catRowRef = useRef<HTMLDivElement | null>(null);
    const juegoRowRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const mostrarAviso = (mensaje: string, tipo: 'error' | 'advertencia' | 'exito' | 'info' = 'advertencia') => {
        setNotificacion({ mensaje, tipo });
    };

    useEffect(() => {
        if (notificacion) {
            const timer = setTimeout(() => {
                setNotificacion(null);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [notificacion]);

    useInteractiveCanvas(canvasRef);

    useEffect(() => {
        if (cliente) {
            setNombreCliente(cliente.nombre || cliente.Nombre || '');
            setTelefonoCliente(cliente.telefono || cliente.Telefono || '');
        }
    }, [cliente]);

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

    const agregarAlCarrito = (producto: Producto, variacion?: VariacionProducto | null, e?: React.MouseEvent) => {
        let errorStock = false;
        const stockDisponible = variacion ? variacion.stockActual : producto.stockActual;

        setCarrito(prevCarrito => {
            const existeIndex = prevCarrito.findIndex(item => 
                item.producto.id === producto.id && 
                (variacion ? item.variacionSeleccionada?.id === variacion.id : !item.variacionSeleccionada)
            );

            if (existeIndex > -1) {
                const itemExistente = prevCarrito[existeIndex];
                if (!producto.esDigital && stockDisponible <= itemExistente.cantidad) {
                    errorStock = true;
                    return prevCarrito;
                }
                const copia = [...prevCarrito];
                copia[existeIndex] = { ...itemExistente, cantidad: itemExistente.cantidad + 1 };
                return copia;
            }

            if (!producto.esDigital && stockDisponible <= 0) {
                errorStock = true;
                return prevCarrito;
            }

            return [...prevCarrito, { producto, variacionSeleccionada: variacion || null, cantidad: 1 }];
        });

        if (errorStock) {
            mostrarAviso("Límite de existencias alcanzado en tienda.", "advertencia");
            return;
        }

        if (e) {
            const cartButton = document.querySelector(`.${styles.cartBtnDesk}`) || document.querySelector(`.${styles.cartBtnMobile}`) || document.getElementById('mobile-bottom-cart-btn');
            
            if (cartButton) {
                const rectBoton = e.currentTarget.getBoundingClientRect();
                const rectCarrito = cartButton.getBoundingClientRect();

                const flyElem = document.createElement('div');
                flyElem.className = styles.flyingParticle;
                
                if (variacion?.imagenUrl || producto.imagenUrl) {
                    flyElem.style.backgroundImage = `url(${variacion?.imagenUrl || producto.imagenUrl})`;
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
    };

    const cambiarCantidad = (id: number, delta: number) => {
        let alcanzadoLimite = false;
        setCarrito(prevCarrito => 
            prevCarrito.map(item => {
                if (item.producto.id === id) {
                    const nuevaCantidad = item.cantidad + delta;
                    if (nuevaCantidad < 1) return item;
                    const stockDisponible = item.variacionSeleccionada ? item.variacionSeleccionada.stockActual : item.producto.stockActual;
                    if (!item.producto.esDigital && stockDisponible < nuevaCantidad) {
                        alcanzadoLimite = true;
                        return item;
                    }
                    return { ...item, cantidad: nuevaCantidad };
                }
                return item;
            })
        );

        if (alcanzadoLimite) {
            mostrarAviso("Límite de existencias alcanzado.", "advertencia");
        }
    };

    const removerDelCarrito = (id: number) => {
        setCarrito(prev => prev.filter(item => item.producto.id !== id));
    };

    const totalPagar = useMemo(() => {
        return carrito.reduce((sum, item) => {
            const precio = item.variacionSeleccionada ? item.variacionSeleccionada.precioVenta : item.producto.precioVenta;
            return sum + (item.cantidad * precio);
        }, 0);
    }, [carrito]);

    const enviarAWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        if (carrito.length === 0) return;
        
        if (!aceptoTerminos) {
            mostrarAviso("Debes aceptar los Términos y Condiciones para continuar.", "advertencia");
            return;
        }
        if (!nombreCliente.trim() || !telefonoCliente.trim()) {
            mostrarAviso("Por favor, ingresa tu nombre y número de teléfono.", "advertencia");
            return;
        }
        if (tipoEntrega === 'Envío a domicilio' && !direccionCliente.trim()) {
            mostrarAviso("Ingresa la dirección completa para el envío a domicilio.", "advertencia");
            return;
        }

        let mensaje = `✨ *NUEVA ORDEN - NICAPLUS GAMING* ✨\n\n👤 *CLIENTE*\n▪️ *Nombre:* ${nombreCliente.trim()}\n▪️ *Teléfono:* ${telefonoCliente.trim()}\n▪️ *Entrega:* ${tipoEntrega}\n`;
        if (tipoEntrega === 'Envío a domicilio') mensaje += `📍 *Dirección:* ${direccionCliente.trim()}\n`;
        mensaje += `💳 *Pago:* ${metodoPago}\n\n🛒 *DETALLE*\n`;

        carrito.forEach(item => {
            const precio = item.variacionSeleccionada ? item.variacionSeleccionada.precioVenta : item.producto.precioVenta;
            const descVariante = item.variacionSeleccionada ? ` [${item.variacionSeleccionada.nombreVariacion}]` : '';
            mensaje += `🔹 *${item.cantidad}x* ${item.producto.nombre}${descVariante} (C$ ${precio.toLocaleString('es-NI')})\n`;
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

    const estaBuscando = useMemo(() => busqueda.trim().length > 0, [busqueda]);

    const productosFiltrados = useMemo(() => {
        if (!Array.isArray(productos)) return [];

        const catSeleccionada = categorias.find(c => c.id === idCatSeleccionada);
        const nombreCatFiltro = catSeleccionada ? catSeleccionada.nombre.toLowerCase().trim() : null;

        const juegoSeleccionado = juegos.find(j => j.id === idJuegoSeleccionado);
        const nombreJuegoFiltro = juegoSeleccionado ? juegoSeleccionado.nombre.toLowerCase().trim() : null;

        return productos.filter((p: any) => {
            const nombreProd = (p.nombre || '').toLowerCase();
            const descProd = (p.descripcion || '').toLowerCase();
            const termino = busqueda.toLowerCase().trim();
            
            const cumpleBusqueda = termino === '' || nombreProd.includes(termino) || descProd.includes(termino);

            if (estaBuscando) {
                return cumpleBusqueda;
            }

            const catProducto = (p.categoriaNombre || '').toLowerCase().trim();
            const cumpleCategoria = idCatSeleccionada === null || idCatSeleccionada === undefined
                ? true
                : (catProducto !== '' && catProducto === nombreCatFiltro);

            const juegoProducto = (p.juegoNombre || '').toLowerCase().trim();
            const cumpleJuego = idJuegoSeleccionado === null || idJuegoSeleccionado === undefined
                ? true
                : (juegoProducto !== '' && juegoProducto === nombreJuegoFiltro);

            return cumpleBusqueda && cumpleCategoria && cumpleJuego;
        });
    }, [productos, busqueda, estaBuscando, idCatSeleccionada, idJuegoSeleccionado, categorias, juegos]);

    const totalCarritoItems = useMemo(() => carrito.reduce((sum, i) => sum + i.cantidad, 0), [carrito]);

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

    const limpiarBusqueda = () => {
        setBusqueda('');
    };

    return (
        <div className={styles.mainWrapper}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />

            {/* SISTEMA DE TOAST NOTIFICACIONES */}
            {notificacion && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    left: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: notificacion.tipo === 'error' ? '#3f0d12' : notificacion.tipo === 'exito' ? '#0d3f1a' : '#2d1b00',
                    color: '#fff',
                    borderLeft: `4px solid ${notificacion.tipo === 'error' ? '#ff4d4d' : notificacion.tipo === 'exito' ? '#00ff66' : '#ffb700'}`,
                    padding: '12px 18px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                    animation: 'slideInToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    maxWidth: '400px',
                    margin: '0 auto'
                }}>
                    {notificacion.tipo === 'error' && <FaExclamationTriangle style={{ color: '#ff4d4d', flexShrink: 0 }} size={18} />}
                    {notificacion.tipo === 'exito' && <FaCheckCircle style={{ color: '#00ff66', flexShrink: 0 }} size={18} />}
                    {notificacion.tipo === 'advertencia' && <FaExclamationTriangle style={{ color: '#ffb700', flexShrink: 0 }} size={18} />}
                    {notificacion.tipo === 'info' && <FaInfo style={{ color: '#00bfff', flexShrink: 0 }} size={18} />}
                    <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>{notificacion.mensaje}</span>
                    <button 
                        onClick={() => setNotificacion(null)}
                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '0 4px', marginLeft: 'auto' }}
                        aria-label="Cerrar notificación"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideInToast {
                    from { transform: translateY(-30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .mobile-bottom-nav {
                    display: none;
                }
                @media (max-width: 768px) {
                    .mobile-bottom-nav {
                        display: flex;
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 62px;
                        background: rgba(13, 8, 24, 0.95);
                        backdrop-filter: blur(16px);
                        border-top: 1px solid rgba(176, 2, 194, 0.3);
                        z-index: 990;
                        justify-content: space-around;
                        align-items: center;
                        padding: 0 10px;
                        box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
                    }
                    .mobile-bottom-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background: transparent;
                        border: none;
                        color: #94a3b8;
                        font-size: 0.7rem;
                        gap: 3px;
                        flex: 1;
                        padding: 6px 0;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .mobile-bottom-item.active {
                        color: #00e5ff;
                        font-weight: bold;
                    }
                }
            `}</style>

            {/* OVERLAY & SIDEBAR MÓVIL */}
            {menuAbierto && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[998] transition-opacity duration-300 lg:hidden"
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
                            <FaShoppingCart size={15} /> 
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
                            {busqueda && (
                                <button 
                                    onClick={limpiarBusqueda} 
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', paddingRight: '10px' }}
                                    aria-label="Limpiar búsqueda"
                                >
                                    <FaTimes size={13} />
                                </button>
                            )}
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
                                
                                {/* COLUMNA IZQUIERDA: COMPONENTE SIDEBAR (OCULTO EN FILTRADO ACTIVO) */}
                                {!estaBuscando && (
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
                                )}

                                {/* COLUMNA DERECHA */}
                                <div className={styles.catalogoMainContent} style={estaBuscando ? { width: '100%', maxWidth: '100%' } : {}}>
                                    
                                    {/* SECCIÓN DE ANUNCIOS DINÁMICOS (SÓLO SI NO HAY BÚSQUEDA) */}
                                    {!estaBuscando && (
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
                                                        onClick={(e) => {
                                                            if (productoPrincipal.tieneVariaciones) {
                                                                manejarVerDetalle(productoPrincipal);
                                                            } else {
                                                                agregarAlCarrito(productoPrincipal, null, e);
                                                            }
                                                        }}
                                                    >
                                                        COMPRAR POR {calcularRangoPrecios(productoPrincipal)}
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
                                                {productosSecundarios.map((prod: Producto, index: number) => {
                                                    const hayStockProd = prod.esDigital || prod.stockActual > 0;
                                                    return (
                                                        <div 
                                                            key={prod.id} 
                                                            className={`${styles.sideBanner} ${index === 0 ? styles.sideBannerTop : styles.sideBannerBottom}`}
                                                        >
                                                            <div className={styles.sideBannerContent}>
                                                                <span className={styles.sideTag}>
                                                                    {prod.esDigital ? "ENTREGA INMEDIATA" : (hayStockProd ? "STOCK DISPONIBLE" : "AGOTADO")}
                                                                </span>
                                                                <h3 onClick={() => manejarVerDetalle(prod)} style={{cursor: 'pointer'}}>
                                                                    {prod.nombre}
                                                                </h3>
                                                                <p>¡Por solo {calcularRangoPrecios(prod)}!</p>
                                                                <button 
                                                                    className={styles.sideLink} 
                                                                    disabled={!hayStockProd}
                                                                    onClick={(e) => {
                                                                        if (prod.tieneVariaciones) {
                                                                            manejarVerDetalle(prod);
                                                                        } else {
                                                                            agregarAlCarrito(prod, null, e);
                                                                        }
                                                                    }}
                                                                >
                                                                    {prod.tieneVariaciones ? "Ver Opciones" : (hayStockProd ? "Añadir al carrito" : "Agotado")}
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
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    )}

                                    {/* BURBUJAS (FILTROS RÁPIDOS) - SE OCULTAN AL BUSCAR */}
                                    {!estaBuscando && (
                                        <div className={styles.filterSectionContainer}>
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
                                    )}
                                    
                                    {/* ENCABEZADO DE RESULTADOS DE BÚSQUEDA */}
                                    <div className={styles.productsHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h2 className={styles.productsHeaderTitle}>
                                            {estaBuscando ? `Resultados para "${busqueda}"` : 'Productos Disponibles'}
                                        </h2>
                                        {estaBuscando && (
                                            <button 
                                                onClick={limpiarBusqueda}
                                                style={{
                                                    background: '#2e004f',
                                                    color: '#e100ff',
                                                    border: '1px solid #32003e',
                                                    borderRadius: '20px',
                                                    padding: '6px 14px',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FaTimes /> Ver todo el catálogo
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* CUADRÍCULA DE PRODUCTOS */}
                                    {productosFiltrados.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px dashed #334155', margin: '1rem 0' }}>
                                            <FaSearch size={44} style={{ opacity: 0.3, marginBottom: '1rem', color: '#38bdf8' }} />
                                            <p style={{ fontSize: '1.1rem', color: '#e2e8f0', margin: '0 0 6px 0' }}>No encontramos coincidencias para "{busqueda}"</p>
                                            <small style={{ color: '#64748b' }}>Prueba con términos más generales o limpia la búsqueda.</small>
                                            <div style={{ marginTop: '16px' }}>
                                                <button 
                                                    onClick={limpiarBusqueda}
                                                    style={{ background: '#7a0090', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Restablecer Catálogo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.productsGrid}>
                                            {productosFiltrados.map((prod: Producto) => {
                                                const tieneVariaciones = Boolean(prod.tieneVariaciones && prod.variaciones && prod.variaciones.length > 0);
                                                const hayStock = prod.esDigital || prod.stockActual > 0;

                                                return (
                                                    <div key={prod.id} className={styles.productCard}>
                                                        <div className={styles.imageWrapper} onClick={() => manejarVerDetalle(prod)} style={{ cursor: 'pointer', position: 'relative' }}>
    
                                                            {/* BADGES SUPERIORES ALINEADOS EN FILA SIN SOLAPAMIENTO */}
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '8px',
                                                                left: '8px',
                                                                right: '8px',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                zIndex: 5,
                                                                pointerEvents: 'none'
                                                            }}>
                                                                {/* Tipo de Producto (Físico / Digital) */}
                                                                <span style={{
                                                                    background: prod.esDigital ? '#581c7e' : '#047688',
                                                                    color: '#fff',
                                                                    fontSize: '0.68rem',
                                                                    fontWeight: 800,
                                                                    padding: '3px 8px',
                                                                    borderRadius: '6px',
                                                                    textTransform: 'uppercase',
                                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                                    letterSpacing: '0.3px'
                                                                }}>
                                                                    {prod.esDigital ? "Digital" : "Físico"}
                                                                </span>

                                                                {/* Badge de Variantes si aplica */}
                                                                {tieneVariaciones && (
                                                                    <span style={{
                                                                        background: '#f59e0b',
                                                                        color: '#000',
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: 800,
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '3px'
                                                                    }}>
                                                                        <FaPalette size={10} /> Variantes
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* INDICADOR DE STOCK EN TIENDA INFERIOR DERECHO */}
                                                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 5, pointerEvents: 'none' }}>
                                                                {hayStock ? (
                                                                    <span style={{
                                                                        background: 'rgba(16, 185, 129, 0.95)',
                                                                        color: '#fff',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 800,
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                                                                    }}>
                                                                        {!prod.esDigital ? `${prod.stockActual} u.` : 'Disponible'}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{
                                                                        background: 'rgba(239, 68, 68, 0.95)',
                                                                        color: '#fff',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 800,
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                                                                    }}>
                                                                        Agotado
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {prod.imagenUrl ? (
                                                                <img src={prod.imagenUrl} alt={prod.nombre} className={styles.productImage} loading="lazy" />
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
                                                                <span className={styles.productPrice}>
                                                                    {calcularRangoPrecios(prod)}
                                                                </span>
                                                                <button 
                                                                    className={styles.addCartBtn}
                                                                    disabled={!hayStock}
                                                                    onClick={(e) => {
                                                                        if (tieneVariaciones) {
                                                                            manejarVerDetalle(prod);
                                                                        } else {
                                                                            agregarAlCarrito(prod, null, e);
                                                                        }
                                                                    }}
                                                                    title={tieneVariaciones ? "Seleccionar variación" : "Añadir al carrito"}
                                                                    aria-label={`Añadir ${prod.nombre} al carrito`}
                                                                >
                                                                    {tieneVariaciones ? <FaPalette size={13} /> : <FaShoppingCart size={13} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                carrito={carrito}
                            />
                        )}

                        {/* VISTA DEL CARRITO */}
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

            {/* BARRA DE NAVEGACIÓN INFERIOR PARA MÓVILES */}
            <nav className="mobile-bottom-nav">
                <button 
                    onClick={() => cambiarSeccion('inicio')} 
                    className={`mobile-bottom-item ${seccionActiva === 'inicio' ? 'active' : ''}`}
                >
                    <FaHome size={18} />
                    <span>Inicio</span>
                </button>
                <button 
                    onClick={() => cambiarSeccion('productos')} 
                    className={`mobile-bottom-item ${seccionActiva === 'productos' ? 'active' : ''}`}
                >
                    <FaStore size={18} />
                    <span>Tienda</span>
                </button>
                <button 
                    id="mobile-bottom-cart-btn"
                    onClick={() => cambiarSeccion('carrito')} 
                    className={`mobile-bottom-item ${seccionActiva === 'carrito' ? 'active' : ''}`}
                    style={{ position: 'relative' }}
                >
                    <FaShoppingCart size={18} />
                    {totalCarritoItems > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '25%',
                            background: '#f43f5e',
                            color: '#fff',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            padding: '1px 5px',
                            borderRadius: '10px'
                        }}>
                            {totalCarritoItems}
                        </span>
                    )}
                    <span>Carrito</span>
                </button>
                <button 
                    onClick={() => cambiarSeccion('contacto')} 
                    className={`mobile-bottom-item ${seccionActiva === 'contacto' ? 'active' : ''}`}
                >
                    <FaMapMarkerAlt size={18} />
                    <span>Ubicación</span>
                </button>
            </nav>

            {/* FOOTER */}
            <footer className={styles.footer} style={{ paddingBottom: '70px' }}>
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