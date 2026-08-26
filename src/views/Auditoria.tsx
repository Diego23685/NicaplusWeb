import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Auditoria.module.css';
import { 
    FaSearch, FaFilter, FaHistory, FaSync, 
    FaChevronLeft, FaChevronRight, FaTimes,
    FaUser, FaLayerGroup, FaClock
} from 'react-icons/fa';

interface Log {
    id: number;
    idUsuario: number;
    nombreUsuario?: string;
    accion: string;
    tablaAfectada: string;
    detalles: string;
    fechaRegistro: string;
}

interface FormattedLog extends Log {
    accionEspanol: string;
    badgeClass: string;
    detalleLimpio: string;
    tablaLimpia: string;
    usuarioDisplay: string;
}

const PAGE_SIZE = 15;

const MAPA_TABLAS: Record<string, string> = {
    cliente: 'Clientes',
    clientes: 'Clientes',
    venta: 'Ventas',
    ventas: 'Ventas',
    producto: 'Productos',
    productos: 'Productos',
    usuario: 'Usuarios',
    usuarios: 'Usuarios',
    suscripcion: 'Suscripciones',
    suscripciones: 'Suscripciones',
    ticket: 'Soporte',
    ticketssoporte: 'Soporte',
    garantiaticket: 'Garantías',
    garantiastickets: 'Garantías',
    movimientocaja: 'Caja y Gastos',
    movimientoscaja: 'Caja y Gastos'
};

const formatearFechaServidor = (fechaStr: string) => {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return fechaStr;
        return fecha.toLocaleString('es-NI', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return fechaStr;
    }
};

export const Auditoria: React.FC = () => {
    const [logs, setLogs] = useState<FormattedLog[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState<string>('');
    const [filtroTabla, setFiltroTabla] = useState<string>('todas');
    const [paginaActual, setPaginaActual] = useState<number>(1);

    const formatLog = useCallback((log: Log): FormattedLog => {
        let accionEspanol = log.accion;
        let badgeClass = styles.badgeDefault;
        let detalleLimpio = log.detalles;
        let usuarioNombre = log.nombreUsuario || `Usuario #${log.idUsuario}`;

        const tablaKey = log.tablaAfectada?.toLowerCase().trim() || '';
        const tablaLimpia = MAPA_TABLAS[tablaKey] || log.tablaAfectada || 'General';

        try {
            if (log.detalles && log.detalles.startsWith('{')) {
                const info = JSON.parse(log.detalles);
                if (info.UsuarioNombre) usuarioNombre = info.UsuarioNombre;
                const destino = info.TargetNombre || info.Nombre || info.Concepto || 'un registro';

                switch (log.accion.toLowerCase()) {
                    case 'added':
                    case 'insert':
                    case 'creacion':
                        accionEspanol = 'Creación';
                        badgeClass = styles.badgeAdded;
                        detalleLimpio = `El usuario ${usuarioNombre} registró en ${tablaLimpia}: "${destino}".`;
                        break;

                    case 'modified':
                    case 'update':
                    case 'modificacion':
                        accionEspanol = 'Modificación';
                        badgeClass = styles.badgeModified;
                        detalleLimpio = `El usuario ${usuarioNombre} actualizó la información de "${destino}".`;
                        break;

                    case 'deleted':
                    case 'delete':
                    case 'eliminacion':
                        accionEspanol = 'Eliminación';
                        badgeClass = styles.badgeDeleted;
                        detalleLimpio = `El usuario ${usuarioNombre} eliminó el registro "${destino}".`;
                        break;

                    default:
                        accionEspanol = log.accion;
                        detalleLimpio = log.detalles;
                }
            } else {
                switch (log.accion.toLowerCase()) {
                    case 'added': accionEspanol = 'Creación'; badgeClass = styles.badgeAdded; break;
                    case 'modified': accionEspanol = 'Modificación'; badgeClass = styles.badgeModified; break;
                    case 'deleted': accionEspanol = 'Eliminación'; badgeClass = styles.badgeDeleted; break;
                }
            }
        } catch {
            detalleLimpio = log.detalles || `Acción de ${log.accion} en ${tablaLimpia}.`;
        }

        return {
            ...log,
            accionEspanol,
            badgeClass,
            detalleLimpio,
            tablaLimpia,
            usuarioDisplay: usuarioNombre
        };
    }, []);

    const fetchLogs = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await api.get<Log[]>('/auditoria');
            const logsFormateados = (res.data || []).map(log => formatLog(log));
            setLogs(logsFormateados);
        } catch (err: any) {
            console.error("Error al cargar auditoría:", err);
            setError("No se pudo obtener el historial de auditoría desde el servidor.");
        } finally {
            setCargando(false);
        }
    }, [formatLog]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const logsFiltrados = useMemo(() => {
        return logs.filter(log => {
            const coincideTabla = filtroTabla === 'todas' || log.tablaLimpia.toLowerCase() === filtroTabla.toLowerCase();
            const termino = busqueda.toLowerCase().trim();
            const coincideBusqueda = !termino || 
                log.detalleLimpio.toLowerCase().includes(termino) ||
                log.usuarioDisplay.toLowerCase().includes(termino) ||
                log.accionEspanol.toLowerCase().includes(termino) ||
                log.tablaLimpia.toLowerCase().includes(termino);

            return coincideTabla && coincideBusqueda;
        });
    }, [logs, filtroTabla, busqueda]);

    const totalPaginas = Math.ceil(logsFiltrados.length / PAGE_SIZE) || 1;
    const logsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * PAGE_SIZE;
        return logsFiltrados.slice(inicio, inicio + PAGE_SIZE);
    }, [logsFiltrados, paginaActual]);

    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className={styles.container}>
            {/* 1. ENCABEZADO */}
            <header className={styles.header}>
                <div className={styles.titleWrap}>
                    <h2 className={styles.title}>
                        <FaHistory /> Auditoría
                    </h2>
                    <span className={styles.totalBadge}>{logsFiltrados.length} eventos</span>
                </div>
                <button 
                    onClick={fetchLogs} 
                    disabled={cargando}
                    className={styles.refreshBtn}
                    aria-label="Refrescar auditoría"
                >
                    <FaSync className={cargando ? styles.spin : ''} /> 
                    <span>Actualizar</span>
                </button>
            </header>

            {/* 2. FILTROS Y BÚSQUEDA */}
            <section className={styles.filterSection}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, acción, detalle..." 
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                        className={styles.searchInput}
                    />
                    {busqueda && (
                        <button 
                            onClick={() => { setBusqueda(''); setPaginaActual(1); }} 
                            className={styles.clearSearchBtn}
                            aria-label="Limpiar búsqueda"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className={styles.filterSelectBox}>
                    <FaFilter className={styles.filterIcon} />
                    <select 
                        value={filtroTabla} 
                        onChange={(e) => { setFiltroTabla(e.target.value); setPaginaActual(1); }}
                        className={styles.filterSelect}
                    >
                        <option value="todas">Todos los Módulos</option>
                        <option value="Clientes">Clientes</option>
                        <option value="Ventas">Ventas</option>
                        <option value="Productos">Productos</option>
                        <option value="Suscripciones">Suscripciones</option>
                        <option value="Caja y Gastos">Caja y Gastos</option>
                        <option value="Soporte">Soporte</option>
                        <option value="Usuarios">Usuarios</option>
                    </select>
                </div>
            </section>

            {/* 3. ESTADOS DE CARGA Y ERROR */}
            {cargando && (
                <div className={styles.loadingBox}>
                    <FaSync className={`${styles.spin} ${styles.loadingIcon}`} />
                    <span>Cargando trazabilidad del sistema...</span>
                </div>
            )}

            {error && (
                <div className={styles.errorBox}>
                    {error}
                </div>
            )}

            {/* 4. RESULTADOS */}
            {!cargando && !error && (
                <>
                    {logsPaginados.length === 0 ? (
                        <div className={styles.emptyState}>
                            No se encontraron registros de auditoría que coincidan con la búsqueda.
                        </div>
                    ) : (
                        <>
                            {/* VISTA MÓVIL / TABLET (FEED DE TARJETAS) */}
                            <div className={styles.mobileContainer}>
                                {logsPaginados.map(log => (
                                    <article key={log.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={`${styles.badge} ${log.badgeClass}`}>
                                                {log.accionEspanol}
                                            </span>
                                            <span className={styles.cardDate}>
                                                <FaClock size={10} /> {formatearFechaServidor(log.fechaRegistro)}
                                            </span>
                                        </div>

                                        <div className={styles.cardMeta}>
                                            <span className={styles.cardUser}>
                                                <FaUser size={10} /> {log.usuarioDisplay}
                                            </span>
                                            <span className={styles.cardModule}>
                                                <FaLayerGroup size={10} /> {log.tablaLimpia}
                                            </span>
                                        </div>

                                        <p className={styles.cardDetails}>
                                            {log.detalleLimpio}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            {/* VISTA DESKTOP (TABLA DE ALTA DENSIDAD) */}
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead className={styles.thead}>
                                        <tr>
                                            <th className={styles.th}>Fecha y Hora</th>
                                            <th className={styles.th}>Usuario</th>
                                            <th className={styles.th}>Operación</th>
                                            <th className={styles.th}>Módulo</th>
                                            <th className={styles.th}>Descripción de Actividad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logsPaginados.map(log => (
                                            <tr key={log.id} className={styles.tr}>
                                                <td className={`${styles.td} ${styles.tdDate}`}>
                                                    {formatearFechaServidor(log.fechaRegistro)}
                                                </td>
                                                <td className={`${styles.td} ${styles.tdUser}`}>
                                                    <strong>{log.usuarioDisplay}</strong>
                                                </td>
                                                <td className={styles.td}>
                                                    <span className={`${styles.badge} ${log.badgeClass}`}>
                                                        {log.accionEspanol}
                                                    </span>
                                                </td>
                                                <td className={`${styles.td} ${styles.tdModule}`}>
                                                    {log.tablaLimpia}
                                                </td>
                                                <td className={`${styles.td} ${styles.tdDetails}`}>
                                                    {log.detalleLimpio}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 5. CONTROLES DE PAGINACIÓN */}
                            <footer className={styles.paginationFooter}>
                                <small className={styles.paginationInfo}>
                                    Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                                </small>
                                <div className={styles.paginationActions}>
                                    <button 
                                        onClick={() => cambiarPagina(paginaActual - 1)}
                                        disabled={paginaActual === 1}
                                        className={styles.pageBtn}
                                        aria-label="Página anterior"
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button 
                                        onClick={() => cambiarPagina(paginaActual + 1)}
                                        disabled={paginaActual === totalPaginas}
                                        className={styles.pageBtn}
                                        aria-label="Página siguiente"
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </footer>
                        </>
                    )}
                </>
            )}
        </div>
    );
};