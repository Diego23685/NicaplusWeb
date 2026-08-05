import React, { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../assets/styles/Clientes/MiCuenta.module.css';

interface MiCuentaProps {
    alVolver: () => void;
    alCerrarSesion: () => void;
}

export const MiCuenta: React.FC<MiCuentaProps> = ({ alVolver, alCerrarSesion }) => {
    const [pestañaActiva, setPestañaActiva] = useState<'dashboard' | 'perfil' | 'compras' | 'suscripciones' | 'credito'>('dashboard');
    const [cargando, setCargando] = useState(false);
    const [datosConsolidados, setDatosConsolidados] = useState<any>(null);

    useEffect(() => {
        const cargarHistorialCliente = async () => {
            setCargando(true);
            try {
                // 1. Obtener datos del perfil actual desde el token de sesión
                const resPerfil = await api.get('/Auth/perfil-cliente');
                const clienteId = resPerfil.data?.id;

                if (clienteId) {
                    // 2. Consultar el historial unificado de compras, suscripciones y créditos
                    const resHistorial = await api.get(`/Clientes/${clienteId}/historial`);
                    setDatosConsolidados(resHistorial.data);
                }
            } catch (error) {
                console.error("Error al obtener la información del cliente:", error);
                setDatosConsolidados(null);
            } finally {
                setCargando(false);
            }
        };

        cargarHistorialCliente();
    }, []);

    const cliente = datosConsolidados?.cliente;
    const compras = datosConsolidados?.historialCompras || [];
    const deudas = datosConsolidados?.historialDeudas || [];
    const suscripcionesVigentes = datosConsolidados?.serviciosActivos?.suscripcionesVigentes || [];
    const suscripcionesExpiradas = datosConsolidados?.serviciosVencidos?.suscripcionesExpiradas || [];

    return (
        <div className={styles.contenedor}>
            <header className={styles.header}>
                <button onClick={alVolver} className={styles.btnVolver}>
                    ← Volver al Catálogo
                </button>
                <h1 className={styles.titulo}>Portal de Clientes</h1>
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
                        🛍️ Mis Compras ({compras.length})
                    </button>
                    <button 
                        className={pestañaActiva === 'suscripciones' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('suscripciones')}
                    >
                        💳 Suscripciones ({suscripcionesVigentes.length})
                    </button>
                    <button 
                        className={pestañaActiva === 'credito' ? styles.tabActivo : styles.tab} 
                        onClick={() => setPestañaActiva('credito')}
                    >
                        🛑 Crédito / Deudas ({deudas.filter((d: any) => d.saldoPendiente > 0).length})
                    </button>
                </aside>

                {/* Contenedor Principal */}
                <main className={styles.contenidoPrincipal}>
                    {cargando ? (
                        <div className={styles.cargando}>Cargando expediente del servidor...</div>
                    ) : (
                        <div className={styles.tarjeta}>
                            
                            {/* 1. RESUMEN GENERAL (DASHBOARD) */}
                            {pestañaActiva === 'dashboard' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Resumen de Cuenta</h2>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Cliente</span>
                                            <span className={styles.infoValue}>{cliente?.nombre || 'Usuario'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Total Invertido</span>
                                            <span className={styles.infoValue}>C$ {datosConsolidados?.totalGastado || 0}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Suscripciones Vigentes</span>
                                            <span className={styles.infoValue}>{suscripcionesVigentes.length} Activas</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Puntos Acumulados</span>
                                            <span className={styles.infoValue}>{cliente?.puntosAcumulados || 0} pts</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. MI PERFIL */}
                            {pestañaActiva === 'perfil' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Información Personal</h2>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Nombre Completo</span>
                                            <span className={styles.infoValue}>{cliente?.nombre || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Correo Electrónico</span>
                                            <span className={styles.infoValue}>{cliente?.email || 'N/A'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Teléfono</span>
                                            <span className={styles.infoValue}>{cliente?.telefono || 'No registrado'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Fecha de Registro</span>
                                            <span className={styles.infoValue}>
                                                {cliente?.fechaRegistro ? new Date(cliente.fechaRegistro).toLocaleDateString('es-NI') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. HISTORIAL DE COMPRAS CON DETALLE DE ARTÍCULOS */}
                            {pestañaActiva === 'compras' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Historial de Facturación</h2>
                                    {compras.length === 0 ? (
                                        <div className={styles.noDatos}>No registras compras registradas a tu nombre.</div>
                                    ) : (
                                        compras.map((venta: any) => (
                                            <div 
                                                key={venta.id} 
                                                style={{ 
                                                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                                                    padding: '16px', 
                                                    borderRadius: '12px', 
                                                    marginBottom: '16px', 
                                                    background: 'rgba(15, 23, 42, 0.6)' 
                                                }}
                                            >
                                                {/* Encabezado de la factura */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '1rem', color: '#ffffff' }}>Factura #000{venta.id}</strong>
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '10px' }}>
                                                            {new Date(venta.fecha).toLocaleDateString('es-NI')}
                                                        </span>
                                                    </div>
                                                    <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>C$ {venta.total}</strong>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Método de Pago: {venta.metodoPago}</div>
                                                
                                                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.06)', margin: '12px 0' }} />
                                                
                                                {/* Lista de Ítems Comprados */}
                                                <div style={{ fontSize: '0.85rem' }}>
                                                    <strong style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Items comprados:</strong>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {venta.detalles.map((d: any, idx: number) => (
                                                            <div 
                                                                key={idx} 
                                                                style={{ 
                                                                    background: 'rgba(255, 255, 255, 0.02)', 
                                                                    border: '1px solid rgba(255, 255, 255, 0.04)', 
                                                                    borderRadius: '8px', 
                                                                    padding: '12px', 
                                                                    display: 'flex', 
                                                                    flexDirection: 'column', 
                                                                    gap: '6px' 
                                                                }}
                                                            >
                                                                {/* Fila 1: Nombre del Producto */}
                                                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                                                    {d.nombreProducto || 'Producto / Servicio'}
                                                                </div>

                                                                {/* Fila 2: Cantidad y Subtotal */}
                                                                <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                                    Cantidad: <strong>{d.cantidad}</strong> &nbsp;|&nbsp; Subtotal: <strong style={{ color: '#38bdf8' }}>C$ {d.subTotal}</strong>
                                                                </div>
                                                                
                                                                {/* Fila 3: Credencial estructurada en líneas separadas */}
                                                                {d.metadataDigital && (
                                                                    <div 
                                                                        style={{ 
                                                                            marginTop: '4px', 
                                                                            background: 'rgba(2, 132, 199, 0.1)', 
                                                                            borderLeft: '3px solid #38bdf8', 
                                                                            padding: '8px 12px', 
                                                                            borderRadius: '4px', 
                                                                            fontFamily: 'monospace', 
                                                                            fontSize: '0.8rem', 
                                                                            color: '#e0f2fe', 
                                                                            display: 'flex', 
                                                                            flexDirection: 'column', 
                                                                            gap: '4px' 
                                                                        }}
                                                                    >
                                                                        <span style={{ fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px' }}>
                                                                            🔑 Credencial de Acceso:
                                                                        </span>
                                                                        
                                                                        {/* Divide la cadena por '|' para que PERFIL, PIN y Acceso aparezcan en su propia fila */}
                                                                        {d.metadataDigital.split('|').map((linea: string, indexLine: number) => (
                                                                            <div key={indexLine} style={{ paddingLeft: '6px' }}>
                                                                                • {linea.trim()}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* 4. SUSCRIPCIONES Y CREDENCIALES ASIGNADAS */}
                            {pestañaActiva === 'suscripciones' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Suscripciones y Licencias Digitales</h2>
                                    
                                    <h3 style={{ fontSize: '1rem', color: '#38bdf8', marginTop: '10px' }}>Activas / Vigentes</h3>
                                    {suscripcionesVigentes.length === 0 ? (
                                        <div className={styles.noDatos}>No posees suscripciones activas actualmente.</div>
                                    ) : (
                                        suscripcionesVigentes.map((sub: any) => (
                                            <div key={sub.id} style={{ border: '1px solid #0284c7', padding: '12px', borderRadius: '8px', marginBottom: '10px', background: '#0369a110' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <strong>{sub.nombreServicio} ({sub.tipoSuscripcion || 'Digital'})</strong>
                                                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                                                        Vence: {new Date(sub.fechaVencimiento).toLocaleDateString('es-NI')}
                                                    </span>
                                                </div>
                                                <div style={{ marginTop: '8px', background: '#0f172a', padding: '8px', borderRadius: '4px', borderLeft: '3px solid #38bdf8', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                    🔓 {sub.detallesCredenciales || 'Credenciales asignadas en caja.'}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {suscripcionesExpiradas.length > 0 && (
                                        <>
                                            <h3 style={{ fontSize: '1rem', color: '#f87171', marginTop: '20px' }}>Expiradas / Histórico</h3>
                                            {suscripcionesExpiradas.map((sub: any) => (
                                                <div key={sub.id} style={{ border: '1px solid #334155', padding: '10px', borderRadius: '8px', marginBottom: '8px', opacity: 0.7 }}>
                                                    <span>{sub.nombreServicio} - Venció el {new Date(sub.fechaVencimiento).toLocaleDateString('es-NI')}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 5. APARTADO DE CRÉDITO Y CUENTAS POR COBRAR */}
                            {pestañaActiva === 'credito' && (
                                <div>
                                    <h2 className={styles.subtitulo}>Estado de Crédito y Financiamientos</h2>
                                    {deudas.length === 0 ? (
                                        <div className={styles.noDatos}>No tienes saldos pendientes ni cuentas al crédito registradas.</div>
                                    ) : (
                                        <div className={styles.tableResponsive}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>N° Venta</th>
                                                        <th>Emisión</th>
                                                        <th>Vencimiento</th>
                                                        <th>Monto Total</th>
                                                        <th>Saldo Pendiente</th>
                                                        <th>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {deudas.map((d: any) => (
                                                        <tr key={d.id}>
                                                            <td style={{ fontWeight: 'bold' }}>#{d.idVenta}</td>
                                                            <td>{new Date(d.fechaEmision).toLocaleDateString('es-NI')}</td>
                                                            <td>{new Date(d.fechaVencimiento).toLocaleDateString('es-NI')}</td>
                                                            <td>C$ {d.montoTotal}</td>
                                                            <td style={{ color: d.saldoPendiente > 0 ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
                                                                C$ {d.saldoPendiente}
                                                            </td>
                                                            <td>
                                                                <span className={`${styles.badge} ${d.esVencida ? styles.badgePending : styles.badgeSuccess}`}>
                                                                    {d.esVencida ? '⚠️ VENCIDO' : d.estado}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
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