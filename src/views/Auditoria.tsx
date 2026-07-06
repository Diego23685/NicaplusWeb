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

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/auditoria'); 
                setLogs(res.data);
            } catch (err) {
                console.error("Error al cargar auditoría", err);
            }
        };
        fetchLogs();
    }, []);

    // Función para traducir y embellecer los datos técnicos del backend
    const formatLog = (log: Log) => {
        let accionEspanol = log.accion;
        let badgeClass = 'badge-info';
        let detalleLimpio = log.detalles;
        let tablaLimpia = log.tablaAfectada;

        // Intentamos parsear el JSON detallado del Backend
        try {
            const info = JSON.parse(log.detalles);
            const usuario = info.UsuarioNombre || `Usuario #${log.idUsuario}`;
            const destino = info.TargetNombre || 'un registro';

            switch (log.accion.toLowerCase()) {
                case 'added':
                    accionEspanol = 'Creación';
                    badgeClass = 'badge-success';
                    detalleLimpio = `El usuario ${usuario} registró un nuevo ${log.tablaAfectada.toLowerCase()}: "${destino}".`;
                    break;
                case 'modified':
                    accionEspanol = 'Modificación';
                    badgeClass = 'badge-warning';
                    detalleLimpio = `El usuario ${usuario} modificó los datos de "${destino}".`;
                    break;
                case 'deleted':
                    accionEspanol = 'Eliminación';
                    badgeClass = 'badge-danger';
                    detalleLimpio = `El usuario ${usuario} eliminó permanentemente a "${destino}".`;
                    break;
                default:
                    accionEspanol = log.accion;
                    detalleLimpio = log.detalles;
            }
        } catch (e) {
            // En caso de que existan logs viejos que no eran JSON, usamos un fallback amigable
            detalleLimpio = `Acción de ${log.accion.toLowerCase()} en el módulo ${log.tablaAfectada}.`;
        }

        // Mapeo estético de nombres de módulos
        if (log.tablaAfectada.toLowerCase() === 'cliente') {
            tablaLimpia = 'Clientes';
        }

        return { accionEspanol, badgeClass, detalleLimpio, tablaLimpia };
    };

    return (
        <div className="auditoria-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Historial de Actividad</h2>
            
            <table className="table-auditoria" style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Fecha y Hora</th>
                        <th style={{ padding: '12px' }}>Usuario</th>
                        <th style={{ padding: '12px' }}>Operación</th>
                        <th style={{ padding: '12px' }}>Módulo / Tabla</th>
                        <th style={{ padding: '12px' }}>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => {
                        const { accionEspanol, badgeClass, detalleLimpio, tablaLimpia } = formatLog(log);
                        return (
                            <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '12px', color: '#555' }}>
                                    {new Date(log.fechaRegistro).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#495057' }}>ID: {log.idUsuario}</span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span className={`badge ${badgeClass}`}>
                                        {accionEspanol}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', color: '#495057', fontWeight: 500 }}>
                                    {tablaLimpia}
                                </td>
                                <td style={{ padding: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                                    {detalleLimpio}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Estilos rápidos para los Badges (Pastillas de color) */}
            <style>{`
                .badge {
                    display: inline-block;
                    padding: 0.25em 0.6em;
                    font-size: 75%;
                    font-weight: 700;
                    line-height: 1;
                    text-align: center;
                    white-space: nowrap;
                    vertical-align: baseline;
                    border-radius: 0.25rem;
                    color: #fff;
                }
                .badge-success { backgroundColor: #28a745; }
                .badge-warning { backgroundColor: #ffc107; color: #212529; }
                .badge-danger { backgroundColor: #dc3545; }
                .badge-info { backgroundColor: #17a2b8; }
                .table-auditoria tr:hover { backgroundColor: #f1f3f5; }
            `}</style>
        </div>
    );
};