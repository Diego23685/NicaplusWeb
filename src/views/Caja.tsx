import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { 
  FaTh, FaList, FaMoneyBillWave, FaTrashAlt, FaShoppingCart, FaUser, 
  FaSearch, FaTimes, FaCalendarAlt, FaWhatsapp, FaPrint, FaCheckCircle, 
  FaTags, FaThList, FaExclamationTriangle, FaBoxes, FaGamepad, FaTv, FaLayerGroup, FaShieldAlt,
  FaArrowLeft, FaChevronRight, FaKey, FaShareAlt
} from 'react-icons/fa';
import styles from '../assets/styles/Caja.module.css';

export interface VariacionProducto {
    id: number;
    productoPadreId?: number;
    sku?: string;
    nombreVariacion: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    color?: string;
    almacenamiento?: string;
}

interface Producto {
    id: number;
    nombre: string;
    descripcion?: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    esCodigoDigital?: boolean;
    requiereServicio: boolean;
    esSuscripcion: boolean;
    categoriaId: number | null;
    metadataDigital?: string;
    primerPerfilId?: number;
    diasDuracion?: number;
    garantiaDias?: number;
    tieneVariaciones?: boolean;
    variaciones?: VariacionProducto[];
}

interface Categoria {
    id: number;
    nombre: string;
}

interface ItemCarrito {
    idProducto: number;
    idVariacion?: number | null;
    nombre: string;
    descripcion?: string;
    cantidad: number;
    precioUnitario: number;
    precioCostoUnitario: number;
    subTotal: number;
    metadataDigital: string;
    diasSuscripcion: number;
    garantiaDias: number;
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
    if (fecha.getDate() !== day) {
        fecha.setDate(0);
    }
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

const extraerListaCodigos = (metaStr: string): string[] => {
    if (!metaStr) return [];
    return metaStr
        .split(/[\n|\|]+/)
        .map(linea => linea.trim())
        .filter(linea => Boolean(linea))
        .map(linea => linea.replace(/^C[ÓO]DIGO(\s*DISPONIBLE)?:\s*/i, '').trim())
        .filter(linea => Boolean(linea));
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
        "📦 *DETALLE DE PRODUCTOS & SERVICIOS*",
        ""
    ];

    let descuentoTotalAcumulado = 0;

    const procesarBloqueCredencialStreaming = (metaStr: string, indiceCredencial?: number) => {
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
        } 
        else if (accesosReales.includes('/')) {
            const subPartes = accesosReales.split('/');
            if (subPartes[0]) lineas.push(`   📧 *Correo:* ${subPartes[0].trim()}`);
            if (subPartes[1]) lineas.push(`   🔑 *Contraseña:* ${subPartes[1].trim()}`);
        } 
        else if (accesosReales) {
            lineas.push(`   🔑 *Datos / Acceso:* ${accesosReales}`);
        }
    };

    datosVenta.detalles.forEach((item: any, idx: number) => {
        const meta = item.metadataDigital || item.metadata || '';
        const esCodigo = meta.toUpperCase().includes('CÓDIGO') || meta.toUpperCase().includes('CODIGO');

        lineas.push(`*Artículo ${idx + 1}:* ${item.nombre || 'Servicio/Producto'}`);
        
        if (item.descripcion && item.descripcion.trim() && item.descripcion !== 'Sin descripción') {
            lineas.push(`   ℹ️ _${item.descripcion.trim()}_`);
        }

        lineas.push(`   🔹 *Cantidad:* ${item.cantidad}`);

        if (!esCodigo) {
            const gDias = item.garantiaDias !== undefined ? item.garantiaDias : 0;
            lineas.push(`   🛡️ *Garantía:* ${gDias > 0 ? `${gDias} días` : 'Sin garantía'}`);
        }

        if (item.descuento && item.descuento > 0) {
            const descPorItem = item.descuento * item.cantidad;
            descuentoTotalAcumulado += descPorItem;
            lineas.push(`   🎁 *Descuento aplicado:* -C$ ${descPorItem}`);
        }

        if (esCodigo) {
            const codigos = extraerListaCodigos(meta);
            lineas.push(`   🔑 *Código(s) Asignado(s):*`);
            codigos.forEach(cod => {
                lineas.push(`   \`${cod}\``);
            });
        } else if (meta) {
            const cuentasMultiples = meta.split(/\r?\n|;/).filter((c: string) => c.trim().length > 0);
            if (cuentasMultiples.length > 1) {
                cuentasMultiples.forEach((bloqueMeta: string, subIdx: number) => {
                    procesarBloqueCredencialStreaming(bloqueMeta, subIdx);
                });
            } else {
                procesarBloqueCredencialStreaming(meta);
            }
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
    lineas.push("📌 *TÉRMINOS Y CONDICIONES*:");
    lineas.push("- Los códigos digitales deben ser canjeados de inmediato.");
    lineas.push("- Para servicios con garantía, conserve este comprobante digital.");
    lineas.push("");
    lineas.push("¡Muchas gracias por su preferencia! 🤝");

    const mensajeFinal = lineas.join("\n");
    const urlWhatsApp = `https://api.whatsapp.com/send?phone=505${telefonoLimpio}&text=${encodeURIComponent(mensajeFinal)}`;
    
    window.open(urlWhatsApp, '_blank');
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
    const logoUrl = `${window.location.origin}/LogoNica.png`;

    const contenidoTicket = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Factura Nicaplus</title>
            <style>
                @page { margin: 0; }
                * { box-sizing: border-box; font-size: 12px !important; font-weight: 700 !important; color: #000000 !important; }
                html, body { width: 100%; margin: 0; padding: 0; }
                body { font-family: 'Courier New', Courier, monospace; width: 100%; padding: 8px 4px; line-height: 1.25; text-align: center; }
                .ticket-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .ticket-logo { max-width: 40%; max-height: 45px; height: auto; margin-bottom: 4px; filter: grayscale(100%) contrast(150%); }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .text-left { text-align: left; }
                .linea { border-bottom: 2px dashed #000; margin: 6px 0; width: 100%; }
                table { width: 100%; border-collapse: collapse; }
                .tabla-detalles td, .tabla-detalles th { vertical-align: top; padding: 2px 0; }
                .codigo-box { font-family: 'Courier New', monospace; font-size: 11px !important; letter-spacing: 0.5px; padding: 1px 0; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="ticket-wrapper">
                <img src="${logoUrl}" alt="Logo Nicaplus" class="ticket-logo" />
                <div class="text-center" style="width: 100%;">
                    NICAPLUS GAMING<br>
                    Tienda Digital y Taller Técnico<br>
                    León, Nicaragua<br>
                    Tel: +505 8888-8888
                </div>
                <div class="linea"></div>
                <div class="text-left" style="width: 100%;">
                    Factura: #000${datosVenta.ventaId || 1}<br>
                    Fecha: ${new Date().toLocaleDateString('es-NI')}<br>
                    Condición: ${escapeHtml(metodoUsado.toUpperCase())}<br>
                    Cliente: ${escapeHtml((datosVenta.cliente?.nombre || "Mostrador").substring(0, 24))}
                </div>
                <div class="linea"></div>
                <table class="tabla-detalles">
                    <thead>
                        <tr>
                            <th align="left">Cant/Desc</th>
                            <th align="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datosVenta.detalles.map((item: any) => {
                            const descPorItem = (item.descuento || 0) * item.cantidad;
                            descuentoTotalAcumulado += descPorItem;
                            const gDias = item.garantiaDias !== undefined ? item.garantiaDias : 0;
                            const meta = item.metadataDigital || '';
                            const esCodigo = meta.toUpperCase().includes('CÓDIGO') || meta.toUpperCase().includes('CODIGO');
                            const listaCodigos = esCodigo ? extraerListaCodigos(meta) : [];

                            return `
                                <tr>
                                    <td align="left">${item.cantidad}x ${escapeHtml((item.nombre || 'Producto').substring(0, 24))}</td>
                                    <td align="right">C$ ${item.subTotal}</td>
                                </tr>
                                ${item.descripcion && item.descripcion.trim() && item.descripcion !== 'Sin descripción' ? `
                                <tr>
                                    <td colspan="2" align="left" style="padding-left: 6px; font-size: 10px !important; color: #333 !important;">
                                        ${escapeHtml(item.descripcion.trim())}
                                    </td>
                                </tr>
                                ` : ''}
                                ${!esCodigo ? `
                                <tr>
                                    <td colspan="2" align="left" style="padding-left: 6px;">
                                        Garantía: ${gDias > 0 ? `${gDias} días` : 'Sin garantía'}
                                    </td>
                                </tr>
                                ` : ''}
                                ${item.descuento && item.descuento > 0 ? `
                                <tr>
                                    <td colspan="2" align="left" style="padding-left: 6px;">
                                        (Descto: -C$ ${descPorItem})
                                    </td>
                                </tr>
                                ` : ''}
                                ${esCodigo ? `
                                <tr>
                                    <td colspan="2" align="left" style="padding-left: 6px; padding-top: 2px;">
                                        ${listaCodigos.map(c => `<div class="codigo-box">🔑 ${escapeHtml(c)}</div>`).join('')}
                                    </td>
                                </tr>
                                ` : (meta ? `
                                <tr>
                                    <td colspan="2" align="left" style="padding-left: 6px; word-break: break-all;">
                                        ID: ${escapeHtml(meta.replace(/^DIAS:\d+\|/, ''))}
                                    </td>
                                </tr>
                                ` : '')}
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
                        <td align="left">TOTAL:</td>
                        <td align="right">C$ ${totalReal}</td>
                    </tr>
                </table>

                ${metodoUsado === "Crédito" && datosVenta.fechaVencimientoCreditoCongelado ? `
                <div style="margin-top: 4px;" class="text-center">
                    * VENCE AL CRÉDITO: ${new Date(datosVenta.fechaVencimientoCreditoCongelado + "T12:00:00").toLocaleDateString('es-NI')} *
                </div>
                ` : ''}

                <div class="linea"></div>
                <div class="text-center" style="margin-top: 6px; width: 100%;">
                    FIRMA DEL CLIENTE<br><br>
                    ______________________<br><br>   
                    ¡Gracias por tu preferencia!<br>
                    Canjee sus códigos de inmediato.
                </div>
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
    }, 500);
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

    // Navegación en móvil: Catálogo vs Carrito/Cobro
    const [seccionMovilActiva, setSeccionMovilActiva] = useState<'catalogo' | 'checkout'>('catalogo');

    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);
    const [filtroRubroCaja, setFiltroRubroCaja] = useState<'todos' | 'fisico' | 'digital' | 'streaming'>('todos');

    const [mostrarModalDespacho, setMostrarModalDespacho] = useState(false);
    const [datosUltimaVenta, setDatosUltimaVenta] = useState<any>(null);
    const [diasCredito, setDiasCredito] = useState(15);
    const [generandoImagen, setGenerandoImagen] = useState(false);
    const [mensajeErrorModal, setMensajeErrorModal] = useState<string | null>(null);

    // Modal de variantes
    const [productoParaSeleccionarVariante, setProductoParaSeleccionarVariante] = useState<Producto | null>(null);

    const ticketRenderRef = useRef<HTMLDivElement>(null);

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
    const totalCantidadItems = useMemo(() => carrito.reduce((sum, item) => sum + item.cantidad, 0), [carrito]);
    const totalCostoVenta = useMemo(() => carrito.reduce((sum, item) => sum + (item.precioCostoUnitario * item.cantidad), 0), [carrito]);
    const margenGananciaTotal = useMemo(() => totalVenta - totalCostoVenta, [totalVenta, totalCostoVenta]);

    const alHacerClicProducto = (producto: Producto) => {
        if (producto.tieneVariaciones && producto.variaciones && producto.variaciones.length > 0) {
            setProductoParaSeleccionarVariante(producto);
        } else {
            agregarAlCarrito(producto);
        }
    };

    const agregarVarianteAlCarrito = (productoPadre: Producto, variante: VariacionProducto) => {
        if (variante.stockActual < 1) {
            mostrarError(`La variante "${variante.nombreVariacion}" no cuenta con existencias disponibles.`);
            return;
        }

        const existe = carrito.find(item => item.idProducto === productoPadre.id && item.idVariacion === variante.id);

        if (existe) {
            if (variante.stockActual <= existe.cantidad) {
                mostrarError(`No hay suficiente stock disponible de "${productoPadre.nombre} (${variante.nombreVariacion})".`);
                return;
            }

            setCarrito(carrito.map(item => {
                if (item.idProducto === productoPadre.id && item.idVariacion === variante.id) {
                    const nuevaCant = item.cantidad + 1;
                    return {
                        ...item,
                        cantidad: nuevaCant,
                        subTotal: Math.round((item.precioUnitario - item.descuento) * nuevaCant)
                    };
                }
                return item;
            }));
        } else {
            setCarrito(prev => [...prev, {
                idProducto: productoPadre.id,
                idVariacion: variante.id,
                nombre: `${productoPadre.nombre} (${variante.nombreVariacion})`,
                descripcion: productoPadre.descripcion || '',
                cantidad: 1,
                precioUnitario: variante.precioVenta,
                precioCostoUnitario: variante.precioCosto,
                subTotal: variante.precioVenta,
                metadataDigital: '',
                diasSuscripcion: 30,
                garantiaDias: productoPadre.garantiaDias ?? 0,
                descuento: 0
            }]);
        }

        setProductoParaSeleccionarVariante(null);
    };

    const agregarAlCarrito = async (producto: Producto) => {
        const existe = carrito.find(item => item.idProducto === producto.id && !item.idVariacion);

        if (existe) {
            if (!producto.esDigital && !producto.requiereServicio && producto.stockActual <= existe.cantidad) {
                mostrarError(`No hay suficiente stock en inventario de "${producto.nombre}". Máximo disponible: ${producto.stockActual}.`);
                return;
            }

            let credencialesActualizadas = existe.metadataDigital;
            let listaIdsPerfiles = existe.idsPerfiles || [];

            if (producto.esSuscripcion || producto.esCodigoDigital) {
                try {
                    const paramsIgnorados = listaIdsPerfiles.filter(Boolean).join(',');
                    const res = await api.get(`/products/${producto.id}/siguiente-credencial`, {
                        params: { ignorados: paramsIgnorados }
                    });

                    if (res.data && res.data.disponible && res.data.metadataDigital && res.data.idPerfil) {
                        const nuevaCredencial = res.data.metadataDigital.trim();
                        credencialesActualizadas = credencialesActualizadas 
                            ? `${credencialesActualizadas}\n${nuevaCredencial}`
                            : nuevaCredencial;

                        listaIdsPerfiles = [...listaIdsPerfiles, res.data.idPerfil];
                    } else {
                        const tipoTexto = producto.esCodigoDigital ? "códigos" : "perfiles";
                        mostrarError(`⚠️ Stock límite alcanzado: No existen más ${tipoTexto} disponibles para "${producto.nombre}".`);
                        return;
                    }
                } catch (error) {
                    console.error('Error al solicitar credencial:', error);
                    mostrarError('Ocurrió un problema al consultar el inventario de códigos/cuentas.');
                    return;
                }
            }

            setCarrito(prev => prev.map(item => {
                if (item.idProducto === producto.id && !item.idVariacion) {
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
                mostrarError(`El producto "${producto.nombre}" no cuenta con existencias disponibles.`);
                return;
            }

            if ((producto.esSuscripcion || producto.esCodigoDigital) && producto.stockActual < 1) {
                const tipoTexto = producto.esCodigoDigital ? "códigos" : "perfiles";
                mostrarError(`No hay ${tipoTexto} disponibles para "${producto.nombre}".`);
                return;
            }

            const metadataDigital = producto.metadataDigital || '';
            const idsIniciales = (producto.primerPerfilId && producto.primerPerfilId > 0) ? [producto.primerPerfilId] : [];

            setCarrito(prevCarrito => [...prevCarrito, {
                idProducto: producto.id,
                idVariacion: null,
                nombre: producto.nombre,
                descripcion: producto.descripcion || '',
                cantidad: 1,
                precioUnitario: producto.precioVenta,
                precioCostoUnitario: producto.precioCosto,
                subTotal: producto.precioVenta,
                metadataDigital: metadataDigital,
                diasSuscripcion: producto.diasDuracion || 30,
                garantiaDias: producto.garantiaDias ?? 0,
                descuento: 0,
                idsPerfiles: idsIniciales
            }]);
        }
    };

    const cambiarGarantiaManual = (idProducto: number, idVariacion: number | null | undefined, garantia: number) => {
        const garantiaValida = Math.max(0, garantia);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto && item.idVariacion === idVariacion) {
                return { ...item, garantiaDias: garantiaValida };
            }
            return item;
        }));
    };

    const cambiarPrecioUnitarioManual = (idProducto: number, idVariacion: number | null | undefined, nuevoPrecio: number) => {
        const precioValidado = Math.max(0, nuevoPrecio);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto && item.idVariacion === idVariacion) {
                return { 
                    ...item, 
                    precioUnitario: precioValidado, 
                    subTotal: Math.round((precioValidado - item.descuento) * item.cantidad)
                };
            }
            return item;
        }));
    };

    const cambiarDescuentoManual = (idProducto: number, idVariacion: number | null | undefined, descuento: number) => {
        const descValidado = Math.max(0, descuento);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto && item.idVariacion === idVariacion) {
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

    const cambiarCantidadManual = (idProducto: number, idVariacion: number | null | undefined, cantidad: number) => {
        const cantValida = Math.max(0, cantidad);
        const productoBase = productos.find(p => p.id === idProducto);

        if (idVariacion && productoBase?.variaciones) {
            const varObj = productoBase.variaciones.find(v => v.id === idVariacion);
            if (varObj && cantValida > varObj.stockActual) {
                mostrarError(`Stock insuficiente para "${itemNombreFormateado(productoBase.nombre, varObj.nombreVariacion)}". Disponibles: ${varObj.stockActual}.`);
                return;
            }
        } else if (productoBase && !productoBase.esDigital && !productoBase.requiereServicio && cantValida > productoBase.stockActual) {
            mostrarError(`Stock insuficiente para "${productoBase.nombre}". Existencias: ${productoBase.stockActual}.`);
            return;
        }

        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto && item.idVariacion === idVariacion) {
                return { 
                    ...item, 
                    cantidad: cantValida, 
                    subTotal: Math.round((item.precioUnitario - item.descuento) * cantValida)
                };
            }
            return item;
        }));
    };

    const itemNombreFormateado = (nombrePadre: string, nombreVariacion: string) => `${nombrePadre} (${nombreVariacion})`;

    const actualizarDiasItemCarrito = (idProducto: number, idVariacion: number | null | undefined, dias: number) => {
        const diasValidados = Math.max(0, dias);
        setCarrito(prev => prev.map(item => {
            if (item.idProducto === idProducto && item.idVariacion === idVariacion) {
                const pBase = productos.find(p => p.id === idProducto);
                const diasBase = pBase?.diasDuracion || 30;
                const tarifaDiaria = pBase ? (pBase.precioVenta / diasBase) : (item.precioUnitario / 30);
                const nuevoPrecioProporcional = Math.round(tarifaDiaria * diasValidados);

                return { 
                    ...item, 
                    diasSuscripcion: diasValidados,
                    precioUnitario: nuevoPrecioProporcional,
                    subTotal: Math.round((nuevoPrecioProporcional - item.descuento) * item.cantidad)
                };
            }
            return item;
        }));
    };

    const aplicarMesesExactosCarrito = (idProducto: number, idVariacion: number | null | undefined, meses: number) => {
        if (meses < 1) return;
        const fechaFinCalculada = sumarMesesExactos(fechaVenta, meses);
        const diasReales = calcularDiasRealesEntreFechas(fechaVenta, fechaFinCalculada);
        actualizarDiasItemCarrito(idProducto, idVariacion, diasReales);
    };

    const eliminarDelCarrito = (idProducto: number, idVariacion: number | null | undefined) => {
        setCarrito(carrito.filter(item => !(item.idProducto === idProducto && item.idVariacion === idVariacion)));
    };

    const actualizarMetadata = (idProducto: number, idVariacion: number | null | undefined, valor: string) => {
        setCarrito(carrito.map(item => (item.idProducto === idProducto && item.idVariacion === idVariacion) ? { ...item, metadataDigital: valor } : item));
    };

    const limpiarCarrito = useCallback(() => setCarrito([]), []);

    // COMPARTIR DIRECTAMENTE A WHATSAPP O COPIAR AL PORTAPAPELES
    const compartirFacturaWhatsApp = async () => {
        if (!ticketRenderRef.current) return;
        try {
            setGenerandoImagen(true);
            const canvas = await html2canvas(ticketRenderRef.current, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `Factura_000${datosUltimaVenta?.ventaId || '1'}.png`, { type: 'image/png' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `Factura #${datosUltimaVenta?.ventaId}`,
                        text: `Factura de compra - Nicaplus Gaming`
                    });
                } else {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    alert("📋 Imagen copiada al portapapeles. Pégala directamente con Ctrl+V en WhatsApp Web.");
                    const tel = datosUltimaVenta?.cliente?.telefono?.replace(/[^0-9]/g, '') || '';
                    window.open(`https://web.whatsapp.com/send?phone=505${tel}`, '_blank');
                }
            }, 'image/png');
        } catch (error) {
            console.error("Error al compartir imagen:", error);
            mostrarError("No se pudo generar el archivo para compartir.");
        } finally {
            setGenerandoImagen(false);
        }
    };

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const faltaMetadata = carrito.some(item => {
            const p = productos.find(prod => prod.id === item.idProducto);
            return (p?.esSuscripcion || p?.esCodigoDigital) && !item.metadataDigital.trim();
        });

        if (faltaMetadata) {
            mostrarError("Debe ingresar o seleccionar las credenciales/códigos correspondientes para los productos digitales.");
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
                idVariacion: item.idVariacion || null,
                cantidad: item.cantidad < 1 ? 1 : item.cantidad,
                precioUnitario: item.precioUnitario,
                subTotal: Math.round((item.precioUnitario - (item.descuento || 0)) * (item.cantidad < 1 ? 1 : item.cantidad)),
                descuento: item.descuento || 0,
                garantiaDias: item.garantiaDias ?? 0,
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
            detalles: detallesMapeados
        };

        try {
            const res = await api.post('/ventas', payload);

            const detallesParaTicket = (res.data.detalles || detallesMapeados).map((item: any) => {
                const itemCarritoOriginal = carrito.find(c => c.idProducto === item.idProducto && c.idVariacion === item.idVariacion);
                
                return {
                    ...item,
                    nombre: itemCarritoOriginal ? itemCarritoOriginal.nombre : "Producto General",
                    descripcion: itemCarritoOriginal ? itemCarritoOriginal.descripcion : "",
                    diasSuscripcion: itemCarritoOriginal ? itemCarritoOriginal.diasSuscripcion : 30,
                    garantiaDias: itemCarritoOriginal ? itemCarritoOriginal.garantiaDias : (item.garantiaDias ?? 0),
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
            setSeccionMovilActiva('catalogo');

            const refreshRes = await api.get('/products');
            setProductos(refreshRes.data);
        } catch (err: any) {
            console.error("Error al procesar factura:", err);

            let mensajeExtraido = "Ocurrió un error en el servidor al intentar procesar la venta.";
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === 'string') mensajeExtraido = data;
                else if (data.mensaje) mensajeExtraido = data.mensaje;
                else if (data.title) mensajeExtraido = data.title;
                else mensajeExtraido = JSON.stringify(data);
            } else if (err.message) {
                mensajeExtraido = err.message;
            }

            mostrarError(mensajeExtraido);
        }
    };

    return (
        <div className={styles.container}>
            {/* SELECTOR DE PESTAÑAS PARA MÓVIL/TABLET */}
            <div className={styles.mobileTabsHeader}>
                <button 
                    onClick={() => setSeccionMovilActiva('catalogo')}
                    className={`${styles.tabBtn} ${seccionMovilActiva === 'catalogo' ? styles.tabBtnActive : ''}`}
                >
                    <FaBoxes /> Catálogo
                </button>
                <button 
                    onClick={() => setSeccionMovilActiva('checkout')}
                    className={`${styles.tabBtn} ${seccionMovilActiva === 'checkout' ? styles.tabBtnActive : ''}`}
                >
                    <FaShoppingCart /> Cobrar
                    {totalCantidadItems > 0 && (
                        <span className={styles.tabBadge}>{totalCantidadItems}</span>
                    )}
                </button>
            </div>

            <div className={styles.cajaWrapper}>
                
                {/* 1. PANEL IZQUIERDO: PRODUCTOS */}
                <div className={`${styles.panel} ${styles.productosPanel} ${seccionMovilActiva === 'checkout' ? styles.hideMobilePanel : ''}`}>
                    
                    <div className={styles.panelHeader}>
                        <h3>Inventario Disponible</h3>
                        <div className={styles.viewToggle}>
                            <button 
                                onClick={() => setVistaModo('cuadricula')} 
                                className={`${styles.toggleBtn} ${vistaModo === 'cuadricula' ? styles.toggleBtnActive : ''}`}
                                aria-label="Vista cuadrícula"
                            >
                                <FaTh />
                            </button>
                            <button 
                                onClick={() => setVistaModo('lista')} 
                                className={`${styles.toggleBtn} ${vistaModo === 'lista' ? styles.toggleBtnActive : ''}`}
                                aria-label="Vista lista"
                            >
                                <FaList />
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
                        {busquedaProducto && (
                            <button onClick={() => setBusquedaProducto('')} className={styles.clearSearchBtn}>
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    {/* FILTROS DE RUBRO */}
                    <div className={styles.categoriasScroll}>
                        <button 
                            onClick={() => setFiltroRubroCaja('todos')} 
                            className={`${styles.catBtn} ${filtroRubroCaja === 'todos' ? styles.catBtnActive : ''}`}
                        >
                            <FaLayerGroup size={12} /> Todos
                        </button>
                        <button 
                            onClick={() => setFiltroRubroCaja('fisico')} 
                            className={`${styles.catBtn} ${filtroRubroCaja === 'fisico' ? styles.catBtnActive : ''}`}
                        >
                            <FaBoxes size={12} /> Físicos
                        </button>
                        <button 
                            onClick={() => setFiltroRubroCaja('digital')} 
                            className={`${styles.catBtn} ${filtroRubroCaja === 'digital' ? styles.catBtnActive : ''}`}
                        >
                            <FaGamepad size={12} /> Digitales
                        </button>
                        <button 
                            onClick={() => setFiltroRubroCaja('streaming')} 
                            className={`${styles.catBtn} ${filtroRubroCaja === 'streaming' ? styles.catBtnActive : ''}`}
                        >
                            <FaTv size={12} /> Streaming
                        </button>
                    </div>

                    {/* FILTROS POR CATEGORÍA */}
                    <div className={styles.categoriasScroll}>
                        <button 
                            onClick={() => setCategoriaFiltroActiva(null)} 
                            className={`${styles.catBtn} ${categoriaFiltroActiva === null ? styles.catBtnActive : ''}`}
                        >
                            <FaThList size={12} /> Todas
                        </button>
                        {categorias.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setCategoriaFiltroActiva(c.id)} 
                                className={`${styles.catBtn} ${categoriaFiltroActiva === c.id ? styles.catBtnActive : ''}`}
                            >
                                <FaTags size={12} /> {c.nombre}
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
                                        onClick={() => alHacerClicProducto(p)} 
                                        className={styles.productCard}
                                    >
                                        <div className={styles.productImgContainer}>
                                            {p.imagenUrl ? (
                                                <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} loading="lazy" />
                                            ) : (
                                                <div className={styles.productNoImg}>SIN FOTO</div>
                                            )}
                                        </div>
                                        
                                        <div className={styles.productDetails}>
                                            <div className={styles.productName} title={p.nombre}>
                                                {p.nombre}
                                            </div>
                                            <div className={styles.productMetaRow}>
                                                <span className={styles.productPrice}>
                                                    {p.tieneVariaciones ? "Varía" : `C$ ${p.precioVenta.toLocaleString()}`}
                                                </span>
                                                {!p.tieneVariaciones && (
                                                    <small className={styles.productProfit}>+C$ {p.precioVenta - p.precioCosto}</small>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.productBadges}>
                                            <span className={`${styles.badge} ${
                                                p.tieneVariaciones 
                                                    ? styles.badgeVariantes 
                                                    : p.esSuscripcion 
                                                        ? styles.badgeRecurrente 
                                                        : p.esCodigoDigital 
                                                            ? styles.badgeDigital 
                                                            : p.esDigital 
                                                                ? styles.badgeDigital 
                                                                : p.requiereServicio 
                                                                    ? styles.badgeServicio 
                                                                    : styles.badgeFisico
                                            }`}>
                                                {p.tieneVariaciones 
                                                    ? "🎨 Variantes" 
                                                    : p.esSuscripcion 
                                                        ? "📺 Streaming" 
                                                        : p.esCodigoDigital 
                                                            ? "🔑 Código" 
                                                            : p.esDigital 
                                                                ? "🎮 Digital" 
                                                                : p.requiereServicio 
                                                                    ? "🛠️ Servicio" 
                                                                    : "📦 Físico"}
                                            </span>
                                            {(!p.esDigital || p.esCodigoDigital) && !p.requiereServicio && (
                                                <small className={`${styles.stockText} ${!p.tieneVariaciones && p.stockActual <= 3 ? styles.stockCritical : ''}`}>
                                                    {p.tieneVariaciones 
                                                        ? `${(p.variaciones || []).reduce((acc, v) => acc + (v.stockActual || 0), 0)} u.`
                                                        : `Cant: ${p.stockActual}`}
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
                                        onClick={() => alHacerClicProducto(p)} 
                                        className={styles.productRow}
                                    >
                                        <div className={styles.productRowLeft}>
                                            <div className={styles.productRowImg}>
                                                {p.imagenUrl ? (
                                                    <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} loading="lazy" />
                                                ) : (
                                                    <div className={styles.productNoImg}>N/A</div>
                                                )}
                                            </div>
                                            <div className={styles.productRowInfo}>
                                                <strong className={styles.productRowName} title={p.nombre}>
                                                    {p.nombre}
                                                </strong>
                                                <small className={styles.productRowSub}>
                                                    {p.tieneVariaciones 
                                                        ? `🎨 Variantes (${p.variaciones?.length || 0} opciones)`
                                                        : p.esSuscripcion 
                                                            ? "📺 Streaming" 
                                                            : p.esCodigoDigital 
                                                                ? `🔑 Códigos Disp: ${p.stockActual}` 
                                                                : p.esDigital 
                                                                    ? "🎮 Recarga Digital" 
                                                                    : p.requiereServicio 
                                                                        ? "Servicio Técnico" 
                                                                        : `Disponibles: ${p.stockActual}`}
                                                </small>
                                            </div>
                                        </div>
                                        <span className={styles.productPrice}>
                                            {p.tieneVariaciones ? "Varía" : `C$ ${p.precioVenta.toLocaleString()}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. PANEL DERECHO: CARRITO Y CHECKOUT */}
                <div className={`${styles.panel} ${styles.carritoPanel} ${seccionMovilActiva === 'catalogo' ? styles.hideMobilePanel : ''}`}>
                    
                    <div className={styles.carritoHeader}>
                        <div className={styles.mobileBackRow}>
                            <button onClick={() => setSeccionMovilActiva('catalogo')} className={styles.mobileBackBtn}>
                                <FaArrowLeft /> Volver al catálogo
                            </button>
                        </div>
                        <div className={styles.carritoTitleRow}>
                            <h4 className={styles.carritoTitle}>
                                <FaShoppingCart className={styles.textCyan} /> Resumen de Orden ({totalCantidadItems})
                            </h4>
                            {carrito.length > 0 && (
                                <button onClick={limpiarCarrito} className={styles.vaciarBtn}>
                                    <FaTrashAlt /> Vaciar
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Lista de Items */}
                    <div className={styles.cartItemsScroll}>
                        {carrito.length === 0 ? (
                            <div className={styles.cartEmpty}>
                                <FaShoppingCart size={28} className={styles.cartEmptyIcon} />
                                <p>No hay productos agregados</p>
                                <button onClick={() => setSeccionMovilActiva('catalogo')} className={styles.btnExplore}>
                                    Explorar productos
                                </button>
                            </div>
                        ) : (
                            carrito.map(item => {
                                const pBase = productos.find(p => p.id === item.idProducto);
                                return (
                                    <div key={`${item.idProducto}-${item.idVariacion || 'base'}`} className={styles.cartItem}>
                                        <div className={styles.cartItemTop}>
                                            <div className={styles.cartItemTitleWrap}>
                                                <button onClick={() => eliminarDelCarrito(item.idProducto, item.idVariacion)} className={styles.eliminarItemBtn} title="Eliminar artículo">
                                                    <FaTimes />
                                                </button>
                                                <span className={styles.cartItemName}>
                                                    {item.nombre} 
                                                    {pBase?.esSuscripcion && <span className={styles.textRed}> (📺)</span>}
                                                    {pBase?.esCodigoDigital && <span style={{ color: '#10b981' }}> (🔑)</span>}
                                                </span>
                                            </div>
                                            <strong className={styles.cartItemSubtotal}>C$ {item.subTotal.toLocaleString()}</strong>
                                        </div>

                                        {/* Fila de Controles Numéricos */}
                                        <div className={styles.cartItemControls}>
                                            <div className={styles.controlBox}>
                                                <label>Cant:</label>
                                                <input 
                                                    type="number" 
                                                    min={1} 
                                                    value={item.cantidad === 0 ? '' : item.cantidad} 
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => cambiarCantidadManual(item.idProducto, item.idVariacion, e.target.value === '' ? 0 : Number(e.target.value))} 
                                                    onBlur={() => {
                                                        if (item.cantidad < 1) cambiarCantidadManual(item.idProducto, item.idVariacion, 1);
                                                    }}
                                                    className={styles.touchInput} 
                                                />
                                            </div>

                                            <div className={styles.controlBox}>
                                                <label>P.Unit:</label>
                                                <input 
                                                    type="number" 
                                                    min={0} 
                                                    value={item.precioUnitario === 0 ? '' : item.precioUnitario} 
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => cambiarPrecioUnitarioManual(item.idProducto, item.idVariacion, e.target.value === '' ? 0 : Number(e.target.value))} 
                                                    className={styles.touchInput} 
                                                />
                                            </div>

                                            <div className={styles.controlBox}>
                                                <label className={styles.labelDiscount}>Desc:</label>
                                                <input 
                                                    type="number" 
                                                    min={0} 
                                                    max={item.precioUnitario} 
                                                    value={item.descuento === 0 ? '' : item.descuento} 
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => cambiarDescuentoManual(item.idProducto, item.idVariacion, e.target.value === '' ? 0 : Number(e.target.value))} 
                                                    className={styles.touchInput} 
                                                />
                                            </div>

                                            {!pBase?.esCodigoDigital && (
                                                <div className={styles.controlBox}>
                                                    <label className={styles.labelWarranty}><FaShieldAlt size={8} /> Gar(d):</label>
                                                    <input 
                                                        type="number" 
                                                        min={0} 
                                                        value={item.garantiaDias === 0 ? '' : item.garantiaDias} 
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => cambiarGarantiaManual(item.idProducto, item.idVariacion, e.target.value === '' ? 0 : Number(e.target.value))} 
                                                        placeholder="0"
                                                        className={styles.touchInput} 
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {pBase?.esSuscripcion && (
                                            <div className={styles.subscriptionRow}>
                                                <div className={styles.controlBox}>
                                                    <label className={styles.textRed}>Días:</label>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        value={item.diasSuscripcion === 0 ? '' : item.diasSuscripcion} 
                                                        onFocus={(e) => e.target.select()}
                                                        onChange={(e) => actualizarDiasItemCarrito(item.idProducto, item.idVariacion, e.target.value === '' ? 0 : Number(e.target.value))} 
                                                        onBlur={() => {
                                                            if (item.diasSuscripcion < 1) actualizarDiasItemCarrito(item.idProducto, item.idVariacion, 1);
                                                        }}
                                                        className={styles.touchInput} 
                                                    />
                                                </div>

                                                <div className={styles.controlBoxFlex}>
                                                    <label>Meses Exactos:</label>
                                                    <select 
                                                        onChange={(e) => {
                                                            const m = Number(e.target.value);
                                                            if (m > 0) aplicarMesesExactosCarrito(item.idProducto, item.idVariacion, m);
                                                        }}
                                                        className={styles.touchSelect}
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

                                        {pBase?.esDigital && (
                                            <div className={styles.credentialsWrap}>
                                                <label className={pBase.esCodigoDigital ? styles.textGreen : styles.textCyan}>
                                                    {pBase.esCodigoDigital ? '🔑 Códigos Asignados (Auto):' : '🔒 Credenciales / Datos:'}
                                                </label>
                                                <textarea 
                                                    rows={2}
                                                    placeholder={pBase.esCodigoDigital ? "No hay códigos disponibles en inventario..." : "Ingrese los accesos o datos del servicio..."}
                                                    value={item.metadataDigital} 
                                                    onChange={(e) => actualizarMetadata(item.idProducto, item.idVariacion, e.target.value)} 
                                                    className={styles.touchTextarea} 
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Checkout Form */}
                    <div className={styles.carritoFooter}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}><FaUser size={10} /> Cliente Asociado</label>
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar por nombre o móvil..." 
                                value={busquedaCliente} 
                                onChange={e => setBusquedaCliente(e.target.value)} 
                                className={styles.searchInput}
                            />
                            <select 
                                value={idClienteSeleccionado || 0} 
                                onChange={e => { 
                                    const val = Number(e.target.value);
                                    setIdClienteSeleccionado(val); 
                                    const selectText = e.target.options[e.target.selectedIndex].text; 
                                    if (val !== 0) setBusquedaCliente(selectText.split(' (')[0]); 
                                }} 
                                className={styles.touchSelect}
                            >
                                <option value={0}>Venta de Mostrador (Genérico)</option>
                                {clientesFiltrados.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formRowDual}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Método de Pago</label>
                                <select 
                                    value={metodoPago} 
                                    onChange={e => setMetodoPago(e.target.value)} 
                                    className={styles.touchSelect}
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Fecha Venta</label>
                                <input 
                                    type="date" 
                                    value={fechaVenta} 
                                    onChange={e => { 
                                        const nuevaFechaVenta = e.target.value; 
                                        setFechaVenta(nuevaFechaVenta); 
                                        setFechaVencimientoCredito(obtenerFechaLocalISO(diasCredito, nuevaFechaVenta)); 
                                    }} 
                                    className={styles.touchInputDate}
                                />
                            </div>
                        </div>

                        {metodoPago === "Crédito" && (
                            <div className={styles.creditoBox}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabelRed}>Plazo (Días)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={diasCredito === 0 ? '' : diasCredito} 
                                        onFocus={(e) => e.target.select()}
                                        onChange={e => { 
                                            const val = e.target.value === '' ? 0 : Number(e.target.value); 
                                            setDiasCredito(val); 
                                            setFechaVencimientoCredito(obtenerFechaLocalISO(val, fechaVenta)); 
                                        }} 
                                        onBlur={() => {
                                            if (diasCredito < 1) {
                                                setDiasCredito(1);
                                                setFechaVencimientoCredito(obtenerFechaLocalISO(1, fechaVenta));
                                            }
                                        }}
                                        className={styles.touchInput} 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabelRed}><FaCalendarAlt size={10} /> Vence</label>
                                    <input 
                                        type="date" 
                                        value={fechaVencimientoCredito} 
                                        onChange={e => setFechaVencimientoCredito(e.target.value)} 
                                        className={styles.touchInputDate} 
                                    />
                                </div>
                            </div>
                        )}

                        {carrito.length > 0 && (
                            <div className={styles.utilityBadge}>
                                <FaMoneyBillWave className={styles.textPurple} />
                                <span>Utilidad: <strong className={styles.textGreen}>C$ {margenGananciaTotal.toLocaleString()}</strong></span>
                            </div>
                        )}

                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Monto Total:</span>
                            <strong className={styles.totalAmount}>C$ {totalVenta.toLocaleString()}</strong>
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

            {/* BARRA FLOTANTE DE ACCESO RÁPIDO EN MÓVIL */}
            {seccionMovilActiva === 'catalogo' && carrito.length > 0 && (
                <div className={styles.mobileFloatingBar}>
                    <div className={styles.floatingBarInfo}>
                        <span className={styles.floatingBadge}>{totalCantidadItems} ítems</span>
                        <strong className={styles.floatingTotal}>C$ {totalVenta.toLocaleString()}</strong>
                    </div>
                    <button 
                        onClick={() => setSeccionMovilActiva('checkout')}
                        className={styles.floatingBarBtn}
                    >
                        Ver Orden <FaChevronRight size={12} />
                    </button>
                </div>
            )}

            {/* MODAL SELECCIONADOR DE VARIANTE */}
            {productoParaSeleccionarVariante && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                Opciones: <span className={styles.textCyan}>{productoParaSeleccionarVariante.nombre}</span>
                            </h3>
                            <button onClick={() => setProductoParaSeleccionarVariante(null)} className={styles.modalCloseBtn}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.variantList}>
                            {productoParaSeleccionarVariante.variaciones?.map((v) => (
                                <button
                                    key={v.id}
                                    disabled={v.stockActual <= 0}
                                    onClick={() => agregarVarianteAlCarrito(productoParaSeleccionarVariante, v)}
                                    className={`${styles.variantOptionBtn} ${v.stockActual <= 0 ? styles.variantDisabled : ''}`}
                                >
                                    <div>
                                        <strong className={styles.variantTitle}>{v.nombreVariacion}</strong>
                                        <small className={v.stockActual <= 0 ? styles.textRed : styles.textGreen}>
                                            {v.stockActual > 0 ? `Stock: ${v.stockActual} u.` : 'Agotado'}
                                        </small>
                                    </div>
                                    <span className={styles.variantPrice}>
                                        C$ {v.precioVenta.toLocaleString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ERROR */}
            {mensajeErrorModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentRed}>
                        <div className={styles.modalIconRed}>
                            <FaExclamationTriangle />
                        </div>
                        <h3 className={styles.modalTitleRed}>Operación Denegada</h3>
                        <p className={styles.modalText}>{mensajeErrorModal}</p>
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setMensajeErrorModal(null)} 
                                className={styles.btnModalSecondary}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DESPACHO EXITOSO */}
            {mostrarModalDespacho && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalIconGreen}><FaCheckCircle /></div>
                        <h3 className={styles.modalTitle}>¡Transacción Guardada!</h3>
                        <p className={styles.modalText}>La venta se registró correctamente. Selecciona la vía de despacho:</p>
                        
                        <div className={styles.modalActions}>
                            {datosUltimaVenta && datosUltimaVenta.cliente && datosUltimaVenta.cliente.id !== 0 ? (
                                <button 
                                    onClick={() => enviarWhatsAppVenta(datosUltimaVenta)} 
                                    className={styles.btnWhatsapp}
                                >
                                    <FaWhatsapp size={18} /> Enviar Texto (WhatsApp)
                                </button>
                            ) : (
                                <div className={styles.warningBanner}>
                                    Venta de mostrador: No vinculada a número de WhatsApp.
                                </div>
                            )}

                            <button 
                                onClick={compartirFacturaWhatsApp} 
                                disabled={generandoImagen}
                                className={styles.btnModalSecondary}
                                style={{ background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <FaShareAlt size={16} /> {generandoImagen ? 'Generando imagen...' : 'Compartir Factura (PNG)'}
                            </button>

                            <button 
                                onClick={() => imprimirTicketTermico(datosUltimaVenta)} 
                                className={styles.btnPrint}
                            >
                                <FaPrint /> Imprimir Ticket
                            </button>
                            <button 
                                onClick={() => { setMostrarModalDespacho(false); setDatosUltimaVenta(null); }} 
                                className={styles.btnClose}
                            >
                                Siguiente Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RENDER INVISIBLE PARA CONVERSIÓN A IMAGEN (HTML2CANVAS) */}
            {datosUltimaVenta && (
                <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                    <div 
                        ref={ticketRenderRef} 
                        style={{
                            width: '380px',
                            background: '#ffffff',
                            color: '#000000',
                            padding: '24px 18px',
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '13px',
                            fontWeight: 'bold',
                            lineHeight: 1.3
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <img 
                                src={`${window.location.origin}/LogoNica.png`} 
                                alt="Logo" 
                                style={{ maxWidth: '140px', maxHeight: '55px', height: 'auto', filter: 'grayscale(100%) contrast(150%)', marginBottom: '6px' }}
                                crossOrigin="anonymous" 
                            />
                            <div style={{ fontSize: '14px', fontWeight: 900 }}>NICAPLUS GAMING</div>
                            <div>Tienda Digital y Taller Técnico</div>
                            <div>León, Nicaragua | Tel: +505 8888-8888</div>
                        </div>

                        <div style={{ borderBottom: '2px dashed #000', margin: '8px 0' }} />

                        <div>
                            <div>Factura: #000{datosUltimaVenta.ventaId || 1}</div>
                            <div>Fecha: {new Date().toLocaleDateString('es-NI')}</div>
                            <div>Condición: {(datosUltimaVenta.metodoPagoCongelado || 'Efectivo').toUpperCase()}</div>
                            <div>Cliente: {datosUltimaVenta.cliente?.nombre || 'Mostrador'}</div>
                        </div>

                        <div style={{ borderBottom: '2px dashed #000', margin: '8px 0' }} />

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr>
                                    <th align="left" style={{ paddingBottom: '4px' }}>Cant/Desc</th>
                                    <th align="right" style={{ paddingBottom: '4px' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosUltimaVenta.detalles.map((item: any, idx: number) => {
                                    const meta = item.metadataDigital || '';
                                    const esCodigo = meta.toUpperCase().includes('CÓDIGO') || meta.toUpperCase().includes('CODIGO');
                                    const listaCodigos = esCodigo ? extraerListaCodigos(meta) : [];

                                    return (
                                        <React.Fragment key={idx}>
                                            <tr>
                                                <td align="left">{item.cantidad}x {item.nombre}</td>
                                                <td align="right">C$ {item.subTotal}</td>
                                            </tr>
                                            {item.descripcion && item.descripcion.trim() && item.descripcion !== 'Sin descripción' && (
                                                <tr>
                                                    <td colSpan={2} align="left" style={{ paddingLeft: '6px', fontSize: '11px', color: '#444' }}>
                                                        {item.descripcion.trim()}
                                                    </td>
                                                </tr>
                                            )}
                                            {!esCodigo && (
                                                <tr>
                                                    <td colSpan={2} align="left" style={{ paddingLeft: '6px', fontSize: '11px' }}>
                                                        Garantía: {item.garantiaDias > 0 ? `${item.garantiaDias} días` : 'Sin garantía'}
                                                    </td>
                                                </tr>
                                            )}
                                            {item.descuento > 0 && (
                                                <tr>
                                                    <td colSpan={2} align="left" style={{ paddingLeft: '6px', fontSize: '11px' }}>
                                                        (Descto: -C$ {item.descuento * item.cantidad})
                                                    </td>
                                                </tr>
                                            )}
                                            {esCodigo ? (
                                                <tr>
                                                    <td colSpan={2} align="left" style={{ paddingLeft: '6px', paddingTop: '2px' }}>
                                                        {listaCodigos.map((c, cIdx) => (
                                                            <div key={cIdx} style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', letterSpacing: '0.5px' }}>
                                                                🔑 {c}
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            ) : (meta && (
                                                <tr>
                                                    <td colSpan={2} align="left" style={{ paddingLeft: '6px', fontSize: '11px', wordBreak: 'break-all' }}>
                                                        ID: {meta.replace(/^DIAS:\d+\|/, '')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div style={{ borderBottom: '2px dashed #000', margin: '8px 0' }} />

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td align="left">TOTAL:</td>
                                    <td align="right" style={{ fontSize: '15px', fontWeight: 900 }}>
                                        C$ {datosUltimaVenta.totalCongelado || datosUltimaVenta.detalles.reduce((acc: number, d: any) => acc + (d.subTotal || 0), 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div style={{ borderBottom: '2px dashed #000', margin: '8px 0' }} />

                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                            <div>¡Gracias por su compra!</div>
                            <div style={{ fontSize: '11px' }}>Canjee sus códigos o conserve su ticket.</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};