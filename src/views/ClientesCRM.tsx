import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaSearch, FaWhatsapp, FaUserTag, FaHistory, FaCalendarAlt, FaFolderOpen } from 'react-icons/fa';

export const ClientesCRM: React.FC = () => {
    const [clientes, setClientes] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
    const [historialData, setHistorialData] = useState<any>(null);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    useEffect(() => {
        cargarClientes();
    }, []);

    const cargarClientes = async () => {
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
        } catch (err) {
            console.error("Error cargando base de clientes", err);
        }
    };

    const seleccionarCliente = async (cliente: any) => {
        setClienteSeleccionado(cliente);
        setCargandoHistorial(true);
        try {
            const res = await api.get(`/clientes/${cliente.id}/historial`);
            setHistorialData(res.data);
        } catch (err) {
            console.error("Error al obtener la historia del cliente", err);
            setHistorialData(null);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono.includes(busqueda)
    );

    return (
        <div className="crm-container">
            {/* INYECCIÓN DE MEDIA QUERIES PARA RESPONSIVE DIRECTO */}
            <style>{`
                .crm-container {
                    display: flex;
                    gap: 20px;
                    width: 100%;
                    min-height: 100%;
                    font-family: sans-serif;
                    color: #fff;
                    box-sizing: border-box;
                }
                .crm-sidebar {
                    width: 320px;
                    min-width: 320px;
                    background: #1e293b;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #334155;
                    height: calc(100vh - 130px);
                    box-sizing: border-box;
                }
                .crm-main-content {
                    flex: 1;
                    background: #1e293b;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid #334155;
                    height: calc(100vh - 130px);
                    overflow-y: auto;
                    box-sizing: border-box;
                }
                .crm-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .crm-history-grid {
                    display: flex;
                    gap: 20px;
                }
                .crm-history-column {
                    flex: 1;
                    min-width: 0;
                }
                .crm-header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1px solid #334155;
                    padding-bottom: 16px;
                    margin-bottom: 20px;
                    gap: 16px;
                }

                /* TABLETS (PANTALLAS MEDIANAS) */
                @media (max-width: 1024px) {
                    .crm-container {
                        flex-direction: column;
                    }
                    .crm-sidebar {
                        width: 100%;
                        min-width: 100%;
                        height: 280px; /* Reducido para no ahogar la pantalla en tablet */
                    }
                    .crm-main-content {
                        width: 100%;
                        height: auto;
                        overflow-y: visible;
                    }
                }

                /* CELULARES (PANTALLAS CHICAS) */
                @media (max-width: 640px) {
                    .crm-header-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .crm-kpi-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                    .crm-history-grid {
                        flex-direction: column;
                        gap: 24px;
                    }
                    .crm-main-content {
                        padding: 16px;
                    }
                }
            `}</style>
            
            {/* PANEL IZQUIERDO: BUSCADOR Y LISTA */}
            <div className="crm-sidebar">
                <h3 style={{ margin: '0 0 12px 0', color: '#38bdf8', fontSize: '1.2rem' }}>Directorio CRM</h3>
                
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o teléfono..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 36px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' }}
                    />
                    <FaSearch style={{ position: 'absolute', top: '12px', left: '12px', color: '#64748b' }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {clientesFiltrados.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => seleccionarCliente(c)}
                            style={{ 
                                padding: '12px', 
                                background: clienteSeleccionado?.id === c.id ? '#581c7e' : '#0f172a', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                border: '1px solid #334155',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.nombre}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                <span>{c.telefono}</span>
                                {c.etiquetas && (
                                    <span style={{ background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                        {c.etiquetas.split(',')[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PANEL DERECHO: EXPEDIENTE COMPLETO */}
            <div className="crm-main-content">
                {!clienteSeleccionado ? (
                    <div style={{ height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', textAlign: 'center' }}>
                        <FaFolderOpen size={48} style={{ marginBottom: '12px' }} />
                        <p style={{ margin: 0 }}>Seleccione un cliente del panel izquierdo para auditar su historia completa.</p>
                    </div>
                ) : cargandoHistorial ? (
                    <div style={{ color: '#38bdf8', textAlign: 'center', marginTop: '40px', fontWeight: 'bold' }}>
                        Consultando expediente de transacciones...
                    </div>
                ) : (
                    <div>
                        {/* ENCABEZADO EXPEDIENTE CLIENTE */}
                        <div className="crm-header-actions">
                            <div>
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>{historialData?.cliente.nombre}</h2>
                                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                                    Registrado el: {new Date(historialData?.cliente.fechaRegistro).toLocaleDateString()}
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                    {historialData?.cliente.etiquetas ? (
                                        historialData.cliente.etiquetas.split(',').map((tag: string, i: number) => (
                                            <span key={i} style={{ background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <FaUserTag /> {tag.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Sin etiquetas asignadas</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <a 
                                    href={`https://wa.me/${historialData?.cliente.telefono.replace(/[^0-9]/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: '#fff', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                                >
                                    <FaWhatsapp size={18} /> WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* KPIS FINANCIEROS DEL CLIENTE */}
                        <div className="crm-kpi-grid">
                            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>TOTAL INVERTIDO</small>
                                <h3 style={{ margin: '6px 0 0 0', color: '#10b981', fontSize: '1.25rem' }}>C$ {historialData?.totalGastado.toLocaleString('es-NI')}</h3>
                            </div>
                            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>SERVICIOS ACTIVOS</small>
                                <h3 style={{ margin: '6px 0 0 0', color: '#38bdf8', fontSize: '1.25rem' }}>
                                    {(historialData?.serviciosActivos?.tallerEquiposEnRevision?.length ?? 0) + (historialData?.serviciosActivos?.suscripcionesVigentes?.length ?? 0)}
                                </h3>
                            </div>
                            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem' }}>SERVICIOS VENCIDOS</small>
                                <h3 style={{ margin: '6px 0 0 0', color: '#ef4444', fontSize: '1.25rem' }}>
                                    {(historialData?.serviciosVencidos?.tallerEquiposEntregados?.length ?? 0) + (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length ?? 0)}
                                </h3>
                            </div>
                        </div>

                        {/* SECCIÓN OBSERVACIONES */}
                        <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #334155' }}>
                            <h4 style={{ margin: '0 0 6px 0', color: '#f59e0b', fontSize: '0.9rem' }}>Observaciones del CRM</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                                {historialData?.cliente.observaciones || "No se han ingresado notas u observaciones de comportamiento de este cliente."}
                            </p>
                        </div>

                        {/* CONTENEDOR DE DOS COLUMNAS DE HISTORIAL */}
                        <div className="crm-history-grid">
                            
                            {/* COLUMNA: HISTORIAL DE COMPRAS */}
                            <div className="crm-history-column">
                                <h4 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', color: '#38bdf8', marginTop: 0 }}><FaHistory /> Historial de Compras</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                    {historialData?.historialCompras.map((compra: any) => (
                                        <div key={compra.id} style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <strong style={{ display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Factura #{compra.id}</strong>
                                                <small style={{ color: '#64748b' }}>{new Date(compra.fecha).toLocaleDateString()}</small>
                                            </div>
                                            <span style={{ fontWeight: 'bold', color: '#10b981', whiteSpace: 'nowrap' }}>C$ {compra.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {historialData?.historialCompras.length === 0 && <small style={{ color: '#64748b' }}>El cliente no registra compras.</small>}
                                </div>
                            </div>

                            {/* COLUMNA: ESTADO DE SERVICIOS */}
                            <div className="crm-history-column">
                                <h4 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', color: '#a855f7', marginTop: 0 }}><FaCalendarAlt /> Estado de Servicios</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                                    
                                    {/* ACTIVOS */}
                                    {((historialData?.serviciosActivos?.tallerEquiposEnRevision?.length > 0) || 
                                      (historialData?.serviciosActivos?.suscripcionesVigentes?.length > 0)) && (
                                        <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px' }}>ACTIVOS / EN CURSO</small>
                                    )}

                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.map((srv: any) => (
                                        <div key={`taller-act-${srv.id}`} style={{ background: '#142820', borderLeft: '3px solid #10b981', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ color: '#a7f3d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.dispositivo}</strong>
                                                <span style={{ background: '#06b6d4', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{srv.estado}</span>
                                            </div>
                                            <div style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '4px' }}>{srv.diagnostico}</div>
                                            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Ingresó: {new Date(srv.fechaIngreso).toLocaleDateString()}</small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosActivos?.suscripcionesVigentes?.map((srv: any) => (
                                        <div key={`susc-act-${srv.id}`} style={{ background: '#1e293b', borderLeft: '3px solid #38bdf8', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #334155', borderLeftWidth: '3px' }}>
                                            <strong style={{ color: '#fff', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.nombreServicio}</strong>
                                            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>{srv.detallesCredenciales}</div>
                                            <small style={{ color: '#38bdf8', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>Vence: {new Date(srv.fechaVencimiento).toLocaleDateString()}</small>
                                        </div>
                                    ))}

                                    {/* HISTORIAL / VENCIDOS */}
                                    {((historialData?.serviciosVencidos?.tallerEquiposEntregados?.length > 0) || 
                                      (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length > 0)) && (
                                        <small style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px', marginTop: '8px' }}>HISTORIAL / VENCIDOS</small>
                                    )}

                                    {historialData?.serviciosVencidos?.tallerEquiposEntregados?.map((srv: any) => (
                                        <div key={`taller-ven-${srv.id}`} style={{ background: '#0f172a', borderLeft: '3px solid #64748b', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid #1e293b', borderLeftWidth: '3px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.dispositivo} (Entregado)</div>
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>{srv.notas}</div>
                                            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Entregado: {new Date(srv.fechaEntrega).toLocaleDateString()}</small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosVencidos?.suscripcionesExpiradas?.map((srv: any) => (
                                        <div key={`susc-ven-${srv.id}`} style={{ background: '#2d1e24', borderLeft: '3px solid #ef4444', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            <strong style={{ color: '#fca5a5', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{srv.nombreServicio}</strong>
                                            <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>Estado: {srv.estado}</div>
                                            <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>Expiró: {new Date(srv.fechaVencimiento).toLocaleDateString()}</small>
                                        </div>
                                    ))}

                                    {/* SECCIÓN CUENTAS POR COBRAR / DEUDAS */}
                                    <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #334155' }}>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#ef4444', fontSize: '0.9rem' }}>Estado de Cuenta (Deudas)</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {historialData?.historialDeudas?.filter((d: any) => d.saldoPendiente > 0).map((deuda: any) => (
                                                <div key={deuda.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '10px', borderRadius: '6px', border: '1px solid #ef4444' }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Deuda #{deuda.id} ({deuda.estado})</span>
                                                        <small style={{ display: 'block', color: '#94a3b8' }}>Vence el: {new Date(deuda.fechaVencimiento).toLocaleDateString()}</small>
                                                    </div>
                                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>C$ {deuda.saldoPendiente}</span>
                                                </div>
                                            ))}
                                            {historialData?.historialDeudas?.filter((d: any) => d.saldoPendiente > 0).length === 0 && (
                                                <small style={{ color: '#10b981' }}>El cliente no tiene saldos pendientes de pago.</small>
                                            )}
                                        </div>
                                    </div>

                                    {/* ESTADO VACÍO */}
                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.length === 0 &&
                                     historialData?.serviciosActivos?.suscripcionesVigentes?.length === 0 &&
                                     historialData?.serviciosVencidos?.tallerEquiposEntregados?.length === 0 &&
                                     historialData?.serviciosVencidos?.suscripcionesExpiradas?.length === 0 && (
                                        <small style={{ color: '#64748b' }}>Sin órdenes ni suscripciones.</small>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};