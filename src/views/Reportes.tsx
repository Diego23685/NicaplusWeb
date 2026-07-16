import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaEdit, FaTimes, FaCalendarAlt, FaFilePdf, FaSearch } from 'react-icons/fa';
import '../assets/styles/Reportes.css'; // Importación directa del archivo css limpio

export const Reportes: React.FC = () => {
    // Estados del Generador de Reportes Original
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [datosReporte, setDatosReporte] = useState<any>(null);
    const [cargandoReporte, setCargandoReporte] = useState(false);

    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);

    // Estados de la Tabla de Auditoría de Ventas
    const [ventasHistorial, setVentasHistorial] = useState<any[]>([]);
    const [busquedaFactura, setBusquedaFactura] = useState('');
    const [cargandoTabla, setCargandoTabla] = useState(true);

    // Estados del Modal de Edición Reversiva
    const [ventaAEditar, setVentaAEditar] = useState<any | null>(null);
    const [nuevoMetodoPago, setMetodoPago] = useState('');
    const [detallesEditados, setDetallesEditados] = useState<any[]>([]);

    // Cargar historial de ventas de la tabla de auditoría
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

    const aplicarRangoRapido = (tipo: 'hoy' | 'semana' | 'mes' | 'ano') => {
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
        } else if (tipo === 'ano') {
            fInicio = new Date(Number(year), 0, 1);
        }

        const formatearLocal = (d: Date) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dia = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${dia}`;
        };

        setDesde(formatearLocal(fInicio));
        setHasta(formatearLocal(fFin));
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
        api.get('/clientes').then(res => setClientes(res.data)).catch(() => {});
        api.get('/products').then(res => setProductos(res.data)).catch(() => {});
    }, []);

    const ventasFiltradas = ventasHistorial.filter(v => 
        v.id.toString().includes(busquedaFactura) || 
        (v.cliente?.nombre || v.cliente?.Nombre || 'mostrador').toLowerCase().includes(busquedaFactura.toLowerCase())
    );

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

        // --- PROCESAMIENTO Y LIMPIEZA DE DATOS ---
        const rangoPeriodo = datosReporte?.rango || 'Periodo no especificado';
        const transacciones = datosReporte?.transacciones || [];
        
        // Función todoterreno para extraer y formatear la fecha
        const formatearFechaSegura = (t: any) => {
            const fechaRaw = t?.fechaVenta || t?.fecha || t?.Fecha || t?.fecha_venta || t?.createdAt || t?.created_at;
            if (!fechaRaw) return 'N/A';
            const dateObj = new Date(fechaRaw);
            return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
        };

        // CRUCE DINÁMICO CON ESTADOS DE REACT (ventasHistorial y clientes)
        const obtenerClienteCruzado = (transaccionReporte: any) => {
            if (!transaccionReporte) return 'Mostrador General';

            // 1. Buscamos la venta coincidente en el historial completo del frontend
            const ventaCompleta = ventasHistorial.find(v => v.id === transaccionReporte.id);

            if (ventaCompleta) {
                // Si la venta del historial ya trae el objeto cliente poblado
                if (ventaCompleta.cliente) {
                    const nombreObj = ventaCompleta.cliente.nombre || ventaCompleta.cliente.Nombre;
                    if (nombreObj) return nombreObj;
                }

                // Si la venta solo tiene el ID del cliente, lo cruzamos con el estado local de clientes
                const idCli = ventaCompleta.idCliente || ventaCompleta.IdCliente;
                if (idCli) {
                    const clienteEncontrado = clientes.find(c => (c.id ?? c.Id) === idCli);
                    if (clienteEncontrado) {
                        return clienteEncontrado.nombre || clienteEncontrado.Nombre || 'Mostrador General';
                    }
                }
            }

            // 2. Si no se halló en el historial de ventas, intentamos buscar directamente en la lista de clientes
            // por si la transacción del reporte de casualidad expone algún idCliente o IdCliente
            const idClienteDirecto = transaccionReporte.idCliente || transaccionReporte.IdCliente;
            if (idClienteDirecto) {
                const clienteEncontrado = clientes.find(c => (c.id ?? c.Id) === idClienteDirecto);
                if (clienteEncontrado) {
                    return clienteEncontrado.nombre || clienteEncontrado.Nombre || 'Mostrador General';
                }
            }

            // 3. Fallback de seguridad
            return 'Mostrador General';
        };

        // Cálculos de métricas operativas
        const totalTransacciones = transacciones.length;
        const totalNeto = transacciones.reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const ticketPromedio = totalTransacciones > 0 ? (totalNeto / totalTransacciones) : 0;

        // Desglose por método de pago
        const efectivo = transacciones.filter((t: any) => t.metodoPago === 'Efectivo').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const transferencia = transacciones.filter((t: any) => t.metodoPago === 'Transferencia').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const tarjeta = datosReporte?.finanzas?.tarjeta ?? transacciones.filter((t: any) => t.metodoPago === 'Tarjeta').reduce((acc: number, t: any) => acc + (t.total || 0), 0);
        const credito = transacciones.filter((t: any) => t.metodoPago === 'Crédito').reduce((acc: number, t: any) => acc + (t.total || 0), 0);

        const listaProductos = datosReporte?.topProductos || [];

        // --- PLANTILLA HTML + CSS PROFESIONAL ---
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
                    
                    /* Contenedor del Logo */
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
                    
                    /* Grid de KPIs */
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

                    /* Tablas */
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

                    /* Firmas de Cierre */
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
                <!-- Encabezado Corporativo -->
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

                <!-- Resumen Financiero -->
                <div class="seccion-titulo">I. Resumen de Cierre de Caja</div>
                <br />
                <div class="grid-cards">
                    <div class="card"><small>Efectivo</small><h3>C$ ${Number(efectivo).toLocaleString()}</h3></div>
                    <div class="card"><small>Transferencias</small><h3>C$ ${Number(transferencia).toLocaleString()}</h3></div>
                    <div class="card"><small>Tarjeta / Créditos</small><h3>C$ ${Number(tarjeta + credito).toLocaleString()}</h3></div>
                    <div class="card card-total">
                        <small>Total Neto Recaudado</small><h3>C$ ${Number(totalNeto).toLocaleString()}</h3>
                    </div>
                </div>

                <!-- Métricas Operativas Extra -->
                <div class="grid-cards" style="grid-template-columns: repeat(3, 1fr);">
                    <div class="card"><small>Transacciones Totales</small><h3>${totalTransacciones} Ventas</h3></div>
                    <div class="card"><small>Ticket Promedio</small><h3>C$ ${Number(ticketPromedio.toFixed(2)).toLocaleString()}</h3></div>
                    <div class="card"><small>Estado de Arqueo</small><h3 style="color: #10b981;">Cuadrado ✔</h3></div>
                </div>

                <!-- Top Productos -->
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

                <!-- Libro Diario de Transacciones -->
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
                                // Buscamos la venta completa para obtener los detalles
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
                                                    // BUSCAMOS EL NOMBRE REAL EN TU ESTADO 'productos'
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

                <!-- Firmas de Responsabilidad -->
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
            
            <div className="filtrosContainer">
                <div className="rangoBotones">
                    <button onClick={() => aplicarRangoRapido('hoy')} className="btnRango">Hoy</button>
                    <button onClick={() => aplicarRangoRapido('semana')} className="btnRango">Esta Semana</button>
                    <button onClick={() => aplicarRangoRapido('mes')} className="btnRango">Este Mes</button>
                    <button onClick={() => aplicarRangoRapido('ano')} className="btnRango">Año</button>
                </div>

                <div className="fechasInputs">
                    <label className="labelFecha">Desde: 
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="inputControlado" />
                    </label>
                    <label className="labelFecha">Hasta: 
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="inputControlado" />
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

                    <div className="kpiGrid">
                        <div className="kpiCard cajaReal">
                            <small className="kpiLabel">BALANCE NETO (CAJA REAL)</small>
                            <h3 className="kpiValue cajaReal">
                                C$ {datosReporte.transacciones.reduce((acc: number, t: any) => acc + (t.total || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard efectivo">
                            <small className="kpiLabel">EFECTIVO</small>
                            <h3 className="kpiValue">
                                C$ {datosReporte.transacciones.filter((t: any) => t.metodoPago === 'Efectivo').reduce((acc: number, t: any) => acc + (t.total || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard transferencia">
                            <small className="kpiLabel">TRANSFERENCIA</small>
                            <h3 className="kpiValue">
                                C$ {datosReporte.transacciones.filter((t: any) => t.metodoPago === 'Transferencia').reduce((acc: number, t: any) => acc + (t.total || 0), 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="kpiCard tarjeta">
                            <small className="kpiLabel">TARJETA</small>
                            <h3 className="kpiValue">C$ {(datosReporte?.finanzas?.tarjeta ?? 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '10px' }}>
                <div className="subPanelHeader">
                    <h4 className="subPanelTitle"><FaCalendarAlt /> Libro de Modificaciones e Historial POS</h4>
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
                </div>

                <div className="tablaWrapper">
                    {cargandoTabla ? (
                        <div style={{ color: '#38bdf8', textAlign: 'center', padding: '15px' }}>Sincronizando transacciones...</div>
                    ) : (
                        <table className="tablaAuditoria">
                            <thead>
                                <tr>
                                    <th>Factura</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th>Desglose Items</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
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
                                            <td>{v.cliente?.nombre || v.cliente?.Nombre || 'Mostrador General'}</td>
                                            <td>
                                                <span className="badgeMetodo">{v.metodoPago}</span>
                                            </td>
                                            <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
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
                                                <button onClick={() => abrirEditorVenta(v)} className="btnCorregir">
                                                    <FaEdit /> Corregir
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL DE AJUSTE CONTABLE REVERSIVO */}
            {ventaAEditar && (
                <div className="modalOverlay">
                    <div className="modalContent">
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
                                <label className="inputLabel">Artículos, Precios y Cantidades</label>
                                <div className="itemsContainer">
                                    {detallesEditados.map((det, idx) => (
                                        <div key={idx} className="itemRow">
                                            <select 
                                                value={Number(det.idProducto)} 
                                                onChange={e => cambiarProductoDetalle(idx, Number(e.target.value))}
                                                className="inputControlado inputItem"
                                                style={{ fontSize: '0.75rem', padding: '4px' }}
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

                                            <input 
                                                type="number" 
                                                value={det.cantidad} 
                                                min={1} 
                                                onChange={e => actualizarCantidadDetalle(idx, Number(e.target.value))} 
                                                className="inputControlado inputItem"
                                                style={{ padding: '4px', textAlign: 'center' }}
                                            />

                                            <input 
                                                type="number" 
                                                value={det.precioUnitario} 
                                                onChange={e => actualizarPrecioDetalle(idx, Number(e.target.value))} 
                                                className="inputControlado inputItem"
                                                style={{ padding: '4px', textAlign: 'center' }}
                                            />

                                            <span className="txtSubtotalItem">
                                                C$ {(det.subTotal ?? 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
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