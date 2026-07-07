import { useEffect, useState } from 'react';
import api from '../services/api';

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
        let badgeStyles = { backgroundColor: '#17a2b8', color: '#fff' }; // info fallback
        let detalleLimpio = log.detalles;
        let tablaLimpia = log.tablaAfectada;

        try {
            const info = JSON.parse(log.detalles);
            const usuario = info.UsuarioNombre || `Usuario #${log.idUsuario}`;
            const destino = info.TargetNombre || 'un registro';

            switch (log.accion.toLowerCase()) {
                case 'added':
                    accionEspanol = 'Creación';
                    badgeStyles = { backgroundColor: '#10b981', color: '#fff' }; // Success moderno
                    detalleLimpio = `El usuario ${usuario} registró un nuevo ${log.tablaAfectada.toLowerCase()}: "${destino}".`;
                    break;
                case 'modified':
                    accionEspanol = 'Modificación';
                    badgeStyles = { backgroundColor: '#f59e0b', color: '#fff' }; // Warning moderno
                    detalleLimpio = `El usuario ${usuario} modificó los datos de "${destino}".`;
                    break;
                case 'deleted':
                    accionEspanol = 'Eliminación';
                    badgeStyles = { backgroundColor: '#ef4444', color: '#fff' }; // Danger moderno
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

        return { accionEspanol, badgeStyles, detalleLimpio, tablaLimpia };
    };

    const isMobile = windowWidth < 768;

    return (
        <div style={{ 
            padding: isMobile ? '12px' : '30px', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor: '#0f172a', // Fondo oscuro a juego con tu centro de notificaciones
            borderRadius: '16px',
            color: '#cbd5e1',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <h2 style={{ 
                fontSize: isMobile ? '1.4rem' : '1.8rem', 
                marginBottom: '20px', 
                color: '#f8fafc',
                fontWeight: '700' 
            }}>
                Historial de Actividad
            </h2>
            
            {isMobile ? (
                // ================= LAYOUT MOBILE (CARDS) =================
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {logs.map(log => {
                        const { accionEspanol, badgeStyles, detalleLimpio, tablaLimpia } = formatLog(log);
                        return (
                            <div key={log.id} style={{ 
                                background: '#1e293b', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                border: '1px solid #334155',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: '700', 
                                        borderRadius: '6px',
                                        ...badgeStyles 
                                    }}>
                                        {accionEspanol}
                                    </span>
                                </div>
                                
                                <div style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                                    <span style={{ color: '#38bdf8', fontWeight: '600' }}>{tablaLimpia}</span>
                                    <span style={{ margin: '0 6px', color: '#64748b' }}>•</span>
                                    <span style={{ fontWeight: '500' }}>ID Usuario: {log.idUsuario}</span>
                                </div>

                                <div style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#94a3b8', 
                                    lineHeight: '1.4',
                                    background: '#0f172a',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontStyle: 'italic'
                                }}>
                                    {detalleLimpio}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // ================= LAYOUT DESKTOP (TABLA OPTIMIZADA) =================
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #334155' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#1e293b' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #334155', color: '#f8fafc' }}>
                                <th style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600' }}>Fecha y Hora</th>
                                <th style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600' }}>Usuario</th>
                                <th style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600' }}>Operación</th>
                                <th style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600' }}>Módulo</th>
                                <th style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600' }}>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
                                const { accionEspanol, badgeStyles, detalleLimpio, tablaLimpia } = formatLog(log);
                                return (
                                    <tr key={log.id} style={{ 
                                        borderBottom: '1px solid #334155',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293bcf')}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                    >
                                        <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                            {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: '600', color: '#f8fafc' }}>
                                            ID: {log.idUsuario}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ 
                                                display: 'inline-block',
                                                padding: '4px 10px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: '700', 
                                                borderRadius: '6px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                ...badgeStyles 
                                            }}>
                                                {accionEspanol}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#38bdf8', fontWeight: '600' }}>
                                            {tablaLimpia}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', maxWidth: '400px', wordBreak: 'break-word' }}>
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