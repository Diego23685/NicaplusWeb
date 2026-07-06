import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaDollarSign, FaTrophy, FaShieldAlt, FaArrowDown, FaCalendarTimes, FaChartLine, FaWallet, FaUserClock } from 'react-icons/fa';

const Card = ({ title, value, icon, color }: any) => (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '1.8rem', color, background: `${color}20`, padding: '15px', borderRadius: '12px' }}>{icon}</div>
        <div>
            <small style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold' }}>{title}</small>
            <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.1rem' }}>{value}</h3>
        </div>
    </div>
);

export const Analitica: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        api.get('/reportes/analitica-ejecutiva')
            .then(res => { setData(res.data); setCargando(false); })
            .catch(err => { console.error(err); setCargando(false); });
    }, []);

    if (cargando) return <div style={{ color: '#38bdf8', padding: '40px' }}>Procesando analítica detallada...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', padding: '10px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.5rem' }}><FaChartLine /> Panel de Inteligencia de Negocio</h3>
            
            {/* KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <Card title="Utilidad Neta Mes" value={`C$ ${data?.resumenFinanciero?.utilidadBruta.toLocaleString() || '0'}`} icon={<FaDollarSign />} color="#10b981" />
                <Card title="Garantías Aplicadas" value={data?.historialGarantias.length || 0} icon={<FaShieldAlt />} color="#f59e0b" />
                <Card title="Dinero Perdido" value={`C$ ${data?.historialGarantias.reduce((a:any, b:any)=>a+b.costoReposicion, 0).toLocaleString()}`} icon={<FaArrowDown />} color="#ef4444" />
                <Card title="Renovaciones Perdidas" value={data?.renovacionesPerdidas.length || 0} icon={<FaCalendarTimes />} color="#f43f5e" />
            </div>

            {/* TABLAS DE DETALLE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                
                {/* Ranking Servicios */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ color: '#38bdf8', marginTop: 0 }}><FaTrophy /> Top Servicios Rentables</h4>
                    {data.rankingServicios.map((s:any, i:number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                            <span>{i+1}. {s.servicio}</span>
                            <strong>C$ {s.utilidadTotal.toLocaleString()}</strong>
                        </div>
                    ))}
                </div>

                {/* Gastos Desglosados */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ color: '#fb923c', marginTop: 0 }}><FaWallet /> Desglose de Gastos Operativos</h4>
                    {data.resumenFinanciero.gastosDesglosados.map((g:any, i:number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                            <span>{g.detalle}</span>
                            <span style={{ color: '#ef4444' }}>- C$ {g.monto.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* Renovaciones Perdidas */}
                <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ color: '#f43f5e', marginTop: 0 }}><FaUserClock /> Clientes con Renovaciones Vencidas</h4>
                    {data.renovacionesPerdidas.map((r:any, i:number) => (
                        <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #334155' }}>
                            <div style={{ fontWeight: 'bold' }}>{r.nombre}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{r.nombreServicio} - Venció: {new Date(r.fechaVencimiento).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};