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
import styles from '../assets/styles/InicioDashboard.module.css'; // ◄ NUEVOS ESTILOS PREMIUM

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

    // NUEVOS ESTADOS: Buscador Universal Integrado
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

    const porcentajeMargen = resumen.ventasMes > 0 ? ((resumen.utilidadMes / resumen.ventasMes) * 100).toFixed(1) : "0";

    const datosGraficaLinea = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
            label: 'Ingresos (C$)',
            data: resumen.semanaFlujo,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#38bdf8',
            pointHoverRadius: 6,
        }]
    };

    const datosGraficaBarra = {
        labels: ['Productos', 'Digitales', 'Soporte'],
        datasets: [{
            label: 'Ventas (C$)',
            data: resumen.rubros,
            backgroundColor: ['#a855f7', '#10b981', '#38bdf8'],
            borderRadius: 6,
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
                padding: 10,
                displayColors: false
            }
        },
        scales: {
            y: { grid: { color: 'rgba(51, 65, 85, 0.4)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
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
            
            {/* ENCABEZADO */}
            <header className={styles.dashboardHeader}>
                <div>
                    <h3 className={styles.headerTitle}>Panel de Control</h3>
                    <p className={styles.headerSubtitle}>Monitoreo en tiempo real del negocio.</p>
                </div>
                <span className={styles.activeBadge}>
                    SISTEMA ACTIVO — 2026
                </span>
            </header>

            {/* BARRA DE BÚSQUEDA UNIVERSAL */}
            <div className={styles.searchSection}>
                <FaSearch className={styles.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Búsqueda rápida universal: Escribe 'Juan', 'Netflix' o 'Spotify'..." 
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

            {/* SECCIÓN: SALUD DEL NEGOCIO E INDICADORES */}
            {indicadores && (
                <section className={styles.indicatorGrid}>
                    <div className={styles.indicatorCard}>
                        <h4 className={styles.indicatorLabel}>Salud de Clientes</h4>
                        <div className={styles.indicatorValue}>
                            <span className={styles.textGreen}>● {indicadores.clientesActivos} Activos</span>
                            <span className={styles.divider}>|</span>
                            <span className={styles.textRed}>● {indicadores.clientesInactivos} Inactivos</span>
                        </div>
                    </div>
                    <div className={styles.indicatorCard}>
                        <h4 className={styles.indicatorLabel}>Mejor Proveedor (Margen)</h4>
                        <div className={`${styles.indicatorValue} ${styles.textCyan}`}>{indicadores.proveedorConMayorMargen}</div>
                    </div>
                    <div className={styles.indicatorCard}>
                        <h4 className={styles.indicatorLabel}>Proveedor (Reclamos)</h4>
                        <div className={`${styles.indicatorValue} ${styles.textRed}`}>{indicadores.proveedorConMasReclamos}</div>
                    </div>
                    <div className={styles.indicatorCard}>
                        <h4 className={styles.indicatorLabel}>Tasa Renovaciones</h4>
                        <div className={`${styles.indicatorValue} ${styles.textGreen}`}>
                            {((indicadores.renovacionesExitosas / (indicadores.renovacionesExitosas + indicadores.renovacionesPerdidas || 1)) * 100).toFixed(0)}%
                        </div>
                    </div>
                </section>
            )}

            {/* CONTROL DINÁMICO DE BÚSQUEDA / DASHBOARD */}
            {buscando ? (
                <div className={styles.searchResultsWrapper}>
                    {/* RESULTADOS DE CLIENTES */}
                    {resultados?.clientes?.length > 0 && (
                        <div className={styles.resultsCard}>
                            <h4 className={styles.resultsTitle}><FaUser className={styles.titleIconCyan} /> Historial de Clientes Encontrados</h4>
                            <div className={styles.resultsList}>
                                {resultados.clientes.map((c: any, idx: number) => (
                                    <div key={idx} className={styles.customerResultItem}>
                                        <div className={styles.customerItemHeader}>
                                            <span className={styles.customerName}>{c.nombre}</span>
                                            <span className={styles.customerPhone}>— 📱 {c.telefono}</span>
                                        </div>
                                        <div className={styles.customerItemBadges}>
                                            <span className={styles.badgeGreen}>🛒 Facturas en Historial: {c.historialCompras?.length || 0}</span>
                                            <span className={styles.badgePurple}>🔄 Servicios Activos: {c.serviciosActivos?.length || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RESULTADOS DE CUENTAS / ESPACIOS LIBRES */}
                    {resultados?.cuentas?.length > 0 && (
                        <div className={styles.resultsCard}>
                            <h4 className={styles.resultsTitle}><FaTv className={styles.titleIconPurple} /> Estado de Cuentas y Espacios Libres</h4>
                            <div className={styles.accountsGrid}>
                                {resultados.cuentas.map((cu: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className={`${styles.accountResultItem} ${cu.ocupado ? styles.borderLeftRed : styles.borderLeftGreen}`}
                                    >
                                        <div className={styles.accountHeader}>
                                            <strong className={styles.accountName}>{cu.servicio} — {cu.nombrePerfil}</strong>
                                            <span className={cu.ocupado ? styles.statusBadgeRed : styles.statusBadgeGreen}>
                                                {cu.ocupado ? 'Ocupado' : 'DISPONIBLE'}
                                            </span>
                                        </div>
                                        <div className={styles.accountEmail}>✉️ {cu.correoCuenta}</div>
                                        <div className={styles.accountSecrets}>
                                            <span><FaLock size={8} /> PIN: <strong className={styles.textOrange}>{cu.pin}</strong></span>
                                            <span className={styles.divider}>|</span>
                                            <span>Clave: {cu.clave}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {resultados?.clientes?.length === 0 && resultados?.cuentas?.length === 0 && (
                        <div className={styles.noResultsCard}>
                            No se encontraron registros ni perfiles libres que coincidan con la consulta.
                        </div>
                    )}
                </div>
            ) : (
                /* FLUJO OPERATIVO POR DEFECTO DEL DASHBOARD */
                <>
                    {/* SECCIÓN 1: KPI CARDS */}
                    <section className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>VENTAS DEL DÍA</small>
                                <FaMoneyBillWave className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>C$ {resumen.ventasDia.toLocaleString('es-NI')}</h4>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiCyan}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>VENTAS SEMANALES</small>
                                <FaChartLine className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>C$ {resumen.ventasSemana.toLocaleString('es-NI')}</h4>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>INGRESOS (MES)</small>
                                <FaPercentage className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>C$ {resumen.ventasMes.toLocaleString('es-NI')}</h4>
                            <small className={styles.kpiSubtitle}>Margen: {porcentajeMargen}%</small>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiOrange}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>UTILIDAD (MES)</small>
                                <FaChartLine className={styles.kpiIcon} />
                            </div>
                            <h4 className={`${styles.kpiValue} ${styles.textOrange}`}>C$ {resumen.utilidadMes.toLocaleString('es-NI')}</h4>
                        </div>

                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            className={`${styles.kpiCard} ${styles.kpiGreenActive}`}
                        >
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>RENOVACIONES HOY</small>
                                <FaCalendarDay className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>
                                {resumen.renovacionesHoy} 
                                <span className={styles.kpiActionLabel}>→ Revisar</span>
                            </h4>
                        </div>

                        <div 
                            onClick={() => setVistaActiva('renovaciones')}
                            className={`${styles.kpiCard} ${styles.kpiRedActive}`}
                        >
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>RENOVACIONES VENCIDAS</small>
                                <FaCalendarTimes className={styles.kpiIcon} />
                            </div>
                            <h4 className={`${styles.kpiValue} ${styles.textRed}`}>
                                {resumen.renovacionesVencidas} 
                                <span className={styles.kpiActionLabelRed}>→ Cobrar</span>
                            </h4>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiPink}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>TICKETS ABIERTOS</small>
                                <FaClipboardList className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>{resumen.ticketsAbiertos}</h4>
                        </div>

                        <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>CLIENTES TOTALES</small>
                                <FaUserPlus className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>{resumen.cantidadClientesNuevos}</h4>
                        </div>
                    </section>

                    {/* SECCIÓN 2: GRÁFICAS DEL FLUJO */}
                    <section className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <span className={styles.chartTitle}>Flujo de Caja Semanal</span>
                            <div className={styles.chartWrapper}>
                                <Line data={datosGraficaLinea} options={opcionesComunes} />
                            </div>
                        </div>
                        <div className={styles.chartCard}>
                            <span className={styles.chartTitle}>Ventas por Categoría de Rubro</span>
                            <div className={styles.chartWrapper}>
                                <Bar data={datosGraficaBarra} options={opcionesComunes} />
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* SECCIÓN 3: COMPONENTES OPERATIVOS Y DETALLES */}
            <section className={styles.operationalGrid}>
                <div className={styles.detailsCard}>
                    <span className={styles.detailsHeaderTitle}><FaBoxOpen /> PRODUCTOS MÁS VENDIDOS</span>
                    <div className={styles.detailsList}>
                        {resumen.productosMasVendidos.map((p: any, idx: number) => (
                            <div key={idx} className={styles.detailsListItem}>
                                <span className={styles.itemText}>{p.nombre}</span>
                                <strong className={styles.itemBadgeCyan}>{p.cantidad} unds</strong>
                            </div>
                        ))}
                        {resumen.productosMasVendidos.length === 0 && <small className={styles.noDataText}>Sin datos de transacciones este mes.</small>}
                    </div>
                </div>

                <div className={styles.detailsCard}>
                    <span className={styles.detailsHeaderTitle}><FaUserPlus /> ÚLTIMOS CLIENTES REGISTRADOS</span>
                    <div className={styles.detailsList}>
                        {resumen.ultimosClientes.map((c: any) => (
                            <div key={c.id} className={styles.detailsListItem}>
                                <span className={styles.itemText}>{c.nombre}</span>
                                <small className={styles.itemSecondaryText}>{c.telefono || 'Sin Teléfono'}</small>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.detailsCard}>
                    <span className={styles.detailsHeaderTitleRed}><FaExclamationTriangle /> ALERTAS DEL SISTEMA</span>
                    <div className={styles.detailsList}>
                        {resumen.alertas.map((alerta: string, idx: number) => (
                            <div key={idx} className={styles.alertItemRed}>
                                {alerta}
                            </div>
                        ))}
                        {resumen.alertas.length === 0 && (
                            <div className={styles.alertItemGreen}>
                                Sistema operando con normalidad. No hay alertas críticas.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* BARRA INFERIOR DE ACCESOS RÁPIDOS */}
            <footer className={styles.actionFooter}>
                <button onClick={() => setVistaActiva('caja')} className={styles.btnActionBlue}>Ir a Caja POS</button>
                <button onClick={() => setVistaActiva('taller')} className={styles.btnActionGreen}>Órdenes de Taller ({resumen.ticketsAbiertos})</button>
            </footer>

        </div>
    );
};