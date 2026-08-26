import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
    FaDollarSign, FaTrophy, FaShieldAlt, FaArrowDown, 
    FaCalendarTimes, FaChartLine, FaWallet, FaUserClock, 
    FaSync, FaExclamationTriangle, FaFilter, FaPrint
} from 'react-icons/fa';
import styles from '../assets/styles/Analitica.module.css';

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
    colorClass: string;
    subtitle?: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, colorClass, subtitle }) => (
    <div className={styles.kpiCard}>
        <div className={`${styles.kpiIconWrap} ${colorClass}`}>
            {icon}
        </div>
        <div className={styles.kpiInfo}>
            <small className={styles.kpiTitle}>{title}</small>
            <h3 className={styles.kpiValue}>{value}</h3>
            {subtitle && <small className={styles.kpiSubtitle}>{subtitle}</small>}
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
        <div className={styles.container}>
            
            {/* 1. ENCABEZADO Y CONTROLES */}
            <header className={styles.headerPanel}>
                <div className={styles.headerTitleWrap}>
                    <h3 className={styles.title}>
                        <FaChartLine /> Inteligencia de Negocio
                    </h3>
                </div>

                <div className={styles.controlsWrap}>
                    <div className={styles.filterBox}>
                        <FaFilter className={styles.filterIcon} />
                        
                        <select 
                            value={tipoFiltro} 
                            onChange={(e) => setTipoFiltro(e.target.value as 'hoy' | 'semana' | 'mes' | 'anio' | 'rango')}
                            className={styles.selectType}
                        >
                            <option value="hoy">Hoy</option>
                            <option value="semana">Esta Semana</option>
                            <option value="mes">Por Mes</option>
                            <option value="anio">Todo el Año</option>
                            <option value="rango">Rango Fechas</option>
                        </select>

                        {tipoFiltro === 'mes' && (
                            <select 
                                value={mes} 
                                onChange={(e) => setMes(Number(e.target.value))}
                                className={styles.selectDetail}
                            >
                                <option value={1}>Enero</option>
                                <option value={2}>Febrero</option>
                                <option value={3}>Marzo</option>
                                <option value={4}>Abril</option>
                                <option value={5}>Mayo</option>
                                <option value={6}>Junio</option>
                                <option value={7}>Julio</option>
                                <option value={8}>Agosto</option>
                                <option value={9}>Septiembre</option>
                                <option value={10}>Octubre</option>
                                <option value={11}>Noviembre</option>
                                <option value={12}>Diciembre</option>
                            </select>
                        )}

                        {(tipoFiltro === 'mes' || tipoFiltro === 'anio') && (
                            <select 
                                value={anio} 
                                onChange={(e) => setAnio(Number(e.target.value))}
                                className={styles.selectDetail}
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                        )}

                        {tipoFiltro === 'rango' && (
                            <div className={styles.dateRangeInputs}>
                                <input 
                                    type="date" 
                                    value={fechaInicio} 
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className={styles.dateInput}
                                />
                                <span className={styles.rangeDivider}>a</span>
                                <input 
                                    type="date" 
                                    value={fechaFin} 
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className={styles.dateInput}
                                />
                            </div>
                        )}
                    </div>

                    <div className={styles.actionButtons}>
                        <button 
                            onClick={imprimirReporteAnalitico}
                            className={styles.btnPrint}
                        >
                            <FaPrint /> <span>PDF</span>
                        </button>

                        <button 
                            onClick={cargarAnalitica} 
                            disabled={cargando}
                            className={styles.btnSync}
                            title="Recargar analítica"
                        >
                            <FaSync className={cargando ? styles.spin : ''} />
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. ESTADOS DE CARGA Y ERROR */}
            {cargando && !data && (
                <div className={styles.loadingBox}>
                    <FaSync className={`${styles.spin} ${styles.loadingIcon}`} />
                    <div>Procesando analítica detallada...</div>
                </div>
            )}

            {error && (
                <div className={styles.errorBox}>
                    <div className={styles.errorContent}>
                        <FaExclamationTriangle />
                        <span>{error}</span>
                    </div>
                    <button onClick={cargarAnalitica} className={styles.btnRetry}>
                        Reintentar
                    </button>
                </div>
            )}

            {/* 3. REPORTES Y GRIDS */}
            {data && (
                <>
                    <div className={styles.gridKpis}>
                        <Card 
                            title={tipoFiltro === 'hoy' ? "Utilidad Neta Hoy" : tipoFiltro === 'semana' ? "Utilidad Neta Semana" : tipoFiltro === 'anio' ? "Utilidad Neta Año" : tipoFiltro === 'rango' ? "Utilidad Neta Rango" : "Utilidad Neta Mes"} 
                            value={`C$ ${utilidadNeta.toLocaleString()}`} 
                            subtitle={`Bruto: C$ ${utilidadBruta.toLocaleString()}`}
                            icon={<FaDollarSign />} 
                            colorClass={styles.iconGreen} 
                        />
                        <Card 
                            title="Garantías Aplicadas" 
                            value={data.historialGarantias?.length ?? 0} 
                            icon={<FaShieldAlt />} 
                            colorClass={styles.iconAmber} 
                        />
                        <Card 
                            title="Pérdida en Garantías" 
                            value={`C$ ${dineroPerdidoGarantias.toLocaleString()}`} 
                            icon={<FaArrowDown />} 
                            colorClass={styles.iconRed} 
                        />
                        <Card 
                            title="Renovaciones Vencidas" 
                            value={data.renovacionesPerdidas?.length ?? 0} 
                            icon={<FaCalendarTimes />} 
                            colorClass={styles.iconRose} 
                        />
                    </div>

                    <div className={styles.gridDetalles}>
                        {/* TOP SERVICIOS */}
                        <div className={styles.detailCard}>
                            <h4 className={`${styles.cardHeaderTitle} ${styles.textCyan}`}>
                                <FaTrophy /> Top Servicios Rentables
                            </h4>
                            <div className={styles.detailList}>
                                {(!data.rankingServicios || data.rankingServicios.length === 0) ? (
                                    <div className={styles.emptyListText}>
                                        No hay datos de servicios en este período.
                                    </div>
                                ) : (
                                    data.rankingServicios.map((s, i) => (
                                        <div key={i} className={styles.detailItem}>
                                            <span className={styles.itemTitle}>{i + 1}. {s.servicio}</span>
                                            <strong className={styles.itemValue}>C$ {(s.utilidadTotal || 0).toLocaleString()}</strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* GASTOS OPERATIVOS */}
                        <div className={styles.detailCard}>
                            <h4 className={`${styles.cardHeaderTitle} ${styles.textOrange}`}>
                                <FaWallet /> Gastos Operativos (C$ {gastosTotales.toLocaleString()})
                            </h4>
                            <div className={styles.detailList}>
                                {(!data.resumenFinanciero?.gastosDesglosados || data.resumenFinanciero.gastosDesglosados.length === 0) ? (
                                    <div className={styles.emptyListText}>
                                        Sin registros de gastos en este período.
                                    </div>
                                ) : (
                                    data.resumenFinanciero.gastosDesglosados.map((g, i) => (
                                        <div key={i} className={styles.detailItem}>
                                            <span className={styles.itemTitle}>{g.detalle}</span>
                                            <strong className={styles.textRed}>- C$ {(g.monto || 0).toLocaleString()}</strong>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RENOVACIONES VENCIDAS */}
                        <div className={styles.detailCard}>
                            <h4 className={`${styles.cardHeaderTitle} ${styles.textRose}`}>
                                <FaUserClock /> Renovaciones Vencidas
                            </h4>
                            <div className={styles.detailList}>
                                {(!data.renovacionesPerdidas || data.renovacionesPerdidas.length === 0) ? (
                                    <div className={styles.emptyListTextGreen}>
                                        ¡Excelente! Sin renovaciones perdidas.
                                    </div>
                                ) : (
                                    data.renovacionesPerdidas.map((r, i) => (
                                        <div key={i} className={styles.detailItemStacked}>
                                            <span className={styles.clientName}>{r.nombre}</span>
                                            <small className={styles.serviceMeta}>
                                                {r.nombreServicio} — Venció: <strong className={styles.textRed}>{formatearFechaLocal(r.fechaVencimiento)}</strong>
                                            </small>
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