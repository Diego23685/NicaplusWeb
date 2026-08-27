import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaUserPlus, FaBoxOpen, FaMoneyBillWave, 
    FaChartLine, FaPercentage, FaExclamationTriangle, 
    FaCalendarDay, FaCalendarTimes, 
    FaSearch, FaUser, FaTv, FaLock, FaTimes,
    FaReceipt, FaUsers, FaTools, FaCheckCircle
} from 'react-icons/fa';
import { 
    Chart as ChartJS, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend, 
    Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import styles from '../assets/styles/InicioDashboard.module.css';

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
    const [indicadores, setIndicadores] = useState<any>(null);

    // Búsqueda Universal
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                const [resResumen, resIndicadores] = await Promise.all([
                    api.get('/reportes/resumen-dashboard'),
                    api.get('/reportes/indicadores')
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

                setIndicadores(resIndicadores.data);
            } catch (err) {
                console.error("Error al sincronizar métricas del dashboard:", err);
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
            console.error("Error en búsqueda universal:", err);
        }
    };

    const limpiarBuscador = () => {
        setQuery('');
        setResultados(null);
        setBuscando(false);
    };

    const porcentajeMargen = resumen.ventasMes > 0 
        ? ((resumen.utilidadMes / resumen.ventasMes) * 100).toFixed(1) 
        : "0";

    const tasaRenovacion = indicadores 
        ? ((indicadores.renovacionesExitosas / (indicadores.renovacionesExitosas + indicadores.renovacionesPerdidas || 1)) * 100).toFixed(0)
        : "0";

    const datosGraficaLinea = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Ingresos (C$)',
            data: resumen.semanaFlujo,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#38bdf8',
            pointHoverRadius: 6,
        }]
    };

    const datosGraficaBarra = {
        labels: ['Prod', 'Dig', 'Sop'],
        datasets: [{
            label: 'Ventas (C$)',
            data: resumen.rubros,
            backgroundColor: ['#a855f7', '#10b981', '#38bdf8'],
            borderRadius: 4,
            borderSkipped: false,
        }]
    };

    const opcionesComunes = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#38bdf8',
                bodyColor: '#fff',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 8,
                displayColors: false
            }
        },
        scales: {
            y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 9 } } }
        }
    };

    if (cargando) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loaderPulse} />
                <span>Sincronizando cuadro de mando...</span>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* 1. ENCABEZADO Y ACCESOS RÁPIDOS OPERATIVOS */}
            <header className={styles.dashboardHeader}>
                <div className={styles.headerInfo}>
                    <h3 className={styles.headerTitle}>Panel de Control</h3>
                    <span className={styles.liveBadge}>● ACTIVO</span>
                </div>

                <div className={styles.quickActionsGrid}>
                    <button onClick={() => setVistaActiva('caja')} className={styles.btnActionPrimary}>
                        <FaReceipt /> <span>Venta</span>
                    </button>
                    <button onClick={() => setVistaActiva('renovaciones')} className={styles.btnActionWarning}>
                        <FaMoneyBillWave /> <span>Cobrar</span>
                    </button>
                    <button onClick={() => setVistaActiva('crm')} className={styles.btnActionSecondary}>
                        <FaUsers /> <span>Clientes</span>
                    </button>
                    <button onClick={() => setVistaActiva('taller')} className={styles.btnActionSecondary}>
                        <FaTools /> <span>Taller ({resumen.ticketsAbiertos})</span>
                    </button>
                </div>
            </header>

            {/* 2. BÚSQUEDA UNIVERSAL */}
            <div className={styles.searchSection}>
                <FaSearch className={styles.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente, número, cuenta o pin..." 
                    value={query}
                    onChange={e => ejecutarBusqueda(e.target.value)}
                    className={styles.searchInput}
                />
                {query && (
                    <button onClick={limpiarBuscador} className={styles.searchClearBtn} aria-label="Limpiar búsqueda">
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* 3. RESULTADOS DINÁMICOS O CUADRO COMPLETO */}
            {buscando ? (
                <div className={styles.searchResultsWrapper}>
                    {resultados?.clientes?.length > 0 && (
                        <div className={styles.resultsCard}>
                            <h4 className={styles.resultsTitle}><FaUser className={styles.textCyan} /> Clientes</h4>
                            <div className={styles.resultsList}>
                                {resultados.clientes.map((c: any, idx: number) => (
                                    <div key={idx} className={styles.resultItem}>
                                        <div className={styles.resultMain}>
                                            <strong>{c.nombre}</strong>
                                            <small>{c.telefono || 'Sin teléfono'}</small>
                                        </div>
                                        <div className={styles.resultTags}>
                                            <span className={styles.badgeGreen}>Fac: {c.historialCompras?.length || 0}</span>
                                            <span className={styles.badgePurple}>Act: {c.serviciosActivos?.length || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resultados?.cuentas?.length > 0 && (
                        <div className={styles.resultsCard}>
                            <h4 className={styles.resultsTitle}><FaTv className={styles.textPurple} /> Cuentas y Perfiles</h4>
                            <div className={styles.resultsList}>
                                {resultados.cuentas.map((cu: any, idx: number) => (
                                    <div key={idx} className={`${styles.resultItem} ${cu.ocupado ? styles.borderRed : styles.borderGreen}`}>
                                        <div className={styles.resultMain}>
                                            <strong>{cu.servicio} — {cu.nombrePerfil}</strong>
                                            <small>{cu.correoCuenta}</small>
                                            <div className={styles.cryptoText}>
                                                <span><FaLock size={10} /> PIN: <strong>{cu.pin}</strong></span>
                                                <span>Pass: <strong>{cu.clave}</strong></span>
                                            </div>
                                        </div>
                                        <span className={cu.ocupado ? styles.badgeRed : styles.badgeGreen}>
                                            {cu.ocupado ? 'Ocupado' : 'LIBRE'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resultados?.clientes?.length === 0 && resultados?.cuentas?.length === 0 && (
                        <div className={styles.noResultsCard}>No se encontraron registros.</div>
                    )}
                </div>
            ) : (
                <>
                    {/* 4. HERO KPI (VENTAS DE HOY) + KPIS SECUNDARIOS EN SCROLL/GRID */}
                    <div className={styles.heroKpiCard}>
                        <div className={styles.heroKpiHeader}>
                            <small>VENTAS DE HOY</small>
                            <FaMoneyBillWave className={styles.textGreen} />
                        </div>
                        <h2 className={styles.heroKpiAmount}>C$ {resumen.ventasDia.toLocaleString('es-NI')}</h2>
                        <div className={styles.heroActionsRow}>
                            <div onClick={() => setVistaActiva('renovaciones')} className={styles.chipUrgent}>
                                <FaCalendarTimes />
                                <span>{resumen.renovacionesVencidas} Vencidas</span>
                            </div>
                            <div onClick={() => setVistaActiva('renovaciones')} className={styles.chipNeutral}>
                                <FaCalendarDay />
                                <span>{resumen.renovacionesHoy} Hoy</span>
                            </div>
                        </div>
                    </div>

                    {/* 5. GRID DE KPIS OPERATIVOS */}
                    <section className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiHeader}>
                                <small>SEMANAL</small>
                                <FaChartLine className={styles.textCyan} />
                            </div>
                            <span className={styles.kpiValue}>C$ {resumen.ventasSemana.toLocaleString('es-NI')}</span>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiHeader}>
                                <small>MES (INGRESOS)</small>
                                <FaPercentage className={styles.textPurple} />
                            </div>
                            <span className={styles.kpiValue}>C$ {resumen.ventasMes.toLocaleString('es-NI')}</span>
                            <small className={styles.kpiSub}>Margen: {porcentajeMargen}%</small>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiHeader}>
                                <small>UTILIDAD MES</small>
                                <FaChartLine className={styles.textOrange} />
                            </div>
                            <span className={`${styles.kpiValue} ${styles.textOrange}`}>C$ {resumen.utilidadMes.toLocaleString('es-NI')}</span>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiHeader}>
                                <small>CLIENTES NUEVOS</small>
                                <FaUserPlus className={styles.textBlue} />
                            </div>
                            <span className={styles.kpiValue}>{resumen.cantidadClientesNuevos}</span>
                        </div>
                    </section>

                    {/* 6. INDICADORES RÁPIDOS DE NEGOCIO */}
                    {indicadores && (
                        <section className={styles.indicatorBar}>
                            <div className={styles.indicatorTag}>
                                <span>Clientes:</span>
                                <strong className={styles.textGreen}>{indicadores.clientesActivos} Act</strong>
                                <span className={styles.slash}>/</span>
                                <strong className={styles.textRed}>{indicadores.clientesInactivos} Inact</strong>
                            </div>
                            <div className={styles.indicatorTag}>
                                <span>Tasa Renov:</span>
                                <strong className={styles.textGreen}>{tasaRenovacion}%</strong>
                            </div>
                            <div className={styles.indicatorTag}>
                                <span>Top Prov:</span>
                                <strong className={styles.textCyan}>{indicadores.proveedorConMayorMargen || 'N/A'}</strong>
                            </div>
                        </section>
                    )}

                    {/* 7. GRÁFICAS ADAPTABLES */}
                    <section className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <span className={styles.sectionTitle}>Flujo Semanal</span>
                            <div className={styles.chartWrapper}>
                                <Line data={datosGraficaLinea} options={opcionesComunes} />
                            </div>
                        </div>
                        <div className={styles.chartCard}>
                            <span className={styles.sectionTitle}>Venta por Rubro</span>
                            <div className={styles.chartWrapper}>
                                <Bar data={datosGraficaBarra} options={opcionesComunes} />
                            </div>
                        </div>
                    </section>

                    {/* 8. LISTAS OPERATIVAS (ALERTAS, TOP PRODUCTOS, ÚLTIMOS CLIENTES) */}
                    <section className={styles.operationalGrid}>
                        {/* Alertas */}
                        <div className={styles.detailsCard}>
                            <span className={`${styles.sectionTitle} ${styles.textRed}`}>
                                <FaExclamationTriangle /> Alertas del Sistema
                            </span>
                            <div className={styles.listContent}>
                                {resumen.alertas.length > 0 ? (
                                    resumen.alertas.map((alerta: string, idx: number) => (
                                        <div key={idx} className={styles.alertCardRed}>{alerta}</div>
                                    ))
                                ) : (
                                    <div className={styles.alertCardGreen}>
                                        <FaCheckCircle /> Sin alertas pendientes.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Productos */}
                        <div className={styles.detailsCard}>
                            <span className={styles.sectionTitle}><FaBoxOpen /> Más Vendidos</span>
                            <div className={styles.listContent}>
                                {resumen.productosMasVendidos.map((p: any, idx: number) => (
                                    <div key={idx} className={styles.listItem}>
                                        <span className={styles.ellipsis}>{p.nombre}</span>
                                        <strong className={styles.textCyan}>{p.cantidad} u</strong>
                                    </div>
                                ))}
                                {resumen.productosMasVendidos.length === 0 && (
                                    <small className={styles.emptyText}>Sin ventas registradas.</small>
                                )}
                            </div>
                        </div>

                        {/* Últimos Clientes */}
                        <div className={styles.detailsCard}>
                            <span className={styles.sectionTitle}><FaUserPlus /> Recientes</span>
                            <div className={styles.listContent}>
                                {resumen.ultimosClientes.map((c: any) => (
                                    <div key={c.id} className={styles.listItem}>
                                        <span className={styles.ellipsis}>{c.nombre}</span>
                                        <small className={styles.textMuted}>{c.telefono || 'Sin tel'}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* 9. BARRA DE NAVEGACIÓN RÁPIDA FIJA EN MÓVIL */}
            <nav className={styles.bottomNav}>
                <button onClick={() => setVistaActiva('inicio')} className={styles.navBtnActive}>Inicio</button>
                <button onClick={() => setVistaActiva('caja')} className={styles.navBtn}>Caja</button>
                <button onClick={() => setVistaActiva('renovaciones')} className={styles.navBtn}>Cobros</button>
                <button onClick={() => setVistaActiva('taller')} className={styles.navBtn}>Taller</button>
            </nav>
        </div>
    );
};