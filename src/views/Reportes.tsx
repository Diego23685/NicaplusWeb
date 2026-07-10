import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaMoneyBillWave, FaEdit, FaTimes, FaCalendarAlt, FaFilePdf, FaSearch } from 'react-icons/fa';

export const Reportes: React.FC = () => {
    // Estados del Generador de Reportes Original
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [datosReporte, setDatosReporte] = useState<any>(null);
    const [cargandoReporte, setCargandoReporte] = useState(false);

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
        
        // Forzamos la zona horaria comercial de Nicaragua para extraer año, mes y día limpios
        const opciones = { timeZone: 'America/Managua', year: 'numeric' as const, month: '2-digit' as const, day: '2-digit' as const };
        const [year, month, day] = new Intl.DateTimeFormat('fr-CA', opciones).format(hoy).split('-');
        
        // Creamos las fechas base fijadas en hora cero local (T00:00:00)
        let fInicio = new Date(`${year}-${month}-${day}T00:00:00`);
        let fFin = new Date(`${year}-${month}-${day}T00:00:00`);

        if (tipo === 'semana') {
            // Corregimos el cálculo de la semana: si es domingo (0), lo tratamos como el día 7 de la semana
            const diaSemana = fInicio.getDay() === 0 ? 7 : fInicio.getDay();
            fInicio.setDate(fInicio.getDate() - (diaSemana - 1)); // Lunes de la semana actual
        } else if (tipo === 'mes') {
            fInicio = new Date(Number(year), Number(month) - 1, 1); // Primer día del mes actual
        } else if (tipo === 'ano') {
            fInicio = new Date(Number(year), 0, 1); // 1 de Enero del año actual
        }

        // Función auxiliar para formatear localmente como YYYY-MM-DD sin usar toISOString()
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

    // Filtrar la tabla de auditoría por número de factura
    const ventasFiltradas = ventasHistorial.filter(v => 
        v.id.toString().includes(busquedaFactura) || 
        (v.cliente?.nombre || 'mostrador').toLowerCase().includes(busquedaFactura.toLowerCase())
    );

    // Lógica de Modificación en el Modal
    const abrirEditorVenta = (venta: any) => {
        setVentaAEditar(venta);
        setMetodoPago(venta.metodoPago);
        setDetallesEditados(venta.detalles.map((d: any) => ({ ...d })));
    };

    const actualizarCantidadDetalle = (index: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;
        const copia = [...detallesEditados];
        copia[index].cantidad = nuevaCantidad;
        copia[index].subTotal = nuevaCantidad * copia[index].precioUnitario;
        setDetallesEditados(copia);
    };

    const procesarAuditoriaVenta = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventaAEditar) return;

        const payload = {
            id: ventaAEditar.id,
            idUsuario: ventaAEditar.idUsuario,
            idCliente: ventaAEditar.idCliente,
            metodoPago: nuevoMetodoPago,
            detalles: detallesEditados
        };

        try {
            await api.put(`/ventas/${ventaAEditar.id}`, payload);
            alert("Factura modificada con éxito. El inventario físico y dinero en caja han sido recalculados.");
            setVentaAEditar(null);
            setCargandoTabla(true);
            cargarHistorialVentas();
            if (desde && hasta) ConsultarReporte(); // Refrescar reporte si está activo
        } catch (err: any) {
            alert(err.response?.data || "Error al procesar la auditoría.");
        }
    };

    const exportarAPDF = () => {
        if (!datosReporte) return;

        const ventanaPrint = window.open('', '_blank');
        if (!ventanaPrint) return;

        const htmlDocumento = `
            <html>
            <head>
                <title>Reporte_Nicaplus_${datosReporte.rango.replace(/ /g, '_')}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .logo-placeholder { font-size: 24px; font-weight: bold; color: #581c7e; }
                    .titulo-reporte { text-align: right; font-size: 14px; color: #666; }
                    .grid-cards { display: flex; gap: 15px; margin-bottom: 30px; }
                    .card { flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; background: #f8fafc; }
                    .card small { color: #64748b; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                    .card h3 { margin: 5px 0 0 0; color: #0f172a; }
                    table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
                    table.data-table th { background: #581c7e; color: white; padding: 10px; text-align: left; font-size: 13px; }
                    table.data-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                    table.data-table tr:nth-child(even) { background: #f8fafc; }
                    .seccion-titulo { font-size: 16px; color: #0f172a; border-bottom: 2px solid #581c7e; padding-bottom: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td class="logo-placeholder">
                            <span style="color:#047688">NICA</span>PLUS GAMING
                        </td>
                        <td class="titulo-reporte">
                            <strong>AUDITORÍA DE SISTEMA POS</strong><br>
                            Período: ${datosReporte.rango}<br>
                            Generado: ${new Date().toLocaleDateString()}
                        </td>
                    </tr>
                </table>

                <div class="seccion-titulo">Resumen de Ingresos Financieros</div>
                <br>
                <div class="grid-cards">
                    <div class="card">
                        <small>Efectivo</small>
                        <h3>C$ ${datosReporte.finanzas.efectivo}</h3>
                    </div>
                    <div class="card">
                        <small>Transferencias</small>
                        <h3>C$ ${datosReporte.finanzas.transferencia}</h3>
                    </div>
                    <div class="card">
                        <small>Tarjeta</small>
                        <h3>C$ ${datosReporte.finanzas.tarjeta}</h3>
                    </div>
                    <div class="card" style="border: 1px solid #10b981; background: #f0fdf4;">
                        <small style="color:#15803d">Total Neto</small>
                        <h3 style="color:#16a34a">C$ ${datosReporte.finanzas.total}</h3>
                    </div>
                </div>

                <div class="seccion-titulo">Top Productos Vendidos en el Período</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Nombre del Producto / Servicio</th>
                            <th>Unidades Vendidas</th>
                            <th>Total Generado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datosReporte.topProductos.map((p: any) => `
                            <tr>
                                <td>${p.producto}</td>
                                <td><strong>${p.cantidad}</strong></td>
                                <td>C$ ${p.subtotal}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="seccion-titulo">Desglose Colectivo de Transacciones (${datosReporte.ventasTotales})</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Factura</th>
                            <th>Fecha y Hora</th>
                            <th>Atendió</th>
                            <th>Método Pago</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${datosReporte.transacciones.map((t: any) => `
                            <tr>
                                <td>#000${t.id}</td>
                                <td>${t.fecha}</td>
                                <td>${t.operador}</td>
                                <td>${t.metodoPago}</td>
                                <td><strong>C$ ${t.total}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <script>
                    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
                </script>
            </body>
            </html>
        `;

        ventanaPrint.document.write(htmlDocumento);
        ventanaPrint.document.close();
    };

    // Estilos de Input controlados legibles para fondo oscuro
    const estiloInputControlado = {
        padding: '8px 12px',
        background: '#0f172a',
        color: '#ffffff',
        border: '1px solid #334155',
        borderRadius: '6px',
        outline: 'none',
        fontSize: '0.9rem',
        boxSizing: 'border-box' as const
    };

    return (
        <div style={{ textAlign: 'left', color: '#fff', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
            
            <style>{`
                .rango-botones { display: flex; flex-wrap: wrap; gap: 6px; }
                .filtros-container { background: #1e293b; padding: 16px; borderRadius: 12px; border: 1px solid #334155; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }
                .tabla-wrapper { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; overflow-x: auto; }
                @media (max-width: 767px) {
                    .filtros-container { flex-direction: column; align-items: stretch; }
                    .fechas-inputs { flex-direction: column; }
                }
            `}</style>

            <div>
                <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>📈 Centro de Reportes y Auditoría Contable</h3>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Análisis financiero del periodo y corrección de libros de IVA/Inventario.</p>
            </div>
            
            {/* SECCIÓN 1: BARRA DE FILTROS DEL REPORTADOR */}
            <div className="filtros-container">
                <div className="rango-botones">
                    <button onClick={() => aplicarRangoRapido('hoy')} style={{ padding: '8px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Hoy</button>
                    <button onClick={() => aplicarRangoRapido('semana')} style={{ padding: '8px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Esta Semana</button>
                    <button onClick={() => aplicarRangoRapido('mes')} style={{ padding: '8px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Este Mes</button>
                    <button onClick={() => aplicarRangoRapido('ano')} style={{ padding: '8px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Año</button>
                </div>

                <div className="fechas-inputs" style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Desde: 
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ ...estiloInputControlado, marginLeft: '6px' }} />
                    </label>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Hasta: 
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ ...estiloInputControlado, marginLeft: '6px' }} />
                    </label>
                </div>

                <button onClick={ConsultarReporte} style={{ padding: '10px 20px', background: '#38bdf8', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
                    {cargandoReporte ? 'Calculando...' : 'Generar Reporte'}
                </button>
            </div>

            {/* SECCIÓN 2: PRESENTACIÓN DE RESULTADOS EN PANTALLA */}
            {datosReporte && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1' }}>Visualización del período: <strong style={{ color: '#fff' }}>{datosReporte.rango}</strong></h4>
                        <button onClick={exportarAPDF} style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            <FaFilePdf /> Imprimir / Guardar PDF
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #10b981'}}>
                            <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem' }}>BALANCE NETO (CAJA REAL)</small>
                            <h3 style={{ margin: '4px 0 0 0', color: '#10b981', fontSize: '1.4rem' }}>
                                {/* Cambiamos finanzas.total por finanzas.balanceCajaReal */}
                                C$ {(datosReporte?.finanzas?.balanceCajaReal ?? 0).toLocaleString()}
                            </h3>
                        </div>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #38bdf8', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                            <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem' }}>EFECTIVO</small>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem' }}>C$ {(datosReporte?.finanzas?.efectivo ?? 0).toLocaleString()}</h3>
                        </div>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #a855f7', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                            <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem' }}>TRANSFERENCIA</small>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem' }}>C$ {(datosReporte?.finanzas?.transferencia ?? 0).toLocaleString()}</h3>
                        </div>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                            <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem' }}>TARJETA</small>
                            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem' }}>C$ {(datosReporte?.finanzas?.tarjeta ?? 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN 3: TABLA DE AUDITORÍA EN VIVO Y CORRECCIÓN (REVERSIVA) */}
            <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}><FaCalendarAlt /> Libro de Modificaciones e Historial POS</h4>
                    
                    {/* Buscador de facturas */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                        <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.85rem' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por factura o cliente..." 
                            value={busquedaFactura} 
                            onChange={e => setBusquedaFactura(e.target.value)} 
                            style={{ ...estiloInputControlado, width: '100%', paddingLeft: '32px' }} 
                        />
                    </div>
                </div>

                <div className="tabla-wrapper">
                    {cargandoTabla ? (
                        <div style={{ color: '#38bdf8', textAlign: 'center', padding: '15px' }}>Sincronizando transacciones...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>Factura</th>
                                    <th style={{ padding: '10px' }}>Fecha</th>
                                    <th style={{ padding: '10px' }}>Cliente</th>
                                    <th style={{ padding: '10px' }}>Método</th>
                                    <th style={{ padding: '10px' }}>Desglose Items</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Monto</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No se encontraron transacciones registradas.</td>
                                    </tr>
                                ) : (
                                    ventasFiltradas.map((v) => (
                                        <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#38bdf8' }}>#000{v.id}</td>
                                            <td style={{ padding: '10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                                                {v.fechaVenta ? new Date(v.fechaVenta).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td style={{ padding: '10px' }}>{v.cliente?.nombre || 'Mostrador General'}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ padding: '2px 8px', background: '#0f172a', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid #334155' }}>{v.metodoPago}</span>
                                            </td>
                                            <td style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>
                                                {v.detalles?.map((d: any, idx: number) => (
                                                    <div key={idx}>{d.cantidad}x {d.nombre}</div>
                                                ))}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                                                C$ {v.detalles?.reduce((s: number, i: any) => s + i.subTotal, 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <button onClick={() => abrirEditorVenta(v)} style={{ background: '#f59e0b', border: 'none', color: '#000', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
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
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid #f59e0b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaMoneyBillWave /> Corregir Factura #000{ventaAEditar.id}
                            </h3>
                            <button onClick={() => setVentaAEditar(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={procesarAuditoriaVenta} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Método de Pago Efectivo / Banco</label>
                                <select value={nuevoMetodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ ...estiloInputControlado, width: '100%', cursor: 'pointer', marginTop: '4px' }}>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Ajustar Cantidades del Inventario Vendido</label>
                                <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {detallesEditados.map((det, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '65%' }}>
                                                • {det.nombre}
                                            </span>
                                            <input 
                                                type="number" 
                                                value={det.cantidad} 
                                                min={1} 
                                                onChange={e => actualizarCantidadDetalle(idx, Number(e.target.value))} 
                                                style={{ width: '65px', padding: '6px', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', textAlign: 'center', fontSize: '0.85rem' }} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                ⚠️ <strong>Nota de Auditoría Reversiva:</strong> Al procesar este cambio, el backend en .NET reintegrará automáticamente el stock original de MySQL y recalculará las existencias y cajas con los nuevos montos en una sola transacción.
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Guardar Cambios y Revertir
                                </button>
                                <button type="button" onClick={() => setVentaAEditar(null)} style={{ padding: '12px', background: '#475569', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};