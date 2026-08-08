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
import '../assets/styles/Reportes.css';

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

    // Estado para conmutar las vistas de auditoría
    const [tabAuditoria, setTabAuditoria] = useState<'ventas' | 'compras' | 'caja'>('ventas');

    const [ventaAEditar, setVentaAEditar] = useState<any | null>(null);
    const [nuevoMetodoPago, setMetodoPago] = useState('');
    const [detallesEditados, setDetallesEditados] = useState<any[]>([]);

    const cargarHistorialVentas = async () => {
        try {
            const res = await api.get('/ventas');
            setVentasHistorial(res.data);
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
        } catch (err) {
            alert("Error al generar el reporte.");
        } finally {
            setCargandoReporte(false);
        }
    };

    // 1. Carga inicial de datos base y asignación de rango "Hoy"
    useEffect(() => {
        aplicarRangoRapido('hoy');
        cargarHistorialVentas();
    }, []);

    // 2. Consulta automática de reportes/arqueos cuando las fechas ya están establecidas
    useEffect(() => {
        if (desde && hasta) {
            ConsultarReporte();
        }
    }, [desde, hasta]);

    useEffect(() => {
        api.get('/clientes').then(res => setClientes(res.data)).catch(() => {});
        api.get('/products').then(res => setProductos(res.data)).catch(() => {});
    }, []);

    const ventasFiltradas = ventasHistorial.filter(v => {
        // 1. Filtro por Búsqueda rápida (Factura / Nombre de cliente)
        const coincideTexto = v.id.toString().includes(busquedaFactura) || 
            (v.cliente?.nombre || v.cliente?.Nombre || 'mostrador').toLowerCase().includes(busquedaFactura.toLowerCase());

        if (!coincideTexto) return false;

        // 2. Filtro por Cliente seleccionado
        if (clienteFiltro) {
            const idCliVenta = v.idCliente ?? v.IdCliente;
            if (idCliVenta !== Number(clienteFiltro)) return false;
        }

        // 3. Filtro por Rubro seleccionado
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
        setMetodoPago(venta.metodoPago);
        
        const detallesConNombre = venta.detalles.map((d: any) => {
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
            setCargandoTabla(true);
            cargarHistorialVentas();
            api.get('/products').then(resProd => setProductos(resProd.data)).catch(() => {});
            if (desde && hasta) ConsultarReporte();
        } catch (err: any) {
            alert(err.response?.data?.mensaje || err.response?.data || "Error al eliminar la venta.");
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
            alert("Factura modificada con éxito. El inventario físico y dinero en caja han sido recalculados.");
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
            alert("El navegador bloqueó la ventana emergente. Por favor, permite los popups.");
            return;
        }

        const rangoPeriodo = datosReporte?.rango || 'Periodo no especificado';
        const transacciones = datosReporte?.transacciones || [];
        const comprasProveedores = datosReporte?.comprasProveedores || [];
        const movimientosCaja = datosReporte?.movimientosCaja || [];

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
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        margin: 40px; 
                        color: #1e293b; 
                        background: #ffffff; 
                        line-height: 1.4;
                    }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    
                    .logo-container {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    .logo-text {
                        font-size: 24px;
                        font-weight: 800;
                        color: #0f172a;
                        letter-spacing: -0.02em;
                        line-height: 1;
                    }
                    .logo-sub {
                        color: #8b00d0;
                    }
                    .logo-tag {
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.15em;
                        color: #64748b;
                        margin-top: 2px;
                    }
                    
                    .titulo-reporte { text-align: right; font-size: 12px; color: #64748b; line-height: 1.6; }
                    
                    .grid-cards { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 12px; 
                        margin-bottom: 25px; 
                    }
                    .card { 
                        border: 1px solid #e2e8f0; 
                        padding: 12px; 
                        border-radius: 6px; 
                        background: #f8fafc; 
                    }
                    .card small { color: #64748b; font-weight: bold; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .card h3 { margin: 4px 0 0 0; color: #0f172a; font-size: 16px; }
                    .card-total { border: 1px solid #10b981; background: #f0fdf4; }
                    .card-total h3 { color: #16a34a; }

                    table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 25px; }
                    table.data-table th { background: #0f172a; color: white; padding: 8px 10px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                    table.data-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155; }
                    table.data-table tr:nth-child(even) { background: #f8fafc; }
                    
                    .seccion-titulo { 
                        font-size: 13px; 
                        color: #0f172a; 
                        border-bottom: 2px solid #8b00d0; 
                        padding-bottom: 4px; 
                        margin-top: 25px; 
                        font-weight: bold; 
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                    }

                    .firmas-container {
                        margin-top: 60px;
                        display: flex;
                        justify-content: space-between;
                        page-break-inside: avoid;
                    }
                    .firma-box {
                        width: 45%;
                        border-top: 1px solid #94a3b8;
                        text-align: center;
                        padding-top: 8px;
                        font-size: 11px;
                        color: #64748b;
                    }

                    @media print {
                        body { margin: 20px; }
                        .seccion-titulo { page-break-after: avoid; }
                        table { page-break-inside: auto; }
                        tr { page-break-inside: avoid; page-break-after: auto; }
                    }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="logo-container">
                                <img src="https://i.imgur.com/Oyiao8C.png" alt="Logo" style="height: 42px; width: auto;" />
                                <div>
                                    <div class="logo-text">NICA<span class="logo-sub">PLUS GAMING</span></div>
                                    <div class="logo-tag">Venta de celulares y accesorios</div>
                                </div>
                            </div>
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
                    <div class="card card-total">
                        <small>Total Neto Recaudado</small><h3>C$ ${Number(totalNeto).toLocaleString()}</h3>
                    </div>
                </div>

                <div class="grid-cards" style="grid-template-columns: repeat(4, 1fr);">
                    <div class="card"><small>Costo Mercancía (CMV)</small><h3>C$ ${Number(costoMercancia).toLocaleString()}</h3></div>
                    <div class="card"><small>Inversión en Compras</small><h3 style="color: #a855f7;">C$ ${Number(inversionCompras).toLocaleString()}</h3></div>
                    <div class="card"><small>Gastos Operativos</small><h3>C$ ${Number(gastosOperativos).toLocaleString()}</h3></div>
                    <div class="card card-total" style="border-color: #3b82f6; background: #eff6ff;">
                        <small style="color: #1d4ed8;">Utilidad Neta Real</small>
                        <h3 style="color: #1e40af;">C$ ${Number(utilidadNeta).toLocaleString()}</h3>
                    </div>
                </div>

                <div class="seccion-titulo">II. Rendimiento de Productos / Servicios (Top)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Producto / Servicio</th>
                            <th style="width: 150px; text-align: center;">Cantidad Vendida</th>
                            <th style="width: 150px; text-align: right;">Total Recaudado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listaProductos.length === 0 
                            ? `<tr><td colspan="3" style="text-align: center; color: #94a3b8;">No hay registros de productos en este rango.</td></tr>`
                            : listaProductos.map((p: any) => `
                                <tr>
                                    <td>${p?.producto || 'Servicio General'}</td>
                                    <td style="text-align: center;"><strong>${p?.cantidad ?? 0}</strong></td>
                                    <td style="text-align: right; font-weight: 600;">C$ ${(p?.subtotal ?? 0).toLocaleString()}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>

                <div class="seccion-titulo">III. Libro Diario / Registro Detallado de Ventas</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 90px;">N° Factura</th>
                            <th style="width: 100px;">Fecha</th>
                            <th>Cliente</th>
                            <th>Detalle Items</th>
                            <th style="width: 110px;">Método Pago</th>
                            <th style="width: 120px; text-align: right;">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transacciones.length === 0 
                            ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No hay transacciones registradas.</td></tr>`
                            : transacciones.map((t: any) => {
                                const ventaCompleta = ventasHistorial.find(v => v.id === t.id);
                                const detalles = ventaCompleta?.detalles || [];
                                
                                return `
                                    <tr>
                                        <td><strong>#000${t?.id}</strong></td>
                                        <td>${formatearFechaSegura(t)}</td>
                                        <td>${obtenerClienteCruzado(t)}</td>
                                        <td>
                                            <div style="font-size: 9px; color: #475569;">
                                                ${detalles.map((d: any) => {
                                                    const productoEncontrado = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                                                    const nombreProducto = productoEncontrado 
                                                        ? (productoEncontrado.nombre ?? productoEncontrado.Nombre) 
                                                        : (d.nombre || `Producto #${d.idProducto}`);
                                                        
                                                    return `<div>• ${d.cantidad}x ${nombreProducto}</div>`;
                                                }).join('')}
                                            </div>
                                        </td>
                                        <td><span style="font-size: 10px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${t?.metodoPago}</span></td>
                                        <td style="text-align: right; font-weight: 600; color: #0f172a;">C$ ${(t?.total ?? 0).toLocaleString()}</td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>

                <div class="seccion-titulo">IV. Compras y Reabastecimiento a Proveedores</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">N° Orden</th>
                            <th style="width: 100px;">Fecha</th>
                            <th>Proveedor</th>
                            <th>Detalle de Productos</th>
                            <th>Notas / Correos</th>
                            <th style="width: 120px; text-align: right;">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comprasProveedores.length === 0 
                            ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No se registraron compras a proveedores en este período.</td></tr>`
                            : comprasProveedores.map((c: any) => `
                                <tr>
                                    <td><strong>#${c.id}</strong></td>
                                    <td>${c.fecha}</td>
                                    <td>${c.proveedor}</td>
                                    <td>
                                        <div style="font-size: 9px; color: #475569;">
                                            ${(c.items || []).map((item: any) => `<div>• ${item.cantidad}x ${item.producto} (a C$ ${item.costoUnitario})</div>`).join('')}
                                        </div>
                                    </td>
                                    <td style="font-size: 10px; color: #64748b;">${c.observaciones || 'Sin notas'}</td>
                                    <td style="text-align: right; font-weight: 600; color: #dc2626;">C$ ${Number(c.totalCompra).toLocaleString()}</td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>

                <div class="seccion-titulo">V. Arqueos y Flujos de Caja (Libro Diario)</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">ID</th>
                            <th style="width: 100px;">Fecha</th>
                            <th style="width: 100px;">Tipo</th>
                            <th>Concepto / Categoría</th>
                            <th>Descripción / Detalle</th>
                            <th style="width: 120px; text-align: right;">Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimientosCaja.length === 0 
                            ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No hay movimientos de caja en este rango.</td></tr>`
                            : movimientosCaja.map((m: any) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                return `
                                    <tr>
                                        <td><strong>#${m.id}</strong></td>
                                        <td>${m.fecha}</td>
                                        <td><span style="font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 600; background: ${esIngreso ? '#dcfce7' : '#fee2e2'}; color: ${esIngreso ? '#15803d' : '#b91c1c'};">${m.tipo}</span></td>
                                        <td><strong>${m.concepto}</strong></td>
                                        <td style="font-size: 10px; color: #475569;">${m.detalle || 'N/A'}</td>
                                        <td style="text-align: right; font-weight: 600; color: ${esIngreso ? '#16a34a' : '#dc2626'};">
                                            ${esIngreso ? '+' : '-'} C$ ${Number(m.monto).toLocaleString()}
                                        </td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>

                <div class="firmas-container">
                    <div class="firma-box">
                        <br><br><br>
                        <strong>Firma de Cajero / Auditor</strong><br>
                        <span>Responsable de Turno</span>
                    </div>
                    <div class="firma-box">
                        <br><br><br>
                        <strong>Firma de Administración</strong><br>
                        <span>Aprobación y Cierre de Caja</span>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    }
                </script>
            </body>
            </html>
        `;

        ventanaPrint.document.write(htmlDocumento);
        ventanaPrint.document.close();
    };

    return (
        <div className="reportesContainer">
            <div>
                <h3 className="headerTitle">📈 Centro de Reportes y Auditoría Contable</h3>
                <p className="headerSubtitle">Análisis financiero del periodo y corrección de libros de IVA/Inventario.</p>
            </div>
            
            {/* Reemplaza la sección del JSX dentro de <div className="filtrosContainer"> */}
            <div className="filtrosContainer">
                <div className="rangoBotones" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => aplicarRangoRapido('hoy')} className="btnRango">Hoy</button>
                    <button onClick={() => aplicarRangoRapido('semana')} className="btnRango">Esta Semana</button>
                    <button onClick={() => aplicarRangoRapido('mes')} className="btnRango">Este Mes</button>
                    <button onClick={() => aplicarRangoRapido('mesPasado')} className="btnRango">Mes Pasado</button>
                    <button onClick={() => aplicarRangoRapido('ano')} className="btnRango">Año</button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                        <button 
                            onClick={() => cambiarMesRelativo(-1)} 
                            className="btnRango" 
                            title="Mes Anterior"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                        >
                            <FaChevronLeft />
                        </button>

                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#e2e8f0', minWidth: '110px', textAlign: 'center' }}>
                            {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>

                        <button 
                            onClick={() => cambiarMesRelativo(1)} 
                            className="btnRango" 
                            title="Mes Siguiente"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                <div className="fechasInputs" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label className="labelFecha">Desde: 
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="inputControlado" />
                    </label>
                    <label className="labelFecha">Hasta: 
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="inputControlado" />
                    </label>

                    {/* NUEVO: Selector de Rubro */}
                    <label className="labelFecha">Rubro:
                        <select 
                            value={rubroFiltro} 
                            onChange={e => setRubroFiltro(e.target.value)} 
                            className="inputControlado"
                            style={{ background: '#1e293b', color: '#fff', borderColor: '#334155' }}
                        >
                            <option value="Todos">🌐 Todos los Rubros</option>
                            <option value="Tienda">🛍️ Tienda (Físico / Servicios)</option>
                            <option value="Streaming">📺 Streaming / Licencias</option>
                            <option value="Videojuegos">🎮 Videojuegos</option>
                        </select>
                    </label>

                    {/* NUEVO: Selector de Cliente */}
                    <label className="labelFecha">Cliente:
                        <select 
                            value={clienteFiltro} 
                            onChange={e => setClienteFiltro(e.target.value)} 
                            className="inputControlado"
                            style={{ background: '#1e293b', color: '#fff', borderColor: '#334155' }}
                        >
                            <option value="">👤 Todos los Clientes</option>
                            {clientes.map(c => (
                                <option key={c.id ?? c.Id} value={c.id ?? c.Id}>
                                    {c.nombre ?? c.Nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <button onClick={ConsultarReporte} className="btnGenerar">
                    {cargandoReporte ? 'Calculando...' : 'Generar Reporte'}
                </button>
            </div>

            {datosReporte && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="visualizacionHeader">
                        <h4 className="txtPeriodo">Visualización del período: <strong>{datosReporte.rango}</strong></h4>
                        <button onClick={exportarAPDF} className="btnExportar">
                            <FaFilePdf /> Imprimir / Guardar PDF
                        </button>
                    </div>

                    {/* TARJETAS KPI AMPLIADAS CON CRÉDITO */}
                    <div className="kpiGrid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <div className="kpiCard cajaReal">
                            <small className="kpiLabel">BALANCE NETO (CAJA REAL)</small>
                            <h3 className="kpiValue cajaReal">
                                C$ {(datosReporte?.finanzas?.balanceCajaReal ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard efectivo">
                            <small className="kpiLabel">TOTAL FACTURADO</small>
                            <h3 className="kpiValue">
                                C$ {(datosReporte?.finanzas?.totalFacturado ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard" style={{ borderLeft: '4px solid #f59e0b', background: '#fffbeb' }}>
                            <small className="kpiLabel" style={{ color: '#b45309' }}>VENTAS AL CRÉDITO</small>
                            <h3 className="kpiValue" style={{ color: '#d97706' }}>
                                C$ {(datosReporte?.finanzas?.credito ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard transferencia" style={{ borderLeft: '4px solid #a855f7' }}>
                            <small className="kpiLabel">INVERSIÓN EN COMPRAS</small>
                            <h3 className="kpiValue" style={{ color: '#a855f7' }}>
                                C$ {(datosReporte?.finanzas?.inversionCompras ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard tarjeta" style={{ borderLeft: '4px solid #ef4444' }}>
                            <small className="kpiLabel">GASTOS OPERATIVOS</small>
                            <h3 className="kpiValue" style={{ color: '#ef4444' }}>
                                C$ {(datosReporte?.finanzas?.gastosOperativos ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard tarjeta">
                            <small className="kpiLabel">UTILIDAD NETA ESTIMADA</small>
                            <h3 className="kpiValue" style={{ color: '#10b981' }}>
                                C$ {(datosReporte?.finanzas?.utilidadNeta ?? 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <div className="subPanelHeader" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={() => setTabAuditoria('ventas')} 
                            className={`btnRango ${tabAuditoria === 'ventas' ? 'btnRangoActive' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FaCalendarAlt /> Ventas POS
                        </button>
                        <button 
                            onClick={() => setTabAuditoria('compras')} 
                            className={`btnRango ${tabAuditoria === 'compras' ? 'btnRangoActive' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FaShoppingCart /> Compras Proveedores
                        </button>
                        <button 
                            onClick={() => setTabAuditoria('caja')} 
                            className={`btnRango ${tabAuditoria === 'caja' ? 'btnRangoActive' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <FaExchangeAlt /> Libro Diario / Arqueo
                        </button>
                    </div>

                    {tabAuditoria === 'ventas' && (
                        <div className="searchWrapper">
                            <FaSearch className="searchIcon" />
                            <input 
                                type="text" 
                                placeholder="Buscar por factura o cliente..." 
                                value={busquedaFactura} 
                                onChange={e => setBusquedaFactura(e.target.value)} 
                                className="inputControlado searchInput" 
                            />
                        </div>
                    )}
                </div>

                <div className="tablaWrapper">
                    {/* VISTA 1: TABLA DE VENTAS */}
                    {tabAuditoria === 'ventas' && (
                        cargandoTabla ? (
                            <div style={{ color: '#38bdf8', textAlign: 'center', padding: '15px' }}>Sincronizando transacciones...</div>
                        ) : (
                            <div className="innerTableScroll">
                                <table className="tablaAuditoria">
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
                                        {ventasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No se encontraron transacciones registradas.</td>
                                            </tr>
                                        ) : (
                                            ventasFiltradas.map((v) => (
                                                <tr key={v.id}>
                                                    <td className="facturaId">#000{v.id}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        {v.fechaVenta ? new Date(v.fechaVenta).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            if (v.cliente?.nombre || v.cliente?.Nombre) {
                                                                return v.cliente.nombre || v.cliente.Nombre;
                                                            }
                                                            const idCli = v.idCliente || v.IdCliente;
                                                            if (idCli) {
                                                                const cli = clientes.find(c => (c.id ?? c.Id) === idCli);
                                                                if (cli) return cli.nombre || cli.Nombre;
                                                            }
                                                            return 'Mostrador General';
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <span className="badgeMetodo">{v.metodoPago}</span>
                                                    </td>
                                                    <td style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'normal' }}>
                                                        {v.detalles?.map((d: any, idx: number) => {
                                                            const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
                                                            return (
                                                                <div key={idx}>
                                                                    {d.cantidad}x {prod ? (prod.nombre ?? prod.Nombre) : (d.nombre || `Producto #${d.idProducto}`)}
                                                                </div>
                                                            );
                                                        })}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }} className="montoTotal">
                                                        C$ {(v.total ?? 0).toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                            <button onClick={() => abrirEditorVenta(v)} className="btnCorregir" title="Editar Venta">
                                                                <FaEdit />
                                                            </button>
                                                            <button onClick={() => reimprimirTicket(v)} className="btnCorregir" style={{ background: '#3b82f6' }} title="Reimprimir Ticket">
                                                                <FaPrint />
                                                            </button>
                                                            <button onClick={() => reordenarEnviarWhatsApp(v)} className="btnCorregir" style={{ background: '#22c55e' }} title="Reenviar por WhatsApp">
                                                                <FaWhatsapp />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}

                    {/* VISTA 2: TABLA DE COMPRAS A PROVEEDORES */}
                    {tabAuditoria === 'compras' && (
                        <div className="innerTableScroll">
                            <table className="tablaAuditoria">
                                <thead>
                                    <tr>
                                        <th>N° Orden</th>
                                        <th>Fecha</th>
                                        <th>Proveedor</th>
                                        <th>Detalle Items</th>
                                        <th>Notas / Correos</th>
                                        <th style={{ textAlign: 'right' }}>Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!datosReporte?.comprasProveedores || datosReporte.comprasProveedores.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No se encontraron compras a proveedores en este rango. Genera un reporte para consultar.</td>
                                        </tr>
                                    ) : (
                                        datosReporte.comprasProveedores.map((c: any) => (
                                            <tr key={c.id}>
                                                <td className="facturaId">#{c.id}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>{c.fecha}</td>
                                                <td><strong>{c.proveedor}</strong></td>
                                                <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                                    {(c.items || []).map((item: any, idx: number) => (
                                                        <div key={idx}>• {item.cantidad}x {item.producto} (a C$ {item.costoUnitario})</div>
                                                    ))}
                                                </td>
                                                <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{c.observaciones || 'Sin notas'}</td>
                                                <td style={{ textAlign: 'right', color: '#f87171', fontWeight: 'bold' }}>
                                                    C$ {Number(c.totalCompra).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* VISTA 3: TABLA DE ARQUEOS Y MOVIMIENTOS DE CAJA */}
                    {tabAuditoria === 'caja' && (
                        <div className="innerTableScroll">
                            <table className="tablaAuditoria">
                                <thead>
                                    <tr>
                                        <th>ID Mov.</th>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Concepto</th>
                                        <th>Detalle / Justificación</th>
                                        <th style={{ textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!datosReporte?.movimientosCaja || datosReporte.movimientosCaja.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay movimientos de caja registrados en este período. Genera un reporte para consultar.</td>
                                        </tr>
                                    ) : (
                                        datosReporte.movimientosCaja.map((m: any) => {
                                            const esIngreso = m.tipo === 'Ingreso';
                                            return (
                                                <tr key={m.id}>
                                                    <td className="facturaId">#{m.id}</td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{m.fecha}</td>
                                                    <td>
                                                        <span className="badgeMetodo" style={{ background: esIngreso ? '#15803d' : '#b91c1c' }}>
                                                            {m.tipo}
                                                        </span>
                                                    </td>
                                                    <td><strong>{m.concepto}</strong></td>
                                                    <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                                                        {(m.idVenta || m.idCompraProveedor) && <FaLock size={10} style={{ color: '#f59e0b', marginRight: '4px' }} title="Movimiento automático de sistema" />}
                                                        {m.detalle || 'N/A'}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: esIngreso ? '#4ade80' : '#f87171' }}>
                                                        {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE AJUSTE CONTABLE REVERSIVO */}
            {ventaAEditar && (
                <div className="modalOverlay">
                    <div className="modalContent" style={{ maxWidth: '850px', width: '90%' }}>
                        <div className="modalHeader">
                            <h3 className="modalTitle">🛠️ Auditoría Absoluta: Factura #000{ventaAEditar.id}</h3>
                            <button onClick={() => setVentaAEditar(null)} className="btnCloseModal"><FaTimes /></button>
                        </div>

                        <form onSubmit={procesarAuditoriaVenta} className="modalForm">
                            <div className="formGrid">
                                <div>
                                    <label className="inputLabel">Asignar Cliente</label>
                                    <select 
                                        value={ventaAEditar.idCliente || ventaAEditar.IdCliente || 0} 
                                        onChange={e => setVentaAEditar({...ventaAEditar, idCliente: Number(e.target.value)})} 
                                        className="inputControlado selectModal"
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
                                    <label className="inputLabel">Método de Pago</label>
                                    <select value={nuevoMetodoPago} onChange={e => setMetodoPago(e.target.value)} className="inputControlado selectModal">
                                        <option value="Efectivo">💵 Efectivo</option>
                                        <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                        <option value="Tarjeta">💳 Tarjeta</option>
                                        <option value="Crédito">⚠️ Crédito Interno</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="inputLabel">Artículos, Precios, Descuentos y Duración</label>
                                <div className="itemsContainer">
                                    {detallesEditados.map((det, idx) => {
                                        const prodAsociado = productos.find(p => (p.id ?? p.Id) === det.idProducto);
                                        const esSuscripcion = prodAsociado?.esSuscripcion || prodAsociado?.EsSuscripcion;
                                        
                                        let diasActuales = prodAsociado?.diasDuracion || 30;
                                        if (det.metadataDigital && det.metadataDigital.startsWith("DIAS:")) {
                                            const extraidos = parseInt(det.metadataDigital.split('|')[0].replace("DIAS:", ""));
                                            if (!isNaN(extraidos)) diasActuales = extraidos;
                                        }

                                        return (
                                            <div key={idx} className="itemRow" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                                                <div>
                                                    <small style={{ fontSize: '9px', color: '#94a3b8' }}>Producto / Servicio</small>
                                                    <select 
                                                        value={Number(det.idProducto)} 
                                                        onChange={e => cambiarProductoDetalle(idx, Number(e.target.value))}
                                                        className="inputControlado inputItem"
                                                        style={{ fontSize: '0.75rem', padding: '4px', width: '100%' }}
                                                    >
                                                        {productos.length === 0 ? (
                                                            <option value={det.idProducto}>{det.nombre}</option>
                                                        ) : (
                                                            productos.map(p => {
                                                                const pId = p.id ?? p.Id;
                                                                const pNombre = p.nombre ?? p.Nombre;
                                                                return <option key={pId} value={Number(pId)}>{pNombre}</option>;
                                                            })
                                                        )}
                                                    </select>
                                                </div>

                                                <div>
                                                    <small style={{ fontSize: '9px', color: '#94a3b8' }}>Cant.</small>
                                                    <input 
                                                        type="number" 
                                                        value={det.cantidad} 
                                                        min={1} 
                                                        onChange={e => actualizarCantidadDetalle(idx, Number(e.target.value))} 
                                                        className="inputControlado inputItem"
                                                        style={{ padding: '4px', textAlign: 'center', width: '100%' }}
                                                    />
                                                </div>

                                                <div>
                                                    <small style={{ fontSize: '9px', color: '#94a3b8' }}>Precio</small>
                                                    <input 
                                                        type="number" 
                                                        value={det.precioUnitario} 
                                                        onChange={e => actualizarPrecioDetalle(idx, Number(e.target.value))} 
                                                        className="inputControlado inputItem"
                                                        style={{ padding: '4px', textAlign: 'center', width: '100%' }}
                                                    />
                                                </div>

                                                <div>
                                                    <small style={{ fontSize: '9px', color: '#f87171' }}>Desc. (C$)</small>
                                                    <input 
                                                        type="number" 
                                                        value={det.descuento || 0} 
                                                        min={0}
                                                        onChange={e => actualizarDescuentoDetalle(idx, Number(e.target.value))} 
                                                        className="inputControlado inputItem"
                                                        style={{ padding: '4px', textAlign: 'center', borderColor: '#f87171', width: '100%' }}
                                                    />
                                                </div>

                                                <div>
                                                    <small style={{ fontSize: '9px', color: '#38bdf8' }}>Días Susc.</small>
                                                    <input 
                                                        type="number" 
                                                        value={diasActuales} 
                                                        min={1}
                                                        disabled={!esSuscripcion}
                                                        onChange={e => actualizarDiasSuscripcion(idx, Number(e.target.value))} 
                                                        className="inputControlado inputItem"
                                                        style={{ padding: '4px', textAlign: 'center', opacity: esSuscripcion ? 1 : 0.4, width: '100%' }}
                                                    />
                                                </div>

                                                <div style={{ textAlign: 'right' }}>
                                                    <small style={{ fontSize: '9px', color: '#94a3b8' }}>Subtotal</small>
                                                    <div className="txtSubtotalItem" style={{ fontWeight: 'bold' }}>
                                                        C$ {(det.subTotal ?? 0).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="modalTotalWrapper">
                                <span>Nuevo Total Factura:</span>
                                <strong className="modalTotalAmount">
                                    C$ {detallesEditados.reduce((acc, d) => acc + (d.subTotal || 0), 0).toLocaleString()}
                                </strong>
                            </div>

                            <div className="modalActions">
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="btnGuardarCambios">Guardar y Recalcular Todo</button>
                                    <button type="button" onClick={() => setVentaAEditar(null)} className="btnCerrarModal">Cerrar</button>
                                </div>
                                <button type="button" onClick={() => eliminarVentaCompleta(ventaAEditar.id)} className="btnEliminarFactura">
                                    🚨 Eliminar Venta por Completo (Destruir Registro)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};