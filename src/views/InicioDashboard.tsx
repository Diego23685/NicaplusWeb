import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaSearch, FaUser, FaTv, FaTimes,
    FaCalendarDay, FaCalendarTimes,
    FaMoneyBillWave, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface InicioDashboardProps {
    setVistaActiva: (vista: any) => void;
}

export const InicioDashboard: React.FC<InicioDashboardProps> = ({ setVistaActiva }) => {
    const [resumen, setResumen] = useState<any>({
        ventasDia: 0,
        ventasSemana: 0,
        ventasMes: 0,
        utilidadMes: 0,
        renovacionesHoy: 0,
        renovacionesVencidas: 0,
        ticketsAbiertos: 0,
        cantidadClientesNuevos: 0,
        rubros: [0, 0, 0],
        semanaFlujo: [0, 0, 0, 0, 0, 0, 0],
        productosMasVendidos: [],
        ultimosClientes: [],
        alertas: []
    });
    const [cargando, setCargando] = useState(true);
    const [periodoKPI, setPeriodoKPI] = useState<'dia' | 'semana' | 'mes'>('dia');
    const [mostrarGrafica, setMostrarGrafica] = useState(false);

    // Buscador Universal
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                const [resResumen] = await Promise.all([
                    api.get('/reportes/resumen-dashboard')
                ]);

                setResumen({
                    ventasDia: resResumen.data.ventasDia ?? 0,
                    ventasSemana: resResumen.data.ventasSemana ?? 0,
                    ventasMes: resResumen.data.ventasMes ?? 0,
                    utilidadMes: resResumen.data.utilidadMes ?? 0,
                    renovacionesHoy: resResumen.data.renovacionesHoy ?? 0,
                    renovacionesVencidas: resResumen.data.renovacionesVencidas ?? 0,
                    ticketsAbiertos: resResumen.data.ticketsAbiertos ?? 0,
                    cantidadClientesNuevos: resResumen.data.cantidadClientesNuevos ?? 0,
                    rubros: resResumen.data.rubros ?? [0, 0, 0],
                    semanaFlujo: resResumen.data.semanaFlujo ?? [0, 0, 0, 0, 0, 0, 0],
                    productosMasVendidos: resResumen.data.productosMasVendidos ?? [],
                    ultimosClientes: resResumen.data.ultimosClientes ?? [],
                    alertas: resResumen.data.alertas ?? []
                });
            } catch (err) {
                console.error("Error al sincronizar dashboard:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarDatosDashboard();
    }, []);

    const ejecutarBusqueda = async (valorQuery: string) => {
        setQuery(valorQuery);
        if (!valorQuery.trim()) {
            setResultados(null);
            setBuscando(false);
            return;
        }
        setBuscando(true);
        try {
            const res = await api.get(`/busqueda/universal?query=${valorQuery}`);
            setResultados(res.data);
        } catch (err) {
            console.error("Error en búsqueda:", err);
        }
    };

    const ventasActuales = 
        periodoKPI === 'dia' ? resumen.ventasDia :
        periodoKPI === 'semana' ? resumen.ventasSemana : resumen.ventasMes;

    const datosGraficaLinea = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            data: resumen.semanaFlujo,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 3
        }]
    };

    if (cargando) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#94a3b8' }}>
                <span>Cargando resumen...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
            
            {/* 1. BUSCADOR RÁPIDO UNIVERSAL */}
            <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente, servicio o PIN..." 
                    value={query}
                    onChange={e => ejecutarBusqueda(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px 36px 12px 42px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                {query && (
                    <FaTimes 
                        onClick={() => { setQuery(''); setBuscando(false); }} 
                        style={{ position: 'absolute', right: '14px', top: '14px', color: '#64748b', cursor: 'pointer' }} 
                    />
                )}
            </div>

            {/* VISTA DE RESULTADOS DE BÚSQUEDA */}
            {buscando ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {resultados?.clientes?.map((c: any, idx: number) => (
                        <div key={idx} style={{ background: '#1e293b', padding: '12px', borderRadius: '10px', borderLeft: '4px solid #38bdf8' }}>
                            <div style={{ color: '#fff', fontWeight: 600 }}><FaUser size={12} /> {c.nombre}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>📱 {c.telefono}</div>
                        </div>
                    ))}
                    {resultados?.cuentas?.map((cu: any, idx: number) => (
                        <div key={idx} style={{ background: '#1e293b', padding: '12px', borderRadius: '10px', borderLeft: cu.ocupado ? '4px solid #ef4444' : '4px solid #10b981' }}>
                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}><FaTv size={12} /> {cu.servicio} — {cu.nombrePerfil}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>PIN: {cu.pin} | Clave: {cu.clave}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* 2. CARD CONSOLIDADA DE INGRESOS */}
                    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '18px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingresos Registrados</span>
                            {/* Selector de Periodo con llaves JSX corregidas */}
                            <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '2px', border: '1px solid #334155' }}>
                                {(['dia', 'semana', 'mes'] as const).map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setPeriodoKPI(p)}
                                        style={{
                                            background: periodoKPI === p ? '#38bdf8' : 'transparent',
                                            color: periodoKPI === p ? '#0f172a' : '#94a3b8',
                                            border: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'capitalize',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
                            C$ {ventasActuales.toLocaleString('es-NI')}
                        </div>

                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', borderTop: '1px solid #334155', paddingTop: '12px', marginTop: '12px' }}>
                            <div style={{ color: '#10b981' }}>
                                <small style={{ color: '#64748b', display: 'block' }}>Utilidad Mes</small>
                                <strong>C$ {resumen.utilidadMes.toLocaleString('es-NI')}</strong>
                            </div>
                            <div style={{ color: '#38bdf8' }}>
                                <small style={{ color: '#64748b', display: 'block' }}>Clientes Nuevos</small>
                                <strong>+{resumen.cantidadClientesNuevos}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 3. ACCIONES Y COBROS URGENTES */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            style={{ background: '#1e293b', border: '1px solid #059669', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                                <FaCalendarDay /> RENOVACIONES HOY
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                                {resumen.renovacionesHoy}
                            </div>
                        </div>

                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            style={{ background: '#1e293b', border: '1px solid #dc2626', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>
                                <FaCalendarTimes /> VENCIDAS (COBRAR)
                            </div>
                            <div style={{ color: '#ef4444', fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                                {resumen.renovacionesVencidas}
                            </div>
                        </div>
                    </div>

                    {/* 4. BOTONES DE ACCIÓN DIRECTA */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setVistaActiva('caja')}
                            style={{ flex: 1, padding: '14px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <FaMoneyBillWave /> Ir a Caja POS
                        </button>
                        <button 
                            onClick={() => setVistaActiva('taller')}
                            style={{ flex: 1, padding: '14px', background: '#334155', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            Taller ({resumen.ticketsAbiertos})
                        </button>
                    </div>

                    {/* 5. ACORDEÓN DESPLEGABLE PARA GRÁFICAS */}
                    <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                        <button 
                            onClick={() => setMostrarGrafica(!mostrarGrafica)}
                            style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <span>Tendencia de Flujo Semanal</span>
                            {mostrarGrafica ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        
                        {mostrarGrafica && (
                            <div style={{ padding: '0 16px 16px 16px', height: '160px' }}>
                                <Line 
                                    data={datosGraficaLinea} 
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: { x: { grid: { display: false } }, y: { display: false } }
                                    }} 
                                />
                            </div>
                        )}
                    </div>

                    {/* 6. LISTA COMPACTA DE PRODUCTOS */}
                    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '14px', border: '1px solid #334155' }}>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Top Vendidos del Mes</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {resumen.productosMasVendidos.slice(0, 3).map((p: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                                    <span style={{ color: '#94a3b8' }}>{p.nombre}</span>
                                    <strong style={{ color: '#38bdf8' }}>{p.cantidad} und.</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};