import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
    FaDollarSign, FaTrophy, FaShieldAlt, FaArrowDown, 
    FaCalendarTimes, FaChartLine, FaWallet, FaUserClock, 
    FaSync, FaExclamationTriangle, FaFilter, FaPrint
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

interface CardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, color, subtitle }) => (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px', minWidth: '220px' }}>
        <div style={{ fontSize: '1.8rem', color, background: `${color}20`, padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
            <small style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
            </small>
            <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.25rem', fontWeight: 600 }}>
                {value}
            </h3>
            {subtitle && <small style={{ color: '#64748b', fontSize: '0.7rem' }}>{subtitle}</small>}
        </div>
    </div>
);

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
    
    // Estados principales
    const [tipoFiltro, setTipoFiltro] = useState<'hoy' | 'semana' | 'mes' | 'anio' | 'rango'>('mes');
    const [mes, setMes] = useState<number>(fechaActual.getMonth() + 1);
    const [anio, setAnio] = useState<number>(fechaActual.getFullYear());
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');

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
            } else if (tipoFiltro === 'rango') {
                params.fechaInicio = fechaInicio;
                params.fechaFin = fechaFin;
            }

            const res = await api.get<AnaliticaData>('/reportes/analitica-ejecutiva', { params });
            setData(res.data);
        } catch (err: any) {
            console.error("Error al cargar analítica ejecutiva:", err);
            setError("No se pudieron obtener los datos analíticos del servidor.");
        } finally {
            setCargando(false);
        }
    }, [tipoFiltro, mes, anio, fechaInicio, fechaFin]);

    useEffect(() => {
        if (tipoFiltro === 'rango' && (!fechaInicio || !fechaFin)) return;
        cargarAnalitica();
    }, [cargarAnalitica, tipoFiltro]);

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
                    body { font-family: Arial, sans-serif; margin: 30px; color: #0f172a; }
                    h2 { border-bottom: 2px solid #38bdf8; padding-bottom: 6px; color: #0f172a; }
                    .card-container { display: flex; gap: 15px; margin-bottom: 20px; }
                    .card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; flex: 1; background: #f8fafc; }
                    .card small { font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; }
                    .card h3 { margin: 5px 0 0 0; font-size: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #0f172a; color: white; padding: 8px; font-size: 11px; text-align: left; }
                    td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 11px; }
                </style>
            </head>
            <body>
                <h2>Informe de Analítica de Negocio y Rentabilidad</h2>
                <div class="card-container">
                    <div class="card"><small>Utilidad Bruta</small><h3>C$ ${(data.resumenFinanciero?.utilidadBruta || 0).toLocaleString()}</h3></div>
                    <div class="card"><small>Gastos Operativos</small><h3>C$ ${(data.resumenFinanciero?.gastosTotales || 0).toLocaleString()}</h3></div>
                    <div class="card" style="border-color: #10b981; background: #f0fdf4;">
                        <small style="color: #166534;">Utilidad Neta</small>
                        <h3 style="color: #15803d;">C$ ${(data.resumenFinanciero?.utilidadNeta || 0).toLocaleString()}</h3>
                    </div>
                </div>

                <h3>Top Servicios Rentables</h3>
                <table>
                    <thead><tr><th>#</th><th>Servicio / Producto</th><th>Utilidad Total</th></tr></thead>
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

                <script>
                    window.onload = function() { window.print(); }
                </script>
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
        <div style={{ color: '#fff', padding: '4px', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
            
            <style>{`
                .grid-kpis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
                    gap: 16px;
                    width: 100%;
                }
                .grid-detalles {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
                    gap: 20px;
                    width: 100%;
                }
                
                @media (max-width: 768px) {
                    .grid-kpis {
                        display: flex !important;
                        flex-direction: row !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        scroll-snap-type: x mandatory;
                        padding-bottom: 8px;
                        -webkit-overflow-scrolling: touch; 
                    }
                    .grid-kpis > div {
                        flex: 0 0 270px !important;
                        scroll-snap-align: start;
                    }
                    .grid-detalles {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            {/* ENCABEZADO Y CONTROLES DINÁMICOS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', background: '#1e293b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <FaChartLine /> Panel de Inteligencia de Negocio
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <FaFilter style={{ color: '#38bdf8', fontSize: '0.85rem' }} />
                        
                        {/* Selector de tipo de consulta */}
                        <select 
                            value={tipoFiltro} 
                            onChange={(e) => setTipoFiltro(e.target.value as 'hoy' | 'semana' | 'mes' | 'anio' | 'rango')}
                            style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                        >
                            <option value="hoy" style={{ background: '#1e293b' }}>Hoy</option>
                            <option value="semana" style={{ background: '#1e293b' }}>Esta Semana</option>
                            <option value="mes" style={{ background: '#1e293b' }}>Por Mes</option>
                            <option value="anio" style={{ background: '#1e293b' }}>Todo el Año</option>
                            <option value="rango" style={{ background: '#1e293b' }}>Rango Personalizado</option>
                        </select>

                        {/* Opciones por Mes */}
                        {tipoFiltro === 'mes' && (
                            <select 
                                value={mes} 
                                onChange={(e) => setMes(Number(e.target.value))}
                                style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                <option value={1} style={{ background: '#1e293b' }}>Enero</option>
                                <option value={2} style={{ background: '#1e293b' }}>Febrero</option>
                                <option value={3} style={{ background: '#1e293b' }}>Marzo</option>
                                <option value={4} style={{ background: '#1e293b' }}>Abril</option>
                                <option value={5} style={{ background: '#1e293b' }}>Mayo</option>
                                <option value={6} style={{ background: '#1e293b' }}>Junio</option>
                                <option value={7} style={{ background: '#1e293b' }}>Julio</option>
                                <option value={8} style={{ background: '#1e293b' }}>Agosto</option>
                                <option value={9} style={{ background: '#1e293b' }}>Septiembre</option>
                                <option value={10} style={{ background: '#1e293b' }}>Octubre</option>
                                <option value={11} style={{ background: '#1e293b' }}>Noviembre</option>
                                <option value={12} style={{ background: '#1e293b' }}>Diciembre</option>
                            </select>
                        )}

                        {/* Selección de Año */}
                        {(tipoFiltro === 'mes' || tipoFiltro === 'anio') && (
                            <select 
                                value={anio} 
                                onChange={(e) => setAnio(Number(e.target.value))}
                                style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                <option value={2025} style={{ background: '#1e293b' }}>2025</option>
                                <option value={2026} style={{ background: '#1e293b' }}>2026</option>
                            </select>
                        )}

                        {/* Rango de fechas dinámico */}
                        {tipoFiltro === 'rango' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input 
                                    type="date" 
                                    value={fechaInicio} 
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem' }}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>a</span>
                                <input 
                                    type="date" 
                                    value={fechaFin} 
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '4px', padding: '2px 6px', fontSize: '0.8rem' }}
                                />
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={imprimirReporteAnalitico}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <FaPrint /> Exportar PDF
                    </button>

                    <button 
                        onClick={cargarAnalitica} 
                        disabled={cargando}
                        style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', opacity: cargando ? 0.7 : 1 }}
                    >
                        <FaSync className={cargando ? 'spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ESTADOS DE CARGA Y ERROR */}
            {cargando && !data && (
                <div style={{ color: '#38bdf8', padding: '40px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                    <FaSync className="spin" style={{ fontSize: '1.5rem', marginBottom: '10px' }} />
                    <div>Procesando analítica detallada...</div>
                </div>
            )}

            {error && (
                <div style={{ color: '#f43f5e', padding: '25px', background: '#1e293b', borderRadius: '12px', border: '1px solid #f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaExclamationTriangle style={{ fontSize: '1.2rem' }} />
                        <span>{error}</span>
                    </div>
                    <button onClick={cargarAnalitica} style={{ background: '#f43f5e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                        Reintentar
                    </button>
                </div>
            )}

            {/* CONTENIDO Y REPORTES */}
            {data && (
                <>
                    <div className="grid-kpis">
                        <Card 
                            title={tipoFiltro === 'hoy' ? "Utilidad Neta Hoy" : tipoFiltro === 'semana' ? "Utilidad Neta Semana" : tipoFiltro === 'anio' ? "Utilidad Neta Año" : tipoFiltro === 'rango' ? "Utilidad Neta Rango" : "Utilidad Neta Mes"} 
                            value={`C$ ${utilidadNeta.toLocaleString()}`} 
                            subtitle={`Bruto: C$ ${utilidadBruta.toLocaleString()}`}
                            icon={<FaDollarSign />} 
                            color="#10b981" 
                        />
                        <Card 
                            title="Garantías Aplicadas" 
                            value={data.historialGarantias?.length ?? 0} 
                            icon={<FaShieldAlt />} 
                            color="#f59e0b" 
                        />
                        <Card 
                            title="Perdido en Garantías" 
                            value={`C$ ${dineroPerdidoGarantias.toLocaleString()}`} 
                            icon={<FaArrowDown />} 
                            color="#ef4444" 
                        />
                        <Card 
                            title="Renovaciones Perdidas" 
                            value={data.renovacionesPerdidas?.length ?? 0} 
                            icon={<FaCalendarTimes />} 
                            color="#f43f5e" 
                        />
                    </div>

                    <div className="grid-detalles">
                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                                <FaTrophy /> Top Servicios Rentables
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                {(!data.rankingServicios || data.rankingServicios.length === 0) ? (
                                    <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                                        No hay datos de servicios prestados en este período.
                                    </div>
                                ) : (
                                    data.rankingServicios.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{i + 1}. {s.servicio}</span>
                                            <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>C$ {(s.utilidadTotal || 0).toLocaleString()}</strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: '#fb923c', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                                <FaWallet /> Gastos Operativos (C$ {gastosTotales.toLocaleString()})
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                {(!data.resumenFinanciero?.gastosDesglosados || data.resumenFinanciero.gastosDesglosados.length === 0) ? (
                                    <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                                        Sin registros de gastos en este período.
                                    </div>
                                ) : (
                                    data.resumenFinanciero.gastosDesglosados.map((g, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{g.detalle}</span>
                                            <span style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.95rem' }}>- C$ {(g.monto || 0).toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: '#f43f5e', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                                <FaUserClock /> Renovaciones Vencidas
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                {(!data.renovacionesPerdidas || data.renovacionesPerdidas.length === 0) ? (
                                    <div style={{ color: '#10b981', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                                        ¡Excelente! Sin renovaciones perdidas.
                                    </div>
                                ) : (
                                    data.renovacionesPerdidas.map((r, i) => (
                                        <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#f8fafc' }}>{r.nombre}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                                {r.nombreServicio} — Venció: <strong style={{ color: '#f43f5e' }}>{formatearFechaLocal(r.fechaVencimiento)}</strong>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};