import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaTh, FaList, FaMoneyBillWave, FaTrashAlt, FaShoppingCart, FaUser, FaSearch, FaTimes, FaCalendarAlt, FaWhatsapp, FaPrint, FaCheckCircle } from 'react-icons/fa';

interface Producto {
    id: number;
    nombre: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    requiereServicio: boolean;
    esSuscripcion: boolean;
}

interface ItemCarrito {
    idProducto: number;
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    precioCostoUnitario: number;
    subTotal: number;
    metadataDigital: string;
    diasSuscripcion: number;
}

export const imprimirTicketTermico = (datosVenta: any) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
        alert("Permita los elementos emergentes para poder emitir el ticket físico.");
        return;
    }

    const contenidoTicket = `
        <!DOCTYPE html>
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
                            <td>${item.cantidad}x ${(item.nombre || 'Producto').substring(0, 15)}</td>
                            <td align="right">C$ ${item.subTotal}</td>
                        </tr>
                        ${item.metadataDigital ? `<tr><td colspan="2" style="font-size:9px; padding-left:10px; color:#555; word-break: break-all;">${item.metadataDigital}</td></tr>` : ''}
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
        </body>
        </html>
    `;

    ventanaImpresion.document.open();
    ventanaImpresion.document.write(contenidoTicket);
    ventanaImpresion.document.close();

    ventanaImpresion.focus();
    ventanaImpresion.setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 250);
};

export const Caja: React.FC = () => {
    const { usuario } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]);
    
    const [fechaVencimientoCredito, setFechaVencimientoCredito] = useState(
        new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );

    const [listaClientes, setListaClientes] = useState<any[]>([]);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [vistaModo, setVistaModo] = useState<'cuadricula' | 'lista'>('cuadricula');

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');

    const [mostrarModalDespacho, setMostrarModalDespacho] = useState(false);
    const [datosUltimaVenta, setDatosUltimaVenta] = useState<any>(null);

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
                metadataDigital: '',
                diasSuscripcion: (producto as any).diasDuracion || 30
            }]);
        }
    };

    const cambiarCantidadManual = (idProducto: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;

        const itemOriginal = carrito.find(item => item.idProducto === idProducto);
        const productoBase = productos.find(p => p.id === idProducto);

        if (!itemOriginal || !productoBase) return;

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

    const actualizarDiasItemCarrito = (idProducto: number, dias: number) => {
        if (dias < 1) return;
        setCarrito(carrito.map(item => 
            item.idProducto === idProducto ? { ...item, diasSuscripcion: dias } : item
        ));
    };

    const eliminarDelCarrito = (idProducto: number) => {
        setCarrito(carrito.filter(item => item.idProducto !== idProducto));
    };

    const actualizarMetadata = (idProducto: number, valor: string) => {
        setCarrito(carrito.map(item => 
            item.idProducto === idProducto ? { ...item, metadataDigital: valor } : item
        ));
    };

    const limpiarCarrito = () => setCarrito([]);

    const enviarCredencialesWhatsApp = () => {
        if (!datosUltimaVenta || !datosUltimaVenta.detalles) return;

        const clienteObj = listaClientes.find(c => c.id === idClienteSeleccionado);
        if (!clienteObj || !clienteObj.telefono) {
            alert("El cliente seleccionado no dispone de un número de teléfono móvil válido.");
            return;
        }

        const telefonoLimpio = clienteObj.telefono.replace(/[^0-9]/g, '');
        const esVentaCredito = metodoPago === "Crédito";

        // 1. Encabezado del Comprobante Digital
        let mensaje = `*NICAPLUS GAMING & TECH*\n`;
        mensaje += `👋 ¡Hola, ${clienteObj.nombre}! Muchas gracias por tu confianza.\n`;
        mensaje += `🧾 *COMPROBANTE DIGITAL DE COMPRA*\n`;
        mensaje += `Factura: #000${datosUltimaVenta.ventaId}\n`;
        mensaje += `Fecha: ${new Date(fechaVenta + "T12:00:00").toLocaleDateString()}\n`;
        mensaje += `Condición: *${metodoPago.toUpperCase()}*\n`;
        mensaje += `--------------------------------------\n\n`;

        mensaje += `🔑 *DATOS DE ACCESO Y SERVICIOS*:\n\n`;

        // 2. Desglose recorriendo los datos reales que devolvió el Backend
        datosUltimaVenta.detalles.forEach((item: any, idx: number) => {
            mensaje += `*${idx + 1}. ${item.nombre || 'Servicio Digital'}*\n`;
            mensaje += `🔹 Cantidad: ${item.cantidad}\n`;
            
            if (item.metadataDigital) {
                // Evaluamos si contiene el formato estructurado de días o credenciales crudas
                if (item.metadataDigital.includes("DIAS:")) {
                    // Filtramos el prefijo de días si el backend concatenó los días de la suscripción
                    const partes = item.metadataDigital.split('|');
                    const accesosReales = partes.slice(1).join('|');
                    mensaje += `👤 Acceso/ID: _${accesosReales || 'Asignado en Servidor'}_\n`;
                } else {
                    mensaje += `👤 Acceso/ID: _${item.metadataDigital}_\n`;
                }
            }

            // Recuperar los días de suscripción calculados
            const diasSuscripcion = item.diasSuscripcion || 30;
            const fInicio = new Date(fechaVenta + "T12:00:00");
            const fVence = new Date(fInicio.getTime() + (diasSuscripcion * 24 * 60 * 60 * 1000));
            
            mensaje += `📅 Vigencia: ${diasSuscripcion} días\n`;
            mensaje += `🛑 Vence el: *${fVence.toLocaleDateString()}*\n`;
            mensaje += `--------------------------------------\n`;
        });

        // 3. Totales y Estado de Cuentas
        mensaje += `\n💰 *RESUMEN FINANCIERO*:\n`;
        mensaje += `Total Neto: *C$ ${totalVenta}*\n`;
        
        if (esVentaCredito) {
            mensaje += `⚠️ *ESTADO:* Cuenta por cobrar pendiente.\n`;
            mensaje += `📅 *LÍMITE DE PAGO:* ${new Date(fechaVencimientoCredito + "T12:00:00").toLocaleDateString()}\n`;
        } else {
            mensaje += `✅ *ESTADO:* Factura Cancelada / Pagada.\n`;
        }

        mensaje += `\n📌 *INFORMACIÓN OPERATIVA*:\n`;
        mensaje += `• Las caídas de perfiles o contraseñas deben reportarse inmediatamente con captura de pantalla.\n`;
        mensaje += `• Nuestro sistema te enviará un recordatorio automático *7, 3 y 1 día antes* de tu vencimiento para evitar cortes de pantalla.\n\n`;
        mensaje += `¡Disfruta tu servicio de entretenimiento! 🎮✨`;

        const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');
    };

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

        const llevaSuscripcion = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return p?.esSuscripcion;
        });

        if ((llevaSuscripcion || metodoPago === "Crédito") && (!idClienteSeleccionado || idClienteSeleccionado === 0)) {
            alert("Operación Denegada: Las ventas al crédito o configuradas como Suscripción requieren obligatoriamente asociar un cliente real con datos verificables.");
            return;
        }

        const detallesMapeados = carrito.map(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            const metaFinal = p?.esSuscripcion 
                ? `DIAS:${item.diasSuscripcion}|${item.metadataDigital}` 
                : item.metadataDigital;

            return {
                idProducto: item.idProducto,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subTotal: item.subTotal,
                metadataDigital: metaFinal || ''
            };
        });

        const payload = {
            idUsuario: usuario?.id || 1,
            idCliente: idClienteSeleccionado === 0 ? null : idClienteSeleccionado, 
            metodoPago: metodoPago,
            fechaVenta: new Date(fechaVenta + "T12:00:00"), 
            total: totalVenta,
            detalles: detallesMapeados,
            fechaVencimientoCreditoManual: metodoPago === "Crédito" ? new Date(fechaVencimientoCredito + "T12:00:00") : null
        };

        try {
            const res = await api.post('/ventas', payload);

            const detallesParaTicket = (res.data.detalles || detallesMapeados).map((item: any) => {
                const prodOriginal = productos.find(p => p.id === item.idProducto);
                const itemCarritoOriginal = carrito.find(c => c.idProducto === item.idProducto);
                return {
                    ...item,
                    nombre: prodOriginal ? prodOriginal.nombre : "Producto General",
                    diasSuscripcion: itemCarritoOriginal ? itemCarritoOriginal.diasSuscripcion : 30
                };
            });

            setDatosUltimaVenta({
                ventaId: res.data.id || res.data.ventaId,
                detalles: detallesParaTicket
            });

            setMostrarModalDespacho(true);

            // Limpieza y reseteo regular de la caja POS se mantiene activo tras confirmación
            const hoy = new Date().toISOString().split('T')[0];
            setFechaVenta(hoy);
            setFechaVencimientoCredito(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

            const refreshRes = await api.get('/products');
            setProductos(refreshRes.data);

        } catch (err: any) {
            console.error(err);
            alert(err.response?.data || "Error en el servidor al intentar procesar la venta.");
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
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
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

                                        <div style={{ borderTop: '1px solid #223249', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexWrap: 'wrap', gap: '4px' }}>
                                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: p.esDigital ? '#581c7e' : p.requiereServicio ? '#047688' : '#334155', color: '#FFFFFF', fontWeight: 'bold' }}>
                                                {p.esDigital ? "Digital" : p.requiereServicio ? "Servicio" : "Físico"}
                                            </span>
                                            {p.esSuscripcion && (
                                                <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: '#b91c1c', color: '#FFFFFF', fontWeight: 'bold' }}>
                                                    🔄 Recurrente
                                                </span>
                                            )}
                                            {!p.esDigital && !p.requiereServicio && (
                                                <small style={{ color: p.stockActual <= 3 ? '#ef4444' : '#94a3b8', fontSize: '0.65rem', fontWeight: 'bold', width: '100%', marginTop: '2px' }}>
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
                                                    {p.esSuscripcion && " | 🔄 Requiere Renovación"}
                                                </small>
                                            </div>
                                        </div>
                                        <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '0.95rem' }}>C$ {p.precioVenta}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL DERECHO: CARRITO Y ACCIONES */}
                <div className="carrito-panel" style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', minHeight: '450px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', height: '45%', minHeight: '180px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 700 }}>
                                <FaShoppingCart style={{ color: '#38bdf8' }} /> Resumen de Orden
                            </h4>
                            {carrito.length > 0 && (
                                <button onClick={limpiarCarrito} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    <FaTrashAlt /> Vaciar
                                </button>
                            )}
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                            {carrito.length === 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', padding: '20px 0' }}>
                                    <FaShoppingCart size={24} style={{ marginBottom: '6px', opacity: 0.4 }} />
                                    <p style={{ margin: 0, fontSize: '0.8rem' }}>El carrito está vacío.</p>
                                </div>
                            )}
                            {carrito.map(item => {
                                const pBase = productos.find(p => p.id === item.idProducto);
                                return (
                                    <div key={item.idProducto} style={{ padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '70%', overflow: 'hidden' }}>
                                                <button 
                                                    onClick={() => eliminarDelCarrito(item.idProducto)} 
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <FaTimes size={12} />
                                                </button>

                                                <input 
                                                    type="number" 
                                                    value={item.cantidad} 
                                                    min={1}
                                                    onChange={(e) => cambiarCantidadManual(item.idProducto, Number(e.target.value))}
                                                    style={{ width: '50px', padding: '4px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem', outline: 'none' }} 
                                                />

                                                <span style={{ fontSize: '0.85rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.nombre} {pBase?.esSuscripcion && <span style={{ color: '#ef4444' }}>(🔄)</span>}
                                                </span>
                                            </div>

                                            <strong style={{ fontSize: '0.9rem', color: '#FFFFFF', flexShrink: 0 }}>C$ {item.subTotal}</strong>
                                        </div>

                                        {pBase?.esSuscripcion && (
                                            <div style={{ marginTop: '6px', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 'bold' }}>Días vigencia:</span>
                                                <input 
                                                    type="number" 
                                                    min={1} 
                                                    value={item.diasSuscripcion} 
                                                    onChange={(e) => actualizarDiasItemCarrito(item.idProducto, Number(e.target.value))}
                                                    style={{ background: '#0f172a', color: '#fff', border: '1px solid #f43f5e', borderRadius: '4px', width: '55px', padding: '2px', textAlign: 'center', fontSize: '0.8rem', outline: 'none' }} 
                                                />
                                            </div>
                                        )}

                                        {pBase?.esDigital && (
                                            <input 
                                                type="text" 
                                                placeholder={pBase.esSuscripcion ? "Referencia/Correo Cuenta (Obligatorio)" : "ID del Jugador (Obligatorio)"} 
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
                                <option value="Crédito">🛑 Crédito (Cuenta por Cobrar)</option>
                            </select>
                        </div>

                        {metodoPago === "Crédito" && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '10px', borderRadius: '6px', border: '1px dashed #ef4444' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#f87171', marginBottom: '4px', textTransform: 'uppercase' }}>
                                    <FaCalendarAlt size={10} /> Vencimiento del Crédito
                                </label>
                                <input 
                                    type="date" 
                                    value={fechaVencimientoCredito} 
                                    onChange={e => setFechaVencimientoCredito(e.target.value)} 
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#0f172a',
                                        color: '#FFFFFF',
                                        border: '1px solid #ef4444',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }} 
                                />
                            </div>
                        )}

                        {/* Fecha de Emisión */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Fecha de Facturación
                            </label>
                            <input 
                                type="date" 
                                value={fechaVenta} 
                                onChange={e => setFechaVenta(e.target.value)} 
                                style={{ width: '100%', padding: '8px', background: '#0f172a', color: '#FFFFFF', border: '1px solid #334155', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} 
                            />
                        </div>

                        {carrito.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(192, 132, 252, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid #c084fc', fontSize: '0.8rem' }}>
                                <FaMoneyBillWave style={{ color: '#c084fc', flexShrink: 0 }} />
                                <span>Utilidad: <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>C$ {margenGananciaTotal}</strong></span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#FFFFFF' }}>Monto Total:</span>
                            <strong style={{ color: '#38bdf8', fontSize: '1.35rem', fontWeight: '900' }}>C$ {totalVenta}</strong>
                        </div>

                        <button 
                            onClick={finalizarVenta} 
                            disabled={carrito.length === 0} 
                            style={{ width: '100%', padding: '12px', backgroundColor: carrito.length === 0 ? '#334155' : '#581c7e', color: carrito.length === 0 ? '#64748b' : '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'background 0.2s, transform 0.1s', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                            Procesar Factura
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL INTERACTIVO FLOTANTE: DESPACHO INTEGRADO POST-VENTA */}
            {mostrarModalDespacho && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '90%', textAlign: 'center', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '3rem', color: '#4ade80', marginBottom: '10px' }}><FaCheckCircle /></div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>¡Transacción Guardada!</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                            La venta se registró correctamente en el sistema. Selecciona la vía de despacho de credenciales para el cliente.
                        </p>
                        
                        {/* REEMPLAZADO CON TU BLOQUE LIMPIO AQUÍ */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {idClienteSeleccionado && idClienteSeleccionado !== 0 ? (
                                <button 
                                    onClick={enviarCredencialesWhatsApp}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px', background: '#25d366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
                                >
                                    <FaWhatsapp size={18} /> Enviar Comprobante y Accesos (WhatsApp)
                                </button>
                            ) : (
                                <div style={{ background: '#334155', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Venta genérica de mostrador: No vinculada a número de WhatsApp para envío directo.
                                </div>
                            )}
                            
                            <button 
                                onClick={() => imprimirTicketTermico(datosUltimaVenta)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '10px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                                <FaPrint /> Imprimir Copia Física (Ticketera)
                            </button>

                            <button 
                                onClick={() => {
                                    setMostrarModalDespacho(false);
                                    setDatosUltimaVenta(null);
                                    limpiarCarrito(); // Asegurar limpieza total del estado local
                                }}
                                style={{ width: '100%', padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '6px', fontWeight: 'bold' }}
                            >
                                Cerrar Caja POS y Siguiente Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};