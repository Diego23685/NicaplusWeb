import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaDollarSign, FaTrophy, FaShieldAlt, FaArrowDown, FaCalendarTimes, FaChartLine, FaWallet, FaUserClock } from 'react-icons/fa';

// interfaces explícitas para evitar el tipo 'any'
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
}

const Card: React.FC<CardProps> = ({ title, value, icon, color }) => (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px', minWidth: '200px' }}>
        <div style={{ fontSize: '1.8rem', color, background: `${color}20`, padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div style={{ overflow: 'hidden' }}>
            <small style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {title}
            </small>
            <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>
                {value}
            </h3>
        </div>
    </div>
);

export const Analitica: React.FC = () => {
    const [data, setData] = useState<AnaliticaData | null>(null);
    const [cargando, setCargando] = useState<boolean>(true);

    useEffect(() => {
        api.get<AnaliticaData>('/reportes/analitica-ejecutiva')
            .then(res => { 
                setData(res.data); 
                setCargando(false); 
            })
            .catch(err => { 
                console.error("Error al cargar analítica ejecutiva:", err); 
                setCargando(false); 
            });
    }, []);

    if (cargando) return <div style={{ color: '#38bdf8', padding: '40px', fontWeight: 500 }}>Procesando analítica detallada...</div>;
    if (!data) return <div style={{ color: '#f43f5e', padding: '40px' }}>No se pudo cargar la información analítica.</div>;

    const dineroPerdidoGarantias = data.historialGarantias.reduce((acc, curr) => acc + curr.costoReposicion, 0);

    return (
        <div style={{ color: '#fff', padding: '4px', display: 'flex', flexDirection: 'column', gap: '25px', width: '100%', boxSizing: 'border-box' }}>
            
            {/* INLINE CSS OPTIMIZADO: Cero Javascript interfiriendo en el scroll */}
            <style>{`
                .grid-kpis {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    width: 100%;
                }
                .grid-detalles {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 20px;
                    width: 100%;
                }
                
                /* Ajustes específicos para pantallas móviles y tablets pequeñas */
                @media (max-width: 768px) {
                    .grid-kpis {
                        display: flex !important;
                        flex-direction: row !important;
                        overflow-x: auto !important;
                        overflow-y: hidden !important;
                        scroll-snap-type: x mandatory;
                        padding-bottom: 12px;
                        /* Forzar aceleración por hardware en móviles */
                        -webkit-overflow-scrolling: touch; 
                    }
                    .grid-kpis > div {
                        flex: 0 0 280px !important; /* Mantiene un tamaño fijo y cómodo en móvil */
                        scroll-snap-align: start;
                    }
                    .grid-detalles {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                <FaChartLine /> Panel de Inteligencia de Negocio
            </h3>

            {/* KPI CARDS - Limpio de eventos "onWheel" innecesarios */}
            <div className="grid-kpis" style={{ scrollbarWidth: 'thin' }}>
                <Card 
                    title="Utilidad Neta Mes" 
                    value={`C$ ${data.resumenFinanciero?.utilidadBruta?.toLocaleString() ?? '0'}`} 
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
                    title="Dinero Perdido" 
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

            {/* BLOCKS DE DETALLE */}
            <div className="grid-detalles" style={{ gap: '20px', width: '100%' }}>
                
                {/* Ranking Servicios */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                        <FaTrophy /> Top Servicios Rentables
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {data.rankingServicios?.map((s, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{i + 1}. {s.servicio}</span>
                                <strong style={{ fontSize: '0.95rem', color: '#f8fafc' }}>C$ {s.utilidadTotal.toLocaleString()}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gastos Desglosados */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ color: '#fb923c', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                        <FaWallet /> Desglose de Gastos Operativos
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {data.resumenFinanciero?.gastosDesglosados?.map((g, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{g.detalle}</span>
                                <span style={{ color: '#ef4444', fontWeight: '500', fontSize: '0.95rem' }}>- C$ {g.monto.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Renovaciones Perdidas */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ color: '#f43f5e', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 600 }}>
                        <FaUserClock /> Clientes con Renovaciones Vencidas
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {data.renovacionesPerdidas?.map((r, i) => (
                            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #334155' }}>
                                <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#f8fafc' }}>{r.nombre}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                    {r.nombreServicio} — Venció: {new Date(r.fechaVencimiento).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};