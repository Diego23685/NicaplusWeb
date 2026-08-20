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
    FaCalendarAlt
} from 'react-icons/fa';
import styles from '../assets/styles/ContabilidadCaja.module.css';

export const ContabilidadCaja: React.FC = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [reporte, setReporte] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    const formatearLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dia}`;
    };

    // FILTROS DE HISTORIAL
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [fechaReferenciaMes, setFechaReferenciaMes] = useState<Date>(new Date());

    // FORMULARIO MOVIMIENTO MANUAL
    const [tipo, setTipo] = useState('Egreso');
    const [concepto, setConcepto] = useState('Gasto Ordinario');
    const [monto, setMonto] = useState(0);
    const [detalle, setDetalle] = useState('');
    const [fechaMovimiento, setFechaMovimiento] = useState(formatearLocal(new Date()));

    // ESTADO PARA EDICIÓN DE MOVIMIENTO
    const [movimientoAEditar, setMovimientoAEditar] = useState<any | null>(null);

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
            // Concatenar con la hora actual local para preservar orden cronológico
            const ahora = new Date();
            const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
            const fechaCompletaISO = new Date(`${fechaMovimiento}T${horaStr}`).toISOString();

            await api.post('/caja/movimientos', { 
                tipo, 
                concepto, 
                monto: Number(monto), 
                detalle,
                fecha: fechaCompletaISO
            });

            alert("Movimiento financiero asentado de forma conforme.");
            setMonto(0); 
            setDetalle('');
            setFechaMovimiento(formatearLocal(new Date()));
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
        const fechaFormateada = m.fecha ? formatearLocal(new Date(m.fecha)) : formatearLocal(new Date());
        setMovimientoAEditar({ ...m, fechaFormateada });
    };

    const guardarEdicionMovimiento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!movimientoAEditar) return;

        try {
            const ahora = new Date();
            const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;
            const fechaCompletaISO = new Date(`${movimientoAEditar.fechaFormateada}T${horaStr}`).toISOString();

            await api.put(`/caja/movimientos/${movimientoAEditar.id}`, {
                tipo: movimientoAEditar.tipo,
                concepto: movimientoAEditar.concepto,
                monto: Number(movimientoAEditar.monto),
                detalle: movimientoAEditar.detalle,
                fecha: fechaCompletaISO
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

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Procesando balances contables...</div>;

    return (
        <div className={styles.container}>
            
            {/* ENCABEZADO */}
            <div className={styles.header}>
                <h3>Arqueo de Caja y Libro Contable</h3>
                <p>Control de flujos brutos, costos operativos y utilidades netas reales.</p>
            </div>

            {/* SECCIÓN 1: METRICAS REALES (DÍA VS MES) */}
            <div className={styles.metricsGrid}>
                <div className={`${styles.card} ${styles.cardUtilidadDiaria}`}>
                    <small>UTILIDAD DIARIA NETAL</small>
                    <h3 style={{ color: '#10b981' }}>C$ {reporte?.dia?.utilidad?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Ingresos Hoy: C$ {reporte?.dia?.ingresos ?? 0}</span>
                </div>
                <div className={`${styles.card} ${styles.cardUtilidadMensual}`}>
                    <small>UTILIDAD MENSUAL NETAL</small>
                    <h3 style={{ color: '#38bdf8' }}>C$ {reporte?.mes?.utilidad?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Ingresos Mes: C$ {reporte?.mes?.ingresos ?? 0}</span>
                </div>
                <div className={`${styles.card} ${styles.cardCostoCompras}`}>
                    <small>COSTO EN COMPRAS (MES)</small>
                    <h3 style={{ color: '#a855f7' }}>C$ {reporte?.mes?.compras?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Inversión en reabastecimiento</span>
                </div>
                <div className={`${styles.card} ${styles.cardGastosOperativos}`}>
                    <small>GASTOS OPERATIVOS (MES)</small>
                    <h3 style={{ color: '#ef4444' }}>C$ {reporte?.mes?.gastos?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Luz, internet, pérdidas fijos</span>
                </div>
            </div>

            <div className={styles.mainLayout}>
                {/* PANEL IZQUIERDO: REGISTRO DE MOVIMIENTO MANUAL */}
                <div className={styles.formPanel}>
                    <h4><FaFileInvoiceDollar /> Registrar Flujo Manual</h4>
                    <form onSubmit={guardarMovimiento} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Tipo de Movimiento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} className={styles.input} style={{ cursor: 'pointer' }}>
                                <option value="Egreso">🛑 Egreso / Salida</option>
                                <option value="Ingreso">💵 Ingreso / Entrada</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Concepto Contable</label>
                            <select value={concepto} onChange={e => setConcepto(e.target.value)} className={styles.input} style={{ cursor: 'pointer' }}>
                                <option value="Gasto Ordinario">Gasto Ordinario (Luz, Renta, Servicios)</option>
                                <option value="Ajuste">Ajuste de Caja</option>
                                <option value="Venta">Ingreso Extraordinario</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label><FaCalendarAlt size={11} /> Fecha del Movimiento</label>
                            <input 
                                type="date" 
                                value={fechaMovimiento} 
                                onChange={e => setFechaMovimiento(e.target.value)} 
                                className={styles.input} 
                                required 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Monto Transacción (C$)</label>
                            <input type="number" min={1} value={monto || ''} onChange={e => setMonto(Number(e.target.value))} className={styles.input} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Descripción / Justificación</label>
                            <input type="text" placeholder="Ej: Pago de recibo Claro internet" value={detalle} onChange={e => setDetalle(e.target.value)} className={styles.input} required />
                        </div>
                        <button type="submit" className={styles.btnSubmit}><FaSave /> Asentar en Libro</button>
                    </form>
                </div>

                {/* PANEL DERECHO: HISTORIAL CONTABLE */}
                <div className={styles.tablePanel}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <h4><FaHistory /> Auditoría de Libro Diario</h4>
                        
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => aplicarRangoRapido('hoy')} className={styles.btnRango} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Hoy</button>
                            <button onClick={() => aplicarRangoRapido('mes')} className={styles.btnRango} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Este Mes</button>
                            <button onClick={() => aplicarRangoRapido('mesPasado')} className={styles.btnRango} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Mes Pasado</button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px' }}>
                                <button onClick={() => cambiarMesRelativo(-1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px 6px' }} title="Mes Anterior">
                                    <FaChevronLeft size={10} />
                                </button>
                                <span style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 'bold' }}>
                                    {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}
                                </span>
                                <button onClick={() => cambiarMesRelativo(1)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px 6px' }} title="Mes Siguiente">
                                    <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={styles.input} style={{ fontSize: '0.75rem', padding: '4px 8px' }} />
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>a</span>
                        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={styles.input} style={{ fontSize: '0.75rem', padding: '4px 8px' }} />
                        <button onClick={consultarHistorialPorFechas} className={styles.btnSubmit} style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaSearch size={10} /> Filtrar
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Detalle / Concepto</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                    <th style={{ textAlign: 'center', width: '80px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                                    movimientos.map((m) => {
                                        const esIngreso = m.tipo === 'Ingreso';
                                        const esAuto = m.esAutomatico || m.es_automatico;

                                        return (
                                            <tr key={m.id} className={esIngreso ? styles.rowIngreso : styles.rowEgreso}>
                                                <td>
                                                    <strong style={{ color: '#fff' }}>
                                                        {esAuto && <FaLock size={10} style={{ color: '#f59e0b', marginRight: '6px' }} title="Movimiento automático de sistema" />}
                                                        {m.detalle}
                                                    </strong>
                                                    <span className={styles.subRowText}>
                                                        📂 {m.concepto} • 📅 {new Date(m.fecha).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className={`${styles.txtMonto} ${esIngreso ? styles.txtIngreso : styles.txtEgreso}`}>
                                                    {esIngreso ? '+' : '-'} C$ {m.monto.toLocaleString()}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {!esAuto ? (
                                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                            <button 
                                                                onClick={() => abrirModalEdicion(m)} 
                                                                style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Editar Movimiento Manual"
                                                            >
                                                                <FaEdit size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => eliminarMovimiento(m)} 
                                                                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                                title="Eliminar Movimiento Manual"
                                                            >
                                                                <FaTrash size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>Sistema</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                            No hay movimientos de caja registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL DE EDICIÓN DE MOVIMIENTO MANUAL */}
            {movimientoAEditar && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
                        padding: '20px', width: '400px', maxWidth: '90%', color: '#f8fafc'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>✏️ Editar Movimiento #{movimientoAEditar.id}</h4>
                            <button onClick={() => setMovimientoAEditar(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <form onSubmit={guardarEdicionMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo de Movimiento</label>
                                <select 
                                    value={movimientoAEditar.tipo} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, tipo: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '100%', marginTop: '4px' }}
                                >
                                    <option value="Egreso">🛑 Egreso / Salida</option>
                                    <option value="Ingreso">💵 Ingreso / Entrada</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Concepto Contable</label>
                                <select 
                                    value={movimientoAEditar.concepto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, concepto: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '100%', marginTop: '4px' }}
                                >
                                    <option value="Gasto Ordinario">Gasto Ordinario (Luz, Renta, Servicios)</option>
                                    <option value="Ajuste">Ajuste de Caja</option>
                                    <option value="Venta">Ingreso Extraordinario</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaCalendarAlt size={10} /> Fecha del Movimiento</label>
                                <input 
                                    type="date" 
                                    value={movimientoAEditar.fechaFormateada} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, fechaFormateada: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '100%', marginTop: '4px' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Monto (C$)</label>
                                <input 
                                    type="number" 
                                    min={0.01}
                                    step="0.01"
                                    value={movimientoAEditar.monto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, monto: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '100%', marginTop: '4px' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Descripción / Justificación</label>
                                <input 
                                    type="text" 
                                    value={movimientoAEditar.detalle} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, detalle: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '100%', marginTop: '4px' }}
                                    required 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setMovimientoAEditar(null)} style={{ background: '#64748b', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ background: '#10b981', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};