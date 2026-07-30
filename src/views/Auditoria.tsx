import { useEffect, useState } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Auditoria.module.css';

interface Log {
    id: number;
    idUsuario: number;
    accion: string;
    tablaAfectada: string;
    detalles: string;
    fechaRegistro: string;
}

// Extendemos la interfaz para guardar el log ya formateado
interface FormattedLog extends Log {
    accionEspanol: string;
    badgeClass: string;
    detalleLimpio: string;
    tablaLimpia: string;
}

export const Auditoria = () => {
    const [logs, setLogs] = useState<FormattedLog[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);

    const formatLog = (log: Log) => {
        let accionEspanol = log.accion;
        let badgeClass = styles.badgeDefault; 
        let detalleLimpio = log.detalles;
        let tablaLimpia = log.tablaAfectada;

        try {
            const info = JSON.parse(log.detalles);
            const usuario = info.UsuarioNombre || `Usuario #${log.idUsuario}`;
            const destino = info.TargetNombre || 'un registro';

            switch (log.accion.toLowerCase()) {
                case 'added':
                    accionEspanol = 'Creación';
                    badgeClass = styles.badgeAdded;
                    detalleLimpio = `El usuario ${usuario} registró un nuevo ${log.tablaAfectada.toLowerCase()}: "${destino}".`;
                    break;
                case 'modified':
                    accionEspanol = 'Modificación';
                    badgeClass = styles.badgeModified;
                    detalleLimpio = `El usuario ${usuario} modificó los datos de "${destino}".`;
                    break;
                case 'deleted':
                    accionEspanol = 'Eliminación';
                    badgeClass = styles.badgeDeleted;
                    detalleLimpio = `El usuario ${usuario} eliminó permanentemente a "${destino}".`;
                    break;
                default:
                    accionEspanol = log.accion;
                    detalleLimpio = log.detalles;
            }
        } catch (e) {
            detalleLimpio = `Acción de ${log.accion.toLowerCase()} en el módulo ${log.tablaAfectada}.`;
        }

        if (log.tablaAfectada.toLowerCase() === 'cliente') {
            tablaLimpia = 'Clientes';
        }

        return { ...log, accionEspanol, badgeClass, detalleLimpio, tablaLimpia };
    };

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get<Log[]>('/auditoria'); 
                // Formateamos los logs una única vez al guardarlos en el estado
                const logsFormateados = res.data.map(log => formatLog(log));
                setLogs(logsFormateados);
            } catch (err) {
                console.error("Error al cargar auditoría:", err);
            } finally {
                setCargando(false);
            }
        };
        
        fetchLogs();
    }, []); // Array de dependencias vacío para ejecutarse SOLO una vez al montar el componente

    if (cargando) {
        return <div style={{ color: '#38bdf8', padding: '40px', fontWeight: 500 }}>Cargando registros de auditoría...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                Historial de Actividad
            </h2>
            
            {logs.length === 0 ? (
                <div className={styles.emptyState}>
                    No hay registros de auditoría disponibles.
                </div>
            ) : (
                <>
                    {/* ================= LAYOUT MOBILE (CARDS) ================= */}
                    <div className={styles.mobileContainer}>
                        {logs.map(log => (
                            <div key={log.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardDate}>
                                        {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                    <span className={`${styles.badge} ${log.badgeClass}`}>
                                        {log.accionEspanol}
                                    </span>
                                </div>
                                
                                <div className={styles.cardBody}>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardModule}>{log.tablaLimpia || log.tablaAfectada}</span>
                                        <span className={styles.cardDot}>•</span>
                                        <span className={styles.cardUser}>ID Usuario: {log.idUsuario}</span>
                                    </div>

                                    <div className={styles.cardDetails}>
                                        {log.detalleLimpio}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ================= LAYOUT DESKTOP (TABLA) ================= */}
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th className={styles.th}>Fecha y Hora</th>
                                    <th className={styles.th}>Usuario</th>
                                    <th className={styles.th}>Operación</th>
                                    <th className={styles.th}>Módulo</th>
                                    <th className={styles.th}>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className={styles.tr}>
                                        <td className={`${styles.td} ${styles.tdDate}`}>
                                            {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdUser}`}>
                                            ID: {log.idUsuario}
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.badge} ${log.badgeClass}`}>
                                                {log.accionEspanol}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdModule}`}>
                                            {log.tablaLimpia || log.tablaAfectada}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdDetails}`}>
                                            {log.detalleLimpio}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};