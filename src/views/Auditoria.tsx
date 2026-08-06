import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../services/api';
import { 
    FaSearch, FaFilter, FaHistory, FaSync, 
    FaChevronLeft, FaChevronRight, FaPlusCircle, 
    FaEdit, FaTrashAlt, FaInfoCircle 
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
    colorTipo: string;
    iconTipo: React.ReactNode;
    detalleLimpio: string;
    tablaLimpia: string;
    usuarioDisplay: string;
}

const PAGE_SIZE = 12;

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

    // Filtros y Paginación
    const [busqueda, setBusqueda] = useState<string>('');
    const [filtroTabla, setFiltroTabla] = useState<string>('todas');
    const [paginaActual, setPaginaActual] = useState<number>(1);

    const formatLog = useCallback((log: Log): FormattedLog => {
        let accionEspanol = log.accion;
        let colorTipo = '#38bdf8';
        let iconTipo = <FaInfoCircle />;
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
                        colorTipo = '#10b981';
                        iconTipo = <FaPlusCircle />;
                        detalleLimpio = `El usuario ${usuarioNombre} registró en ${tablaLimpia}: "${destino}".`;
                        break;

                    case 'modified':
                    case 'update':
                    case 'modificacion':
                        accionEspanol = 'Modificación';
                        colorTipo = '#f59e0b';
                        iconTipo = <FaEdit />;
                        detalleLimpio = `El usuario ${usuarioNombre} actualizó la información de "${destino}".`;
                        break;

                    case 'deleted':
                    case 'delete':
                    case 'eliminacion':
                        accionEspanol = 'Eliminación';
                        colorTipo = '#ef4444';
                        iconTipo = <FaTrashAlt />;
                        detalleLimpio = `El usuario ${usuarioNombre} eliminó el registro "${destino}".`;
                        break;

                    default:
                        accionEspanol = log.accion;
                        detalleLimpio = log.detalles;
                }
            } else {
                switch (log.accion.toLowerCase()) {
                    case 'added': 
                        accionEspanol = 'Creación'; 
                        colorTipo = '#10b981'; 
                        iconTipo = <FaPlusCircle />;
                        break;
                    case 'modified': 
                        accionEspanol = 'Modificación'; 
                        colorTipo = '#f59e0b'; 
                        iconTipo = <FaEdit />;
                        break;
                    case 'deleted': 
                        accionEspanol = 'Eliminación'; 
                        colorTipo = '#ef4444'; 
                        iconTipo = <FaTrashAlt />;
                        break;
                }
            }
        } catch {
            detalleLimpio = log.detalles || `Acción de ${log.accion} en ${tablaLimpia}.`;
        }

        return {
            ...log,
            accionEspanol,
            colorTipo,
            iconTipo,
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
            setError("No se pudo obtener el historial de auditoría.");
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
        }
    };

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box', paddingBottom: '24px' }}>
            
            {/* 1. ENCABEZADO Y CONTROLES */}
            <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <FaHistory /> Auditoría y Movimientos
                </h3>
                <button 
                    onClick={fetchLogs} 
                    disabled={cargando}
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                    <FaSync className={cargando ? 'spin' : ''} /> Refrescar
                </button>
            </div>

            {/* 2. FILTROS Y BÚSQUEDA TÁCTIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                {/* Input Búsqueda */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', padding: '0 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <FaSearch style={{ color: '#64748b', marginRight: '8px', fontSize: '0.85rem' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar movimiento, usuario o detalle..." 
                        value={busqueda}
                        onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                        style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', padding: '10px 0', outline: 'none', fontSize: '0.85rem' }}
                    />
                </div>

                {/* Filtro por Módulo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <FaFilter style={{ color: '#38bdf8', fontSize: '0.8rem' }} />
                    <select 
                        value={filtroTabla} 
                        onChange={(e) => { setFiltroTabla(e.target.value); setPaginaActual(1); }}
                        style={{ width: '100%', background: 'transparent', color: '#fff', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
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
                <div style={{ color: '#38bdf8', padding: '24px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', fontSize: '0.85rem' }}>
                    <FaSync className="spin" style={{ fontSize: '1.2rem', marginBottom: '8px' }} />
                    <div>Cargando trazabilidad del sistema...</div>
                </div>
            )}

            {error && (
                <div style={{ color: '#f43f5e', padding: '12px', background: '#1e293b', borderRadius: '12px', border: '1px solid #f43f5e', fontSize: '0.85rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {/* 3. FEED / TIMELINE VERTICAL DE AUDITORÍA */}
            {!cargando && !error && (
                <>
                    {logsPaginados.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', background: '#1e293b', borderRadius: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>
                            Sin registros coincidentes.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {logsPaginados.map(log => (
                                <div 
                                    key={log.id} 
                                    style={{ 
                                        background: '#1e293b', 
                                        padding: '12px', 
                                        borderRadius: '10px', 
                                        borderLeft: `4px solid ${log.colorTipo}`, 
                                        borderTop: '1px solid #334155',
                                        borderRight: '1px solid #334155',
                                        borderBottom: '1px solid #334155',
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '6px' 
                                    }}
                                >
                                    {/* Encabezado del log */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: log.colorTipo, fontSize: '0.75rem', fontWeight: 700 }}>
                                            {log.iconTipo} {log.accionEspanol.toUpperCase()} — {log.tablaLimpia}
                                        </div>
                                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                            {formatearFechaServidor(log.fechaRegistro)}
                                        </span>
                                    </div>

                                    {/* Detalle principal */}
                                    <div style={{ color: '#f8fafc', fontSize: '0.82rem', lineHeight: '1.3' }}>
                                        {log.detalleLimpio}
                                    </div>

                                    {/* Footer / Usuario */}
                                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', gap: '4px', marginTop: '2px' }}>
                                        <span>Ejecutado por:</span>
                                        <strong style={{ color: '#38bdf8' }}>{log.usuarioDisplay}</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 4. PAGINADOR COMPACTO MÓVIL */}
                    {logsFiltrados.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', marginTop: '4px' }}>
                            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                Pág. {paginaActual} de {totalPaginas} ({logsFiltrados.length} reg.)
                            </small>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={() => cambiarPagina(paginaActual - 1)}
                                    disabled={paginaActual === 1}
                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', opacity: paginaActual === 1 ? 0.4 : 1, fontSize: '0.8rem' }}
                                >
                                    <FaChevronLeft />
                                </button>
                                <button 
                                    onClick={() => cambiarPagina(paginaActual + 1)}
                                    disabled={paginaActual === totalPaginas}
                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaActual === totalPaginas ? 0.4 : 1, fontSize: '0.8rem' }}
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};