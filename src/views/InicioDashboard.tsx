import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaUserPlus, FaBoxOpen, FaMoneyBillWave, 
    FaChartLine, FaPercentage, FaExclamationTriangle, 
    FaCalendarDay, FaCalendarTimes, FaClipboardList,
    FaSearch, FaUser, FaTv, FaLock, FaTimes
} from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

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

    const [indicadores, setIndicadores] = useState<any>(null); // NUEVO ESTADO PARA INDICADORES DE SALUD DEL NEGOCIO

    // NUEVOS ESTADOS: Buscador Universal Integrado
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                // Realizamos ambas peticiones en paralelo para mayor velocidad
                const [resResumen, resIndicadores] = await Promise.all([
                    api.get('/reportes/resumen-dashboard'),
                    api.get('/reportes/indicadores') // ◄ ESTO ES LO QUE FALTABA
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

                // Guardamos los indicadores de salud
                setIndicadores(resIndicadores.data);

            } catch (err) {
                console.error("Error al sincronizar métricas del dashboard:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarDatosDashboard();
    }, []);

    // LÓGICA: Ejecutar Búsqueda Universal en Tiempo Real
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
            console.error("Error en búsqueda universal:", err);
        }
    };

    const limpiarBuscador = () => {
        setQuery('');
        setResultados(null);
        setBuscando(false);
    };

    const porcentajeMargen = resumen.ventasMes > 0 ? ((resumen.utilidadMes / resumen.ventasMes) * 100).toFixed(1) : "0";

    const datosGraficaLinea = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Ingresos (C$)',
            data: resumen.semanaFlujo,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#38bdf8'
        }]
    };

    const datosGraficaBarra = {
        labels: ['Productos', 'Digitales', 'Soporte'],
        datasets: [{
            label: 'Ventas (C$)',
            data: resumen.rubros,
            backgroundColor: ['#a855f7', '#10b981', '#38bdf8'],
            borderRadius: 6
        }]
    };

    const opcionesComunes = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
    };

    if (cargando) {
        return (
            <div style={{ color: '#38bdf8', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', background: '#0f172a', fontFamily: 'sans-serif' }}>
                Sincronizando cuadro de mando...
            </div>
        );
    }

    return (
        <div style={{ flex: 1, padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', background: '#0f172a', fontFamily: 'sans-serif', color: '#fff' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Panel de Control</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Monitoreo en tiempo real del negocio.</p>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', background: '#1e293b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
                    SISTEMA ACTIVO - 2026
                </span>
            </div>

            {/* NUEVA BARRA DE BÚSQUEDA UNIVERSAL DIRECTA EN DASHBOARD */}
            <div style={{ position: 'relative', width: '100%', background: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155', boxSizing: 'border-box' }}>
                <FaSearch style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }} />
                <input 
                    type="text" 
                    placeholder="Búsqueda rápida universal: Escribe 'Juan', 'Netflix' o 'Spotify'..." 
                    value={query}
                    onChange={e => ejecutarBusqueda(e.target.value)}
                    style={{ width: '100%', padding: '12px 40px 12px 38px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
                {query && (
                    <button onClick={limpiarBuscador} style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* SECCIÓN: SALUD DEL NEGOCIO E INDICADORES (Nuevo) */}
            {indicadores && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>Salud de Clientes</h4>
                        <div style={{ fontSize: '0.9rem' }}><span style={{ color: '#10b981' }}>✅ {indicadores.clientesActivos} Activos</span> | <span style={{ color: '#ef4444' }}>❌ {indicadores.clientesInactivos} Inactivos</span></div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>Mejor Proveedor (Margen)</h4>
                        <div style={{ color: '#38bdf8', fontWeight: 'bold' }}>{indicadores.proveedorConMayorMargen}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>Proveedor (Reclamos)</h4>
                        <div style={{ color: '#ef4444', fontWeight: 'bold' }}>{indicadores.proveedorConMasReclamos}</div>
                    </div>
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>Tasa Renovaciones</h4>
                        <div style={{ color: '#22c55e', fontWeight: 'bold' }}>{((indicadores.renovacionesExitosas / (indicadores.renovacionesExitosas + indicadores.renovacionesPerdidas || 1)) * 100).toFixed(0)}%</div>
                    </div>
                </div>
            )}

            {/* CONTROL DINÁMICO: SI ESTÁ BUSCANDO RENDERIZA RESULTADOS, SINO MUESTRA EL DASHBOARD */}
            {buscando ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-in-out' }}>
                    
                    {/* RESULTADOS DE CLIENTES ("Juan") */}
                    {resultados?.clientes?.length > 0 && (
                        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h4 style={{ color: '#38bdf8', margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser /> Historial de Clientes Encontrados</h4>
                            {resultados.clientes.map((c: any, idx: number) => (
                                <div key={idx} style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #233249' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{c.nombre} <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'normal' }}>— 📱 {c.telefono}</span></div>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '4px' }}>🛒 Facturas en Historial: {c.historialCompras?.length || 0}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '4px 8px', borderRadius: '4px' }}>🔄 Servicios Activos: {c.serviciosActivos?.length || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* RESULTADOS DE CUENTAS / ESPACIOS LIBRES ("Netflix", "Spotify") */}
                    {resultados?.cuentas?.length > 0 && (
                        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155' }}>
                            <h4 style={{ color: '#a855f7', margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaTv /> Estado de Cuentas y Espacios Libres</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                                {resultados.cuentas.map((cu: any, idx: number) => (
                                    <div key={idx} style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #233249', borderLeft: `4px solid ${cu.ocupado ? '#ef4444' : '#10b981'}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <strong style={{ fontSize: '0.9rem' }}>{cu.servicio} — {cu.nombrePerfil}</strong>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', background: cu.ocupado ? '#7f1d1d' : '#064e3b', color: cu.ocupado ? '#fca5a5' : '#a7f3d0' }}>
                                                {cu.ocupado ? 'Ocupado' : 'DISPONIBLE'}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', wordBreak: 'break-all' }}>✉️ {cu.correoCuenta}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}><FaLock size={8} /> PIN: <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{cu.pin}</span> | Clave: {cu.clave}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resultados?.clientes?.length === 0 && resultados?.cuentas?.length === 0 && (
                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #334155' }}>
                            No se encontraron registros ni perfiles libres que coincidan con la consulta.
                        </div>
                    )}
                </div>
            ) : (
                /* FLUJO OPERATIVO POR DEFECTO DEL DASHBOARD */
                <>
                    {/* SECCIÓN 1: KPI CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #10b981' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7_rem' }}>VENTAS DEL DÍA</small>
                                <FaMoneyBillWave style={{ color: '#10b981' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#fff' }}>C$ {resumen.ventasDia.toLocaleString('es-NI')}</h4>
                        </div>

                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #38bdf8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>VENTAS SEMANALES</small>
                                <FaChartLine style={{ color: '#38bdf8' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#fff' }}>C$ {resumen.ventasSemana.toLocaleString('es-NI')}</h4>
                        </div>

                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #a855f7' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>INGRESOS (MES)</small>
                                <FaPercentage style={{ color: '#a855f7' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#fff' }}>C$ {resumen.ventasMes.toLocaleString('es-NI')}</h4>
                            <small style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Margen: {porcentajeMargen}%</small>
                        </div>

                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #f59e0b' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>UTILIDAD (MES)</small>
                                <FaChartLine style={{ color: '#f59e0b' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#f59e0b' }}>C$ {resumen.utilidadMes.toLocaleString('es-NI')}</h4>
                        </div>

                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #22c55e', cursor: 'pointer', transition: 'transform 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>RENOVACIONES HOY</small>
                                <FaCalendarDay style={{ color: '#22c55e' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#fff' }}>{resumen.renovacionesHoy} <span style={{ fontSize: '0.75rem', color: '#22c55e', marginLeft: '4px' }}>→ Revisar</span></h4>
                        </div>

                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #ef4444', cursor: 'pointer', transition: 'transform 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>RENOVACIONES VENCIDAS</small>
                                <FaCalendarTimes style={{ color: '#ef4444' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem', color: '#ef4444' }}>{resumen.renovacionesVencidas} <span style={{ fontSize: '0.75rem', color: '#ef4444', marginLeft: '4px' }}>→ Cobrar</span></h4>
                        </div>

                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #ec4899' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>TICKETS ABIERTOS</small>
                                <FaClipboardList style={{ color: '#ec4899' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem' }}>{resumen.ticketsAbiertos}</h4>
                        </div>

                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', borderBottom: '3px solid #06b6d4' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>CLIENTES TOTALES</small>
                                <FaUserPlus style={{ color: '#06b6d4' }} />
                            </div>
                            <h4 style={{ margin: '8px 0 0 0', fontSize: '1.3rem' }}>{resumen.cantidadClientesNuevos}</h4>
                        </div>
                    </div>

                    {/* SECCIÓN 2: GRÁFICAS DEL FLUJO */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', height: '220px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Flujo de Caja Semanal</span>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Line data={datosGraficaLinea} options={opcionesComunes} />
                            </div>
                        </div>
                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', height: '220px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Ventas por Categoría de Rubro</span>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Bar data={datosGraficaBarra} options={opcionesComunes} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* SECCIÓN 3: COMPONENTES OPERATIVOS Y DETALLES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}><FaBoxOpen /> PRODUCTOS MÁS VENDIDOS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {resumen.productosMasVendidos.map((p: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #334155', fontSize: '0.85rem' }}>
                                <span style={{ color: '#cbd5e1' }}>{p.nombre}</span>
                                <strong style={{ color: '#38bdf8' }}>{p.cantidad} unds</strong>
                            </div>
                        ))}
                        {resumen.productosMasVendidos.length === 0 && <small style={{ color: '#64748b' }}>Sin datos de transacciones este mes.</small>}
                    </div>
                </div>

                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}><FaUserPlus /> ÚLTIMOS CLIENTES REGISTRADOS</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {resumen.ultimosClientes.map((c: any) => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #334155', fontSize: '0.85rem' }}>
                                <span style={{ color: '#cbd5e1' }}>{c.nombre}</span>
                                <small style={{ color: '#64748b' }}>{c.telefono || 'Sin Teléfono'}</small>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '8px' }}><FaExclamationTriangle /> ALERTAS DEL SISTEMA</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {resumen.alertas.map((alerta: string, idx: number) => (
                            <div key={idx} style={{ background: '#2d1e2e', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #ef4444', fontSize: '0.75rem', color: '#fca5a5' }}>
                                {alerta}
                            </div>
                        ))}
                        {resumen.alertas.length === 0 && (
                            <div style={{ background: '#1c2d24', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #10b981', fontSize: '0.75rem', color: '#a7f3d0' }}>
                                Sistema operando con normalidad. No hay alertas críticas.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRA INFERIOR DE ACCESOS RÁPIDOS */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button onClick={() => setVistaActiva('caja')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Ir a Caja POS</button>
                <button onClick={() => setVistaActiva('taller')} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Órdenes de Taller ({resumen.ticketsAbiertos})</button>
            </div>

        </div>
    );
};