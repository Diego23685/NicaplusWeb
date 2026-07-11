import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
            } finally {
                setCargando(false);
            }
        };

        cargarDatosPestaña();
    }, [pestañaActiva]);

    return (
        <div style={estilos.contenedor}>
            <header style={estilos.header}>
                <button onClick={alVolver} style={estilos.btnVolver}>← Volver al Catálogo</button>
                <h1 style={estilos.titulo}>Mi Cuenta</h1>
                <button onClick={alCerrarSesion} style={estilos.btnSalir}>Cerrar Sesión</button>
            </header>

            <div style={estilos.layout}>
                {/* Menú Lateral */}
                <aside style={estilos.sidebar}>
                    <button 
                        style={pestañaActiva === 'dashboard' ? estilos.tabActivo : estilos.tab} 
                        onClick={() => setPestañaActiva('dashboard')}
                    >
                        📊 Resumen General
                    </button>
                    <button 
                        style={pestañaActiva === 'perfil' ? estilos.tabActivo : estilos.tab} 
                        onClick={() => setPestañaActiva('perfil')}
                    >
                        👤 Información de Perfil
                    </button>
                    <button 
                        style={pestañaActiva === 'compras' ? estilos.tabActivo : estilos.tab} 
                        onClick={() => setPestañaActiva('compras')}
                    >
                        🛍️ Historial de Compras
                    </button>
                    <button 
                        style={pestañaActiva === 'suscripciones' ? estilos.tabActivo : estilos.tab} 
                        onClick={() => setPestañaActiva('suscripciones')}
                    >
                        💳 Mis Suscripciones
                    </button>
                </aside>

                {/* Contenedor Dinámico */}
                <main style={estilos.contenidoPrincipal}>
                    {cargando ? (
                        <div style={estilos.cargando}>Cargando información del servidor...</div>
                    ) : (
                        <div style={estilos.tarjeta}>
                            {pestañaActiva === 'dashboard' && (
                                <div>
                                    <h2 style={estilos.subtitulo}>Panel de Control (Dashboard)</h2>
                                    <pre style={estilos.json}>{JSON.stringify(datos, null, 2)}</pre>
                                </div>
                            )}

                            {pestañaActiva === 'perfil' && (
                                <div>
                                    <h2 style={estilos.subtitulo}>Mis Datos Personales</h2>
                                    {datos && (
                                        <div style={estilos.infoGrid}>
                                            <p><strong>Nombre completo:</strong> {datos.nombre || datos.Nombre}</p>
                                            <p><strong>Correo electrónico:</strong> {datos.email || datos.Email}</p>
                                            <p><strong>Teléfono:</strong> {datos.telefono || datos.Telefono || 'No registrado'}</p>
                                            <p><strong>Usuario:</strong> {datos.username || datos.Username}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {pestañaActiva === 'compras' && (
                                <div>
                                    <h2 style={estilos.subtitulo}>Mis Órdenes y Compras</h2>
                                    <pre style={estilos.json}>{JSON.stringify(datos, null, 2)}</pre>
                                </div>
                            )}

                            {pestañaActiva === 'suscripciones' && (
                                <div>
                                    <h2 style={estilos.subtitulo}>Suscripciones Activas</h2>
                                    <pre style={estilos.json}>{JSON.stringify(datos, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const estilos: { [key: string]: React.CSSProperties } = {
    contenedor: { minHeight: '100vh', background: '#0f172a', fontFamily: 'Roboto, sans-serif', color: '#fff', padding: '20px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px', marginBottom: '25px' },
    titulo: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
    btnVolver: { background: 'transparent', border: '1px solid #047688', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    btnSalir: { background: '#f87171', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    layout: { display: 'flex', gap: '30px', maxWidth: '1200px', margin: '0 auto' },
    sidebar: { width: '250px', display: 'flex', flexDirection: 'column', gap: '10px' },
    tab: { width: '100%', padding: '14px', textAlignLast: 'left', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s' },
    tabActivo: { width: '100%', padding: '14px', background: '#b002c2', border: '1px solid #b002c2', color: '#fff', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', boxShadow: '0 0 10px rgba(176,2,194,0.4)' },
    contenidoPrincipal: { flex: 1 },
    tarjeta: { background: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' },
    subtitulo: { margin: '0 0 20px 0', fontSize: '20px', color: '#fff', borderBottom: '1px solid #334155', paddingBottom: '10px' },
    infoGrid: { display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '16px', color: '#cbd5e1' },
    cargando: { textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '18px' },
    json: { background: '#0f172a', padding: '15px', borderRadius: '6px', overflowX: 'auto', color: '#38bdf8', fontSize: '14px', border: '1px solid #334155' }
};