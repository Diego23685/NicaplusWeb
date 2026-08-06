import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
    FaTrophy, FaShieldAlt, FaArrowDown, 
    FaChartLine, FaWallet, FaUserClock, 
    FaSync, FaExclamationTriangle, FaPrint, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

interface Gasto {
    detalle: string;
    monto: number;
}

interface ServicioRentable {
    servicio: string;
    utilidadTotal: number;
}

interface Garantia {
    costoReposicion: number;
}

interface RenovacionPerdida {
    nombre: string;
    nombreServicio: string;
    fechaVencimiento: string;
}

interface AnaliticaData {
    resumenFinanciero: {
        utilidadBruta: number;
        gastosTotales: number;
        utilidadNeta: number;
        gastosDesglosados: Gasto[];
    };
    historialGarantias: Garantia[];
    renovacionesPerdidas: RenovacionPerdida[];
    rankingServicios: ServicioRentable[];
}

const formatearFechaLocal = (fechaStr: string) => {
    if (!fechaStr) return 'N/A';
    const partes = fechaStr.split('T')[0].split('-');
    if (partes.length === 3) {
        const [anio, mes, dia] = partes;
        return `${dia}/${mes}/${anio}`;
    }
    return new Date(fechaStr).toLocaleDateString();
};

export const Analitica: React.FC = () => {
    const fechaActual = new Date();
    
    // Estados de filtros
    const [tipoFiltro, setTipoFiltro] = useState<'hoy' | 'semana' | 'mes' | 'anio'>('mes');
    const [mes, setMes] = useState<number>(fechaActual.getMonth() + 1);
    const [anio, setAnio] = useState<number>(fechaActual.getFullYear());

    // Estados de acordeones para móvil
    const [seccionAbierta, setSeccionAbierta] = useState<'servicios' | 'gastos' | 'renovaciones' | null>('servicios');

    const [data, setData] = useState<AnaliticaData | null>(null);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const cargarAnalitica = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const params: Record<string, any> = { tipoFiltro, anio };

            if (tipoFiltro === 'mes') {
                params.mes = mes;
            }

            const res = await api.get<AnaliticaData>('/reportes/analitica-ejecutiva', { params });
            setData(res.data);
        } catch (err: any) {
            console.error("Error al cargar analítica ejecutiva:", err);
            setError("No se pudieron obtener los datos analíticos del servidor.");
        } finally {
            setCargando(false);
        }
    }, [tipoFiltro, mes, anio]);

    useEffect(() => {
        cargarAnalitica();
    }, [cargarAnalitica]);

    const imprimirReporteAnalitico = () => {
        if (!data) return;

        const ventanaPrint = window.open('', '_blank');
        if (!ventanaPrint) return alert("Por favor permita las ventanas emergentes.");

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Informe_Analitica_Ejecutiva</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; }
                    h2 { border-bottom: 2px solid #38bdf8; padding-bottom: 6px; color: #0f172a; }
                    .card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 10px; background: #f8fafc; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #0f172a; color: white; padding: 8px; font-size: 11px; text-align: left; }
                    td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 11px; }
                </style>
            </head>
            <body>
                <h2>Informe de Analítica de Negocio</h2>
                <div class="card">
                    <strong>Utilidad Neta:</strong> C$ ${(data.resumenFinanciero?.utilidadNeta || 0).toLocaleString()}<br/>
                    <strong>Gastos:</strong> C$ ${(data.resumenFinanciero?.gastosTotales || 0).toLocaleString()}
                </div>
                <h3>Top Servicios Rentables</h3>
                <table>
                    <thead><tr><th>#</th><th>Servicio</th><th>Utilidad Total</th></tr></thead>
                    <tbody>
                        ${(data.rankingServicios || []).map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.servicio}</td>
                                <td>C$ ${(s.utilidadTotal || 0).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        ventanaPrint.document.write(htmlContent);
        ventanaPrint.document.close();
    };

    const dineroPerdidoGarantias = data?.historialGarantias?.reduce((acc, curr) => acc + (curr.costoReposicion || 0), 0) ?? 0;
    const utilidadBruta = data?.resumenFinanciero?.utilidadBruta ?? 0;
    const gastosTotales = data?.resumenFinanciero?.gastosTotales ?? 0;
    const utilidadNeta = data?.resumenFinanciero?.utilidadNeta ?? (utilidadBruta - gastosTotales);

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', paddingBottom: '24px' }}>
            
            {/* 1. ENCABEZADO Y SELECTOR TÁCTIL DE PERIODOS (Chips Scrollables) */}
            <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <FaChartLine /> Analítica Ejecutiva
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={imprimirReporteAnalitico}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <FaPrint /> PDF
                        </button>
                        <button 
                            onClick={cargarAnalitica} 
                            disabled={cargando}
                            style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: cargando ? 0.7 : 1 }}
                        >
                            <FaSync className={cargando ? 'spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filtros rápidos estilo App móvil */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {(['hoy', 'semana', 'mes', 'anio'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setTipoFiltro(f)}
                            style={{
                                background: tipoFiltro === f ? '#38bdf8' : '#0f172a',
                                color: tipoFiltro === f ? '#0f172a' : '#94a3b8',
                                border: '1px solid #334155',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}
                        >
                            {f === 'anio' ? 'Año' : f}
                        </button>
                    ))}
                </div>

                {/* Selectores de Mes y Año si aplica */}
                {tipoFiltro === 'mes' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                            value={mes} 
                            onChange={(e) => setMes(Number(e.target.value))}
                            style={{ flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontSize: '0.85rem' }}
                        >
                            {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select 
                            value={anio} 
                            onChange={(e) => setAnio(Number(e.target.value))}
                            style={{ width: '90px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontSize: '0.85rem' }}
                        >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </select>
                    </div>
                )}
            </div>

            {/* ESTADO DE CARGA Y ERROR */}
            {cargando && !data && (
                <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', background: '#1e293b', borderRadius: '12px' }}>
                    <FaSync className="spin" style={{ fontSize: '1.2rem', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.85rem' }}>Sincronizando datos contables...</div>
                </div>
            )}

            {error && (
                <div style={{ color: '#f43f5e', padding: '14px', background: '#1e293b', borderRadius: '12px', border: '1px solid #f43f5e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaExclamationTriangle /> {error}
                    </span>
                    <button onClick={cargarAnalitica} style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                        Reintentar
                    </button>
                </div>
            )}

            {/* 2. CARD RESUMEN P&L (Balance de Estado de Resultados) */}
            {data && (
                <>
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '16px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                            Estado de Ganancias y Pérdidas
                        </span>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Utilidad Neta:</span>
                            <span style={{ color: '#10b981', fontSize: '1.6rem', fontWeight: 800 }}>
                                C$ {utilidadNeta.toLocaleString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                            <div>
                                <small style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Ingreso Bruto</small>
                                <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>C$ {utilidadBruta.toLocaleString()}</strong>
                            </div>
                            <div>
                                <small style={{ color: '#64748b', display: 'block', fontSize: '0.7rem' }}>Gastos Totales</small>
                                <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>- C$ {gastosTotales.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 3. METRICAS SECUNDARIAS EN GRID COMPACTO (2x2) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaShieldAlt /> GARANTÍAS
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>
                                {data.historialGarantias?.length ?? 0}
                            </div>
                            <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Casos atencion</small>
                        </div>

                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaArrowDown /> REPOSICIÓN
                            </div>
                            <div style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>
                                C$ {dineroPerdidoGarantias.toLocaleString()}
                            </div>
                            <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Costo de garantías</small>
                        </div>
                    </div>

                    {/* 4. ACORDEONES DESPLEGABLES PARA DESGLOSES DETALLADOS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        
                        {/* SECCIÓN: TOP SERVICIOS */}
                        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <button 
                                onClick={() => setSeccionAbierta(seccionAbierta === 'servicios' ? null : 'servicios')}
                                style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaTrophy /> Top Servicios Rentables</span>
                                {seccionAbierta === 'servicios' ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {seccionAbierta === 'servicios' && (
                                <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(!data.rankingServicios || data.rankingServicios.length === 0) ? (
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Sin registros en el periodo.</div>
                                    ) : (
                                        data.rankingServicios.map((s, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                                                <span style={{ color: '#cbd5e1' }}>{i + 1}. {s.servicio}</span>
                                                <strong style={{ color: '#10b981' }}>C$ {(s.utilidadTotal || 0).toLocaleString()}</strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN: GASTOS OPERATIVOS */}
                        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <button 
                                onClick={() => setSeccionAbierta(seccionAbierta === 'gastos' ? null : 'gastos')}
                                style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#fb923c', fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaWallet /> Desglose de Gastos</span>
                                {seccionAbierta === 'gastos' ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {seccionAbierta === 'gastos' && (
                                <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(!data.resumenFinanciero?.gastosDesglosados || data.resumenFinanciero.gastosDesglosados.length === 0) ? (
                                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Sin gastos registrados.</div>
                                    ) : (
                                        data.resumenFinanciero.gastosDesglosados.map((g, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                                                <span style={{ color: '#cbd5e1' }}>{g.detalle}</span>
                                                <strong style={{ color: '#ef4444' }}>- C$ {(g.monto || 0).toLocaleString()}</strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN: RENOVACIONES VENCIDAS */}
                        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                            <button 
                                onClick={() => setSeccionAbierta(seccionAbierta === 'renovaciones' ? null : 'renovaciones')}
                                style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaUserClock /> Renovaciones Vencidas ({data.renovacionesPerdidas?.length ?? 0})</span>
                                {seccionAbierta === 'renovaciones' ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {seccionAbierta === 'renovaciones' && (
                                <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(!data.renovacionesPerdidas || data.renovacionesPerdidas.length === 0) ? (
                                        <div style={{ color: '#10b981', fontSize: '0.8rem' }}>Sin pérdidas registradas.</div>
                                    ) : (
                                        data.renovacionesPerdidas.map((r, i) => (
                                            <div key={i} style={{ borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#f8fafc' }}>{r.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    {r.nombreServicio} — <span style={{ color: '#f43f5e' }}>{formatearFechaLocal(r.fechaVencimiento)}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};