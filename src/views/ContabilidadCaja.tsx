import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaFileInvoiceDollar, FaSave, FaHistory } from 'react-icons/fa';

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
            setMovimientos(resMovs.data);
            setReporte(resRep.data);
        } catch (err) {
            console.error("Error cargando flujos de caja:", err);
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

    const cardEstilo = { background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' };
    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Procesando balances contables...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
            
            {/* ENCABEZADO */}
            <div>
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Arqueo de Caja y Libro Contable</h3>
                <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Control de flujos brutos, costos operativos y utilidades netas reales.</p>
            </div>

            {/* SECCIÓN 1: METRICAS REALES (DÍA VS MES) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div style={{ ...cardEstilo, borderBottom: '3px solid #10b981' }}>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>UTILIDAD DIARIA NETAL</small>
                    <h3 style={{ color: '#10b981', margin: '6px 0 0 0' }}>C$ {reporte?.dia.utilidad.toLocaleString()}</h3>
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Ingresos Hoy: C$ {reporte?.dia.ingresos}</small>
                </div>
                <div style={{ ...cardEstilo, borderBottom: '3px solid #38bdf8' }}>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>UTILIDAD MENSUAL NETAL</small>
                    <h3 style={{ color: '#38bdf8', margin: '6px 0 0 0' }}>C$ {reporte?.mes.utilidad.toLocaleString()}</h3>
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Ingresos Mes: C$ {reporte?.mes.ingresos}</small>
                </div>
                <div style={{ ...cardEstilo, borderBottom: '3px solid #a855f7' }}>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>COSTO EN COMPRAS (MES)</small>
                    <h3 style={{ color: '#a855f7', margin: '6px 0 0 0' }}>C$ {reporte?.mes.compras.toLocaleString()}</h3>
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Inversión en reabastecimiento</small>
                </div>
                <div style={{ ...cardEstilo, borderBottom: '3px solid #ef4444' }}>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>GASTOS OPERATIVOS (MES)</small>
                    <h3 style={{ color: '#ef4444', margin: '6px 0 0 0' }}>C$ {reporte?.mes.gastos.toLocaleString()}</h3>
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>Luz, internet, pérdidas fijos</small>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* PANEL IZQUIERDO: REGISTRO DE MOVIMIENTO MANUAL */}
                <div style={{ flex: '1 1 300px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
                    <h4 style={{ color: '#fb923c', margin: '0 0 14px 0' }}><FaFileInvoiceDollar /> Registrar Flujo Manual</h4>
                    <form onSubmit={guardarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo de Movimiento</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ ...inputEstilo, cursor: 'pointer' }}>
                                <option value="Egreso">🛑 Egreso / Salida</option>
                                <option value="Ingreso">💵 Ingreso / Entrada</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Concepto Contable</label>
                            <select value={concepto} onChange={e => setConcepto(e.target.value)} style={{ ...inputEstilo, cursor: 'pointer' }}>
                                <option value="Gasto Ordinario">Gasto Ordinario (Luz, Renta, Servicios)</option>
                                <option value="Ajuste">Ajuste de Caja</option>
                                <option value="Venta">Ingreso Extraordinario</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Monto Transacción (C$)</label>
                            <input type="number" min={1} value={monto || ''} onChange={e => setMonto(Number(e.target.value))} style={inputEstilo} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Descripción / Justificación</label>
                            <input type="text" placeholder="Ej: Pago de recibo Claro internet" value={detalle} onChange={e => setDetalle(e.target.value)} style={inputEstilo} required />
                        </div>
                        <button type="submit" style={{ padding: '12px', background: '#fb923c', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}><FaSave /> Asentar en Libro</button>
                    </form>
                </div>

                {/* PANEL DERECHO: HISTORIAL CONTABLE GENERAL */}
                <div style={{ flex: '1 1 500px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0' }}><FaHistory /> Auditoría de Libro Diario</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                        {movimientos.map((m) => (
                            <div key={m.id} style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${m.tipo === 'Ingreso' ? '#10b981' : '#ef4444'}` }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{m.detalle}</span>
                                    <div style={{ display: 'flex', gap: '10px', color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                                        <span>📂 {m.concepto}</span>
                                        <span>📅 {new Date(m.fecha).toLocaleString()}</span>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 'bold', color: m.tipo === 'Ingreso' ? '#10b981' : '#ef4444', fontSize: '0.95rem' }}>
                                    {m.tipo === 'Ingreso' ? '+' : '-'} C$ {m.monto.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};