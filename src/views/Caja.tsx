import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { 
  FaTh, FaList, FaMoneyBillWave, FaTrashAlt, FaShoppingCart, FaUser, 
  FaSearch, FaTimes, FaCalendarAlt, FaWhatsapp, FaPrint, FaCheckCircle, 
  FaTags, FaThList, FaExclamationTriangle 
} from 'react-icons/fa';
import styles from '../assets/styles/Caja.module.css';

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
    categoriaId: number | null;
}

interface Categoria {
    id: number;
    nombre: string;
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
    descuento: number; 
    idCombo?: number; 
}

const escapeHtml = (unsafe: string) => {
    return (unsafe || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const obtenerFechaLocalISO = (offsetDias = 0, fechaBaseStr?: string): string => {
    const d = fechaBaseStr ? new Date(fechaBaseStr + "T00:00:00") : new Date();
    if (offsetDias !== 0) d.setDate(d.getDate() + offsetDias);
    const opciones = { timeZone: 'America/Managua', year: 'numeric' as const, month: '2-digit' as const, day: '2-digit' as const };
    const formateador = new Intl.DateTimeFormat('fr-CA', opciones);
    return formateador.format(d);
};

export const imprimirTicketTermico = (datosVenta: any) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
        alert("Permita los elementos emergentes para poder emitir el ticket físico.");
        return;
    }

    let descuentoTotalAcumulado = 0;
    const metodoUsado = datosVenta.metodoPagoCongelado || "Efectivo";
    const totalReal = datosVenta.totalCongelado || datosVenta.detalles.reduce((sum: number, i: any) => sum + i.subTotal, 0);

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
                    margin: 4px 10px; 
                    font-size: 11px; 
                    color: #000; 
                    line-height: 1.2;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .linea { border-bottom: 1px dashed #000; margin: 6px 0; }
                table { width: 100%; border-collapse: collapse; }
                .negrita { font-weight: bold; }
                .tabla-detalles td { vertical-align: top; padding: 2px 0; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <span class="negrita" style="font-size: 13px;">NICAPLUS GAMING</span><br>
                Tienda Digital y Taller Técnico<br>
                León, Nicaragua<br>
                Tel: +505 8888-8888
            </div>
            <div class="linea"></div>
            <div>
                Factura: #000${datosVenta.ventaId || 1}<br>
                Fecha: ${new Date().toLocaleDateString('es-NI')}<br>
                Condición: ${escapeHtml(metodoUsado.toUpperCase())}<br>
                Cliente: ${escapeHtml((datosVenta.cliente?.nombre || "Mostrador").substring(0, 18))}
            </div>
            <div class="linea"></div>
            <table class="tabla-detalles">
                <thead>
                    <tr>
                        <th align="left" class="negrita">Cant/Desc</th>
                        <th align="right" class="negrita">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${datosVenta.detalles.map((item: any) => {
                        const descPorItem = (item.descuento || 0) * item.cantidad;
                        descuentoTotalAcumulado += descPorItem;
                        
                        return `
                            <tr>
                                <td>${item.cantidad}x ${escapeHtml((item.nombre || 'Producto').substring(0, 15))}</td>
                                <td align="right">C$ ${item.subTotal}</td>
                            </tr>
                            ${item.descuento && item.descuento > 0 ? `
                            <tr>
                                <td colspan="2" style="font-size: 9px; color: #333; padding-left: 10px;">
                                    (Descto: -C$ ${descPorItem})
                                </td>
                            </tr>
                            ` : ''}
                            ${item.metadataDigital ? `
                            <tr>
                                <td colspan="2" style="font-size:9px; padding-left:10px; color:#333; word-break: break-all;">
                                    ID: ${escapeHtml(item.metadataDigital.replace(/^DIAS:\d+\|/, ''))}
                                </td>
                            </tr>
                            ` : ''}
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="linea"></div>
            
            <table style="width: 100%;">
                ${descuentoTotalAcumulado > 0 ? `
                <tr>
                    <td align="left">Subtotal:</td>
                    <td align="right">C$ ${totalReal + descuentoTotalAcumulado}</td>
                </tr>
                <tr>
                    <td align="left">Descuento:</td>
                    <td align="right">-C$ ${descuentoTotalAcumulado}</td>
                </tr>
                ` : ''}
                <tr>
                    <td align="left" class="negrita" style="font-size: 12px;">TOTAL:</td>
                    <td align="right" class="negrita" style="font-size: 12px;">C$ ${totalReal}</td>
                </tr>
            </table>

            ${metodoUsado === "Crédito" && datosVenta.fechaVencimientoCreditoCongelado ? `
            <div style="font-size: 9px; margin-top: 4px;" class="text-center">
                * VENCE AL CRÉDITO EL: ${new Date(datosVenta.fechaVencimientoCreditoCongelado + "T12:00:00").toLocaleDateString('es-NI')} *
            </div>
            ` : ''}

            <div class="linea"></div>
            <div class="text-center" style="margin-top:8px;">
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
    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 300);
};

export const Caja: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [fechaVenta, setFechaVenta] = useState(obtenerFechaLocalISO());    
    const [fechaVencimientoCredito, setFechaVencimientoCredito] = useState(obtenerFechaLocalISO(15));

    const [listaClientes, setListaClientes] = useState<any[]>([]);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [vistaModo, setVistaModo] = useState<'cuadricula' | 'lista'>('cuadricula');

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);

    const [mostrarModalDespacho, setMostrarModalDespacho] = useState(false);
    const [datosUltimaVenta, setDatosUltimaVenta] = useState<any>(null);
    const [diasCredito, setDiasCredito] = useState(15);

    const [mensajeErrorModal, setMensajeErrorModal] = useState<string | null>(null);

    const mostrarError = (mensaje: string) => {
        setMensajeErrorModal(mensaje);
    };

    useEffect(() => {
        Promise.all([
            api.get('/products'),
            api.get('/categorias'),
            api.get('/clientes')
        ]).then(([resProd, resCat, resCli]) => {
            setProductos(resProd.data || []);
            setCategorias(resCat.data || []);
            setListaClientes(resCli.data || []);
        }).catch(err => {
            console.error("Error cargando catálogos de Caja:", err);
            mostrarError("No se pudieron obtener los datos iniciales del punto de venta.");
        });
    }, []);

    const productosFiltrados = useMemo(() => {
        return productos
            .filter(p => {
                const coincideTexto = p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
                const coincideCategoria = categoriaFiltroActiva ? p.categoriaId === categoriaFiltroActiva : true;
                return coincideTexto && coincideCategoria;
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [productos, busquedaProducto, categoriaFiltroActiva]);

    const clientesFiltrados = useMemo(() => {
        if (!busquedaCliente.trim()) return listaClientes.slice(0, 30);
        const termino = busquedaCliente.toLowerCase();
        return listaClientes.filter(c => 
            c.nombre.toLowerCase().includes(termino) || (c.telefono && c.telefono.includes(termino))
        ).slice(0, 30);
    }, [listaClientes, busquedaCliente]);

    const totalVenta = useMemo(() => carrito.reduce((sum, item) => sum + item.subTotal, 0), [carrito]);
    const totalCostoVenta = useMemo(() => carrito.reduce((sum, item) => sum + (item.precioCostoUnitario * item.cantidad), 0), [carrito]);
    const margenGananciaTotal = useMemo(() => totalVenta - totalCostoVenta, [totalVenta, totalCostoVenta]);

    const agregarAlCarrito = (producto: Producto) => {
        const existe = carrito.find(item => item.idProducto === producto.id);

        if (existe) {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual <= existe.cantidad) {
                mostrarError(`No hay suficiente stock en inventario de "${producto.nombre}". Máximo disponible: ${producto.stockActual}.`);
                return;
            }
            setCarrito(carrito.map(item => {
                if (item.idProducto === producto.id) {
                    const nuevaCant = item.cantidad + 1;
                    return { 
                        ...item, 
                        cantidad: nuevaCant, 
                        subTotal: (item.precioUnitario - item.descuento) * nuevaCant 
                    };
                }
                return item;
            }));
        } else {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual < 1) {
                mostrarError(`El producto "${producto.nombre}" no cuenta con existencias disponibles.`);
                return;
            }
            setCarrito([...carrito, {
                idProducto: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: producto.precioVenta,
                precioCostoUnitario: producto.precioCosto,
                subTotal: producto.precioVenta,
                metadataDigital: '',
                diasSuscripcion: (producto as any).diasDuracion || 30,
                descuento: 0,
            }]);
        }
    };

    const cambiarDescuentoManual = (idProducto: number, descuento: number) => {
        const descValidado = Math.max(0, descuento);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto) {
                const descFinal = descValidado > item.precioUnitario ? item.precioUnitario : descValidado;
                return { 
                    ...item, 
                    descuento: descFinal, 
                    subTotal: (item.precioUnitario - descFinal) * item.cantidad 
                };
            }
            return item;
        }));
    };

    const cambiarCantidadManual = (idProducto: number, cantidad: number) => {
        const cantValida = Math.max(1, cantidad);
        const productoBase = productos.find(p => p.id === idProducto);

        if (productoBase && !productoBase.esDigital && !productoBase.requiereServicio && cantValida > productoBase.stockActual) {
            mostrarError(`Stock insuficiente para "${productoBase.nombre}". Existencias: ${productoBase.stockActual}.`);
            return;
        }

        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto) {
                return { 
                    ...item, 
                    cantidad: cantValida, 
                    subTotal: (item.precioUnitario - item.descuento) * cantValida 
                };
            }
            return item;
        }));
    };

    const actualizarDiasItemCarrito = (idProducto: number, dias: number) => {
        if (dias < 1) return;
        setCarrito(carrito.map(item => item.idProducto === idProducto ? { ...item, diasSuscripcion: dias } : item));
    };

    const eliminarDelCarrito = (idProducto: number) => {
        setCarrito(carrito.filter(item => item.idProducto !== idProducto));
    };

    const actualizarMetadata = (idProducto: number, valor: string) => {
        setCarrito(carrito.map(item => item.idProducto === idProducto ? { ...item, metadataDigital: valor } : item));
    };

    const limpiarCarrito = useCallback(() => setCarrito([]), []);

    const enviarCredencialesWhatsApp = () => {
        if (!datosUltimaVenta || !datosUltimaVenta.detalles) {
            mostrarError("No hay datos de una venta reciente para enviar.");
            return;
        }

        const clienteObj = datosUltimaVenta.cliente;
        if (!clienteObj || !clienteObj.telefono) {
            mostrarError("Venta genérica de mostrador: No hay un cliente con número de WhatsApp vinculado a esta venta.");
            return;
        }

        const telefonoLimpio = clienteObj.telefono.replace(/[^0-9]/g, '');
        const metodoUsado = datosUltimaVenta.metodoPagoCongelado;
        const totalReal = datosUltimaVenta.totalCongelado;
        const esVentaCredito = metodoUsado === "Crédito";
        
        const separador = "--------------------------------------------------------------------";

        const lineas: string[] = [
            "🎮 *NICAPLUS GAMING & TECH*",
            "",
            `¡Hola, ${clienteObj.nombre}! Gracias por tu compra.`,
            "",
            separador,
            "",
            "📝 *COMPROBANTE DIGITAL DE COMPRA*",
            `Factura: #000${datosUltimaVenta.ventaId}`,
            `Fecha de compra: ${new Date().toLocaleDateString('es-NI')}`,
            `Condición: ${metodoUsado.toUpperCase()}`,
            "",
            separador,
            "",
            "🔒 *CREDENCIALES DE ACCESO*",
            ""
        ];

        let descuentoTotalAcumulado = 0;

        datosUltimaVenta.detalles.forEach((item: any, idx: number) => {
            lineas.push(`*Servicio ${idx + 1}:* ${item.nombre || 'Servicio Digital'}`);
            lineas.push(`🔹 *Cantidad:* ${item.cantidad}`);
            
            if (item.descuento && item.descuento > 0) {
                const descPorItem = item.descuento * item.cantidad;
                descuentoTotalAcumulado += descPorItem;
                lineas.push(`🎁 *Descuento aplicado:* -C$ ${descPorItem}`);
            }

            if (item.metadataDigital) {
                let accesosReales = item.metadataDigital;
                if (item.metadataDigital.includes("DIAS:")) {
                    const partes = item.metadataDigital.split('|');
                    accesosReales = partes.slice(1).join('|');
                }
                
                if (accesosReales.includes('|')) {
                    const fragmentos = accesosReales.split('|').map((f: string) => f.trim());
                    
                    if (fragmentos[2]) {
                        const accesoLimpio = fragmentos[2].replace(/acceso:\s*/i, '');
                        const subPartes = accesoLimpio.split('/');
                        if (subPartes[0]) lineas.push(`📧 *Correo:* ${subPartes[0].trim()}`);
                        if (subPartes[1]) lineas.push(`🔑 *Contraseña:* ${subPartes[1].trim()}`);
                    }
                    if (fragmentos[0]) {
                        const perfilLimpio = fragmentos[0].replace(/perfil:\s*/i, '');
                        lineas.push(`👤 *Perfil asignado:* ${perfilLimpio}`);
                    }
                    if (fragmentos[1]) {
                        const pinLimpio = fragmentos[1].replace(/pin:\s*/i, '');
                        lineas.push(`🔒 *PIN:* ${pinLimpio}`);
                    }
                } else {
                    lineas.push(`👤 *Acceso/ID:* _${accesosReales}_`);
                }
            }
            lineas.push("");
        });

        lineas.push(separador);
        lineas.push("");
        lineas.push("📅 *VIGENCIA DEL SERVICIO*");
        lineas.push("");

        const primerItem = datosUltimaVenta.detalles[0];
        const diasSuscripcion = primerItem?.diasSuscripcion || 30;
        const fInicio = new Date();
        const fVence = new Date(fInicio.getTime() + (diasSuscripcion * 24 * 60 * 60 * 1000));

        lineas.push(`🟢 *Fecha de activación:* ${fInicio.toLocaleDateString('es-NI')}`);
        lineas.push(`🔴 *Fecha de vencimiento:* ${fVence.toLocaleDateString('es-NI')}`);
        lineas.push(`⏳ *Duración:* ${diasSuscripcion} días`);
        lineas.push("");
        lineas.push(separador);
        lineas.push("");
        lineas.push("💰 *INFORMACIÓN FINANCIERA*");
        lineas.push("");
        
        if (descuentoTotalAcumulado > 0) {
            lineas.push(`Subtotal: C$ ${totalReal + descuentoTotalAcumulado}`);
            lineas.push(`Descuento Total: -C$ ${descuentoTotalAcumulado}`);
        }
        lineas.push(`*Total a Pagar: C$ ${totalReal}*`);
        
        if (esVentaCredito) {
            lineas.push(`Estado: ⏳ Cuenta por cobrar`);
            if (datosUltimaVenta.fechaVencimientoCreditoCongelado) {
                const fLimite = new Date(datosUltimaVenta.fechaVencimientoCreditoCongelado + "T12:00:00");
                lineas.push(`Fecha límite de pago: ${fLimite.toLocaleDateString('es-NI')}`);
            }
        } else {
            lineas.push(`Estado: ✅ Factura Cancelada / Pagada`);
        }

        lineas.push("");
        lineas.push(separador);
        lineas.push("");
        lineas.push("📌 *INFORMACIÓN OPERATIVA*:");
        lineas.push("- Las caídas de perfiles o contraseñas deben reportarse inmediatamente.");
        lineas.push("");
        lineas.push("¡Muchas gracias por su preferencia! 🤝");

        const mensajeFinal = lineas.join("\n");
        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(mensajeFinal)}`;
        
        window.open(urlWhatsApp, '_blank');
    };

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const faltaMetadata = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return p?.esDigital && !p?.esSuscripcion && !item.metadataDigital.trim();
        });

        if (faltaMetadata) {
            mostrarError("Debe ingresar el ID del jugador o la referencia requerida para todos los productos digitales.");
            return;
        }

        const llevaSuscripcion = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return p?.esSuscripcion;
        });

        if ((llevaSuscripcion || metodoPago === "Crédito") && (!idClienteSeleccionado || idClienteSeleccionado === 0)) {
            mostrarError("Operación Denegada: Las ventas al crédito o configuradas como Suscripción requieren obligatoriamente asociar un cliente real.");
            return;
        }

        const detallesMapeados = carrito.map(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            const metaFinal = p?.esSuscripcion ? `DIAS:${item.diasSuscripcion}|${item.metadataDigital}` : item.metadataDigital;

            return {
                idProducto: item.idProducto,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subTotal: (item.precioUnitario - (item.descuento || 0)) * item.cantidad,
                descuento: item.descuento || 0,
                metadataDigital: metaFinal || ''
            };
        });

        const payload = {
            idCliente: idClienteSeleccionado === 0 ? null : idClienteSeleccionado, 
            metodoPago: metodoPago,
            fechaVenta: new Date(fechaVenta + "T00:00:00"),
            detalles: detallesMapeados,
            fechaVencimientoCreditoManual: metodoPago === "Crédito" ? new Date(fechaVencimientoCredito + "T00:00:00") : null
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

            const clienteFacturado = listaClientes.find(c => c.id === idClienteSeleccionado);
            
            setDatosUltimaVenta({
                ventaId: res.data.id || res.data.ventaId,
                detalles: detallesParaTicket,
                cliente: clienteFacturado || null,
                totalCongelado: totalVenta, 
                metodoPagoCongelado: metodoPago, 
                fechaVencimientoCreditoCongelado: fechaVencimientoCredito 
            });

            setMostrarModalDespacho(true);
            setCarrito([]); 
            setIdClienteSeleccionado(null); 
            setBusquedaCliente(''); 
            setBusquedaProducto(''); 
            setMetodoPago('Efectivo'); 
            setDiasCredito(15);
            setFechaVenta(obtenerFechaLocalISO());
            setFechaVencimientoCredito(obtenerFechaLocalISO(15));

            const refreshRes = await api.get('/products');
            setProductos(refreshRes.data);
        } catch (err: any) {
            console.error("Error al procesar factura:", err);

            let mensajeExtraido = "Ocurrió un error en el servidor al intentar procesar la venta.";

            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === 'string') {
                    mensajeExtraido = data;
                } else if (data.mensaje) {
                    mensajeExtraido = data.mensaje;
                } else if (data.title) {
                    mensajeExtraido = data.title;
                } else {
                    mensajeExtraido = JSON.stringify(data);
                }
            } else if (err.message) {
                mensajeExtraido = err.message;
            }

            mostrarError(mensajeExtraido);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.cajaWrapper}>
                
                {/* PANEL IZQUIERDO: PRODUCTOS */}
                <div className={`${styles.panel} ${styles.productosPanel}`}>
                    
                    <div className={styles.panelHeader}>
                        <h3>Inventario Disponible</h3>
                        <div className={styles.viewToggle}>
                            <button 
                                onClick={() => setVistaModo('cuadricula')} 
                                className={`${styles.toggleBtn} ${vistaModo === 'cuadricula' ? styles.toggleBtnActive : ''}`}
                            >
                                <FaTh /> Cuadrícula
                            </button>
                            <button 
                                onClick={() => setVistaModo('lista')} 
                                className={`${styles.toggleBtn} ${vistaModo === 'lista' ? styles.toggleBtnActive : ''}`}
                            >
                                <FaList /> Lista
                            </button>
                        </div>
                    </div>

                    <div className={styles.searchContainer}>
                        <FaSearch className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Buscar producto por nombre..." 
                            value={busquedaProducto} 
                            onChange={e => setBusquedaProducto(e.target.value)} 
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.categoriasScroll}>
                        <button 
                            onClick={() => setCategoriaFiltroActiva(null)} 
                            className={`${styles.catBtn} ${categoriaFiltroActiva === null ? styles.catBtnActive : ''}`}
                        >
                            <FaThList size={11} /> Todas
                        </button>
                        {categorias.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setCategoriaFiltroActiva(c.id)} 
                                className={`${styles.catBtn} ${categoriaFiltroActiva === c.id ? styles.catBtnActive : ''}`}
                            >
                                <FaTags size={11} /> {c.nombre}
                            </button>
                        ))}
                    </div>

                    <div className={styles.scrollContainer}>
                        {productosFiltrados.length === 0 ? (
                            <div className={styles.noProducts}>No se encontraron productos coincidentes.</div>
                        ) : vistaModo === 'cuadricula' ? (
                            <div className={styles.productGrid}>
                                {productosFiltrados.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => agregarAlCarrito(p)} 
                                        className={styles.productCard}
                                    >
                                        <div className={styles.productImgContainer}>
                                            {p.imagenUrl ? (
                                                <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} />
                                            ) : (
                                                <div className={styles.productNoImg}>SIN FOTO</div>
                                            )}
                                        </div>
                                        
                                        <div className={styles.productDetails}>
                                            <div className={styles.productName} title={p.nombre}>
                                                {p.nombre}
                                            </div>
                                            <div className={styles.productMetaRow}>
                                                <span className={styles.productPrice}>C$ {p.precioVenta}</span>
                                                <small className={styles.productProfit}>+C$ {p.precioVenta - p.precioCosto}</small>
                                            </div>
                                        </div>

                                        <div className={styles.productBadges}>
                                            <span className={`${styles.badge} ${p.esDigital ? styles.badgeDigital : p.requiereServicio ? styles.badgeServicio : styles.badgeFisico}`}>
                                                {p.esDigital ? "Digital" : p.requiereServicio ? "Servicio" : "Físico"}
                                            </span>
                                            {p.esSuscripcion && (
                                                <span className={`${styles.badge} ${styles.badgeRecurrente}`}>
                                                    🔄 Recurrente
                                                </span>
                                            )}
                                            {!p.esDigital && !p.requiereServicio && (
                                                <small className={`${styles.stockText} ${p.stockActual <= 3 ? styles.stockCritical : ''}`}>
                                                    Cant: {p.stockActual}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.productList}>
                                {productosFiltrados.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => agregarAlCarrito(p)} 
                                        className={styles.productRow}
                                    >
                                        <div className={styles.productRowLeft}>
                                            <div className={styles.productRowImg}>
                                                {p.imagenUrl ? (
                                                    <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} />
                                                ) : (
                                                    <div className={styles.productNoImg}>N/A</div>
                                                )}
                                            </div>
                                            <div className={styles.productRowInfo}>
                                                <strong className={styles.productRowName} title={p.nombre}>
                                                    {p.nombre}
                                                </strong>
                                                <small className={styles.productRowSub}>
                                                    {p.esDigital ? "Digital" : p.requiereServicio ? "Servicio Técnico" : `Disponibles: ${p.stockActual}`}
                                                    {p.esSuscripcion && " | 🔄 Requiere Renovación"}
                                                </small>
                                            </div>
                                        </div>
                                        <span className={styles.productPrice}>C$ {p.precioVenta}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* PANEL DERECHO: CARRITO Y ACCIONES */}
                <div className={styles.carritoPanel}>
                    <div style={{ display: 'flex', flexDirection: 'column', height: '45%', minHeight: '180px', flex: 1 }}>
                        <div className={styles.carritoHeader}>
                            <h4 className={styles.carritoTitle}>
                                <FaShoppingCart style={{ color: '#38bdf8' }} /> Resumen de Orden
                            </h4>
                            {carrito.length > 0 && (
                                <button onClick={limpiarCarrito} className={styles.vaciarBtn}>
                                    <FaTrashAlt /> Vaciar
                                </button>
                            )}
                        </div>
                        
                        <div className={styles.scrollContainer}>
                            {carrito.length === 0 && (
                                <div className={styles.cartEmpty}>
                                    <FaShoppingCart size={24} style={{ opacity: 0.4 }} />
                                    <p>El carrito está vacío.</p>
                                </div>
                            )}
                            {carrito.map(item => {
                                const pBase = productos.find(p => p.id === item.idProducto);
                                return (
                                    <div key={item.idProducto} className={styles.cartItem}>
                                        <div className={styles.cartItemMain}>
                                            <div className={styles.cartItemLeft}>
                                                <button onClick={() => eliminarDelCarrito(item.idProducto)} className={styles.eliminarItem} title="Eliminar artículo">
                                                    <FaTimes size={14} />
                                                </button>
                                                <span className={styles.cartItemName}>
                                                    {item.nombre} {pBase?.esSuscripcion && <span style={{ color: '#ef4444' }}>(🔄)</span>}
                                                </span>
                                            </div>
                                            <strong style={{ fontSize: '0.9rem', color: '#FFFFFF', whiteSpace: 'nowrap' }}>C$ {item.subTotal}</strong>
                                        </div>

                                        <div className={styles.cartItemSubRow}>
                                            <div className={styles.controlGroup}>
                                                <span className={styles.cartLabel}>Cant:</span>
                                                <input 
                                                    type="number" 
                                                    value={item.cantidad} 
                                                    min={1} 
                                                    onChange={(e) => cambiarCantidadManual(item.idProducto, Number(e.target.value))} 
                                                    className={styles.cantInput} 
                                                />
                                            </div>

                                            <div className={styles.controlGroup}>
                                                <span className={`${styles.cartLabel} ${styles.labelDescuento}`}>Desc (C$):</span>
                                                <input 
                                                    type="number" 
                                                    min={0} 
                                                    max={item.precioUnitario} 
                                                    value={item.descuento || 0} 
                                                    onChange={(e) => cambiarDescuentoManual(item.idProducto, Number(e.target.value))} 
                                                    className={styles.smallInput} 
                                                />
                                            </div>
                                        </div>

                                        {pBase?.esSuscripcion && (
                                            <div className={styles.cartItemSubRow}>
                                                <div className={styles.controlGroup}>
                                                    <span className={`${styles.cartLabel} ${styles.labelSuscripcion}`}>Días:</span>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        value={item.diasSuscripcion} 
                                                        onChange={(e) => actualizarDiasItemCarrito(item.idProducto, Number(e.target.value))} 
                                                        className={styles.smallInput} 
                                                    />
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: '#64748b', alignSelf: 'center' }}>Base: C$ {item.precioUnitario}</span>
                                            </div>
                                        )}

                                        {pBase?.esDigital && !pBase?.esSuscripcion && (
                                            <input 
                                                type="text" 
                                                placeholder="ID del Jugador / Referencia (Obligatorio)" 
                                                value={item.metadataDigital} 
                                                onChange={(e) => actualizarMetadata(item.idProducto, e.target.value)} 
                                                className={styles.metaInput} 
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={styles.carritoFooter}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}><FaUser size={10} /> Cliente Asociado</label>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar por nombre o móvil..." 
                                value={busquedaCliente} 
                                onChange={e => setBusquedaCliente(e.target.value)} 
                                className={styles.searchInput}
                                style={{ padding: '8px 12px', fontSize: '0.8rem', marginBottom: '4px' }} 
                            />
                            <select 
                                value={idClienteSeleccionado || 0} 
                                onChange={e => { 
                                    const val = Number(e.target.value);
                                    setIdClienteSeleccionado(val); 
                                    const selectText = e.target.options[e.target.selectedIndex].text; 
                                    if (val !== 0) setBusquedaCliente(selectText.split(' (')[0]); 
                                }} 
                                className={styles.selectControl}
                            >
                                <option value={0}>Venta de Mostrador (Genérico)</option>
                                {clientesFiltrados.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Método de Pago</label>
                            <select 
                                value={metodoPago} 
                                onChange={e => setMetodoPago(e.target.value)} 
                                className={styles.selectControl}
                            >
                                <option value="Efectivo">💵 Efectivo</option>
                                <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                <option value="Tarjeta">💳 Tarjeta</option>
                                <option value="Crédito">🛑 Crédito (Cuenta por Cobrar)</option>
                            </select>
                        </div>

                        {metodoPago === "Crédito" && (
                            <div className={styles.creditoBox}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} style={{ color: '#f87171' }}>Plazo del Crédito (Días)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={diasCredito} 
                                        onChange={e => { 
                                            const dias = Number(e.target.value); 
                                            setDiasCredito(dias); 
                                            setFechaVencimientoCredito(obtenerFechaLocalISO(dias, fechaVenta)); 
                                        }} 
                                        className={styles.searchInput}
                                        style={{ border: '1px solid #ef4444', padding: '8px' }} 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel} style={{ color: '#f87171' }}><FaCalendarAlt size={10} /> Fecha de Vencimiento</label>
                                    <input 
                                        type="date" 
                                        value={fechaVencimientoCredito} 
                                        onChange={e => setFechaVencimientoCredito(e.target.value)} 
                                        className={styles.searchInput}
                                        style={{ border: '1px solid #ef4444', padding: '8px' }} 
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Fecha de Facturación</label>
                            <input 
                                type="date" 
                                value={fechaVenta} 
                                onChange={e => { 
                                    const nuevaFechaVenta = e.target.value; 
                                    setFechaVenta(nuevaFechaVenta); 
                                    setFechaVencimientoCredito(obtenerFechaLocalISO(diasCredito, nuevaFechaVenta)); 
                                }} 
                                className={styles.searchInput}
                                style={{ padding: '8px' }} 
                            />
                        </div>

                        {carrito.length > 0 && (
                            <div className={styles.utilityBadge}>
                                <FaMoneyBillWave style={{ color: '#c084fc', flexShrink: 0 }} />
                                <span>Utilidad: <strong style={{ color: '#4ade80', fontSize: '0.9rem' }}>C$ {margenGananciaTotal}</strong></span>
                            </div>
                        )}

                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Monto Total:</span>
                            <strong className={styles.totalAmount}>C$ {totalVenta}</strong>
                        </div>

                        <button 
                            onClick={finalizarVenta} 
                            disabled={carrito.length === 0} 
                            className={`${styles.submitBtn} ${carrito.length === 0 ? styles.submitBtnDisabled : styles.submitBtnActive}`}
                        >
                            Procesar Factura
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL FLOTANTE DE ERROR */}
            {mensajeErrorModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ borderTop: '4px solid #ef4444' }}>
                        <div className={styles.modalIcon} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h3 className={styles.modalTitle} style={{ color: '#f87171' }}>Operación Denegada</h3>
                        <p className={styles.modalText} style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
                            {mensajeErrorModal}
                        </p>
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setMensajeErrorModal(null)} 
                                className={`${styles.modalBtn}`}
                                style={{ background: '#334155', color: '#fff' }}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INTERACTIVO FLOTANTE: DESPACHO EXITOSO */}
            {mostrarModalDespacho && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIcon}><FaCheckCircle /></div>
                        <h3 className={styles.modalTitle}>¡Transacción Guardada!</h3>
                        <p className={styles.modalText}>La venta se registró correctamente en el sistema. Selecciona la vía de despacho de credenciales para el cliente.</p>
                        
                        <div className={styles.modalActions}>
                            {datosUltimaVenta && datosUltimaVenta.cliente && datosUltimaVenta.cliente.id !== 0 ? (
                                <button 
                                    onClick={enviarCredencialesWhatsApp} 
                                    className={`${styles.modalBtn} ${styles.btnWhatsapp}`}
                                >
                                    <FaWhatsapp size={18} /> Enviar Comprobante y Accesos (WhatsApp)
                                </button>
                            ) : (
                                <div className={styles.warningBanner}>
                                    Venta genérica de mostrador: No vinculada a número de WhatsApp para envío directo.
                                </div>
                            )}
                            <button 
                                onClick={() => imprimirTicketTermico(datosUltimaVenta)} 
                                className={`${styles.modalBtn} ${styles.btnPrint}`}
                            >
                                <FaPrint /> Imprimir Copia Física (Ticketera)
                            </button>
                            <button 
                                onClick={() => { setMostrarModalDespacho(false); setDatosUltimaVenta(null); }} 
                                className={`${styles.modalBtn} ${styles.btnClose}`}
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