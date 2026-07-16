// src/components/Auditoria.tsx
import { useEffect, useState } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Auditoria.module.css'; // Importación de los nuevos estilos

interface Log {
    id: number;
    idUsuario: number;
    accion: string;
    tablaAfectada: string;
    detalles: string;
    fechaRegistro: string;
}

export const Auditoria = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

    // Escuchar el tamaño de pantalla para cambiar el layout dinámicamente (Mobile vs Desktop)
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        
        const fetchLogs = async () => {
            try {
                const res = await api.get('/auditoria'); 
                setLogs(res.data);
            } catch (err) {
                console.error("Error al cargar auditoría", err);
            }
        };
        
        fetchLogs();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

        return { accionEspanol, badgeClass, detalleLimpio, tablaLimpia };
    };

    const isMobile = windowWidth < 768;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                Historial de Actividad
            </h2>
            
            {logs.length === 0 ? (
                <div className={styles.emptyState}>
                    No hay registros de auditoría disponibles.
                </div>
            ) : isMobile ? (
                // ================= LAYOUT MOBILE (CARDS) =================
                <div className={styles.mobileContainer}>
                    {logs.map(log => {
                        const { accionEspanol, badgeClass, detalleLimpio, tablaLimpia } = formatLog(log);
                        return (
                            <div key={log.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardDate}>
                                        {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                    <span className={`${styles.badge} ${badgeClass}`}>
                                        {accionEspanol}
                                    </span>
                                </div>
                                
                                <div className={styles.cardBody}>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardModule}>{tablaLimpia}</span>
                                        <span className={styles.cardDot}>•</span>
                                        <span className={styles.cardUser}>ID Usuario: {log.idUsuario}</span>
                                    </div>

                                    <div className={styles.cardDetails}>
                                        {detalleLimpio}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // ================= LAYOUT DESKTOP (TABLA OPTIMIZADA) =================
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
                            {logs.map(log => {
                                const { accionEspanol, badgeClass, detalleLimpio, tablaLimpia } = formatLog(log);
                                return (
                                    <tr key={log.id} className={styles.tr}>
                                        <td className={`${styles.td} ${styles.tdDate}`}>
                                            {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdUser}`}>
                                            ID: {log.idUsuario}
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.badge} ${badgeClass}`}>
                                                {accionEspanol}
                                            </span>
                                        </td>
                                        <td className={`${styles.td} ${styles.tdModule}`}>
                                            {tablaLimpia}
                                        </td>
                                        <td className={`${styles.td} ${styles.tdDetails}`}>
                                            {detalleLimpio}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};