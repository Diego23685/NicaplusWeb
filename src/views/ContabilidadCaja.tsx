import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    FaFileInvoiceDollar, 
    FaSave, 
    FaEdit, 
    FaTrash, 
    FaTimes, 
    FaSearch, 
    FaChevronLeft, 
    FaChevronRight, 
    FaLock,
    FaCalendarAlt,
    FaPlus,
    FaChevronUp,
    FaMoneyBillWave} from 'react-icons/fa';
import styles from '../assets/styles/ContabilidadCaja.module.css';

export const ContabilidadCaja: React.FC = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [reporte, setReporte] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
    const [monto, setMonto] = useState<number | ''>('');
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
        } catch {
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
        if (!monto || Number(monto) <= 0) {
            alert("Ingrese un monto válido mayor a 0.");
            return;
        }

        try {
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
            setMonto(''); 
            setDetalle('');
            setFechaMovimiento(formatearLocal(new Date()));
            setMostrarFormulario(false);
            cargarDatosCaja();
        } catch {
            alert("Error de red al registrar flujo.");
        }
    };

    const abrirModalEdicion = (m: any) => {
        if (m.esAutomatico || m.es_automatico) {
            alert("Los movimientos automáticos derivados de ventas o compras deben editarse directamente desde sus respectivos módulos.");
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
            alert("No es posible eliminar un movimiento automático directamente. Anule la venta o compra desde su módulo de auditoría.");
            return;
        }

        if (!window.confirm(`¿Eliminar movimiento "${m.detalle}" por C$ ${Number(m.monto).toLocaleString()}?`)) return;

        try {
            await api.delete(`/caja/movimientos/${m.id}`);
            alert("Movimiento eliminado correctamente.");
            cargarDatosCaja();
        } catch (err: any) {
            alert(err.response?.data?.mensaje || "Error al eliminar el movimiento.");
        }
    };

    if (cargando) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loaderPulse} />
                <span>Procesando balances contables...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            
            {/* 1. ENCABEZADO */}
            <header className={styles.header}>
                <h3 className={styles.title}>Arqueo de Caja y Libro Diario</h3>
                <p className={styles.subtitle}>Flujos brutos, compras operativas y utilidades netas.</p>
            </header>

            {/* 2. KPIS FINANCIEROS */}
            <div className={styles.metricsGrid}>
                <div className={`${styles.card} ${styles.cardUtilidadDiaria}`}>
                    <small className={styles.cardLabel}>Utilidad Neta (Hoy)</small>
                    <h3 className={styles.textGreen}>C$ {reporte?.dia?.utilidad?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Ingresos Hoy: C$ {reporte?.dia?.ingresos?.toLocaleString() ?? 0}</span>
                </div>

                <div className={`${styles.card} ${styles.cardUtilidadMensual}`}>
                    <small className={styles.cardLabel}>Utilidad Neta (Mes)</small>
                    <h3 className={styles.textCyan}>C$ {reporte?.mes?.utilidad?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Ingresos Mes: C$ {reporte?.mes?.ingresos?.toLocaleString() ?? 0}</span>
                </div>

                <div className={`${styles.card} ${styles.cardCostoCompras}`}>
                    <small className={styles.cardLabel}>Compras Lotes (Mes)</small>
                    <h3 className={styles.textPurple}>C$ {reporte?.mes?.compras?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Inversión en stock</span>
                </div>

                <div className={`${styles.card} ${styles.cardGastosOperativos}`}>
                    <small className={styles.cardLabel}>Gastos Operativos (Mes)</small>
                    <h3 className={styles.textRed}>C$ {reporte?.mes?.gastos?.toLocaleString() ?? 0}</h3>
                    <span className={styles.subtext}>Renta, luz, servicios fijos</span>
                </div>
            </div>

            {/* 3. FORMULARIO ACCORDEÓN (FLUJO MANUAL) */}
            <div className={styles.formAccordionWrap}>
                <button 
                    type="button" 
                    onClick={() => setMostrarFormulario(!mostrarFormulario)} 
                    className={styles.accordionToggleBtn}
                >
                    <span className={styles.accordionTitle}>
                        <FaFileInvoiceDollar /> Registrar Flujo Manual (Gasto / Ingreso)
                    </span>
                    {mostrarFormulario ? <FaChevronUp /> : <FaPlus />}
                </button>

                <form 
                    onSubmit={guardarMovimiento} 
                    className={`${styles.formContent} ${!mostrarFormulario ? styles.formCollapsed : ''}`}
                >
                    <div className={styles.formRowDual}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo de Movimiento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} className={styles.select}>
                                <option value="Egreso">🛑 Egreso / Salida</option>
                                <option value="Ingreso">💵 Ingreso / Entrada</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Concepto Contable</label>
                            <select value={concepto} onChange={e => setConcepto(e.target.value)} className={styles.select}>
                                <option value="Gasto Ordinario">Gasto Ordinario (Luz, Renta, Servicios)</option>
                                <option value="Ajuste">Ajuste de Caja</option>
                                <option value="Venta">Ingreso Extraordinario</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formRowDual}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}><FaCalendarAlt size={10} /> Fecha</label>
                            <input 
                                type="date" 
                                value={fechaMovimiento} 
                                onChange={e => setFechaMovimiento(e.target.value)} 
                                className={styles.input} 
                                required 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}><FaMoneyBillWave size={10} /> Monto Transacción (C$) *</label>
                            <input 
                                type="number" 
                                min={0.01} 
                                step="0.01" 
                                placeholder="0.00"
                                value={monto} 
                                onChange={e => setMonto(e.target.value === '' ? '' : Number(e.target.value))} 
                                className={`${styles.input} ${styles.inputMonto}`} 
                                required 
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Descripción / Justificación *</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Pago de recibo Claro internet, Alquiler local..." 
                            value={detalle} 
                            onChange={e => setDetalle(e.target.value)} 
                            className={styles.input} 
                            required 
                        />
                    </div>

                    <button type="submit" className={styles.btnSubmit}>
                        <FaSave /> Asentar en Libro Diario
                    </button>
                </form>
            </div>

            {/* 4. BARRA DE FILTROS TEMPORALES */}
            <div className={styles.filtersBar}>
                <div className={styles.quickPillsRow}>
                    <button type="button" onClick={() => aplicarRangoRapido('hoy')} className={styles.btnPill}>Hoy</button>
                    <button type="button" onClick={() => aplicarRangoRapido('mes')} className={styles.btnPill}>Este Mes</button>
                    <button type="button" onClick={() => aplicarRangoRapido('mesPasado')} className={styles.btnPill}>Mes Pasado</button>
                    
                    <div className={styles.monthNavBox}>
                        <button type="button" onClick={() => cambiarMesRelativo(-1)} className={styles.btnNavMonth} title="Mes Anterior">
                            <FaChevronLeft size={10} />
                        </button>
                        <span className={styles.monthLabel}>
                            {fechaReferenciaMes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()}
                        </span>
                        <button type="button" onClick={() => cambiarMesRelativo(1)} className={styles.btnNavMonth} title="Mes Siguiente">
                            <FaChevronRight size={10} />
                        </button>
                    </div>
                </div>

                <div className={styles.customDateRangeRow}>
                    <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={styles.dateInput} />
                    <span className={styles.textMuted}>a</span>
                    <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className={styles.dateInput} />
                    <button type="button" onClick={consultarHistorialPorFechas} className={styles.btnFilterSubmit}>
                        <FaSearch size={11} /> Filtrar
                    </button>
                </div>
            </div>

            {/* 5. VISTA MÓVIL (FEED DE MOVIMIENTOS) */}
            <div className={styles.mobileFeed}>
                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                    movimientos.map((m) => {
                        const esIngreso = m.tipo === 'Ingreso';
                        const esAuto = m.esAutomatico || m.es_automatico;

                        return (
                            <div key={m.id} className={`${styles.movementCard} ${esIngreso ? styles.cardIngreso : styles.cardEgreso}`}>
                                <div className={styles.movementCardHeader}>
                                    <div className={styles.movementTitleWrap}>
                                        <div className={styles.movementTitle}>
                                            {esAuto && <FaLock size={10} className={styles.textAmber} title="Movimiento automático de sistema" />}
                                            <strong>{m.detalle}</strong>
                                        </div>
                                        <small className={styles.movementConcept}>📂 {m.concepto}</small>
                                    </div>
                                    <strong className={`${styles.movementAmount} ${esIngreso ? styles.textGreen : styles.textRed}`}>
                                        {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                    </strong>
                                </div>

                                <div className={styles.movementCardFooter}>
                                    <span className={styles.movementDate}>
                                        📅 {new Date(m.fecha).toLocaleDateString()}
                                    </span>
                                    <div className={styles.movementActions}>
                                        {!esAuto ? (
                                            <>
                                                <button 
                                                    type="button"
                                                    onClick={() => abrirModalEdicion(m)} 
                                                    className={styles.btnActionEdit}
                                                    title="Editar"
                                                >
                                                    <FaEdit size={12} />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => eliminarMovimiento(m)} 
                                                    className={styles.btnActionDelete}
                                                    title="Eliminar"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className={styles.systemBadge}>Automático</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.emptyFeed}>No hay movimientos registrados para este rango.</div>
                )}
            </div>

            {/* 6. VISTA ESCRITORIO (TABLA >= 1024px) */}
            <div className={styles.desktopTableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Detalle / Concepto</th>
                            <th>Fecha</th>
                            <th style={{ textAlign: 'right' }}>Monto</th>
                            <th style={{ textAlign: 'center', width: '90px' }}>Acciones</th>
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
                                            <div className={styles.movementTitle}>
                                                {esAuto && <FaLock size={10} className={styles.textAmber} />}
                                                <strong>{m.detalle}</strong>
                                            </div>
                                            <small className={styles.textMuted}>📂 {m.concepto}</small>
                                        </td>
                                        <td className={styles.textMuted}>{new Date(m.fecha).toLocaleDateString()}</td>
                                        <td className={`${styles.txtMonto} ${esIngreso ? styles.textGreen : styles.textRed}`}>
                                            {esIngreso ? '+' : '-'} C$ {Number(m.monto).toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {!esAuto ? (
                                                <div className={styles.tableActions}>
                                                    <button onClick={() => abrirModalEdicion(m)} className={styles.btnActionEdit}><FaEdit /></button>
                                                    <button onClick={() => eliminarMovimiento(m)} className={styles.btnActionDelete}><FaTrash /></button>
                                                </div>
                                            ) : (
                                                <span className={styles.systemBadge}>Sistema</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className={styles.emptyFeed}>No hay movimientos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 7. MODAL DE EDICIÓN MANUAL */}
            {movimientoAEditar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <div className={styles.modalHeader}>
                            <h4 className={styles.modalTitle}>✏️ Editar Movimiento #{movimientoAEditar.id}</h4>
                            <button onClick={() => setMovimientoAEditar(null)} className={styles.modalCloseBtn}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={guardarEdicionMovimiento} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tipo de Movimiento</label>
                                <select 
                                    value={movimientoAEditar.tipo} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, tipo: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="Egreso">🛑 Egreso / Salida</option>
                                    <option value="Ingreso">💵 Ingreso / Entrada</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Concepto Contable</label>
                                <select 
                                    value={movimientoAEditar.concepto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, concepto: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="Gasto Ordinario">Gasto Ordinario</option>
                                    <option value="Ajuste">Ajuste de Caja</option>
                                    <option value="Venta">Ingreso Extraordinario</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaCalendarAlt size={10} /> Fecha</label>
                                <input 
                                    type="date" 
                                    value={movimientoAEditar.fechaFormateada} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, fechaFormateada: e.target.value })}
                                    className={styles.input}
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Monto (C$)</label>
                                <input 
                                    type="number" 
                                    min={0.01}
                                    step="0.01"
                                    value={movimientoAEditar.monto} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, monto: e.target.value })}
                                    className={styles.input}
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción</label>
                                <input 
                                    type="text" 
                                    value={movimientoAEditar.detalle} 
                                    onChange={e => setMovimientoAEditar({ ...movimientoAEditar, detalle: e.target.value })}
                                    className={styles.input}
                                    required 
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setMovimientoAEditar(null)} className={styles.btnCancelModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnSaveModal}>
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