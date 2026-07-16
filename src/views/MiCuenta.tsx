import React, { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Clientes/MiCuenta.module.css';

interface MiCuentaProps {
    alVolver: () => void;
    alCerrarSesion: () => void;
}

export const MiCuenta: React.FC<MiCuentaProps> = ({ alVolver, alCerrarSesion }) => {
    const [pestañaActiva, setPestañaActiva] = useState<'dashboard' | 'perfil' | 'compras' | 'suscripciones'>('dashboard');
    const [cargando, setCargando] = useState(false);
    const [datos, setDatos] = useState<any>(null);

    // Cargar la información según la pestaña seleccionada
    useEffect(() => {
        const cargarDatosPestaña = async () => {
            setCargando(true);
            try {
                let url = '/micuenta/dashboard';
                if (pestañaActiva === 'perfil') url = '/micuenta/perfil';
                if (pestañaActiva === 'compras') url = '/micuenta/mis-compras';
                if (pestañaActiva === 'suscripciones') url = '/micuenta/mis-suscripciones';

                const respuesta = await api.get(url);
                setDatos(respuesta.data);
            } catch (error) {
                console.error(`Error cargando datos de ${pestañaActiva}:`, error);
                setDatos(null);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosPestaña();
    }, [pestañaActiva]);

    return (
        <div className={styles.contenedor}>
            <header className={styles.header}>
                <button onClick={alVolver} className={styles.btnVolver}>
                    ← Volver al Catálogo
                </button>
                <h1 className={styles.titulo}>Mi Cuenta</h1>
                <button onClick={alCerrarSesion} className={styles.btnSalir}>
                    Cerrar Sesión
                </button>
            </header>

            <div className={styles.layout}>
                {/* Menú Lateral */}
                <aside className={styles.sidebar}>
                    <button 
                        className={pestañaActiva === 'dashboard' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('dashboard')}
                    >
                        📊 Resumen General
                    </button>
                    <button 
                        className={pestañaActiva === 'perfil' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('perfil')}
                    >
                        👤 Mi Perfil
                    </button>
                    <button 
                        className={pestañaActiva === 'compras' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('compras')}
                    >
                        🛍️ Historial de Compras
                    </button>
                    <button 
                        className={pestañaActiva === 'suscripciones' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('suscripciones')}
                    >
                        💳 Mis Suscripciones
                    </button>
                </aside>

                {/* Contenedor Dinámico */}
                <main className={styles.contenidoPrincipal}>
                    {cargando ? (
                        <div className={styles.cargando}>Cargando información del servidor...</div>
                    ) : (
                        <div className={styles.tarjeta}>
                            {/* 1. DASHBOARD */}
                            {pestañaActiva === 'dashboard' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Panel de Control</h2>
                                    {datos ? (
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Bienvenido de vuelta</span>
                                                <span className={styles.infoValue}>{datos.nombreUsuario || 'Usuario'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Última Compra</span>
                                                <span className={styles.infoValue}>{datos.ultimaCompra || 'Sin compras recientes'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Suscripciones Activas</span>
                                                <span className={styles.infoValue}>{datos.totalSuscripciones || 0}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Puntos / Miembro</span>
                                                <span className={styles.infoValue}>{datos.rangoMiembro || 'Bronce'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.noDatos}>Cargando el resumen de tu cuenta...</div>
                                    )}
                                </div>
                            )}

                            {/* 2. PERFIL DE USUARIO */}
                            {pestañaActiva === 'perfil' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Mis Datos Personales</h2>
                                    {datos ? (
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Nombre completo</span>
                                                <span className={styles.infoValue}>{datos.nombre || datos.Nombre || 'N/A'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Correo electrónico</span>
                                                <span className={styles.infoValue}>{datos.email || datos.Email || 'N/A'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Teléfono</span>
                                                <span className={styles.infoValue}>{datos.telefono || datos.Telefono || 'No registrado'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Nombre de usuario</span>
                                                <span className={styles.infoValue}>@{datos.username || datos.Username || 'N/A'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.noDatos}>No hay información de perfil disponible.</div>
                                    )}
                                </div>
                            )}

                            {/* 3. HISTORIAL DE COMPRAS */}
                            {pestañaActiva === 'compras' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Mis Órdenes y Compras</h2>
                                    {datos && Array.isArray(datos) && datos.length > 0 ? (
                                        <div className={styles.tableResponsive}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>ID Órden</th>
                                                        <th>Fecha</th>
                                                        <th>Total</th>
                                                        <th>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datos.map((compra: any, idx: number) => (
                                                        <tr key={compra.id || idx}>
                                                            <td style={{ fontWeight: 700 }}>#{compra.id || compra.codigo || idx + 100}</td>
                                                            <td>{compra.fecha || 'Reciente'}</td>
                                                            <td style={{ color: '#b002c2', fontWeight: 800 }}>${compra.total || 0}</td>
                                                            <td>
                                                                <span className={`${styles.badge} ${compra.estado === 'completado' || compra.estado === 'Pagado' ? styles.badgeSuccess : styles.badgePending}`}>
                                                                    {compra.estado || 'Completado'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className={styles.noDatos}>Aún no has realizado ninguna compra en nuestra tienda.</div>
                                    )}
                                </div>
                            )}

                            {/* 4. SUSCRIPCIONES */}
                            {pestañaActiva === 'suscripciones' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Suscripciones Activas</h2>
                                    {datos && Array.isArray(datos) && datos.length > 0 ? (
                                        <div className={styles.tableResponsive}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Plan</th>
                                                        <th>Próximo Pago</th>
                                                        <th>Monto</th>
                                                        <th>Estatus</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datos.map((sub: any, idx: number) => (
                                                        <tr key={sub.id || idx}>
                                                            <td style={{ fontWeight: 700 }}>{sub.plan || 'Suscripción Básica'}</td>
                                                            <td>{sub.proximoPago || 'N/A'}</td>
                                                            <td style={{ color: '#38bdf8', fontWeight: 800 }}>${sub.monto || 0}/mes</td>
                                                            <td>
                                                                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                                    {sub.estatus || 'Activa'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className={styles.noDatos}>No tienes ninguna suscripción activa actualmente.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};