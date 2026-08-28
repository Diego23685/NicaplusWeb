import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
    FaUserPlus, FaBoxOpen, FaMoneyBillWave, 
    FaChartLine, FaPercentage, FaExclamationTriangle, 
    FaCalendarDay, FaCalendarTimes, FaClipboardList,
    FaSearch, FaUser, FaTv, FaLock, FaTimes,
    FaReceipt, FaUsers, FaTools
} from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import styles from '../assets/styles/InicioDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface InicioDashboardProps {
    setVistaActiva: (vista: any) => void;
}

export const InicioDashboard: React.FC<InicioDashboardProps> = ({ setVistaActiva }) => {
    const { usuario } = useAuth();
    const esVentas = usuario?.rol === 'Ventas';

    const [esMobile, setEsMobile] = useState<boolean>(window.innerWidth <= 768);

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

    // Estado para almacenar la tasa de cambio traída del backend
    const [tasaCambio, setTasaCambio] = useState<number>(0);

    // Estados para Búsqueda Universal
    const [query, setQuery] = useState('');
    const [resultados, setResultados] = useState<any>(null);
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const handleResize = () => setEsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                const peticiones: any[] = [
                    api.get('/reportes/resumen-dashboard'),
                    api.get('/tasa-cambio')
                ];

                // Si no es ventas, también traemos los indicadores de negocio generales
                if (!esVentas) {
                    peticiones.push(api.get('/reportes/indicadores'));
                }

                const respuestas = await Promise.all(peticiones);
                const resResumen = respuestas[0];
                const resTasa = respuestas[1];
                const resIndicadores = !esVentas ? respuestas[2] : null;

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

                if (resIndicadores) {
                    setIndicadores(resIndicadores.data);
                }

                if (resTasa.data) {
                    const valorObtenido = resTasa.data.valor ?? resTasa.data.Valor ?? 0;
                    setTasaCambio(Number(valorObtenido));
                }
            } catch (err) {
                console.error("Error al sincronizar métricas o tasa de cambio:", err);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosDashboard();
    }, [esVentas]);

    const calcularDolares = (montoCordobas: number) => {
        if (!tasaCambio || tasaCambio <= 0) return 0;
        return montoCordobas / tasaCambio;
    };

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

    /* =========================================================
       1. VISTA MÓVIL
       ========================================================= */
    if (esMobile) {
        return (
            <div className={styles.mobileContainer}>
                <div className={styles.topSummaryCard}>
                    <div className={styles.summaryHeader}>
                        <span>VENTAS DE HOY</span>
                        <span className={styles.liveDot}>● SISTEMA ACTIVO</span>
                    </div>
                    <h2 className={styles.totalAmount}>C$ {resumen.ventasDia.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</h2>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginTop: '-4px', marginBottom: '8px' }}>
                        US$ {calcularDolares(resumen.ventasDia).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className={styles.quickMetricsRow}>
                        <div onClick={() => setVistaActiva('renovaciones')} className={styles.miniMetricUrgent}>
                            <FaCalendarTimes />
                            <span>{resumen.renovacionesVencidas} Vencidas</span>
                        </div>
                        <div onClick={() => setVistaActiva('taller')} className={styles.miniMetric}>
                            <FaTools />
                            <span>{resumen.ticketsAbiertos} Taller</span>
                        </div>
                    </div>
                </div>

                <div className={styles.quickActionsGrid}>
                    <button onClick={() => setVistaActiva('caja')} className={styles.actionBtnPrimary}>
                        <FaReceipt className={styles.actionIcon} />
                        <span>Nueva Venta</span>
                    </button>
                    <button onClick={() => setVistaActiva('renovaciones')} className={styles.actionBtnWarning}>
                        <FaMoneyBillWave className={styles.actionIcon} />
                        <span>Cobrar</span>
                    </button>
                    <button onClick={() => setVistaActiva('crm')} className={styles.actionBtnSecondary}>
                        <FaUsers className={styles.actionIcon} />
                        <span>Clientes</span>
                    </button>
                    <button onClick={() => setVistaActiva('taller')} className={styles.actionBtnSecondary}>
                        <FaTools className={styles.actionIcon} />
                        <span>Taller</span>
                    </button>
                </div>

                <div className={styles.searchBoxWrapper}>
                    <FaSearch className={styles.searchBoxIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar cliente, correo o cuenta..." 
                        value={query}
                        onChange={(e) => ejecutarBusqueda(e.target.value)}
                        className={styles.searchBoxInput}
                    />
                    {query && <FaTimes onClick={limpiarBuscador} className={styles.clearIcon} />}
                </div>

                {buscando ? (
                    <div className={styles.mobileSearchResults}>
                        {resultados?.clientes?.map((c: any, i: number) => (
                            <div key={i} className={styles.mobileResultCard}>
                                <strong>{c.nombre}</strong>
                                <p>📱 {c.telefono || 'Sin teléfono'}</p>
                                <small>Servicios Activos: {c.serviciosActivos?.length || 0}</small>
                            </div>
                        ))}
                        {resultados?.cuentas?.map((cu: any, i: number) => (
                            <div key={i} className={`${styles.mobileResultCard} ${cu.ocupado ? styles.statusRed : styles.statusGreen}`}>
                                <div className={styles.cardRow}>
                                    <strong>{cu.servicio} - {cu.nombrePerfil}</strong>
                                    <span className={styles.badge}>{cu.ocupado ? 'Ocupado' : 'LIBRE'}</span>
                                </div>
                                <p className={styles.cryptoText}>PIN: {cu.pin} | Pass: {cu.clave}</p>
                            </div>
                        ))}
                        {resultados?.clientes?.length === 0 && resultados?.cuentas?.length === 0 && (
                            <div className={styles.noResultsCard}>No se encontraron registros.</div>
                        )}
                    </div>
                ) : (
                    <div className={styles.urgentFeed}>
                        <h4 className={styles.feedTitle}><FaExclamationTriangle /> Alertas del Sistema</h4>
                        {resumen.alertas.length > 0 ? (
                            resumen.alertas.map((alerta: string, idx: number) => (
                                <div key={idx} className={styles.alertCard}>
                                    {alerta}
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyAlerts}>Sistema operando con normalidad.</div>
                        )}
                    </div>
                )}

                <nav className={styles.bottomNav}>
                    <button onClick={() => setVistaActiva('inicio')} className={styles.navItemActive}>Inicio</button>
                    <button onClick={() => setVistaActiva('caja')} className={styles.navItem}>Caja</button>
                    <button onClick={() => setVistaActiva('renovaciones')} className={styles.navItem}>Cobros</button>
                    <button onClick={() => setVistaActiva('taller')} className={styles.navItem}>Taller</button>
                </nav>
            </div>
        );
    }

    /* =========================================================
       2. VISTA ESCRITORIO
       ========================================================= */
    return (
        <div className={styles.dashboardContainer}>
            
            <header className={styles.dashboardHeader}>
                <div>
                    <h3 className={styles.headerTitle}>{esVentas ? 'Panel de Ventas' : 'Panel de Control'}</h3>
                    <p className={styles.headerSubtitle}>
                        {esVentas ? 'Gestión rápida comercial y atención al cliente.' : 'Monitoreo en tiempo real del negocio.'}
                    </p>
                </div>
                <span className={styles.activeBadge}>
                    SISTEMA ACTIVO — 2026
                </span>
            </header>

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

            {/* Los indicadores de salud y proveedores se ocultan para el rol Ventas */}
            {!esVentas && indicadores && (
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

            {buscando ? (
                <div className={styles.searchResultsWrapper}>
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
                <>
                    {/* SECCIÓN 1: KPI CARDS FILTRADAS SEGÚN ROL */}
                    <section className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                            <div className={styles.kpiHeader}>
                                <small className={styles.kpiLabel}>VENTAS DEL DÍA</small>
                                <FaMoneyBillWave className={styles.kpiIcon} />
                            </div>
                            <h4 className={styles.kpiValue}>C$ {resumen.ventasDia.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</h4>
                            <small className={styles.kpiSubtitle}>US$ {calcularDolares(resumen.ventasDia).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                        </div>

                        {/* Ocultar ventas semanales, mensuales y utilidad a Ventas */}
                        {!esVentas && (
                            <div className={`${styles.kpiCard} ${styles.kpiCyan}`}>
                                <div className={styles.kpiHeader}>
                                    <small className={styles.kpiLabel}>VENTAS SEMANALES</small>
                                    <FaChartLine className={styles.kpiIcon} />
                                </div>
                                <h4 className={styles.kpiValue}>C$ {resumen.ventasSemana.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</h4>
                                <small className={styles.kpiSubtitle}>US$ {calcularDolares(resumen.ventasSemana).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                            </div>
                        )}

                        {!esVentas && (
                            <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                                <div className={styles.kpiHeader}>
                                    <small className={styles.kpiLabel}>INGRESOS (MES)</small>
                                    <FaPercentage className={styles.kpiIcon} />
                                </div>
                                <h4 className={styles.kpiValue}>C$ {resumen.ventasMes.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</h4>
                                <small className={styles.kpiSubtitle}>US$ {calcularDolares(resumen.ventasMes).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Margen: {porcentajeMargen}%</small>
                            </div>
                        )}

                        {!esVentas && (
                            <div className={`${styles.kpiCard} ${styles.kpiOrange}`}>
                                <div className={styles.kpiHeader}>
                                    <small className={styles.kpiLabel}>UTILIDAD (MES)</small>
                                    <FaChartLine className={styles.kpiIcon} />
                                </div>
                                <h4 className={`${styles.kpiValue} ${styles.textOrange}`}>C$ {resumen.utilidadMes.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</h4>
                                <small className={styles.kpiSubtitle} style={{ color: '#fed7aa' }}>US$ {calcularDolares(resumen.utilidadMes).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</small>
                            </div>
                        )}

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

                        {!esVentas && (
                            <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                                <div className={styles.kpiHeader}>
                                    <small className={styles.kpiLabel}>CLIENTES TOTALES</small>
                                    <FaUserPlus className={styles.kpiIcon} />
                                </div>
                                <h4 className={styles.kpiValue}>{resumen.cantidadClientesNuevos}</h4>
                            </div>
                        )}
                    </section>

                    {/* SECCIÓN 2: GRÁFICAS DE NEGOCIO (Ocultas para Ventas) */}
                    {!esVentas && (
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
                    )}
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

            <footer className={styles.actionFooter}>
                <button onClick={() => setVistaActiva('caja')} className={styles.btnActionBlue}>Ir a Caja POS</button>
                <button onClick={() => setVistaActiva('taller')} className={styles.btnActionGreen}>Órdenes de Taller ({resumen.ticketsAbiertos})</button>
            </footer>

        </div>
    );
};