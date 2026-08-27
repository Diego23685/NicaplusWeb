import React, { useState, useEffect, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import api from '../services/api';
import { 
    FaEdit, 
    FaTimes, 
    FaCalendarAlt, 
    FaFilePdf, 
    FaSearch, 
    FaPrint, 
    FaWhatsapp, 
    FaChevronLeft, 
    FaChevronRight,
    FaShoppingCart,
    FaExchangeAlt,
    FaLock,
    FaTrash,
    FaShareAlt
} from 'react-icons/fa';
import { imprimirTicketTermico, enviarWhatsAppVenta } from './Caja';
import styles from '../assets/styles/Reportes.module.css';

const extraerListaCodigos = (metaStr: string): string[] => {
    if (!metaStr) return [];
    return metaStr
        .split(/[\n|\|]+/)
        .map(linea => linea.trim())
        .filter(linea => Boolean(linea))
        .map(linea => linea.replace(/^C[ÓO]DIGO(\s*DISPONIBLE)?:\s*/i, '').trim())
        .filter(linea => Boolean(linea));
};

export const Reportes: React.FC = () => {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [datosReporte, setDatosReporte] = useState<any>(null);
    const [cargandoReporte, setCargandoReporte] = useState(false);

    const [clienteFiltro, setClienteFiltro] = useState<string>('');
    const [rubroFiltro, setRubroFiltro] = useState<string>('Todos');

    const [fechaReferenciaMes, setFechaReferenciaMes] = useState<Date>(new Date());

    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    const [ventasHistorial, setVentasHistorial] = useState<any[]>([]);
    const [busquedaFactura, setBusquedaFactura] = useState('');
    const [cargandoTabla, setCargandoTabla] = useState(true);

    const [tabAuditoria, setTabAuditoria] = useState<'ventas' | 'compras' | 'caja'>('ventas');

    const [ventaAEditar, setVentaAEditar] = useState<any | null>(null);
    const [nuevoMetodoPago, setMetodoPago] = useState('');
    const [detallesEditados, setDetallesEditados] = useState<any[]>([]);

    // Estados y Referencia para la generación de imagen
    const [ventaParaImagen, setVentaParaImagen] = useState<any | null>(null);
    const [, setGenerandoImagen] = useState(false);
    const ticketRenderRef = useRef<HTMLDivElement>(null);

    const formatearLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    };

    const obtenerNombreCliente = useCallback((v: any, listaClientes: any[] = clientes): string => {
        if (!v) return 'Mostrador General';

        const objCli = v.cliente || v.Cliente;
        if (objCli) {
            const nom = objCli.nombre ?? objCli.Nombre ?? objCli.razonSocial ?? objCli.RazonSocial;
            if (nom && typeof nom === 'string' && nom.trim() !== '') return nom.trim();
        }

        const nomPlano = v.clienteNombre ?? v.ClienteNombre ?? v.nombreCliente ?? v.NombreCliente;
        if (nomPlano && typeof nomPlano === 'string' && nomPlano.trim() !== '') return nomPlano.trim();

        const idCli = v.idCliente ?? v.IdCliente ?? v.clienteId ?? v.ClienteId;
        if (idCli && Number(idCli) > 0) {
            const encontrado = listaClientes.find(c => (c.id ?? c.Id) === Number(idCli));
            if (encontrado) {
                const nomEnc = encontrado.nombre ?? encontrado.Nombre ?? encontrado.razonSocial ?? encontrado.RazonSocial;
                if (nomEnc) return nomEnc;
            }
        }

        return 'Mostrador General';
    }, [clientes]);

    const cargarDatosIniciales = useCallback(async () => {
        setCargandoTabla(true);
        try {
            const [resVentas, resClientes, resProd] = await Promise.all([
                api.get('/ventas'),
                api.get('/clientes'),
                api.get('/products')
            ]);

            setClientes(resClientes.data || []);
            setProductos(resProd.data || []);
            setVentasHistorial(resVentas.data || []);
        } catch (err) {
            console.error("Error sincronizando catálogos de reportes:", err);
        } finally {
            setCargandoTabla(false);
        }
    }, []);

    const perteneceAlRubro = (prod: any, rubro: string) => {
        if (!prod) return false;
        const esJuego = (prod.juegoId ?? prod.JuegoId) != null;
        const esSuscripcion = prod.esSuscripcion ?? prod.EsSuscripcion ?? false;
        const esDigital = prod.esDigital ?? prod.EsDigital ?? false;

        switch (rubro.toLowerCase()) {
            case 'videojuegos':
                return esJuego;
            case 'streaming':
                return (esSuscripcion || esDigital) && !esJuego;
            case 'tienda':
                return !esSuscripcion && !esDigital && !esJuego;
            default:
                return true;
        }
    };

    const aplicarRangoRapido = (tipo: 'hoy' | 'semana' | 'mes' | 'mesPasado' | 'ano') => {
        const hoy = new Date();
        const opciones = { timeZone: 'America/Managua', year: 'numeric' as const, month: '2-digit' as const, day: '2-digit' as const };
        const [year, month, day] = new Intl.DateTimeFormat('fr-CA', opciones).format(hoy).split('-');
        
        let fInicio = new Date(`${year}-${month}-${day}T00:00:00`);
        let fFin = new Date(`${year}-${month}-${day}T00:00:00`);

        if (tipo === 'semana') {
            const diaSemana = fInicio.getDay() === 0 ? 7 : fInicio.getDay();
            fInicio.setDate(fInicio.getDate() - (diaSemana - 1));
        } else if (tipo === 'mes') {
            fInicio = new Date(Number(year), Number(month) - 1, 1);
            fFin = new Date(Number(year), Number(month), 0);
            setFechaReferenciaMes(new Date(Number(year), Number(month) - 1, 1));
        } else if (tipo === 'mesPasado') {
            fInicio = new Date(Number(year), Number(month) - 2, 1);
            fFin = new Date(Number(year), Number(month) - 1, 0);
            setFechaReferenciaMes(new Date(Number(year), Number(month) - 2, 1));
        } else if (tipo === 'ano') {
            fInicio = new Date(Number(year), 0, 1);
        }

        setDesde(formatearLocal(fInicio));
        setHasta(formatearLocal(fFin));
    };

    const cambiarMesRelativo = (deltaMeses: number) => {
        const nuevaFecha = new Date(fechaReferenciaMes);
        nuevaFecha.setMonth(nuevaFecha.getMonth() + deltaMeses);
        setFechaReferenciaMes(nuevaFecha);

        const primerDia = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1);
        const ultimoDia = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth() + 1, 0);

        setDesde(formatearLocal(primerDia));
        setHasta(formatearLocal(ultimoDia));
    };

    const ConsultarReporte = async () => {
        if (!desde || !hasta) {
            alert("Por favor seleccione ambas fechas.");
            return;
        }
        setCargandoReporte(true);
        try {
            let url = `/reportes/personalizado?desde=${desde}&hasta=${hasta}`;
            if (clienteFiltro) url += `&idCliente=${clienteFiltro}`;
            if (rubroFiltro && rubroFiltro !== 'Todos') url += `&rubro=${rubroFiltro}`;

            const res = await api.get(url);
            setDatosReporte(res.data);
        } catch {
            alert("Error al generar el reporte.");
        } finally {
            setCargandoReporte(false);
        }
    };

    useEffect(() => {
        aplicarRangoRapido('hoy');
        cargarDatosIniciales();
    }, [cargarDatosIniciales]);

    useEffect(() => {
        if (desde && hasta) {
            ConsultarReporte();
        }
    }, [desde, hasta]);

    const ventasFiltradas = ventasHistorial.filter(v => {
        const nombreResuelto = obtenerNombreCliente(v);
        const coincideTexto = v.id.toString().includes(busquedaFactura) || 
            nombreResuelto.toLowerCase().includes(busquedaFactura.toLowerCase());

        if (!coincideTexto) return false;

        if (clienteFiltro) {
            const idCliVenta = v.idCliente ?? v.IdCliente ?? v.clienteId ?? v.ClienteId;
            if (Number(idCliVenta) !== Number(clienteFiltro)) return false;
        }

        if (rubroFiltro && rubroFiltro !== 'Todos') {
            const contieneProductoDelRubro = v.detalles?.some((d: any) => {
                const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                return perteneceAlRubro(prod, rubroFiltro);
            });
            if (!contieneProductoDelRubro) return false;
        }

        return true;
    });

    const abrirEditorVenta = (venta: any) => {
        setVentaAEditar(venta);
        setMetodoPago(venta.metodoPago ?? venta.MetodoPago ?? 'Efectivo');
        
        const detallesConNombre = (venta.detalles || []).map((d: any) => {
            const prodEncontrado = productos.find(p => (p.id ?? p.Id) === d.idProducto);
            return {
                ...d,
                nombre: prodEncontrado ? (prodEncontrado.nombre ?? prodEncontrado.Nombre) : (d.producto?.nombre || d.producto?.Nombre || `Producto #${d.idProducto}`)
            };
        });
        
        setDetallesEditados(detallesConNombre);
    };

    const eliminarVentaCompleta = async (id: number) => {
        if (!window.confirm(`¿Está completamente seguro de ELIMINAR la factura #000${id}? Esta acción revertirá inventarios y eliminará el ingreso de caja de forma permanente.`)) return;
        
        try {
            const res = await api.delete(`/ventas/${id}`);
            alert(res.data?.mensaje || "Venta eliminada e inventarios restaurados.");
            setVentaAEditar(null);
            cargarDatosIniciales();
            if (desde && hasta) ConsultarReporte(); 
        } catch (err: any) {
            alert(err.response?.data?.mensaje || err.response?.data || "Error al eliminar la venta.");
        }
    };

    const cambiarProductoDetalle = (index: number, idProd: number) => {
        const prodSeleccionado = productos.find(p => (p.id ?? p.Id) === idProd);
        if (!prodSeleccionado) return;

        const copia = [...detallesEditados];
        const nuevoPrecio = prodSeleccionado.precio ?? prodSeleccionado.Precio ?? prodSeleccionado.precioVenta ?? 0;
        copia[index].idProducto = idProd;
        copia[index].nombre = prodSeleccionado.nombre ?? prodSeleccionado.Nombre; 
        copia[index].precioUnitario = nuevoPrecio; 
        
        const cant = Number(copia[index].cantidad) || 0;
        const desc = Number(copia[index].descuento) || 0;
        copia[index].subTotal = (cant * nuevoPrecio) - desc;
        setDetallesEditados(copia);
    };

    const actualizarPrecioDetalle = (index: number, valStr: string) => {
        const copia = [...detallesEditados];
        const nuevoPrecio = valStr === '' ? 0 : Number(valStr);
        copia[index].precioUnitario = valStr === '' ? '' : nuevoPrecio;
        
        const cant = Number(copia[index].cantidad) || 0;
        const desc = Number(copia[index].descuento) || 0;
        copia[index].subTotal = (cant * nuevoPrecio) - desc;
        setDetallesEditados(copia);
    };

    const actualizarCantidadDetalle = (index: number, valStr: string) => {
        const copia = [...detallesEditados];
        const nuevaCantidad = valStr === '' ? 0 : Number(valStr);
        copia[index].cantidad = valStr === '' ? '' : nuevaCantidad;
        
        const precio = Number(copia[index].precioUnitario) || 0;
        const desc = Number(copia[index].descuento) || 0;
        copia[index].subTotal = (nuevaCantidad * precio) - desc;
        setDetallesEditados(copia);
    };

    const actualizarDescuentoDetalle = (index: number, valStr: string) => {
        const copia = [...detallesEditados];
        const nuevoDescuento = valStr === '' ? 0 : Math.max(0, Number(valStr));
        copia[index].descuento = valStr === '' ? '' : nuevoDescuento;
        
        const cant = Number(copia[index].cantidad) || 0;
        const precio = Number(copia[index].precioUnitario) || 0;
        copia[index].subTotal = (cant * precio) - nuevoDescuento;
        setDetallesEditados(copia);
    };

    const actualizarDiasSuscripcion = (index: number, valStr: string) => {
        const copia = [...detallesEditados];
        const diasNum = valStr === '' ? '' : Number(valStr);
        const diasValidos = typeof diasNum === 'number' && diasNum > 0 ? diasNum : 30;
        
        let metaActual = copia[index].metadataDigital || '';
        
        if (metaActual.startsWith("DIAS:")) {
            const partes = metaActual.split('|');
            partes[0] = `DIAS:${diasValidos}`;
            copia[index].metadataDigital = partes.join('|');
        } else {
            copia[index].metadataDigital = metaActual 
                ? `DIAS:${diasValidos}|${metaActual}` 
                : `DIAS:${diasValidos}`;
        }
        
        copia[index].diasTemporales = diasNum;
        setDetallesEditados(copia);
    };

    const procesarAuditoriaVenta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventaAEditar) return;

        const detallesSaneados = detallesEditados.map(d => ({
            ...d,
            cantidad: Number(d.cantidad) || 1,
            precioUnitario: Number(d.precioUnitario) || 0,
            descuento: Number(d.descuento) || 0,
            subTotal: Number(d.subTotal) || 0
        }));

        const idCliVal = Number(ventaAEditar.idCliente ?? ventaAEditar.IdCliente ?? ventaAEditar.clienteId ?? ventaAEditar.ClienteId);

        const payload = {
            id: ventaAEditar.id,
            idUsuario: ventaAEditar.idUsuario ?? ventaAEditar.IdUsuario ?? 1,
            idCliente: idCliVal === 0 ? null : idCliVal,
            metodoPago: nuevoMetodoPago,
            detalles: detallesSaneados
        };

        try {
            await api.put(`/ventas/${ventaAEditar.id}`, payload);
            alert("Factura modificada con éxito. El inventario físico y dinero en caja han sido recalculados.");
            setVentaAEditar(null);
            cargarDatosIniciales();
            if (desde && hasta) ConsultarReporte(); 
        } catch (err: any) {
            alert(err.response?.data?.mensaje || err.response?.data || "Error al procesar la auditoría.");
        }
    };

    const obtenerEstructuraVentaNormalizada = (venta: any) => {
        const idCli = venta.idCliente ?? venta.IdCliente ?? venta.clienteId ?? venta.ClienteId;
        const clienteAsociado = venta.cliente || venta.Cliente || clientes.find(c => (c.id ?? c.Id) === idCli) || { nombre: obtenerNombreCliente(venta) };

        const detallesMapeados = (venta.detalles || []).map((d: any) => {
            const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
            return {
                ...d,
                nombre: prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`),
                descripcion: prod?.descripcion || '',
                subTotal: d.subTotal ?? (d.cantidad * d.precioUnitario - (d.descuento || 0))
            };
        });

        return {
            ventaId: venta.id,
            detalles: detallesMapeados,
            cliente: clienteAsociado,
            totalCongelado: venta.total ?? detallesMapeados.reduce((acc: number, item: any) => acc + item.subTotal, 0),
            metodoPagoCongelado: venta.metodoPago ?? venta.MetodoPago,
            fechaVenta: venta.fechaVenta || venta.fecha || venta.Fecha
        };
    };

    const reimprimirTicket = (venta: any) => {
        const datosVenta = obtenerEstructuraVentaNormalizada(venta);
        imprimirTicketTermico(datosVenta);
    };

    const reordenarEnviarWhatsApp = (venta: any) => {
        const datosVenta = obtenerEstructuraVentaNormalizada(venta);
        enviarWhatsAppVenta(datosVenta);
    };

    // COMPARTIR FACTURA COMO IMAGEN
    const compartirFacturaImagenReportes = async (venta: any) => {
        const datosNormalizados = obtenerEstructuraVentaNormalizada(venta);
        setVentaParaImagen(datosNormalizados);
        setGenerandoImagen(true);

        setTimeout(async () => {
            if (!ticketRenderRef.current) {
                setGenerandoImagen(false);
                return;
            }

            try {
                const canvas = await html2canvas(ticketRenderRef.current, {
                    scale: 3,
                    backgroundColor: '#ffffff',
                    useCORS: true
                });

                canvas.toBlob(async (blob) => {
                    if (!blob) return;
                    const file = new File([blob], `Factura_000${datosNormalizados.ventaId}.png`, { type: 'image/png' });

                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: `Factura #${datosNormalizados.ventaId}`,
                            text: `Factura de compra - Nicaplus Gaming`
                        });
                    } else {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        alert("📋 Factura copiada como imagen al portapapeles. Pégala directamente con Ctrl+V en WhatsApp Web.");
                        const tel = datosNormalizados.cliente?.telefono?.replace(/[^0-9]/g, '') || '';
                        if (tel) {
                            window.open(`https://web.whatsapp.com/send?phone=505${tel}`, '_blank');
                        }
                    }
                }, 'image/png');
            } catch (error) {
                console.error("Error al generar imagen de la factura:", error);
                alert("Ocurrió un error al generar la imagen de la factura.");
            } finally {
                setGenerandoImagen(false);
            }
        }, 150);
    };

    const exportarAPDF = () => {
        if (!datosReporte) {
            alert("No hay datos disponibles para exportar.");
            return;
        }

        const ventanaPrint = window.open('', '_blank');
        if (!ventanaPrint) {
            alert("El navegador bloqueó la ventana emergente.");
            return;
        }

        const rangoPeriodo = datosReporte?.rango || 'Periodo no especificado';
        const transacciones = datosReporte?.transacciones || [];
        const comprasProveedores = datosReporte?.comprasProveedores || [];
        const movimientosCaja = datosReporte?.movimientosCaja || [];
        const listaProductos = datosReporte?.topProductos || [];

        const utilidadNeta = datosReporte?.finanzas?.utilidadNeta ?? 0;
        const costoMercancia = datosReporte?.finanzas?.costoMercancia ?? 0;
        const gastosOperativos = datosReporte?.finanzas?.gastosOperativos ?? 0;
        const inversionCompras = datosReporte?.finanzas?.inversionCompras ?? 0;
        
        const clienteNombreFiltro = clienteFiltro 
            ? (clientes.find(c => (c.id ?? c.Id) === Number(clienteFiltro))?.nombre || 'Cliente Específico')
            : 'Todos los Clientes';

        const rubroNombreFiltro = rubroFiltro === 'Todos' ? 'Todos los Rubros' : rubroFiltro;

        const formatearFechaSegura = (t: any) => {
            const fechaRaw = t?.fechaVenta || t?.fecha || t?.Fecha || t?.fecha_venta || t?.createdAt || t?.created_at;
            if (!fechaRaw) return 'N/A';
            const dateObj = new Date(fechaRaw);
            return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
        };

        const totalNeto = transacciones.reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const efectivo = transacciones.filter((t: any) => t.metodoPago === 'Efectivo').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const transferencia = transacciones.filter((t: any) => t.metodoPago === 'Transferencia').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const tarjeta = datosReporte?.finanzas?.tarjeta ?? transacciones.filter((t: any) => t.metodoPago === 'Tarjeta').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const credito = transacciones.filter((t: any) => t.metodoPago === 'Crédito').reduce((acc: number, t: any) => acc + (t.total || 0), 0);

        const htmlDocumento = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Reporte_Auditoria_${rangoPeriodo.replace(/[^a-zA-Z0-9]/g, '_')}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #1e293b; background: #ffffff; line-height: 1.4; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .logo-text { font-size: 24px; font-weight: 800; color: #0f172a; }
                    .logo-sub { color: #8b00d0; }
                    .titulo-reporte { text-align: right; font-size: 11px; color: #64748b; line-height: 1.5; }
                    .grid-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
                    .card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background: #f8fafc; }
                    .card small { color: #64748b; font-weight: bold; font-size: 9px; text-transform: uppercase; }
                    .card h3 { margin: 4px 0 0 0; color: #0f172a; font-size: 16px; }
                    .card-total { border: 1px solid #10b981; background: #f0fdf4; }
                    .card-total h3 { color: #16a34a; }
                    table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
                    table.data-table th { background: #0f172a; color: white; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                    table.data-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
                    .seccion-titulo { font-size: 13px; color: #0f172a; border-bottom: 2px solid #8b00d0; padding-bottom: 4px; margin-top: 25px; font-weight: bold; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="logo-text">NICA<span class="logo-sub">PLUS GAMING</span></div>
                        </td>
                        <td class="titulo-reporte">
                            <strong>REPORTE DE AUDITORÍA INTERNA POS</strong><br>
                            <strong>Período:</strong> ${rangoPeriodo}<br>
                            <strong>Rubro:</strong> ${rubroNombreFiltro} | <strong>Cliente:</strong> ${clienteNombreFiltro}<br>
                            <strong>Generado:</strong> ${new Date().toLocaleString()}
                        </td>
                    </tr>
                </table>

                <div class="seccion-titulo">I. Resumen de Cierre de Caja y Rentabilidad</div>
                <br />
                <div class="grid-cards">
                    <div class="card"><small>Efectivo</small><h3>C$ ${Number(efectivo).toLocaleString()}</h3></div>
                    <div class="card"><small>Transferencias</small><h3>C$ ${Number(transferencia).toLocaleString()}</h3></div>
                    <div class="card"><small>Tarjeta / Créditos</small><h3>C$ ${Number(tarjeta + credito).toLocaleString()}</h3></div>
                    <div class="card card-total"><small>Total Recaudado</small><h3>C$ ${Number(totalNeto).toLocaleString()}</h3></div>
                </div>

                <div class="grid-cards">
                    <div class="card"><small>Costo Mercancía (CMV)</small><h3>C$ ${Number(costoMercancia).toLocaleString()}</h3></div>
                    <div class="card"><small>Inversión en Compras</small><h3 style="color: #a855f7;">C$ ${Number(inversionCompras).toLocaleString()}</h3></div>
                    <div class="card"><small>Gastos Operativos</small><h3>C$ ${Number(gastosOperativos).toLocaleString()}</h3></div>
                    <div class="card card-total" style="border-color: #3b82f6; background: #eff6ff;"><small style="color: #1d4ed8;">Utilidad Neta</small><h3 style="color: #1e40af;">C$ ${Number(utilidadNeta).toLocaleString()}</h3></div>
                </div>

                ${listaProductos.length > 0 ? `
                <div class="seccion-titulo">II. Productos / Servicios Más Vendidos</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Producto</th><th style="text-align: center;">Cantidad</th><th style="text-align: right;">Total</th></tr>
                    </thead>
                    <tbody>
                        ${listaProductos.map((p: any) => `
                            <tr>
                                <td>${p.producto}</td>
                                <td style="text-align: center;">${p.cantidad}</td>
                                <td style="text-align: right;">C$ ${Number(p.subtotal || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                <div class="seccion-titulo">III. Libro Diario de Ventas</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Factura</th><th>Fecha</th><th>Cliente</th><th>Método</th><th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transacciones.map((t: any) => {
                            const ventaOrig = ventasHistorial.find(v => v.id === t.id) || t;
                            return `
                                <tr>
                                    <td>#000${t?.id}</td>
                                    <td>${formatearFechaSegura(t)}</td>
                                    <td>${obtenerNombreCliente(ventaOrig, clientes)}</td>
                                    <td>${t?.metodoPago}</td>
                                    <td style="text-align: right;">C$ ${(t?.total ?? 0).toLocaleString()}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>

                ${comprasProveedores.length > 0 ? `
                <div class="seccion-titulo">IV. Compras a Proveedores</div>
                <table class="data-table">
                    <thead>
                        <tr><th>Orden</th><th>Fecha</th><th>Proveedor</th><th style="text-align: right;">Total</th></tr>
                    </thead>
                    <tbody>
                        ${comprasProveedores.map((c: any) => `
                            <tr>
                                <td>#ORD-${c.id}</td>
                                <td>${c.fecha}</td>
                                <td>${c.proveedor}</td>
                                <td style="text-align: right; color: #dc2626;">C$ ${Number(c.totalCompra || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                ${movimientosCaja.length > 0 ? `
                <div class="seccion-titulo">V. Movimientos de Caja</div>
                <table class="data-table">
                    <thead>
                        <tr><th>ID</th><th>Fecha</th><th>Tipo</th><th>Concepto</th><th style="text-align: right;">Monto</th></tr>
                    </thead>
                    <tbody>
                        ${movimientosCaja.map((m: any) => `
                            <tr>
                                <td>#${m.id}</td>
                                <td>${m.fecha}</td>
                                <td>${m.tipo}</td>
                                <td>${m.concepto}</td>
                                <td style="text-align: right;">C$ ${Number(m.monto || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ` : ''}

                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        ventanaPrint.document.write(htmlDocumento);
        ventanaPrint.document.close();
    };

    return (
        <div className={styles.container}>
            {/* 1. HEADER */}
            <header className={styles.header}>
                <h3 className={styles.title}>Reportes y Auditoría Contable</h3>
                <p className={styles.subtitle}>Análisis de cierres, control de márgenes y corrección de facturas.</p>
            </header>

            {/* 2. FILTROS RÁPIDOS Y TEMPORALES */}
            <div className={styles.filtersCard}>
                <div className={styles.quickPillsScroll}>
                    <button onClick={() => aplicarRangoRapido('hoy')} className={styles.btnPill}>Hoy</button>
                    <button onClick={() => aplicarRangoRapido('semana')} className={styles.btnPill}>Semana</button>
                    <button onClick={() => aplicarRangoRapido('mes')} className={styles.btnPill}>Este Mes</button>
                    <button onClick={() => aplicarRangoRapido('mesPasado')} className={styles.btnPill}>Mes Pasado</button>
                    <button onClick={() => aplicarRangoRapido('ano')} className={styles.btnPill}>Año</button>

                    <div className={styles.monthNavBox}>
                        <button onClick={() => cambiarMesRelativo(-1)} className={styles.btnNavMonth} title="Mes Anterior">
                            <FaChevronLeft size={10} />
                        </button>
                        <span className={styles.monthText}>
                            {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                        <button onClick={() => cambiarMesRelativo(1)} className={styles.btnNavMonth} title="Mes Siguiente">
                            <FaChevronRight size={10} />
                        </button>
                    </div>
                </div>

                <div className={styles.formFiltersGrid}>
                    <div className={styles.formGroupDate}>
                        <label className={styles.label}>Desde:</label>
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={styles.input} />
                    </div>

                    <div className={styles.formGroupDate}>
                        <label className={styles.label}>Hasta:</label>
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={styles.input} />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Rubro:</label>
                        <select value={rubroFiltro} onChange={e => setRubroFiltro(e.target.value)} className={styles.select}>
                            <option value="Todos">🌐 Todos los Rubros</option>
                            <option value="Tienda">🛍️ Tienda Físico</option>
                            <option value="Streaming">📺 Streaming / Cuentas</option>
                            <option value="Videojuegos">🎮 Videojuegos</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Cliente:</label>
                        <select value={clienteFiltro} onChange={e => setClienteFiltro(e.target.value)} className={styles.select}>
                            <option value="">👤 Todos los Clientes</option>
                            {clientes.map(c => (
                                <option key={c.id ?? c.Id} value={c.id ?? c.Id}>
                                    {c.nombre ?? c.Nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <button onClick={ConsultarReporte} className={styles.btnConsultar}>
                    {cargandoReporte ? 'Calculando balances...' : 'Generar Reporte'}
                </button>
            </div>

            {/* 3. KPIS FINANCIEROS DEL PERÍODO */}
            {datosReporte && (
                <div className={styles.reportSummaryWrap}>
                    <div className={styles.periodHeaderRow}>
                        <h4 className={styles.periodTitle}>Período: <strong>{datosReporte.rango}</strong></h4>
                        <button onClick={exportarAPDF} className={styles.btnExportPdf}>
                            <FaFilePdf /> <span>Exportar PDF</span>
                        </button>
                    </div>

                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.kpiCajaReal}`}>
                            <small className={styles.kpiLabel}>Balance Neto (Caja Real)</small>
                            <h3 className={styles.textGreen}>
                                C$ {(datosReporte?.finanzas?.balanceCajaReal ?? 0).toLocaleString()}
                            </h3>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiFacturado}`}>
                            <small className={styles.kpiLabel}>Total Facturado</small>
                            <h3 className={styles.textCyan}>
                                C$ {(datosReporte?.finanzas?.totalFacturado ?? 0).toLocaleString()}
                            </h3>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiCredito}`}>
                            <small className={styles.kpiLabel}>Ventas al Crédito</small>
                            <h3 className={styles.textAmber}>
                                C$ {(datosReporte?.finanzas?.credito ?? 0).toLocaleString()}
                            </h3>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiInversion}`}>
                            <small className={styles.kpiLabel}>Inversión Compras</small>
                            <h3 className={styles.textPurple}>
                                C$ {(datosReporte?.finanzas?.inversionCompras ?? 0).toLocaleString()}
                            </h3>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiGastos}`}>
                            <small className={styles.kpiLabel}>Gastos Operativos</small>
                            <h3 className={styles.textRed}>
                                C$ {(datosReporte?.finanzas?.gastosOperativos ?? 0).toLocaleString()}
                            </h3>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiUtilidad}`}>
                            <small className={styles.kpiLabel}>Utilidad Neta Real</small>
                            <h3 className={styles.textGreen}>
                                C$ {(datosReporte?.finanzas?.utilidadNeta ?? 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. TABS DE AUDITORÍA Y SUB-MÓDULOS */}
            <div className={styles.auditSection}>
                <div className={styles.auditHeader}>
                    <div className={styles.auditTabsRow}>
                        <button 
                            onClick={() => setTabAuditoria('ventas')} 
                            className={`${styles.tabBtn} ${tabAuditoria === 'ventas' ? styles.tabBtnActive : ''}`}
                        >
                            <FaCalendarAlt /> Ventas ({ventasFiltradas.length})
                        </button>
                        <button 
                            onClick={() => setTabAuditoria('compras')} 
                            className={`${styles.tabBtn} ${tabAuditoria === 'compras' ? styles.tabBtnActive : ''}`}
                        >
                            <FaShoppingCart /> Compras
                        </button>
                        <button 
                            onClick={() => setTabAuditoria('caja')} 
                            className={`${styles.tabBtn} ${tabAuditoria === 'caja' ? styles.tabBtnActive : ''}`}
                        >
                            <FaExchangeAlt /> Libro Diario
                        </button>
                    </div>

                    {tabAuditoria === 'ventas' && (
                        <div className={styles.searchBox}>
                            <FaSearch className={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Buscar factura # o cliente..." 
                                value={busquedaFactura} 
                                onChange={e => setBusquedaFactura(e.target.value)} 
                                className={styles.searchInput} 
                            />
                            {busquedaFactura && (
                                <button onClick={() => setBusquedaFactura('')} className={styles.clearBtn}><FaTimes /></button>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. VISTA MÓVIL (FEEDS TÁCTILES) */}
                <div className={styles.mobileFeed}>
                    {tabAuditoria === 'ventas' && (
                        cargandoTabla ? (
                            <div className={styles.emptyText}>Sincronizando transacciones...</div>
                        ) : ventasFiltradas.length === 0 ? (
                            <div className={styles.emptyText}>No se encontraron ventas registradas.</div>
                        ) : (
                            ventasFiltradas.map((v) => {
                                const clienteNombre = obtenerNombreCliente(v);
                                return (
                                    <div key={v.id} className={styles.auditCard}>
                                        <div className={styles.auditCardHeader}>
                                            <div className={styles.orderIdBadge}>#000{v.id}</div>
                                            <span className={styles.paymentBadge}>{v.metodoPago ?? v.MetodoPago}</span>
                                        </div>

                                        <div className={styles.cardCustomerRow}>
                                            <strong>👤 {clienteNombre}</strong>
                                            <small className={styles.textMuted}>
                                                📅 {v.fechaVenta || v.fecha ? new Date(v.fechaVenta || v.fecha).toLocaleDateString() : 'N/A'}
                                            </small>
                                        </div>

                                        <div className={styles.itemsDesgloseBox}>
                                            {v.detalles?.map((d: any, idx: number) => {
                                                const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                                                return (
                                                    <div key={idx} className={styles.itemDesgloseLine}>
                                                        • {d.cantidad}x {prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`)}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className={styles.cardFooterRow}>
                                            <strong className={styles.totalText}>C$ {(v.total ?? 0).toLocaleString()}</strong>
                                            <div className={styles.actionsGroup}>
                                                <button onClick={() => abrirEditorVenta(v)} className={styles.btnActionEdit} title="Editar">
                                                    <FaEdit size={13} />
                                                </button>
                                                <button onClick={() => compartirFacturaImagenReportes(v)} className={styles.btnActionPrint} style={{ background: '#0284c7', color: '#fff' }} title="Compartir Imagen PNG">
                                                    <FaShareAlt size={13} />
                                                </button>
                                                <button onClick={() => reimprimirTicket(v)} className={styles.btnActionPrint} title="Imprimir Ticket">
                                                    <FaPrint size={13} />
                                                </button>
                                                <button onClick={() => reordenarEnviarWhatsApp(v)} className={styles.btnActionWhatsapp} title="WhatsApp">
                                                    <FaWhatsapp size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}

                    {tabAuditoria === 'compras' && (
                        !datosReporte?.comprasProveedores || datosReporte.comprasProveedores.length === 0 ? (
                            <div className={styles.emptyText}>No hay compras a proveedores registradas en este período.</div>
                        ) : (
                            datosReporte.comprasProveedores.map((c: any) => (
                                <div key={c.id} className={styles.auditCard}>
                                    <div className={styles.auditCardHeader}>
                                        <div className={styles.orderIdBadge}>#ORD-{c.id}</div>
                                        <small className={styles.textMuted}>📅 {c.fecha}</small>
                                    </div>
                                    <div><strong>Proveedor: {c.proveedor}</strong></div>
                                    <div className={styles.itemsDesgloseBox}>
                                        {(c.items || []).map((item: any, idx: number) => (
                                            <div key={idx} className={styles.itemDesgloseLine}>
                                                • {item.cantidad}x {item.producto} (a C$ {item.costoUnitario})
                                            </div>
                                        ))}
                                    </div>
                                    {c.observaciones && <small className={styles.textAmber}>📝 {c.observaciones}</small>}
                                    <div className={styles.cardFooterRow}>
                                        <span className={styles.textMuted}>Total Compra:</span>
                                        <strong className={styles.textRed}>C$ {Number(c.totalCompra).toLocaleString()}</strong>
                                    </div>
                                </div>
                            ))
                        )
                    )}

                    {tabAuditoria === 'caja' && (
                        !datosReporte?.movimientosCaja || datosReporte.movimientosCaja.length === 0 ? (
                            <div className={styles.emptyText}>No hay movimientos de caja en este rango.</div>
                        ) : (
                            datosReporte.movimientosCaja.map((m: any) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                return (
                                    <div key={m.id} className={`${styles.auditCard} ${esIngreso ? styles.borderGreen : styles.borderRed}`}>
                                        <div className={styles.auditCardHeader}>
                                            <span className={`${styles.paymentBadge} ${esIngreso ? styles.bgGreen : styles.bgRed}`}>
                                                {m.tipo}
                                            </span>
                                            <small className={styles.textMuted}>📅 {m.fecha}</small>
                                        </div>
                                        <div className={styles.movementConceptRow}>
                                            <strong>{m.concepto}</strong>
                                            {(m.idVenta || m.idCompraProveedor) && <FaLock size={10} className={styles.textAmber} />}
                                        </div>
                                        <p className={styles.movementDetail}>{m.detalle || 'Sin descripción'}</p>
                                        <div className={styles.cardFooterRow}>
                                            <span className={styles.textMuted}>Monto:</span>
                                            <strong className={esIngreso ? styles.textGreen : styles.textRed}>
                                                {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                            </strong>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    )}
                </div>

                {/* 6. VISTA ESCRITORIO */}
                <div className={styles.desktopTableWrap}>
                    {tabAuditoria === 'ventas' && (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th>Desglose Items</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasFiltradas.map((v) => (
                                    <tr key={v.id}>
                                        <td className={styles.orderIdBadge}>#000{v.id}</td>
                                        <td>{v.fechaVenta || v.fecha ? new Date(v.fechaVenta || v.fecha).toLocaleDateString() : 'N/A'}</td>
                                        <td><strong>{obtenerNombreCliente(v)}</strong></td>
                                        <td><span className={styles.paymentBadge}>{v.metodoPago ?? v.MetodoPago}</span></td>
                                        <td className={styles.textMuted}>
                                            {v.detalles?.map((d: any, idx: number) => {
                                                const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                                                return <div key={idx}>• {d.cantidad}x {prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`)}</div>;
                                            })}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>C$ {(v.total ?? 0).toLocaleString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className={styles.actionsGroupCenter}>
                                                <button onClick={() => abrirEditorVenta(v)} className={styles.btnActionEdit} title="Editar"><FaEdit /></button>
                                                <button onClick={() => compartirFacturaImagenReportes(v)} className={styles.btnActionPrint} style={{ background: '#0284c7', color: '#fff' }} title="Compartir Imagen PNG"><FaShareAlt /></button>
                                                <button onClick={() => reimprimirTicket(v)} className={styles.btnActionPrint} title="Imprimir"><FaPrint /></button>
                                                <button onClick={() => reordenarEnviarWhatsApp(v)} className={styles.btnActionWhatsapp} title="WhatsApp"><FaWhatsapp /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tabAuditoria === 'compras' && (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>N° Orden</th>
                                    <th>Fecha</th>
                                    <th>Proveedor</th>
                                    <th>Detalle Items</th>
                                    <th>Notas</th>
                                    <th style={{ textAlign: 'right' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(datosReporte?.comprasProveedores || []).map((c: any) => (
                                    <tr key={c.id}>
                                        <td className={styles.orderIdBadge}>#ORD-{c.id}</td>
                                        <td>{c.fecha}</td>
                                        <td><strong>{c.proveedor}</strong></td>
                                        <td className={styles.textMuted}>
                                            {(c.items || []).map((item: any, idx: number) => (
                                                <div key={idx}>• {item.cantidad}x {item.producto} (a C$ {item.costoUnitario})</div>
                                            ))}
                                        </td>
                                        <td>{c.observaciones || 'Sin notas'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#f87171' }}>C$ {Number(c.totalCompra).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tabAuditoria === 'caja' && (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Concepto</th>
                                    <th>Detalle</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(datosReporte?.movimientosCaja || []).map((m: any) => {
                                    const esIngreso = m.tipo === 'Ingreso';
                                    return (
                                        <tr key={m.id}>
                                            <td className={styles.orderIdBadge}>#{m.id}</td>
                                            <td>{m.fecha}</td>
                                            <td><span className={`${styles.paymentBadge} ${esIngreso ? styles.bgGreen : styles.bgRed}`}>{m.tipo}</span></td>
                                            <td><strong>{m.concepto}</strong></td>
                                            <td className={styles.textMuted}>{m.detalle || 'N/A'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: esIngreso ? '#10b981' : '#f87171' }}>
                                                {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* 7. MODAL DE EDICIÓN / AUDITORÍA DE FACTURA */}
            {ventaAEditar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>🛠️ Auditoría: Factura #000{ventaAEditar.id}</h3>
                            <button onClick={() => setVentaAEditar(null)} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>

                        <form onSubmit={procesarAuditoriaVenta} className={styles.modalForm}>
                            <div className={styles.formRowDual}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Cliente</label>
                                    <select 
                                        value={ventaAEditar.idCliente ?? ventaAEditar.IdCliente ?? ventaAEditar.clienteId ?? ventaAEditar.ClienteId ?? 0} 
                                        onChange={e => setVentaAEditar({...ventaAEditar, idCliente: Number(e.target.value)})} 
                                        className={styles.select}
                                    >
                                        <option value={0}>Mostrador General</option>
                                        {clientes.map(c => (
                                            <option key={c.id ?? c.Id} value={c.id ?? c.Id}>{c.nombre ?? c.Nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Método de Pago</label>
                                    <select value={nuevoMetodoPago} onChange={e => setMetodoPago(e.target.value)} className={styles.select}>
                                        <option value="Efectivo">💵 Efectivo</option>
                                        <option value="Transferencia">🏦 Transferencia</option>
                                        <option value="Tarjeta">💳 Tarjeta</option>
                                        <option value="Crédito">⚠️ Crédito</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.itemsAuditContainer}>
                                <label className={styles.label}>Desglose de Ítems y Precios:</label>
                                {detallesEditados.map((det, idx) => {
                                    const prodAsociado = productos.find(p => (p.id ?? p.Id) === det.idProducto);
                                    const esSuscripcion = prodAsociado?.esSuscripcion || prodAsociado?.EsSuscripcion;
                                    
                                    let diasActuales: any = det.diasTemporales ?? prodAsociado?.diasDuracion ?? 30;
                                    if (det.diasTemporales === undefined && det.metadataDigital && det.metadataDigital.startsWith("DIAS:")) {
                                        const extraidos = parseInt(det.metadataDigital.split('|')[0].replace("DIAS:", ""));
                                        if (!isNaN(extraidos)) diasActuales = extraidos;
                                    }

                                    return (
                                        <div key={idx} className={styles.itemAuditCard}>
                                            <div className={styles.formGroup}>
                                                <small className={styles.textMuted}>Producto</small>
                                                <select 
                                                    value={Number(det.idProducto)} 
                                                    onChange={e => cambiarProductoDetalle(idx, Number(e.target.value))}
                                                    className={styles.select}
                                                >
                                                    {productos.map(p => (
                                                        <option key={p.id ?? p.Id} value={Number(p.id ?? p.Id)}>{p.nombre ?? p.Nombre}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={styles.itemAuditInputsGrid}>
                                                <div className={styles.formGroup}>
                                                    <small className={styles.textMuted}>Cant.</small>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        value={det.cantidad ?? ''} 
                                                        onChange={e => actualizarCantidadDetalle(idx, e.target.value)} 
                                                        className={styles.touchInput}
                                                    />
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <small className={styles.textMuted}>Precio</small>
                                                    <input 
                                                        type="number" 
                                                        value={det.precioUnitario ?? ''} 
                                                        onChange={e => actualizarPrecioDetalle(idx, e.target.value)} 
                                                        className={styles.touchInput}
                                                    />
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <small className={styles.textRed}>Desc.</small>
                                                    <input 
                                                        type="number" 
                                                        min={0} 
                                                        value={det.descuento ?? ''} 
                                                        onChange={e => actualizarDescuentoDetalle(idx, e.target.value)} 
                                                        className={`${styles.touchInput} ${styles.borderRed}`}
                                                    />
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <small className={styles.textCyan}>Días</small>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        disabled={!esSuscripcion}
                                                        value={diasActuales ?? ''} 
                                                        onChange={e => actualizarDiasSuscripcion(idx, e.target.value)} 
                                                        className={styles.touchInput}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.itemSubtotalRow}>
                                                <small>Subtotal Ítem:</small>
                                                <strong className={styles.textCyan}>C$ {(det.subTotal ?? 0).toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={styles.modalTotalBox}>
                                <span>Nuevo Total Factura:</span>
                                <strong className={styles.textGreen}>
                                    C$ {detallesEditados.reduce((acc, d) => acc + (d.subTotal || 0), 0).toLocaleString()}
                                </strong>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnSaveAudit}>
                                    Guardar y Recalcular
                                </button>
                                <button type="button" onClick={() => setVentaAEditar(null)} className={styles.btnCancelAudit}>
                                    Cerrar
                                </button>
                            </div>

                            <button type="button" onClick={() => eliminarVentaCompleta(ventaAEditar.id)} className={styles.btnDeleteSaleFull}>
                                <FaTrash /> Eliminar Factura por Completo (Revertir Stock)
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* RENDER INVISIBLE PARA CONVERSIÓN DE FACTURA A IMAGEN */}
            {ventaParaImagen && (
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
                            <div>Factura: #000{ventaParaImagen.ventaId || 1}</div>
                            <div>Fecha: {new Date(ventaParaImagen.fechaVenta || Date.now()).toLocaleDateString('es-NI')}</div>
                            <div>Condición: {(ventaParaImagen.metodoPagoCongelado || 'Efectivo').toUpperCase()}</div>
                            <div>Cliente: {ventaParaImagen.cliente?.nombre || 'Mostrador'}</div>
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
                                {ventaParaImagen.detalles.map((item: any, idx: number) => {
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
                                        C$ {ventaParaImagen.totalCongelado || ventaParaImagen.detalles.reduce((acc: number, d: any) => acc + (d.subTotal || 0), 0)}
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