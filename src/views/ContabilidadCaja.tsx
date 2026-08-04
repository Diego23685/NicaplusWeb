import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaFileInvoiceDollar, FaSave, FaHistory } from 'react-icons/fa';
import styles from '../assets/styles/ContabilidadCaja.module.css';

export const ContabilidadCaja: React.FC = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [reporte, setReporte] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO MOVIMIENTO MANUAL
    const [tipo, setTipo] = useState('Egreso');
    const [concepto, setConcepto] = useState('Gasto Ordinario');
    const [monto, setMonto] = useState(0);
    const [detalle, setDetalle] = useState('');

    const cargarDatosCaja = async () => {
        try {
            const [resMovs, resRep] = await Promise.all([
                api.get('/caja/movimientos'),
                api.get('/caja/reporte-utilidades')
            ]);
            
            // Si la API devuelve { items: [...] } o datos envueltos, los extraemos.
            // Si no es un array, se asigna [] por defecto para evitar que rompa el .map()
            const datosMovimientos = Array.isArray(resMovs.data) 
                ? resMovs.data 
                : (resMovs.data?.items || resMovs.data?.$values || []);

            setMovimientos(datosMovimientos);
            setReporte(resRep.data);
        } catch (err) {
            console.error("Error cargando flujos de caja:", err);
            setMovimientos([]); // En caso de fallo de red, resetea a arreglo vacío
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatosCaja(); }, []);

    const guardarMovimiento = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/caja/movimientos', { tipo, concepto, monto: Number(monto), detalle });
            alert("Movimiento financiero asentado de forma conforme.");
            setMonto(0); setDetalle('');
            cargarDatosCaja();
        } catch {
            alert("Error de red al registrar flujo.");
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
                    <h3 style={{ color: '#10b981' }}>C$ {reporte?.dia.utilidad.toLocaleString()}</h3>
                    <span className={styles.subtext}>Ingresos Hoy: C$ {reporte?.dia.ingresos}</span>
                </div>
                <div className={`${styles.card} ${styles.cardUtilidadMensual}`}>
                    <small>UTILIDAD MENSUAL NETAL</small>
                    <h3 style={{ color: '#38bdf8' }}>C$ {reporte?.mes.utilidad.toLocaleString()}</h3>
                    <span className={styles.subtext}>Ingresos Mes: C$ {reporte?.mes.ingresos}</span>
                </div>
                <div className={`${styles.card} ${styles.cardCostoCompras}`}>
                    <small>COSTO EN COMPRAS (MES)</small>
                    <h3 style={{ color: '#a855f7' }}>C$ {reporte?.mes.compras.toLocaleString()}</h3>
                    <span className={styles.subtext}>Inversión en reabastecimiento</span>
                </div>
                <div className={`${styles.card} ${styles.cardGastosOperativos}`}>
                    <small>GASTOS OPERATIVOS (MES)</small>
                    <h3 style={{ color: '#ef4444' }}>C$ {reporte?.mes.gastos.toLocaleString()}</h3>
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

                {/* PANEL DERECHO: HISTORIAL CONTABLE GENERAL CON TABLA OPTIMIZADA */}
                <div className={styles.tablePanel}>
                    <h4><FaHistory /> Auditoría de Libro Diario</h4>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Detalle / Concepto</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(movimientos) && movimientos.length > 0 ? (
                                    movimientos.map((m) => {
                                        const esIngreso = m.tipo === 'Ingreso';
                                        return (
                                            <tr key={m.id} className={esIngreso ? styles.rowIngreso : styles.rowEgreso}>
                                                <td>
                                                    <strong style={{ color: '#fff' }}>{m.detalle}</strong>
                                                    <span className={styles.subRowText}>
                                                        📂 {m.concepto} • 📅 {new Date(m.fecha).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className={`${styles.txtMonto} ${esIngreso ? styles.txtIngreso : styles.txtEgreso}`}>
                                                    {esIngreso ? '+' : '-'} C$ {m.monto.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                                            No hay movimientos de caja registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};