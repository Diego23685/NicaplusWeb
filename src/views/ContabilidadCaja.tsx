import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    FaFileInvoiceDollar, 
    FaSave, 
    FaHistory, 
    FaEdit, 
    FaTrash, 
    FaTimes, 
    FaSearch, 
    FaChevronLeft, 
    FaChevronRight, 
    FaLock,
    FaPlus,
    FaChartBar
} from 'react-icons/fa';

export const ContabilidadCaja: React.FC = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [reporte, setReporte] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    // CONTROL DE NAVEGACIÓN MÓVIL (Pestañas)
    const [tabActiva, setTabActiva] = useState<'balance' | 'registrar' | 'libro'>('balance');

    // FILTROS DE HISTORIAL
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [fechaReferenciaMes, setFechaReferenciaMes] = useState<Date>(new Date());

    // FORMULARIO MOVIMIENTO MANUAL
    const [tipo, setTipo] = useState('Egreso');
    const [concepto, setConcepto] = useState('Gasto Ordinario');
    const [monto, setMonto] = useState(0);
    const [detalle, setDetalle] = useState('');

    // ESTADO PARA EDICIÓN DE MOVIMIENTO
    const [movimientoAEditar, setMovimientoAEditar] = useState<any | null>(null);

    const formatearLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    };

    const aplicarRangoRapido = (tipoRango: 'hoy' | 'mes' | 'mesPasado') => {
        const hoy = new Date();
        const opciones = { timeZone: 'America/Managua', year: 'numeric' as const, month: '2-digit' as const, day: '2-digit' as const };
        const [year, month, day] = new Intl.DateTimeFormat('fr-CA', opciones).format(hoy).split('-');

        let fInicio = new Date(`${year}-${month}-${day}T00:00:00`);
        let fFin = new Date(`${year}-${month}-${day}T23:59:59`);

        if (tipoRango === 'mes') {
            fInicio = new Date(Number(year), Number(month) - 1, 1);
            fFin = new Date(Number(year), Number(month), 0);
            setFechaReferenciaMes(new Date(Number(year), Number(month) - 1, 1));
        } else if (tipoRango === 'mesPasado') {
            fInicio = new Date(Number(year), Number(month) - 2, 1);
            fFin = new Date(Number(year), Number(month) - 1, 0);
            setFechaReferenciaMes(new Date(Number(year), Number(month) - 2, 1));
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

    const cargarDatosCaja = async () => {
        try {
            const [resMovs, resRep] = await Promise.all([
                api.get('/caja/movimientos'),
                api.get('/caja/reporte-utilidades')
            ]);
            
            const rawData = resMovs.data;
            const datosMovimientos = Array.isArray(rawData) 
                ? rawData 
                : (rawData?.datos || rawData?.items || rawData?.$values || []);

            setMovimientos(datosMovimientos);
            setReporte(resRep.data);
        } catch (err) {
            console.error("Error cargando flujos de caja:", err);
            setMovimientos([]);
        } finally {
            setCargando(false);
        }
    };

    const consultarHistorialPorFechas = async () => {
        if (!desde || !hasta) {
            alert("Por favor seleccione ambas fechas para el filtro.");
            return;
        }
        setCargando(true);
        try {
            const res = await api.get(`/caja/movimientos/historial?desde=${desde}&hasta=${hasta}`);
            const rawData = res.data;
            const datosMovimientos = Array.isArray(rawData) 
                ? rawData 
                : (rawData?.datos || rawData?.items || rawData?.$values || []);

            setMovimientos(datosMovimientos);
        } catch (err) {
            alert("Error al consultar el historial por fechas.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { 
        aplicarRangoRapido('hoy');
        cargarDatosCaja(); 
    }, []);

    const guardarMovimiento = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/caja/movimientos', { tipo, concepto, monto: Number(monto), detalle });
            alert("Movimiento financiero asentado de forma conforme.");
            setMonto(0); 
            setDetalle('');
            setTabActiva('libro');
            cargarDatosCaja();
        } catch {
            alert("Error de red al registrar flujo.");
        }
    };

    const abrirModalEdicion = (m: any) => {
        if (m.esAutomatico || m.es_automatico) {
            alert("Los movimientos automáticos derivados de ventas o compras a proveedores deben editarse directamente desde sus módulos correspondientes.");
            return;
        }
        setMovimientoAEditar({ ...m });
    };

    const guardarEdicionMovimiento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!movimientoAEditar) return;

        try {
            await api.put(`/caja/movimientos/${movimientoAEditar.id}`, {
                tipo: movimientoAEditar.tipo,
                concepto: movimientoAEditar.concepto,
                monto: Number(movimientoAEditar.monto),
                detalle: movimientoAEditar.detalle
            });
            alert("Movimiento de caja actualizado correctamente.");
            setMovimientoAEditar(null);
            cargarDatosCaja();
        } catch (err: any) {
            alert(err.response?.data?.mensaje || "Error al actualizar el movimiento.");
        }
    };

    const eliminarMovimiento = async (m: any) => {
        if (m.esAutomatico || m.es_automatico) {
            alert("No es posible eliminar un movimiento automático directamente. Debe anular la venta o compra desde su módulo de auditoría.");
            return;
        }

        if (!window.confirm(`¿Está seguro de eliminar el movimiento "${m.detalle}" por C$ ${m.monto.toLocaleString()}?`)) return;

        try {
            await api.delete(`/caja/movimientos/${m.id}`);
            alert("Movimiento eliminado correctamente.");
            cargarDatosCaja();
        } catch (err: any) {
            alert(err.response?.data?.mensaje || "Error al eliminar el movimiento.");
        }
    };

    if (cargando) return (
        <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>
            Procesando balances contables...
        </div>
    );

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO Y TABS DE NAVEGACIÓN MÓVIL */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Arqueo y Libro Contable</h3>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Control de flujos brutos, costos y utilidad neta</small>
                </div>

                {/* Conmutador de Capas */}
                <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button 
                        onClick={() => setTabActiva('balance')}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            background: tabActiva === 'balance' ? '#38bdf8' : 'transparent',
                            color: tabActiva === 'balance' ? '#0f172a' : '#94a3b8',
                            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        <FaChartBar /> Balance
                    </button>
                    <button 
                        onClick={() => setTabActiva('registrar')}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            background: tabActiva === 'registrar' ? '#38bdf8' : 'transparent',
                            color: tabActiva === 'registrar' ? '#0f172a' : '#94a3b8',
                            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        <FaPlus /> + Flujo
                    </button>
                    <button 
                        onClick={() => setTabActiva('libro')}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            background: tabActiva === 'libro' ? '#38bdf8' : 'transparent',
                            color: tabActiva === 'libro' ? '#0f172a' : '#94a3b8',
                            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        <FaHistory /> Libro ({movimientos.length})
                    </button>
                </div>
            </div>

            {/* PESTAÑA 1: BALANCE DE UTILIDADES Y METRICAS REALES (2x2 Grid Móvil) */}
            {tabActiva === 'balance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #10b981' }}>
                        <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>UTILIDAD DÍA NETAL</small>
                        <h3 style={{ color: '#10b981', margin: '4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                            C$ {reporte?.dia?.utilidad?.toLocaleString() ?? 0}
                        </h3>
                        <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Ingresos: C$ {reporte?.dia?.ingresos ?? 0}</small>
                    </div>

                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #38bdf8' }}>
                        <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>UTILIDAD MES NETAL</small>
                        <h3 style={{ color: '#38bdf8', margin: '4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                            C$ {reporte?.mes?.utilidad?.toLocaleString() ?? 0}
                        </h3>
                        <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Ingresos: C$ {reporte?.mes?.ingresos ?? 0}</small>
                    </div>

                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #a855f7' }}>
                        <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>COMPRAS (MES)</small>
                        <h3 style={{ color: '#a855f7', margin: '4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                            C$ {reporte?.mes?.compras?.toLocaleString() ?? 0}
                        </h3>
                        <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Inversión reabastecimiento</small>
                    </div>

                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #ef4444' }}>
                        <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block', fontWeight: 700 }}>GASTOS (MES)</small>
                        <h3 style={{ color: '#ef4444', margin: '4px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                            C$ {reporte?.mes?.gastos?.toLocaleString() ?? 0}
                        </h3>
                        <small style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Luz, renta, servicios</small>
                    </div>
                </div>
            )}

            {/* PESTAÑA 2: REGISTRO DE MOVIMIENTO MANUAL */}
            {tabActiva === 'registrar' && (
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaFileInvoiceDollar /> Registrar Flujo Manual
                    </h4>
                    
                    <form onSubmit={guardarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Tipo de Movimiento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                                <option value="Egreso">🛑 Egreso / Salida</option>
                                <option value="Ingreso">💵 Ingreso / Entrada</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Concepto Contable</label>
                            <select value={concepto} onChange={e => setConcepto(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                                <option value="Gasto Ordinario">Gasto Ordinario (Luz, Renta, Servicios)</option>
                                <option value="Ajuste">Ajuste de Caja</option>
                                <option value="Venta">Ingreso Extraordinario</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Monto Transacción (C$)</label>
                            <input type="number" min={1} value={monto || ''} onChange={e => setMonto(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Descripción / Justificación</label>
                            <input type="text" placeholder="Ej: Pago de recibo internet" value={detalle} onChange={e => setDetalle(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <FaSave /> Asentar en Libro
                        </button>
                    </form>
                </div>
            )}

            {/* PESTAÑA 3: AUDITORÍA Y LIBRO DIARIO CON FILTROS */}
            {tabActiva === 'libro' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Filtros Rápidos de Fecha */}
                    <div style={{ background: '#1e293b', padding: '10px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                            <button onClick={() => aplicarRangoRapido('hoy')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Hoy</button>
                            <button onClick={() => aplicarRangoRapido('mes')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Este Mes</button>
                            <button onClick={() => aplicarRangoRapido('mesPasado')} style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>Mes Pasado</button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#0f172a', padding: '2px 6px', borderRadius: '6px', border: '1px solid #334155', marginLeft: 'auto' }}>
                                <button onClick={() => cambiarMesRelativo(-1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><FaChevronLeft size={10} /></button>
                                <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 700 }}>
                                    {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase()}
                                </span>
                                <button onClick={() => cambiarMesRelativo(1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><FaChevronRight size={10} /></button>
                            </div>
                        </div>

                        {/* Rango Desde - Hasta */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 6px', borderRadius: '6px', fontSize: '0.75rem' }} />
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>a</span>
                            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 6px', borderRadius: '6px', fontSize: '0.75rem' }} />
                            <button onClick={consultarHistorialPorFechas} style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>
                                <FaSearch size={10} />
                            </button>
                        </div>
                    </div>

                    {/* Timeline de Transacciones Contables */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.isArray(movimientos) && movimientos.length > 0 ? (
                            movimientos.map((m) => {
                                const esIngreso = m.tipo === 'Ingreso';
                                const esAuto = m.esAutomatico || m.es_automatico;

                                return (
                                    <div 
                                        key={m.id} 
                                        style={{ 
                                            background: '#1e293b', 
                                            padding: '10px 12px', 
                                            borderRadius: '10px', 
                                            borderLeft: `4px solid ${esIngreso ? '#10b981' : '#ef4444'}`,
                                            borderTop: '1px solid #334155',
                                            borderRight: '1px solid #334155',
                                            borderBottom: '1px solid #334155',
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            gap: '4px' 
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '70%' }}>
                                                {esAuto && <FaLock size={10} style={{ color: '#f59e0b', flexShrink: 0 }} title="Automático de sistema" />}
                                                <strong style={{ color: '#fff', fontSize: '0.82rem', lineHeight: '1.2' }}>{m.detalle}</strong>
                                            </div>
                                            <strong style={{ color: esIngreso ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
                                                {esIngreso ? '+' : '-'} C$ {m.monto.toLocaleString()}
                                            </strong>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                            <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                📂 {m.concepto} • 📅 {new Date(m.fecha).toLocaleDateString('es-NI')}
                                            </span>

                                            {!esAuto ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button onClick={() => abrirModalEdicion(m)} style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                                        <FaEdit />
                                                    </button>
                                                    <button onClick={() => eliminarMovimiento(m)} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>Sistema</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                                No hay movimientos de caja en este rango.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN DE MOVIMIENTO MANUAL */}
            {movimientoAEditar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>✏️ Editar Movimiento #{movimientoAEditar.id}</h4>
                            <button onClick={() => setMovimientoAEditar(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={guardarEdicionMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Tipo</label>
                                <select 
                                    value={movimientoAEditar.tipo} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, tipo: e.target.value })}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                >
                                    <option value="Egreso">🛑 Egreso / Salida</option>
                                    <option value="Ingreso">💵 Ingreso / Entrada</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Concepto</label>
                                <select 
                                    value={movimientoAEditar.concepto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, concepto: e.target.value })}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                >
                                    <option value="Gasto Ordinario">Gasto Ordinario</option>
                                    <option value="Ajuste">Ajuste de Caja</option>
                                    <option value="Venta">Ingreso Extraordinario</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Monto (C$)</label>
                                <input 
                                    type="number" 
                                    min={0.01}
                                    step="0.01"
                                    value={movimientoAEditar.monto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, monto: e.target.value })}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Descripción</label>
                                <input 
                                    type="text" 
                                    value={movimientoAEditar.detalle} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, detalle: e.target.value })}
                                    style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                    required 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setMovimientoAEditar(null)} style={{ flex: 1, background: '#475569', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};