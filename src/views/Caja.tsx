import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaTh, FaList, FaMoneyBillWave, FaTrashAlt, FaShoppingCart, FaUser, FaSearch, FaTimes } from 'react-icons/fa';

interface Producto {
    id: number;
    nombre: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    requiereServicio: boolean;
}

interface ItemCarrito {
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    precioCostoUnitario: number;
    subTotal: number;
    metadataDigital: string;
}

export const imprimirTicketTermico = (datosVenta: any) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const contenidoTicket = `
        <html>
        <head>
            <title>Factura Nicaplus</title>
            <style>
                @page { margin: 0; }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: 200px; 
                    margin: 10px;
                    font-size: 11px;
                    color: #000;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .linea { border-bottom: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; border-collapse: collapse; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <strong>NICAPLUS GAMING</strong><br>
                Tienda Digital y Taller Técnico<br>
                León, Nicaragua<br>
                Tel: +505 8888-8888
            </div>
            <div class="linea"></div>
            <div>
                Factura: #000${datosVenta.ventaId || 1}<br>
                Fecha: ${new Date().toLocaleDateString()}<br>
                Atendió: Personal Autorizado
            </div>
            <div class="linea"></div>
            <table>
                <thead>
                    <tr>
                        <th align="left">Cant/Desc</th>
                        <th align="right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${datosVenta.detalles.map((item: any) => `
                        <tr>
                            <td>${item.cantidad}x ${item.nombre.substring(0, 15)}</td>
                            <td align="right">C$ ${item.subTotal}</td>
                        </tr>
                        ${item.metadataDigital ? `<tr><td colspan="2" style="font-size:9px; padding-left:10px; color:#555;">ID: ${item.metadataDigital}</td></tr>` : ''}
                    `).join('')}
                </tbody>
            </table>
            <div class="linea"></div>
            <div class="text-right">
                <strong>Total: C$ ${datosVenta.detalles.reduce((sum: number, i: any) => sum + i.subTotal, 0)}</strong>
            </div>
            <div class="linea"></div>
            <div class="text-center" style="margin-top:15px;">
                ¡Gracias por tu preferencia!<br>
                Soporte y Garantía de Calidad.
            </div>
            <script>
                window.onload = function() { 
                    window.print(); 
                    setTimeout(function() { window.close(); }, 500); 
                }
            </script>
        </body>
        </html>
    `;

    ventanaImpresion.document.write(contenidoTicket);
    ventanaImpresion.document.close();
};

export const Caja: React.FC = () => {
    const { usuario } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
    const [listaClientes, setListaClientes] = useState<any[]>([]);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [vistaModo, setVistaModo] = useState<'cuadricula' | 'lista'>('cuadricula');

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');

    useEffect(() => {
        api.get('/products')
            .then(res => setProductos(res.data))
            .catch(err => console.error(err));
            
        api.get('/clientes')
            .then(res => setListaClientes(res.data))
            .catch(err => console.error(err));
    }, []);

    const productosFiltrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
    );

    const clientesFiltrados = listaClientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        c.telefono.includes(busquedaCliente)
    );

    const totalVenta = carrito.reduce((sum, item) => sum + item.subTotal, 0);
    const totalCostoVenta = carrito.reduce((sum, item) => sum + (item.precioCostoUnitario * item.cantidad), 0);
    const margenGananciaTotal = totalVenta - totalCostoVenta;

    const agregarAlCarrito = (producto: Producto) => {
        const existe = carrito.find(item => item.idProducto === producto.id);

        if (existe) {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual <= existe.cantidad) {
                alert("No hay suficiente stock en inventario.");
                return;
            }
            setCarrito(carrito.map(item => 
                item.idProducto === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1, subTotal: (item.cantidad + 1) * item.precioUnitario }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                idProducto: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: producto.precioVenta,
                precioCostoUnitario: producto.precioCosto,
                subTotal: producto.precioVenta,
                metadataDigital: ''
            }]);
        }
    };

    // NUEVO: Modificar cantidad de forma manual mediante input numérico
    const cambiarCantidadManual = (idProducto: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;

        const itemOriginal = carrito.find(item => item.idProducto === idProducto);
        const productoBase = productos.find(p => p.id === idProducto);

        if (!itemOriginal || !productoBase) return;

        // Validar stock si el rubro es un artículo físico
        if (!productoBase.esDigital && !productoBase.requiereServicio && productoBase.stockActual < nuevaCantidad) {
            alert(`Acción denegada: El stock disponible para este artículo es de ${productoBase.stockActual} unidades.`);
            return;
        }

        setCarrito(carrito.map(item => 
            item.idProducto === idProducto 
                ? { ...item, cantidad: nuevaCantidad, subTotal: nuevaCantidad * item.precioUnitario }
                : item
            ));
    };

    // NUEVO: Remover un producto específico de la lista sin limpiar la orden completa
    const eliminarDelCarrito = (idProducto: number) => {
        setCarrito(carrito.filter(item => item.idProducto !== idProducto));
    };

    const actualizarMetadata = (idProducto: number, valor: string) => {
        setCarrito(carrito.map(item => 
            item.idProducto === idProducto ? { ...item, metadataDigital: valor } : item
        ));
    };

    const limpiarCarrito = () => setCarrito([]);

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const faltaMetadata = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return p?.esDigital && !item.metadataDigital.trim();
        });

        if (faltaMetadata) {
            alert("Error: Debe ingresar el ID del jugador para todos los productos digitales.");
            return;
        }

        const detallesMapeados = carrito.map(item => ({
            idProducto: item.idProducto,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subTotal: item.subTotal,
            metadataDigital: item.metadataDigital || ''
        }));

        const payload = {
            idUsuario: usuario?.id || 1,
            idCliente: idClienteSeleccionado === 0 ? null : idClienteSeleccionado, 
            metodoPago: metodoPago,
            fechaVenta: new Date(fechaVenta + "T12:00:00"), 
            total: totalVenta,
            detalles: detallesMapeados
        };

        try {
            const res = await api.post('/ventas', payload);
            alert("Venta completada con éxito. Stock actualizado.");
            
            imprimirTicketTermico({ ventaId: res.data.id || res.data.ventaId, detalles: carrito });
            limpiarCarrito();
            
            const hoy = new Date().toISOString().split('T')[0];
            setFechaVenta(hoy);

            const refreshRes = await api.get('/products');
            setProductos(refreshRes.data);
        } catch (err: any) {
            alert(err.response?.data || "Error al procesar la venta.");
        }
    };

    const selectEstilo = { width: '100%', padding: '8px', background: '#0f172a', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' as const };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', padding: '4px', width: '100%', boxSizing: 'border-box', color: '#FFFFFF', fontFamily: 'sans-serif' }}>
            
            <style>{`
                @media (min-width: 1024px) {
                    div[data-role="caja-wrapper"] { grid-template-columns: 1.6fr 1fr !important; }
                    .productos-panel, .carrito-panel { height: calc(100vh - 55px) !important; }
                }
            `}</style>

            <div data-role="caja-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', width: '100%' }}>
                
                {/* PANEL IZQUIERDO: PRODUCTOS */}
                <div className="productos-panel" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', minHeight: '450px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem', fontWeight: 700 }}>Inventario Disponible</h3>
                        <div style={{ display: 'flex', gap: '4px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                            <button onClick={() => setVistaModo('cuadricula')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: vistaModo === 'cuadricula' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                <FaTh /> Cuadrícula
                            </button>
                            <button onClick={() => setVistaModo('lista')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: vistaModo === 'lista' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                <FaList /> Lista
                            </button>
                        </div>
                    </div>

                    {/* Buscador de productos */}
                    <div style={{ position: 'relative', marginBottom: '14px' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar producto por nombre..." 
                            value={busquedaProducto} 
                            onChange={e => setBusquedaProducto(e.target.value)} 
                            style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f172a', color: '#FFFFFF', borderRadius: '8px', border: '1px solid #334155', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' }} 
                        />
                    </div>

                    {/* Contenedor de renderizado con scroll dedicado */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '550px', paddingRight: '4px' }}>
                        {vistaModo === 'cuadricula' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                {productosFiltrados.map(p => (
                                    <div key={p.id} onClick={() => agregarAlCarrito(p)} style={{ padding: '10px', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', background: '#0f172a', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                                         onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c084fc'}
                                         onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}>
                                        
                                        <div style={{ width: '100%', height: '80px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                                            {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>SIN FOTO</div>}
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#FFFFFF' }}>{p.nombre}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.9rem' }}>C$ {p.precioVenta}</span>
                                                <small style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 'bold' }}>+C$ {p.precioVenta - p.precioCosto}</small>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: '1px solid #223249', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: p.esDigital ? '#581c7e' : p.requiereServicio ? '#047688' : '#334155', color: '#FFFFFF', fontWeight: 'bold' }}>
                                                {p.esDigital ? "Digital" : p.requiereServicio ? "Servicio" : "Físico"}
                                            </span>
                                            {!p.esDigital && !p.requiereServicio && (
                                                <small style={{ color: p.stockActual <= 3 ? '#ef4444' : '#94a3b8', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                    Cant: {p.stockActual}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {productosFiltrados.map(p => (
                                    <div key={p.id} onClick={() => agregarAlCarrito(p)} style={{ padding: '8px 12px', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxSizing: 'border-box', gap: '10px' }}
                                         onMouseEnter={(e) => e.currentTarget.style.borderColor = '#c084fc'}
                                         onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', width: '70%' }}>
                                            <div style={{ width: '36px', height: '36px', background: '#1e293b', borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155', flexShrink: 0 }}>
                                                {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.55rem', color: '#64748b' }}>N/A</div>}
                                            </div>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <strong style={{ fontSize: '0.85rem', color: '#FFFFFF', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</strong>
                                                <small style={{ color: p.esDigital ? '#c084fc' : p.requiereServicio ? '#38bdf8' : '#94a3b8', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                    {p.esDigital ? "Digital" : p.requiereServicio ? "Servicio Técnico" : `Disponibles: ${p.stockActual}`}
                                                </small>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.95rem' }}>C$ {p.precioVenta}</div>
                                            <small style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.7rem' }}>+C$ {p.precioVenta - p.precioCosto}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL DERECHO: CARRITO Y ACCIONES CONTABLES */}
                <div className="carrito-panel" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '450px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', height: '45%', minHeight: '180px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 700 }}>
                                <FaShoppingCart style={{ color: '#38bdf8' }} /> Resumen de Orden
                            </h4>
                            {carrito.length > 0 && (
                                <button onClick={limpiarCarrito} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    <FaTrashAlt /> Vaciar
                                </button>
                            )}
                        </div>
                        
                        {/* Lista Carrito con Scroll Independiente */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            {carrito.length === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', padding: '20px 0' }}>
                                    <FaShoppingCart size={24} style={{ marginBottom: '6px', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: '0.8rem' }}>El carrito está vacío.</p>
                                </div>
                            )}
                            {carrito.map(item => {
                                const esDigital = productos.find(p => p.id === item.idProducto)?.esDigital;
                                return (
                                    <div key={item.idProducto} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                            
                                            {/* Sección izquierda de la línea del carrito */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '70%', overflow: 'hidden' }}>
                                                {/* MEJORA 2: Botón individual para remover este item */}
                                                <button 
                                                    onClick={() => eliminarDelCarrito(item.idProducto)} 
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                    title="Quitar artículo"
                                                >
                                                    <FaTimes size={12} />
                                                </button>

                                                {/* MEJORA 1: Input numérico directo para editar cantidad */}
                                                <input 
                                                    type="number" 
                                                    value={item.cantidad} 
                                                    min={1}
                                                    onChange={(e) => cambiarCantidadManual(item.idProducto, Number(e.target.value))}
                                                    style={{ width: '50px', padding: '4px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', outline: 'none' }} 
                                                />

                                                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.nombre}
                                                </span>
                                            </div>

                                            <strong style={{ fontSize: '0.9rem', color: '#FFFFFF', flexShrink: 0 }}>C$ {item.subTotal}</strong>
                                        </div>
                                        {esDigital && (
                                            <input 
                                                type="text" 
                                                placeholder="ID del Jugador (Obligatorio)" 
                                                value={item.metadataDigital}
                                                onChange={(e) => actualizarMetadata(item.idProducto, e.target.value)}
                                                style={{ marginTop: '6px', width: '100%', padding: '6px 10px', background: '#0f172a', border: '1px solid #ef4444', borderRadius: '6px', color: '#FFFFFF', outline: 'none', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Métricas e Inyecciones de Venta */}
                    <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                        
                        {/* Selector de Cliente */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                <FaUser size={10} /> Cliente Asociado
                            </label>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar por nombre o móvil..." 
                                value={busquedaCliente}
                                onChange={e => setBusquedaCliente(e.target.value)}
                                style={{ width: '100%', padding: '6px 10px', background: '#0f172a', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', marginBottom: '4px', boxSizing: 'border-box' }}
                            />
                            <select 
                                value={idClienteSeleccionado || 0} 
                                onChange={e => {
                                    setIdClienteSeleccionado(Number(e.target.value));
                                    const selectText = e.target.options[e.target.selectedIndex].text;
                                    if(Number(e.target.value) !== 0) setBusquedaCliente(selectText.split(' (')[0]);
                                }} 
                                style={selectEstilo}
                            >
                                <option value={0}>Venta de Mostrador (Genérico)</option>
                                {clientesFiltrados.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                ))}
                            </select>
                        </div>

                        {/* Método de Pago */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Método de Pago
                            </label>
                            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={selectEstilo}>
                                <option value="Efectivo">💵 Efectivo</option>
                                <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                <option value="Tarjeta">💳 Tarjeta</option>
                            </select>
                        </div>

                        {/* Fecha de Emisión */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Fecha de Facturación
                            </label>
                            <input 
                                type="date" 
                                value={fechaVenta} 
                                onChange={e => setFechaVenta(e.target.value)} 
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#0f172a',
                                    color: '#FFFFFF',
                                    border: '1px solid #334155',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }} 
                            />
                        </div>

                        {/* Caja de Utilidad Dinámica */}
                        {carrito.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid #c084fc', fontSize: '0.8rem' }}>
                                <FaMoneyBillWave style={{ color: '#c084fc', flexShrink: 0 }} />
                                <span>Utilidad: <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>C$ {margenGananciaTotal}</strong></span>
                            </div>
                        )}

                        {/* Totales Reales */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#FFFFFF' }}>Monto Total:</span>
                            <strong style={{ color: '#38bdf8', fontSize: '1.35rem', fontWeight: '900' }}>C$ {totalVenta}</strong>
                        </div>

                        {/* Botón de Acción Principal */}
                        <button 
                            onClick={finalizarVenta} 
                            disabled={carrito.length === 0} 
                            style={{ width: '100%', padding: '12px', backgroundColor: carrito.length === 0 ? '#334155' : '#581c7e', color: carrito.length === 0 ? '#64748b' : '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background 0.2s, transform 0.1s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                            onMouseDown={(e) => { if(carrito.length > 0) e.currentTarget.style.transform = 'scale(0.98)'; }}
                            onMouseUp={(e) => { if(carrito.length > 0) e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            Procesar Factura
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};