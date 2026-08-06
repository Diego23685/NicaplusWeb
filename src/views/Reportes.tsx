import React, { useState, useEffect } from 'react';
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
    FaLock
} from 'react-icons/fa';
import { imprimirTicketTermico, enviarWhatsAppVenta } from './Caja';

export const Reportes: React.FC = () => {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [datosReporte, setDatosReporte] = useState<any>(null);
    const [cargandoReporte, setCargandoReporte] = useState(false);

    const [fechaReferenciaMes, setFechaReferenciaMes] = useState<Date>(new Date());

    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    const [ventasHistorial, setVentasHistorial] = useState<any[]>([]);
    const [busquedaFactura, setBusquedaFactura] = useState('');
    const [cargandoTabla, setCargandoTabla] = useState(true);

    // Estado para conmutar las vistas de auditoría
    const [tabAuditoria, setTabAuditoria] = useState<'ventas' | 'compras' | 'caja'>('ventas');

    const [ventaAEditar, setVentaAEditar] = useState<any | null>(null);
    const [nuevoMetodoPago, setMetodoPago] = useState('');
    const [detallesEditados, setDetallesEditados] = useState<any[]>([]);

    const cargarHistorialVentas = async () => {
        try {
            const res = await api.get('/ventas');
            setVentasHistorial(res.data || []);
        } catch (err) {
            console.error("Error al cargar historial de ventas:", err);
        } finally {
            setCargandoTabla(false);
        }
    };

    const formatearLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
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
            const res = await api.get(`/reportes/personalizado?desde=${desde}&hasta=${hasta}`);
            setDatosReporte(res.data);
        } catch (err) {
            alert("Error al generar el reporte.");
        } finally {
            setCargandoReporte(false);
        }
    };

    useEffect(() => {
        aplicarRangoRapido('hoy');
        cargarHistorialVentas();
    }, []);

    useEffect(() => {
        api.get('/clientes').then(res => setClientes(res.data || [])).catch(() => {});
        api.get('/products').then(res => setProductos(res.data || [])).catch(() => {});
    }, []);

    const ventasFiltradas = ventasHistorial.filter(v => 
        v.id.toString().includes(busquedaFactura) || 
        (v.cliente?.nombre || v.cliente?.Nombre || 'mostrador').toLowerCase().includes(busquedaFactura.toLowerCase())
    );

    const abrirEditorVenta = (venta: any) => {
        setVentaAEditar(venta);
        setMetodoPago(venta.metodoPago);
        
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
        if (!window.confirm(`¿Está completamente seguro de ELIMINAR la factura #000${id}? Esta acción revertirá inventarios y eliminará el ingreso de caja.`)) return;
        
        try {
            await api.delete(`/ventas/${id}`);
            alert("Venta eliminada e inventarios restaurados.");
            setVentaAEditar(null);
            setCargandoTabla(true);
            cargarHistorialVentas();
            if (desde && hasta) ConsultarReporte();
        } catch (err: any) {
            alert(err.response?.data || "Error al eliminar la venta.");
        }
    };

    const cambiarProductoDetalle = (index: number, idProd: number) => {
        const prodSeleccionado = productos.find(p => (p.id ?? p.Id) === idProd);
        if (!prodSeleccionado) return;

        const copia = [...detallesEditados];
        copia[index].idProducto = idProd;
        copia[index].nombre = prodSeleccionado.nombre ?? prodSeleccionado.Nombre; 
        copia[index].precioUnitario = prodSeleccionado.precio ?? prodSeleccionado.Precio ?? 0; 
        copia[index].subTotal = (copia[index].cantidad * (prodSeleccionado.precio ?? prodSeleccionado.Precio ?? 0)) - (copia[index].descuento || 0);
        setDetallesEditados(copia);
    };

    const actualizarPrecioDetalle = (index: number, nuevoPrecio: number) => {
        const copia = [...detallesEditados];
        copia[index].precioUnitario = nuevoPrecio;
        copia[index].subTotal = (copia[index].cantidad * nuevoPrecio) - (copia[index].descuento || 0);
        setDetallesEditados(copia);
    };

    const actualizarCantidadDetalle = (index: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;
        const copia = [...detallesEditados];
        copia[index].cantidad = nuevaCantidad;
        copia[index].subTotal = (nuevaCantidad * copia[index].precioUnitario) - (copia[index].descuento || 0);
        setDetallesEditados(copia);
    };

    const actualizarDescuentoDetalle = (index: number, nuevoDescuento: number) => {
        const copia = [...detallesEditados];
        copia[index].descuento = nuevoDescuento < 0 ? 0 : nuevoDescuento;
        copia[index].subTotal = (copia[index].cantidad * copia[index].precioUnitario) - copia[index].descuento;
        setDetallesEditados(copia);
    };

    const actualizarDiasSuscripcion = (index: number, nuevosDias: number) => {
        const copia = [...detallesEditados];
        const diasValidos = nuevosDias > 0 ? nuevosDias : 30;
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
        
        setDetallesEditados(copia);
    };

    const procesarAuditoriaVenta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventaAEditar) return;

        const payload = {
            id: ventaAEditar.id,
            idUsuario: ventaAEditar.idUsuario,
            idCliente: ventaAEditar.idCliente === 0 ? null : ventaAEditar.idCliente,
            metodoPago: nuevoMetodoPago,
            detalles: detallesEditados
        };

        try {
            await api.put(`/ventas/${ventaAEditar.id}`, payload);
            alert("Factura modificada con éxito.");
            setVentaAEditar(null);
            setCargandoTabla(true);
            cargarHistorialVentas();
            if (desde && hasta) ConsultarReporte(); 
        } catch (err: any) {
            alert(err.response?.data || "Error al procesar la auditoría.");
        }
    };

    const obtenerEstructuraVentaNormalizada = (venta: any) => {
        const idCli = venta.idCliente || venta.IdCliente;
        const clienteAsociado = venta.cliente || clientes.find(c => (c.id ?? c.Id) === idCli) || null;

        const detallesMapeados = (venta.detalles || []).map((d: any) => {
            const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
            return {
                ...d,
                nombre: prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`),
                subTotal: d.subTotal ?? (d.cantidad * d.precioUnitario - (d.descuento || 0))
            };
        });

        return {
            ventaId: venta.id,
            detalles: detallesMapeados,
            cliente: clienteAsociado,
            totalCongelado: venta.total ?? detallesMapeados.reduce((acc: number, item: any) => acc + item.subTotal, 0),
            metodoPagoCongelado: venta.metodoPago,
            fechaVenta: venta.fechaVenta || venta.fecha
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

        const utilidadNeta = datosReporte?.finanzas?.utilidadNeta ?? 0;
        const costoMercancia = datosReporte?.finanzas?.costoMercancia ?? 0;
        const gastosOperativos = datosReporte?.finanzas?.gastosOperativos ?? 0;
        const inversionCompras = datosReporte?.finanzas?.inversionCompras ?? 0;
        
        const formatearFechaSegura = (t: any) => {
            const fechaRaw = t?.fechaVenta || t?.fecha || t?.Fecha || t?.fecha_venta || t?.createdAt || t?.created_at;
            if (!fechaRaw) return 'N/A';
            const dateObj = new Date(fechaRaw);
            return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
        };

        const obtenerClienteCruzado = (transaccionReporte: any) => {
            if (!transaccionReporte) return 'Mostrador General';

            if (transaccionReporte.cliente || transaccionReporte.Cliente) {
                return transaccionReporte.cliente || transaccionReporte.Cliente;
            }

            const ventaCompleta = ventasHistorial.find(v => v.id === transaccionReporte.id);
            if (ventaCompleta) {
                if (ventaCompleta.cliente) {
                    const nombreObj = ventaCompleta.cliente.nombre || ventaCompleta.cliente.Nombre;
                    if (nombreObj) return nombreObj;
                }

                const idCli = ventaCompleta.idCliente || ventaCompleta.IdCliente;
                if (idCli) {
                    const clienteEncontrado = clientes.find(c => (c.id ?? c.Id) === idCli);
                    if (clienteEncontrado) {
                        return clienteEncontrado.nombre || clienteEncontrado.Nombre || 'Mostrador General';
                    }
                }
            }

            const idClienteDirecto = transaccionReporte.idCliente || transaccionReporte.IdCliente;
            if (idClienteDirecto) {
                const clienteEncontrado = clientes.find(c => (c.id ?? c.Id) === idClienteDirecto);
                if (clienteEncontrado) {
                    return clienteEncontrado.nombre || clienteEncontrado.Nombre || 'Mostrador General';
                }
            }

            return 'Mostrador General';
        };

        const totalNeto = transacciones.reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const efectivo = transacciones.filter((t: any) => t.metodoPago === 'Efectivo').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const transferencia = transacciones.filter((t: any) => t.metodoPago === 'Transferencia').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const tarjeta = datosReporte?.finanzas?.tarjeta ?? transacciones.filter((t: any) => t.metodoPago === 'Tarjeta').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const credito = transacciones.filter((t: any) => t.metodoPago === 'Crédito').reduce((acc: number, t: any) => acc + (t.total || 0), 0);

        const listaProductos = datosReporte?.topProductos || [];

        const htmlDocumento = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Reporte_Auditoria_${rangoPeriodo.replace(/[^a-zA-Z0-9]/g, '_')}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; background: #ffffff; line-height: 1.4; font-size: 12px; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .logo-text { font-size: 22px; font-weight: 800; color: #0f172a; }
                    .logo-sub { color: #8b00d0; }
                    .titulo-reporte { text-align: right; font-size: 11px; color: #64748b; }
                    .grid-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .card { border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background: #f8fafc; }
                    .card small { color: #64748b; font-weight: bold; font-size: 9px; text-transform: uppercase; }
                    .card h3 { margin: 4px 0 0 0; color: #0f172a; font-size: 15px; }
                    table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                    table.data-table th { background: #0f172a; color: white; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
                    table.data-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #334155; }
                    .seccion-titulo { font-size: 12px; color: #0f172a; border-bottom: 2px solid #8b00d0; padding-bottom: 4px; margin-top: 20px; font-weight: bold; text-transform: uppercase; }
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
                    <div class="card" style="border-color: #10b981; background: #f0fdf4;"><small style="color: #166534;">Total Neto</small><h3 style="color: #16a34a;">C$ ${Number(totalNeto).toLocaleString()}</h3></div>
                </div>

                <div class="grid-cards">
                    <div class="card"><small>Costo Mercancía</small><h3>C$ ${Number(costoMercancia).toLocaleString()}</h3></div>
                    <div class="card"><small>Inversión Compras</small><h3 style="color: #a855f7;">C$ ${Number(inversionCompras).toLocaleString()}</h3></div>
                    <div class="card"><small>Gastos Operativos</small><h3>C$ ${Number(gastosOperativos).toLocaleString()}</h3></div>
                    <div class="card" style="border-color: #3b82f6; background: #eff6ff;"><small style="color: #1d4ed8;">Utilidad Neta</small><h3 style="color: #1e40af;">C$ ${Number(utilidadNeta).toLocaleString()}</h3></div>
                </div>

                <div class="seccion-titulo">II. Rendimiento de Productos (Top)</div>
                <table class="data-table">
                    <thead><tr><th>Producto</th><th style="text-align: center;">Cantidad</th><th style="text-align: right;">Total</th></tr></thead>
                    <tbody>
                        ${listaProductos.map((p: any) => `
                            <tr>
                                <td>${p?.producto || 'Servicio General'}</td>
                                <td style="text-align: center;"><strong>${p?.cantidad ?? 0}</strong></td>
                                <td style="text-align: right;">C$ ${(p?.subtotal ?? 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="seccion-titulo">III. Libro Diario de Ventas</div>
                <table class="data-table">
                    <thead><tr><th>N° Factura</th><th>Fecha</th><th>Cliente</th><th style="text-align: right;">Monto</th></tr></thead>
                    <tbody>
                        ${transacciones.map((t: any) => `
                            <tr>
                                <td><strong>#000${t?.id}</strong></td>
                                <td>${formatearFechaSegura(t)}</td>
                                <td>${obtenerClienteCruzado(t)}</td>
                                <td style="text-align: right;">C$ ${(t?.total ?? 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        ventanaPrint.document.write(htmlDocumento);
        ventanaPrint.document.close();
    };

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO Y FILTROS RÁPIDOS */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Reportes y Auditoría POS</h3>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Consolidado financiero y corrección de libros</small>
                </div>

                {/* Botones de Rango de Fecha Rápidos */}
                <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                    <button onClick={() => aplicarRangoRapido('hoy')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Hoy</button>
                    <button onClick={() => aplicarRangoRapido('semana')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Esta Semana</button>
                    <button onClick={() => aplicarRangoRapido('mes')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Este Mes</button>
                    <button onClick={() => aplicarRangoRapido('mesPasado')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Mes Pasado</button>
                    <button onClick={() => aplicarRangoRapido('ano')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Año</button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#0f172a', padding: '2px 6px', borderRadius: '6px', border: '1px solid #334155', marginLeft: 'auto' }}>
                        <button onClick={() => cambiarMesRelativo(-1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><FaChevronLeft size={10} /></button>
                        <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 700 }}>
                            {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase()}
                        </span>
                        <button onClick={() => cambiarMesRelativo(1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><FaChevronRight size={10} /></button>
                    </div>
                </div>

                {/* Selección Desde / Hasta */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>a</span>
                    <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                    <button onClick={ConsultarReporte} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {cargandoReporte ? '...' : 'Generar'}
                    </button>
                </div>
            </div>

            {/* VISTA DE KPIS CALCULADOS Y PDF */}
            {datosReporte && (
                <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Período: <strong>{datosReporte.rango}</strong></small>
                        <button onClick={exportarAPDF} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <FaFilePdf /> Imprimir PDF
                        </button>
                    </div>

                    {/* Grid de Balances Financiales */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #10b981' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>BALANCE CAJA REAL</small>
                            <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.balanceCajaReal ?? 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #38bdf8' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>TOTAL FACTURADO</small>
                            <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.totalFacturado ?? 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>VENTAS AL CRÉDITO</small>
                            <strong style={{ color: '#f59e0b', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.credito ?? 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #a855f7' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>INVERSIÓN COMPRAS</small>
                            <strong style={{ color: '#a855f7', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.inversionCompras ?? 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>GASTOS OPERATIVOS</small>
                            <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.gastosOperativos ?? 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #10b981' }}>
                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>UTILIDAD NETA REAL</small>
                            <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>C$ {(datosReporte?.finanzas?.utilidadNeta ?? 0).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN DE AUDITORÍA Y LIBROS DIARIOS */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Conmutador de Libros */}
                <div style={{ display: 'flex', gap: '4px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155', overflowX: 'auto' }}>
                    <button 
                        onClick={() => setTabAuditoria('ventas')}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: 'none', background: tabAuditoria === 'ventas' ? '#38bdf8' : 'transparent', color: tabAuditoria === 'ventas' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <FaCalendarAlt /> Ventas POS
                    </button>
                    <button 
                        onClick={() => setTabAuditoria('compras')}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: 'none', background: tabAuditoria === 'compras' ? '#38bdf8' : 'transparent', color: tabAuditoria === 'compras' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <FaShoppingCart /> Compras
                    </button>
                    <button 
                        onClick={() => setTabAuditoria('caja')}
                        style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: 'none', background: tabAuditoria === 'caja' ? '#38bdf8' : 'transparent', color: tabAuditoria === 'caja' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        <FaExchangeAlt /> Libro Caja
                    </button>
                </div>

                {/* Búsqueda de facturas */}
                {tabAuditoria === 'ventas' && (
                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por factura o cliente..." 
                            value={busquedaFactura} 
                            onChange={e => setBusquedaFactura(e.target.value)} 
                            style={{ width: '100%', padding: '8px 10px 8px 32px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                )}

                {/* VISTA 1: FEED MÓVIL DE VENTAS POS */}
                {tabAuditoria === 'ventas' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cargandoTabla ? (
                            <div style={{ color: '#38bdf8', textAlign: 'center', padding: '15px', fontSize: '0.8rem' }}>Sincronizando transacciones...</div>
                        ) : ventasFiltradas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.8rem' }}>No se encontraron transacciones registradas.</div>
                        ) : (
                            ventasFiltradas.map((v) => (
                                <div key={v.id} style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>#000{v.id}</strong>
                                        <strong style={{ color: '#10b981', fontSize: '0.9rem' }}>C$ {(v.total ?? 0).toLocaleString()}</strong>
                                    </div>

                                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                                        👤 {(() => {
                                            if (v.cliente?.nombre || v.cliente?.Nombre) return v.cliente.nombre || v.cliente.Nombre;
                                            const idCli = v.idCliente || v.IdCliente;
                                            if (idCli) {
                                                const cli = clientes.find(c => (c.id ?? c.Id) === idCli);
                                                if (cli) return cli.nombre || cli.Nombre;
                                            }
                                            return 'Mostrador General';
                                        })()}
                                    </div>

                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                        {v.detalles?.map((d: any, idx: number) => {
                                            const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                                            return (
                                                <div key={idx}>• {d.cantidad}x {prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`)}</div>
                                            );
                                        })}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '2px' }}>
                                        <span style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>{v.metodoPago}</span>
                                        
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button onClick={() => abrirEditorVenta(v)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }} title="Editar Venta"><FaEdit /></button>
                                            <button onClick={() => reimprimirTicket(v)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }} title="Reimprimir Ticket"><FaPrint /></button>
                                            <button onClick={() => reordenarEnviarWhatsApp(v)} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }} title="Reenviar por WhatsApp"><FaWhatsapp /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VISTA 2: COMPRAS PROVEEDORES */}
                {tabAuditoria === 'compras' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {!datosReporte?.comprasProveedores || datosReporte.comprasProveedores.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.8rem' }}>No hay compras registradas en este rango. Genera un reporte.</div>
                        ) : (
                            datosReporte.comprasProveedores.map((c: any) => (
                                <div key={c.id} style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>#Orden {c.id} — {c.proveedor}</strong>
                                        <strong style={{ color: '#ef4444', fontSize: '0.88rem' }}>C$ {Number(c.totalCompra).toLocaleString()}</strong>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                        {(c.items || []).map((item: any, idx: number) => (
                                            <div key={idx}>• {item.cantidad}x {item.producto} (a C$ {item.costoUnitario})</div>
                                        ))}
                                    </div>
                                    <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Fecha: {c.fecha} • {c.observaciones || 'Sin notas'}</small>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VISTA 3: ARQUEO DE CAJA */}
                {tabAuditoria === 'caja' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {!datosReporte?.movimientosCaja || datosReporte.movimientosCaja.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.8rem' }}>No hay movimientos de caja en este rango. Genera un reporte.</div>
                        ) : (
                            datosReporte.movimientosCaja.map((m: any) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                return (
                                    <div key={m.id} style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', borderLeft: `4px solid ${esIngreso ? '#10b981' : '#ef4444'}`, borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ color: '#fff', fontSize: '0.82rem' }}>
                                                {(m.idVenta || m.idCompraProveedor) && <FaLock size={10} style={{ color: '#f59e0b', marginRight: '4px' }} title="Automático" />}
                                                {m.concepto}
                                            </strong>
                                            <strong style={{ color: esIngreso ? '#10b981' : '#ef4444', fontSize: '0.85rem' }}>
                                                {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                            </strong>
                                        </div>
                                        <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{m.detalle || 'N/A'}</small>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* MODAL EDITAR VENTA AUDITORÍA */}
            {ventaAEditar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>🛠️ Auditoría Factura #000{ventaAEditar.id}</h4>
                            <button onClick={() => setVentaAEditar(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={procesarAuditoriaVenta} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Cliente</label>
                                <select 
                                    value={ventaAEditar.idCliente || ventaAEditar.IdCliente || 0} 
                                    onChange={e => setVentaAEditar({...ventaAEditar, idCliente: Number(e.target.value)})} 
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                >
                                    <option value={0}>Mostrador General</option>
                                    {clientes.map(c => {
                                        const cId = c.id ?? c.Id;
                                        const cNombre = c.nombre ?? c.Nombre;
                                        return <option key={cId} value={cId}>{cNombre}</option>;
                                    })}
                                </select>
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Método de Pago</label>
                                <select value={nuevoMetodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">⚠️ Crédito</option>
                                </select>
                            </div>

                            {/* Detalle de ítems editables */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                <label style={{ color: '#38bdf8', fontSize: '0.7rem', fontWeight: 700 }}>Artículos Facturados</label>
                                {detallesEditados.map((det, idx) => {
                                    const prodAsociado = productos.find(p => (p.id ?? p.Id) === det.idProducto);
                                    const esSuscripcion = prodAsociado?.esSuscripcion || prodAsociado?.EsSuscripcion;
                                    
                                    let diasActuales = prodAsociado?.diasDuracion || 30;
                                    if (det.metadataDigital && det.metadataDigital.startsWith("DIAS:")) {
                                        const extraidos = parseInt(det.metadataDigital.split('|')[0].replace("DIAS:", ""));
                                        if (!isNaN(extraidos)) diasActuales = extraidos;
                                    }

                                    return (
                                        <div key={idx} style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <select 
                                                value={Number(det.idProducto)} 
                                                onChange={e => cambiarProductoDetalle(idx, Number(e.target.value))}
                                                style={{ width: '100%', background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '4px', borderRadius: '4px', fontSize: '0.75rem' }}
                                            >
                                                {productos.map(p => <option key={p.id ?? p.Id} value={Number(p.id ?? p.Id)}>{p.nombre ?? p.Nombre}</option>)}
                                            </select>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                                <div>
                                                    <small style={{ color: '#64748b', fontSize: '0.65rem' }}>Cant.</small>
                                                    <input type="number" value={det.cantidad} min={1} onChange={e => actualizarCantidadDetalle(idx, Number(e.target.value))} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <small style={{ color: '#64748b', fontSize: '0.65rem' }}>Precio C$</small>
                                                    <input type="number" value={det.precioUnitario} onChange={e => actualizarPrecioDetalle(idx, Number(e.target.value))} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                                                </div>
                                                <div>
                                                    <small style={{ color: '#f87171', fontSize: '0.65rem' }}>Desc. C$</small>
                                                    <input type="number" value={det.descuento || 0} min={0} onChange={e => actualizarDescuentoDetalle(idx, Number(e.target.value))} style={{ width: '100%', background: '#1e293b', border: '1px solid #ef4444', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                                                </div>
                                            </div>

                                            {esSuscripcion && (
                                                <div>
                                                    <small style={{ color: '#38bdf8', fontSize: '0.65rem' }}>Días Suscripción:</small>
                                                    <input type="number" value={diasActuales} min={1} onChange={e => actualizarDiasSuscripcion(idx, Number(e.target.value))} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.75rem', boxSizing: 'border-box' }} />
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', borderTop: '1px solid #334155', paddingTop: '4px', marginTop: '2px' }}>
                                                <span style={{ color: '#64748b' }}>Subtotal:</span>
                                                <strong style={{ color: '#10b981' }}>C$ {(det.subTotal ?? 0).toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '8px', borderRadius: '6px', border: '1px solid #334155' }}>
                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Total Factura:</span>
                                <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>
                                    C$ {detallesEditados.reduce((acc, d) => acc + (d.subTotal || 0), 0).toLocaleString()}
                                </strong>
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
                                Guardar y Recalcular
                            </button>

                            <button type="button" onClick={() => eliminarVentaCompleta(ventaAEditar.id)} style={{ width: '100%', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                                🚨 Anular Factura Completa
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};