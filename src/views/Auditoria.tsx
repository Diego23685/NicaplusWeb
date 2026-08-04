import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Auditoria.module.css';
import { FaSearch, FaFilter, FaHistory, FaSync, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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

// Mapeo seguro de nombres de entidades de base de datos a nombres amigables
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

// Formateador seguro de fechas para evitar desfases de zona horaria en móvil
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

    // Filtros y Paginación
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

    // Filtrado dinámico por búsqueda en tiempo real
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

    // Paginador
    const totalPaginas = Math.ceil(logsFiltrados.length / PAGE_SIZE) || 1;
    const logsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * PAGE_SIZE;
        return logsFiltrados.slice(inicio, inicio + PAGE_SIZE);
    }, [logsFiltrados, paginaActual]);

    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
        }
    };

    return (
        <div className={styles.container} style={{ color: '#fff', padding: '10px 4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ color: '#38bdf8', margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <FaHistory /> Historial de Auditoría
                </h2>
                <button 
                    onClick={fetchLogs} 
                    disabled={cargando}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <FaSync className={cargando ? 'spin' : ''} /> Refrescar
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA Y FILTROS */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: '#0f172a', padding: '0 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <FaSearch style={{ color: '#64748b', marginRight: '8px' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario, acción o detalle..." 
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', outline: 'none', fontSize: '0.9rem' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '0 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <FaFilter style={{ color: '#38bdf8', fontSize: '0.85rem' }} />
                    <select 
                        value={filtroTabla} 
                        onChange={(e) => { setFiltroTabla(e.target.value); setPaginaActual(1); }}
                        style={{ background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', padding: '10px 0', fontSize: '0.9rem' }}
                    >
                        <option value="todas" style={{ background: '#1e293b' }}>Todos los Módulos</option>
                        <option value="Clientes" style={{ background: '#1e293b' }}>Clientes</option>
                        <option value="Ventas" style={{ background: '#1e293b' }}>Ventas</option>
                        <option value="Productos" style={{ background: '#1e293b' }}>Productos</option>
                        <option value="Suscripciones" style={{ background: '#1e293b' }}>Suscripciones</option>
                        <option value="Caja y Gastos" style={{ background: '#1e293b' }}>Caja y Gastos</option>
                        <option value="Soporte" style={{ background: '#1e293b' }}>Soporte</option>
                        <option value="Usuarios" style={{ background: '#1e293b' }}>Usuarios</option>
                    </select>
                </div>
            </div>

            {/* ESTADOS DE CARGA Y ERROR */}
            {cargando && (
                <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
                    <FaSync className="spin" style={{ fontSize: '1.4rem', marginBottom: '8px' }} />
                    <div>Cargando trazabilidad del sistema...</div>
                </div>
            )}

            {error && (
                <div style={{ color: '#f43f5e', padding: '16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #f43f5e', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {/* VISTA DE RESULTADOS */}
            {!cargando && !error && (
                <>
                    {logsPaginados.length === 0 ? (
                        <div className={styles.emptyState} style={{ padding: '40px', textAlign: 'center', background: '#1e293b', borderRadius: '10px', color: '#94a3b8' }}>
                            No se encontraron registros de auditoría que coincidan con el filtro.
                        </div>
                    ) : (
                        <>
                            {/* LAYOUT MOBILE (CARDS) */}
                            <div className={styles.mobileContainer}>
                                {logsPaginados.map(log => (
                                    <div key={log.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.cardDate}>
                                                {formatearFechaServidor(log.fechaRegistro)}
                                            </span>
                                            <span className={`${styles.badge} ${log.badgeClass}`}>
                                                {log.accionEspanol}
                                            </span>
                                        </div>
                                        
                                        <div className={styles.cardBody}>
                                            <div className={styles.cardMeta}>
                                                <span className={styles.cardModule}>{log.tablaLimpia}</span>
                                                <span className={styles.cardDot}>•</span>
                                                <span className={styles.cardUser}>{log.usuarioDisplay}</span>
                                            </div>

                                            <div className={styles.cardDetails}>
                                                {log.detalleLimpio}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* LAYOUT DESKTOP (TABLA) */}
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
                                                    <strong style={{ color: '#e2e8f0' }}>{log.usuarioDisplay}</strong>
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

                            {/* CONTROLES DE PAGINACIÓN */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
                                <small style={{ color: '#94a3b8' }}>
                                    Página {paginaActual} de {totalPaginas} ({logsFiltrados.length} registros)
                                </small>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => cambiarPagina(paginaActual - 1)}
                                        disabled={paginaActual === 1}
                                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', opacity: paginaActual === 1 ? 0.5 : 1 }}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <button 
                                        onClick={() => cambiarPagina(paginaActual + 1)}
                                        disabled={paginaActual === totalPaginas}
                                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaActual === totalPaginas ? 0.5 : 1 }}
                                    >
                                        <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};