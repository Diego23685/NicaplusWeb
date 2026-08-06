import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import { 
  FaTrashAlt, FaShoppingCart, 
  FaSearch, FaTimes, FaWhatsapp, FaPrint, FaCheckCircle, 
  FaExclamationTriangle} from 'react-icons/fa';

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
    metadataDigital?: string;
    primerPerfilId?: number;
    diasDuracion?: number;
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
    idsPerfiles?: number[];
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

const sumarMesesExactos = (fechaBaseISO: string, meses: number): string => {
    const [year, month, day] = fechaBaseISO.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    fecha.setMonth(fecha.getMonth() + meses);
    if (fecha.getDate() !== day) fecha.setDate(0);
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const calcularDiasRealesEntreFechas = (fechaInicioStr: string, fechaFinStr: string): number => {
    const inicio = new Date(fechaInicioStr + "T00:00:00");
    const fin = new Date(fechaFinStr + "T00:00:00");
    const diferenciaMs = fin.getTime() - inicio.getTime();
    return Math.max(1, Math.round(diferenciaMs / (1000 * 60 * 60 * 24)));
};

export const enviarWhatsAppVenta = (datosVenta: any) => {
    if (!datosVenta || !datosVenta.detalles) {
        alert("No hay datos de venta válidos para enviar.");
        return;
    }

    const clienteObj = datosVenta.cliente;
    if (!clienteObj || (!clienteObj.telefono && !clienteObj.Telefono)) {
        alert("Venta genérica de mostrador: No hay un cliente con número de WhatsApp vinculado.");
        return;
    }

    const telefonoRaw = clienteObj.telefono || clienteObj.Telefono || "";
    const telefonoLimpio = telefonoRaw.replace(/[^0-9]/g, '');
    const metodoUsado = datosVenta.metodoPagoCongelado || datosVenta.metodoPago || "Efectivo";
    const totalReal = datosVenta.totalCongelado ?? datosVenta.total ?? datosVenta.detalles.reduce((sum: number, i: any) => sum + (i.subTotal || 0), 0);
    const esVentaCredito = metodoUsado === "Crédito";
    const separador = "--------------------------------------------------------------------";

    const lineas: string[] = [
        "🎮 *NICAPLUS GAMING & TECH*",
        "",
        `¡Hola, ${clienteObj.nombre || clienteObj.Nombre}! Gracias por tu compra.`,
        "",
        separador,
        "",
        "📝 *COMPROBANTE DIGITAL DE COMPRA*",
        `Factura: #000${datosVenta.ventaId || datosVenta.id}`,
        `Fecha de compra: ${datosVenta.fechaVenta ? new Date(datosVenta.fechaVenta).toLocaleDateString('es-NI') : new Date().toLocaleDateString('es-NI')}`,
        `Condición: ${metodoUsado.toUpperCase()}`,
        "",
        separador,
        "",
        "🔒 *CREDENCIALES DE ACCESO*",
        ""
    ];

    let descuentoTotalAcumulado = 0;

    const procesarBloqueCredencial = (metaStr: string, indiceCredencial?: number) => {
        if (!metaStr) return;
        let accesosReales = metaStr.trim();
        if (accesosReales.startsWith("DIAS:")) {
            const partes = accesosReales.split('|');
            accesosReales = partes.slice(1).join('|').trim();
        }

        if (indiceCredencial !== undefined) {
            lineas.push(`📌 *Perfil / Acceso #${indiceCredencial + 1}:*`);
        }

        if (accesosReales.includes('|')) {
            const fragmentos = accesosReales.split('|').map((f: string) => f.trim());
            fragmentos.forEach(frag => {
                if (/^perfil:/i.test(frag)) {
                    lineas.push(`   👤 *Perfil:* ${frag.replace(/^perfil:\s*/i, '')}`);
                } else if (/^pin:/i.test(frag)) {
                    lineas.push(`   🔒 *PIN:* ${frag.replace(/^pin:\s*/i, '')}`);
                } else if (/^acceso:/i.test(frag)) {
                    const accesoLimpio = frag.replace(/^acceso:\s*/i, '');
                    const subPartes = accesoLimpio.split('/');
                    if (subPartes[0]) lineas.push(`   📧 *Correo:* ${subPartes[0].trim()}`);
                    if (subPartes[1]) lineas.push(`   🔑 *Contraseña:* ${subPartes[1].trim()}`);
                } else if (frag.length > 0) {
                    lineas.push(`   🔹 ${frag}`);
                }
            });
        } else if (accesosReales.includes('/')) {
            const subPartes = accesosReales.split('/');
            if (subPartes[0]) lineas.push(`   📧 *Correo:* ${subPartes[0].trim()}`);
            if (subPartes[1]) lineas.push(`   🔑 *Contraseña:* ${subPartes[1].trim()}`);
        } else if (accesosReales) {
            lineas.push(`   🔑 *Datos / Acceso:* ${accesosReales}`);
        }
    };

    datosVenta.detalles.forEach((item: any, idx: number) => {
        lineas.push(`*Servicio ${idx + 1}:* ${item.nombre || 'Servicio/Producto'}`);
        lineas.push(`🔹 *Cantidad:* ${item.cantidad}`);
        
        if (item.descuento && item.descuento > 0) {
            const descPorItem = item.descuento * item.cantidad;
            descuentoTotalAcumulado += descPorItem;
            lineas.push(`🎁 *Descuento aplicado:* -C$ ${descPorItem}`);
        }

        const meta = item.metadataDigital || item.metadata || '';
        if (meta) {
            const cuentasMultiples = meta.split(/\r?\n|;/).filter((c: string) => c.trim().length > 0);
            if (cuentasMultiples.length > 1) {
                cuentasMultiples.forEach((bloqueMeta: string, subIdx: number) => {
                    procesarBloqueCredencial(bloqueMeta, subIdx);
                });
            } else {
                procesarBloqueCredencial(meta);
            }
        } else {
            lineas.push(`   ⚠️ _Sin credenciales asignadas_`);
        }
        lineas.push("");
    });

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
    } else {
        lineas.push(`Estado: ✅ Factura Cancelada / Pagada`);
    }

    lineas.push("");
    lineas.push(separador);
    lineas.push("");
    lineas.push("¡Muchas gracias por su preferencia! 🤝");

    const mensajeFinal = lineas.join("\n");
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(mensajeFinal)}`;
    window.open(urlWhatsApp, '_blank');
};

export const imprimirTicketTermico = (datosVenta: any) => {
    let descuentoTotalAcumulado = 0;
    const metodoUsado = datosVenta.metodoPagoCongelado || "Efectivo";
    const totalReal = datosVenta.totalCongelado || datosVenta.detalles.reduce((sum: number, i: any) => sum + i.subTotal, 0);

    const contenidoTicket = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Factura Nicaplus</title>
            <style>
                @page { 
                    margin: 0; 
                    size: auto;
                }
                body { 
                    font-family: 'Courier New', Courier, monospace; 
                    width: 100%;
                    max-width: 280px;
                    margin: 0 auto; 
                    padding: 8px;
                    font-size: 11px; 
                    color: #000; 
                    line-height: 1.2;
                    box-sizing: border-box;
                }
                .text-center { text-align: center; }
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
                Nicaragua
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
                <tbody>
                    ${datosVenta.detalles.map((item: any) => {
                        const descPorItem = (item.descuento || 0) * item.cantidad;
                        descuentoTotalAcumulado += descPorItem;
                        return `
                            <tr>
                                <td>${item.cantidad}x ${escapeHtml((item.nombre || 'Producto').substring(0, 15))}</td>
                                <td align="right">C$ ${item.subTotal}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div class="linea"></div>
            <table style="width: 100%;">
                <tr>
                    <td align="left" class="negrita" style="font-size: 12px;">TOTAL:</td>
                    <td align="right" class="negrita" style="font-size: 12px;">C$ ${totalReal}</td>
                </tr>
            </table>
            <div class="linea"></div>
            <div class="text-center" style="margin-top:8px;">
                ¡Gracias por tu preferencia!
            </div>
        </body>
        </html>
    `;

    // 1. Crear iframe oculto en el documento actual (Evita popups/window.open)
    const idIframe = 'iframe_impresion_ticket';
    let iframe = document.getElementById(idIframe) as HTMLIFrameElement;
    if (iframe) {
        document.body.removeChild(iframe);
    }

    iframe = document.createElement('iframe');
    iframe.id = idIframe;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const docIframe = iframe.contentWindow?.document || iframe.contentDocument;
    if (!docIframe) return;

    docIframe.open();
    docIframe.write(contenidoTicket);
    docIframe.close();

    // 2. Disparar impresión nativa directamente desde el iframe
    setTimeout(() => {
        try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (e) {
            console.error("Error al imprimir:", e);
        }
    }, 600);
};

export const Caja: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [, setCategorias] = useState<Categoria[]>([]);
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [fechaVenta, setFechaVenta] = useState(obtenerFechaLocalISO());    
    const [fechaVencimientoCredito, setFechaVencimientoCredito] = useState(obtenerFechaLocalISO(15));

    const [listaClientes, setListaClientes] = useState<any[]>([]);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);

    // Estado para alternar vistas en móvil (Productos / Carrito)
    const [tabActiva, setTabActiva] = useState<'catalogo' | 'carrito'>('catalogo');

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [categoriaFiltroActiva] = useState<number | null>(null);
    const [filtroRubroCaja, setFiltroRubroCaja] = useState<'todos' | 'fisico' | 'digital' | 'streaming'>('todos');

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
                
                let coincideRubro = true;
                if (filtroRubroCaja === 'fisico') coincideRubro = !p.esDigital;
                if (filtroRubroCaja === 'digital') coincideRubro = p.esDigital && !p.esSuscripcion;
                if (filtroRubroCaja === 'streaming') coincideRubro = p.esDigital && p.esSuscripcion;

                return coincideTexto && coincideCategoria && coincideRubro;
            })
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [productos, busquedaProducto, categoriaFiltroActiva, filtroRubroCaja]);

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

    const agregarAlCarrito = async (producto: Producto) => {
        const existe = carrito.find(item => item.idProducto === producto.id);

        if (existe) {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual <= existe.cantidad) {
                mostrarError(`Stock insuficiente para "${producto.nombre}". Disponibles: ${producto.stockActual}.`);
                return;
            }

            let credencialesActualizadas = existe.metadataDigital;
            let listaIdsPerfiles = existe.idsPerfiles || [];

            if (producto.esDigital) {
                try {
                    const paramsIgnorados = listaIdsPerfiles.join(',');
                    const res = await api.get(`/products/${producto.id}/siguiente-credencial`, {
                        params: { ignorados: paramsIgnorados }
                    });

                    if (res.data && res.data.disponible && res.data.metadataDigital) {
                        const nuevaCredencial = res.data.metadataDigital.trim();
                        credencialesActualizadas = credencialesActualizadas 
                            ? `${credencialesActualizadas}\n${nuevaCredencial}`
                            : nuevaCredencial;

                        if (res.data.idPerfil) {
                            listaIdsPerfiles = [...listaIdsPerfiles, res.data.idPerfil];
                        }
                    } else {
                        mostrarError(`Sin más credenciales disponibles para "${producto.nombre}".`);
                        return;
                    }
                } catch (error) {
                    mostrarError('Error al consultar el inventario de cuentas.');
                    return;
                }
            }

            setCarrito(carrito.map(item => {
                if (item.idProducto === producto.id) {
                    const nuevaCant = item.cantidad + 1;
                    return { 
                        ...item, 
                        cantidad: nuevaCant, 
                        subTotal: Math.round((item.precioUnitario - item.descuento) * nuevaCant),
                        metadataDigital: credencialesActualizadas,
                        idsPerfiles: listaIdsPerfiles
                    };
                }
                return item;
            }));

        } else {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual < 1) {
                mostrarError(`El producto "${producto.nombre}" no cuenta con existencias.`);
                return;
            }

            const metadataDigital = producto.esDigital ? (producto.metadataDigital || '') : '';
            const idsIniciales = (producto.esDigital && producto.primerPerfilId) ? [producto.primerPerfilId] : [];

            setCarrito(prevCarrito => [...prevCarrito, {
                idProducto: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: producto.precioVenta,
                precioCostoUnitario: producto.precioCosto,
                subTotal: producto.precioVenta,
                metadataDigital: metadataDigital,
                diasSuscripcion: producto.diasDuracion || 30,
                descuento: 0,
                idsPerfiles: idsIniciales
            }]);
        }
    };

    const cambiarPrecioUnitarioManual = (idProducto: number, nuevoPrecio: number) => {
        const precioValidado = Math.max(0, nuevoPrecio);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto) {
                return { 
                    ...item, 
                    precioUnitario: precioValidado, 
                    subTotal: Math.round((precioValidado - item.descuento) * item.cantidad)
                };
            }
            return item;
        }));
    };

    const cambiarDescuentoManual = (idProducto: number, descuento: number) => {
        const descValidado = Math.max(0, descuento);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto) {
                const descFinal = descValidado > item.precioUnitario ? item.precioUnitario : descValidado;
                return { 
                    ...item, 
                    descuento: descFinal, 
                    subTotal: Math.round((item.precioUnitario - descFinal) * item.cantidad)
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
                    subTotal: Math.round((item.precioUnitario - item.descuento) * cantValida)
                };
            }
            return item;
        }));
    };

    const actualizarDiasItemCarrito = (idProducto: number, dias: number) => {
        if (dias < 1) return;
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto) {
                const pBase = productos.find(p => p.id === idProducto);
                const diasBase = pBase?.diasDuracion || 30;
                const tarifaDiaria = pBase ? (pBase.precioVenta / diasBase) : (item.precioUnitario / 30);
                const nuevoPrecioProporcional = Math.round(tarifaDiaria * dias);

                return { 
                    ...item, 
                    diasSuscripcion: dias,
                    precioUnitario: nuevoPrecioProporcional,
                    subTotal: Math.round((nuevoPrecioProporcional - item.descuento) * item.cantidad)
                };
            }
            return item;
        }));
    };

    const aplicarMesesExactosCarrito = (idProducto: number, meses: number) => {
        if (meses < 1) return;
        const fechaFinCalculada = sumarMesesExactos(fechaVenta, meses);
        const diasReales = calcularDiasRealesEntreFechas(fechaVenta, fechaFinCalculada);
        actualizarDiasItemCarrito(idProducto, diasReales);
    };

    const eliminarDelCarrito = (idProducto: number) => {
        setCarrito(carrito.filter(item => item.idProducto !== idProducto));
    };

    const actualizarMetadata = (idProducto: number, valor: string) => {
        setCarrito(carrito.map(item => item.idProducto === idProducto ? { ...item, metadataDigital: valor } : item));
    };

    const limpiarCarrito = useCallback(() => setCarrito([]), []);

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const faltaMetadata = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return (p?.esDigital || p?.esSuscripcion) && !item.metadataDigital.trim();
        });

        if (faltaMetadata) {
            mostrarError("Faltan credenciales de acceso para algunos productos digitales seleccionados.");
            return;
        }

        const llevaSuscripcion = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return p?.esSuscripcion;
        });

        if ((llevaSuscripcion || metodoPago === "Crédito") && (!idClienteSeleccionado || idClienteSeleccionado === 0)) {
            mostrarError("Las ventas al crédito o suscripciones requieren asociar un cliente obligatoriamente.");
            return;
        }

        const detallesMapeados = carrito.map(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            const metaFinal = p?.esSuscripcion ? `DIAS:${item.diasSuscripcion}|${item.metadataDigital}` : item.metadataDigital;

            return {
                idProducto: item.idProducto,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subTotal: Math.round((item.precioUnitario - (item.descuento || 0)) * item.cantidad),
                descuento: item.descuento || 0,
                metadataDigital: metaFinal || ''
            };
        });

        const payload = {
            idCliente: idClienteSeleccionado && idClienteSeleccionado > 0 ? idClienteSeleccionado : null,
            metodoPago: metodoPago,
            fechaVenta: fechaVenta ? new Date(fechaVenta + "T00:00:00").toISOString() : null, 
            fechaVencimientoCreditoManual: metodoPago === "Crédito" 
                ? new Date(fechaVencimientoCredito + "T12:00:00").toISOString() 
                : null,
            detalles: carrito.map(item => {
                const p = productos.find(prod => prod.id === item.idProducto);
                const metaFinal = p?.esSuscripcion 
                    ? `DIAS:${item.diasSuscripcion}|${item.metadataDigital}` 
                    : item.metadataDigital;

                return {
                    idProducto: item.idProducto,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario,
                    descuento: item.descuento || 0,
                    metadataDigital: metaFinal || ''
                };
            })
        };

        try {
            const res = await api.post('/ventas', payload);
            const detallesParaTicket = (res.data.detalles || detallesMapeados).map((item: any) => {
                const prodOriginal = productos.find(p => p.id === item.idProducto);
                const itemCarritoOriginal = carrito.find(c => c.idProducto === item.idProducto);
                
                return {
                    ...item,
                    nombre: prodOriginal ? prodOriginal.nombre : "Producto General",
                    diasSuscripcion: itemCarritoOriginal ? itemCarritoOriginal.diasSuscripcion : 30,
                    metadataDigital: item.metadataDigital || itemCarritoOriginal?.metadataDigital || ''
                };
            });

            const clienteFacturado = listaClientes.find(c => c.id === idClienteSeleccionado);
            
            setDatosUltimaVenta({
                ventaId: res.data.id || res.data.ventaId || res.data.idVenta || "0",
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
            setTabActiva('catalogo');

            const refreshRes = await api.get('/products');
            setProductos(refreshRes.data);
        } catch (err: any) {
            console.error("Error al procesar factura:", err);
            let mensajeExtraido = "Ocurrió un error al procesar la venta.";
            if (err.response?.data?.mensaje) mensajeExtraido = err.response.data.mensaje;
            mostrarError(mensajeExtraido);
        }
    };

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* CONMUTADOR PRINCIPAL MÓVIL (CATÁLOGO / CARRITO) */}
            <div style={{ display: 'flex', gap: '8px', background: '#1e293b', padding: '6px', borderRadius: '12px', border: '1px solid #334155' }}>
                <button 
                    onClick={() => setTabActiva('catalogo')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: tabActiva === 'catalogo' ? '#38bdf8' : 'transparent',
                        color: tabActiva === 'catalogo' ? '#0f172a' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                    }}
                >
                    📦 Productos
                </button>
                <button 
                    onClick={() => setTabActiva('carrito')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: tabActiva === 'carrito' ? '#38bdf8' : 'transparent',
                        color: tabActiva === 'carrito' ? '#0f172a' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <FaShoppingCart /> Carrito ({carrito.length})
                </button>
            </div>

            {/* TAB 1: PRODUCTOS / CATÁLOGO */}
            {tabActiva === 'catalogo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Buscador de productos */}
                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar producto por nombre..." 
                            value={busquedaProducto} 
                            onChange={e => setBusquedaProducto(e.target.value)} 
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 38px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Filtros horizontales por rubro */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button onClick={() => setFiltroRubroCaja('todos')} style={{ background: filtroRubroCaja === 'todos' ? '#38bdf8' : '#0f172a', color: filtroRubroCaja === 'todos' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Todos</button>
                        <button onClick={() => setFiltroRubroCaja('fisico')} style={{ background: filtroRubroCaja === 'fisico' ? '#38bdf8' : '#0f172a', color: filtroRubroCaja === 'fisico' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Físicos</button>
                        <button onClick={() => setFiltroRubroCaja('digital')} style={{ background: filtroRubroCaja === 'digital' ? '#38bdf8' : '#0f172a', color: filtroRubroCaja === 'digital' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Digitales</button>
                        <button onClick={() => setFiltroRubroCaja('streaming')} style={{ background: filtroRubroCaja === 'streaming' ? '#38bdf8' : '#0f172a', color: filtroRubroCaja === 'streaming' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Streaming</button>
                    </div>

                    {/* Grid de productos */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                        {productosFiltrados.map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => agregarAlCarrito(p)} 
                                style={{
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer'
                                }}
                            >
                                <div>
                                    <strong style={{ color: '#f8fafc', fontSize: '0.8rem', display: 'block', marginBottom: '4px', lineHeight: '1.2' }}>{p.nombre}</strong>
                                    <small style={{ color: '#38bdf8', fontSize: '0.7rem', display: 'block' }}>
                                        {p.esSuscripcion ? '📺 Streaming' : p.esDigital ? '🎮 Digital' : `Stock: ${p.stockActual}`}
                                    </small>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                    <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>C$ {p.precioVenta}</strong>
                                    <span style={{ background: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>+</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: CARRITO DE COMPRAS Y CONTROLES COMPLETOS */}
            {tabActiva === 'carrito' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Encabezado del Carrito */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>Resumen de Orden ({carrito.length})</span>
                        {carrito.length > 0 && (
                            <button 
                                onClick={limpiarCarrito}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <FaTrashAlt /> Vaciar Carrito
                            </button>
                        )}
                    </div>

                    {/* Lista de Items con todos los controles operativos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {carrito.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px' }}>
                                El carrito está vacío. Agrega productos desde el catálogo.
                            </div>
                        ) : (
                            carrito.map(item => {
                                const pBase = productos.find(p => p.id === item.idProducto);
                                return (
                                    <div key={item.idProducto} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        
                                        {/* Título y botón eliminar */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>
                                                {item.nombre} {pBase?.esSuscripcion && <span style={{ color: '#ef4444' }}>(📺)</span>}
                                            </strong>
                                            <button onClick={() => eliminarDelCarrito(item.idProducto)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                                <FaTimes />
                                            </button>
                                        </div>

                                        {/* Fila de Cantidad, Precio y Descuento */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                            <div>
                                                <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>Cant.</small>
                                                <input type="number" min={1} value={item.cantidad} onChange={(e) => cambiarCantidadManual(item.idProducto, Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                            </div>
                                            <div>
                                                <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>P.Unit C$</small>
                                                <input type="number" min={0} value={item.precioUnitario} onChange={(e) => cambiarPrecioUnitarioManual(item.idProducto, Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                            </div>
                                            <div>
                                                <small style={{ color: '#f59e0b', fontSize: '0.68rem', display: 'block' }}>Desc C$</small>
                                                <input type="number" min={0} max={item.precioUnitario} value={item.descuento || 0} onChange={(e) => cambiarDescuentoManual(item.idProducto, Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                            </div>
                                        </div>

                                        {/* Controles de Suscripción (Días / Meses Exactos) */}
                                        {pBase?.esSuscripcion && (
                                            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div>
                                                    <small style={{ color: '#38bdf8', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>Días Manuales</small>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        value={item.diasSuscripcion} 
                                                        onChange={(e) => actualizarDiasItemCarrito(item.idProducto, Number(e.target.value))} 
                                                        style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px 6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                                                    />
                                                </div>

                                                <div>
                                                    <small style={{ color: '#10b981', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>Meses Exactos</small>
                                                    <select 
                                                        onChange={(e) => {
                                                            const m = Number(e.target.value);
                                                            if (m > 0) aplicarMesesExactosCarrito(item.idProducto, m);
                                                        }}
                                                        style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px 6px', borderRadius: '6px', fontSize: '0.75rem', boxSizing: 'border-box' }}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Seleccionar...</option>
                                                        <option value="1">1 mes</option>
                                                        <option value="2">2 meses</option>
                                                        <option value="3">3 meses</option>
                                                        <option value="6">6 meses</option>
                                                        <option value="12">12 meses</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {/* Textarea de Metadata Digital (Credenciales / PIN) */}
                                        {pBase?.esDigital && (
                                            <div>
                                                <small style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                                                    🔒 Credenciales / Accesos Asignados:
                                                </small>
                                                <textarea 
                                                    rows={2}
                                                    placeholder="Credencial / Perfil / PIN asignado..."
                                                    value={item.metadataDigital} 
                                                    onChange={(e) => actualizarMetadata(item.idProducto, e.target.value)} 
                                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.78rem', resize: 'vertical', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        )}

                                        {/* Subtotal por Item */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                                            <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Subtotal calculado:</small>
                                            <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>C$ {item.subTotal}</strong>
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Resumen Final, Datos del Cliente y Métodos de Pago */}
                    {carrito.length > 0 && (
                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            
                            {/* Búsqueda y Selección de Cliente */}
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '4px' }}>Cliente Asociado</label>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Filtrar cliente por nombre..." 
                                    value={busquedaCliente} 
                                    onChange={e => setBusquedaCliente(e.target.value)} 
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '4px', boxSizing: 'border-box' }}
                                />
                                <select 
                                    value={idClienteSeleccionado || 0} 
                                    onChange={e => setIdClienteSeleccionado(Number(e.target.value))}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                >
                                    <option value={0}>Venta de Mostrador (Genérico)</option>
                                    {clientesFiltrados.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Método de Pago */}
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '4px' }}>Método de Pago</label>
                                <select 
                                    value={metodoPago} 
                                    onChange={e => setMetodoPago(e.target.value)}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito</option>
                                </select>
                            </div>

                            {/* Plazo del Crédito (si aplica) */}
                            {metodoPago === "Crédito" && (
                                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div>
                                        <label style={{ color: '#f87171', fontSize: '0.7rem', display: 'block' }}>Plazo del Crédito (Días)</label>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={diasCredito} 
                                            onChange={e => { 
                                                const dias = Number(e.target.value); 
                                                setDiasCredito(dias); 
                                                setFechaVencimientoCredito(obtenerFechaLocalISO(dias, fechaVenta)); 
                                            }} 
                                            style={{ width: '100%', background: '#1e293b', border: '1px solid #ef4444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: '#f87171', fontSize: '0.7rem', display: 'block' }}>Fecha de Vencimiento</label>
                                        <input 
                                            type="date" 
                                            value={fechaVencimientoCredito} 
                                            onChange={e => setFechaVencimientoCredito(e.target.value)} 
                                            style={{ width: '100%', background: '#1e293b', border: '1px solid #ef4444', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Margen de Utilidad */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                                <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Margen de Utilidad:</span>
                                <strong style={{ color: '#10b981', fontSize: '0.85rem' }}>C$ {margenGananciaTotal}</strong>
                            </div>

                            {/* Total Final y Botón de Cobro */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Total a cobrar:</span>
                                <strong style={{ color: '#38bdf8', fontSize: '1.4rem' }}>C$ {totalVenta}</strong>
                            </div>

                            <button 
                                onClick={finalizarVenta}
                                style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                            >
                                Procesar Factura
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE DESPACHO EXITOSO */}
            {mostrarModalDespacho && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
                        <FaCheckCircle style={{ color: '#10b981', fontSize: '2.5rem', margin: '0 auto' }} />
                        <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>¡Transacción Guardada!</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>La venta fue registrada. Elige la vía de despacho para el cliente:</p>

                        {datosUltimaVenta && datosUltimaVenta.cliente && datosUltimaVenta.cliente.id !== 0 ? (
                            <button 
                                onClick={() => enviarWhatsAppVenta(datosUltimaVenta)}
                                style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                            >
                                <FaWhatsapp /> Enviar Accesos (WhatsApp)
                            </button>
                        ) : (
                            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', color: '#f59e0b', fontSize: '0.75rem' }}>
                                Venta de mostrador sin WhatsApp vinculado.
                            </div>
                        )}

                        <button 
                            onClick={() => imprimirTicketTermico(datosUltimaVenta)}
                            style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            <FaPrint /> Imprimir Ticket
                        </button>

                        <button 
                            onClick={() => { setMostrarModalDespacho(false); setDatosUltimaVenta(null); }}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px' }}
                        >
                            Cerrar y Siguiente Venta
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL ERROR */}
            {mensajeErrorModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                        <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', margin: '0 auto' }} />
                        <h4 style={{ color: '#f87171', margin: 0 }}>Operación Denegada</h4>
                        <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>{mensajeErrorModal}</p>
                        <button onClick={() => setMensajeErrorModal(null)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', fontSize: '0.85rem' }}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};