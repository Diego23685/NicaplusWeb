// ClientesCRM.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaSearch, FaWhatsapp, FaUserTag, FaHistory, FaCalendarAlt, FaFolderOpen } from 'react-icons/fa';
import styles from '../assets/styles/ClientesCRM.module.css'; // Importación limpia de estilos modulares

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
        <div className={styles.crmContainer}>
            
            {/* PANEL IZQUIERDO: BUSCADOR Y LISTA */}
            <div className={styles.crmSidebar}>
                <h3 className={styles.sidebarTitle}>Directorio CRM</h3>
                
                <div className={styles.searchWrapper}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o teléfono..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                    <FaSearch className={styles.searchIcon} />
                </div>

                <div className={styles.clientList}>
                    {clientesFiltrados.map(c => {
                        const esActivo = clienteSeleccionado?.id === c.id;
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => seleccionarCliente(c)}
                                className={`${styles.clientItem} ${esActivo ? styles.clientItemActive : ''}`}
                            >
                                <div className={styles.clientName}>{c.nombre}</div>
                                <div className={styles.clientMetaRow}>
                                    <span>{c.telefono}</span>
                                    {c.etiquetas && (
                                        <span className={styles.sidebarTag}>
                                            {c.etiquetas.split(',')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* PANEL DERECHO: EXPEDIENTE COMPLETO */}
            <div className={styles.crmMainContent}>
                {!clienteSeleccionado ? (
                    <div className={styles.emptyState}>
                        <FaFolderOpen size={48} style={{ marginBottom: '12px' }} />
                        <p className={styles.emptyStateText}>
                            Seleccione un cliente del panel izquierdo para auditar su historia completa.
                        </p>
                    </div>
                ) : cargandoHistorial ? (
                    <div className={styles.loadingState}>
                        Consultando expediente de transacciones...
                    </div>
                ) : (
                    <div>
                        {/* ENCABEZADO EXPEDIENTE CLIENTE */}
                        <div className={styles.crmHeaderActions}>
                            <div>
                                <h2 className={styles.clientTitle}>{historialData?.cliente.nombre}</h2>
                                <p className={styles.registerDate}>
                                    Registrado el: {new Date(historialData?.cliente.fechaRegistro).toLocaleDateString()}
                                </p>
                                <div className={styles.tagContainer}>
                                    {historialData?.cliente.etiquetas ? (
                                        historialData.cliente.etiquetas.split(',').map((tag: string, i: number) => (
                                            <span key={i} className={styles.tag}>
                                                <FaUserTag /> {tag.trim()}
                                            </span>
                                        ))
                                    ) : (
                                        <span className={styles.noTags}>Sin etiquetas asignadas</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <a 
                                    href={`https://wa.me/${historialData?.cliente.telefono.replace(/[^0-9]/g, '')}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={styles.btnWhatsapp}
                                >
                                    <FaWhatsapp size={18} /> WhatsApp
                                </a>
                            </div>
                        </div>

                        {/* KPIS FINANCIEROS DEL CLIENTE */}
                        <div className={styles.crmKpiGrid}>
                            <div className={`${styles.kpiCard} ${styles.kpiCardInvertido}`}>
                                <small className={styles.kpiLabel}>TOTAL INVERTIDO</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueInvertido}`}>
                                    C$ {historialData?.totalGastado.toLocaleString('es-NI')}
                                </h3>
                            </div>
                            <div className={styles.kpiCardActivo}>
                                <small className={styles.kpiLabel}>SERVICIOS ACTIVOS</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueActivo}`}>
                                    {(historialData?.serviciosActivos?.tallerEquiposEnRevision?.length ?? 0) + 
                                     (historialData?.serviciosActivos?.suscripcionesVigentes?.length ?? 0)}
                                </h3>
                            </div>
                            <div className={styles.kpiCardVencido}>
                                <small className={styles.kpiLabel}>SERVICIOS VENCIDOS</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueVencido}`}>
                                    {(historialData?.serviciosVencidos?.tallerEquiposEntregados?.length ?? 0) + 
                                     (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length ?? 0)}
                                </h3>
                            </div>
                        </div>

                        {/* SECCIÓN OBSERVACIONES */}
                        <div className={styles.observacionesBox}>
                            <h4 className={styles.observacionesTitle}>Observaciones del CRM</h4>
                            <p className={styles.observacionesContent}>
                                {historialData?.cliente.observaciones || 
                                 "No se han ingresado notas u observaciones de comportamiento de este cliente."}
                            </p>
                        </div>

                        {/* CONTENEDOR DE DOS COLUMNAS DE HISTORIAL */}
                        <div className={styles.crmHistoryGrid}>
                            
                            {/* COLUMNA: HISTORIAL DE COMPRAS */}
                            <div className={styles.crmHistoryColumn}>
                                <h4 className={styles.columnHeaderCompras}>
                                    <FaHistory /> Historial de Compras
                                </h4>
                                <div className={styles.listWrapper}>
                                    {historialData?.historialCompras.map((compra: any) => (
                                        <div key={compra.id} className={styles.compraItem}>
                                            <div className={styles.compraInfo}>
                                                <strong className={styles.compraTitle}>Factura #{compra.id}</strong>
                                                <small className={styles.compraSub}>
                                                    {new Date(compra.fecha).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <span className={styles.compraPrice}>
                                                C$ {compra.total.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {historialData?.historialCompras.length === 0 && (
                                        <small className={styles.emptyText}>El cliente no registra compras.</small>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA: ESTADO DE SERVICIOS */}
                            <div className={styles.crmHistoryColumn}>
                                <h4 className={styles.columnHeaderServicios}>
                                    <FaCalendarAlt /> Estado de Servicios
                                </h4>
                                <div className={styles.listWrapper}>
                                    
                                    {/* ACTIVOS */}
                                    {((historialData?.serviciosActivos?.tallerEquiposEnRevision?.length > 0) || 
                                      (historialData?.serviciosActivos?.suscripcionesVigentes?.length > 0)) && (
                                        <div className={styles.sectionSubTitle}>ACTIVOS / EN CURSO</div>
                                    )}

                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.map((srv: any) => (
                                        <div key={`taller-act-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceTallerAct}`}>
                                            <div className={styles.serviceTallerActHeader}>
                                                <strong className={styles.serviceTallerActTitle}>{srv.dispositivo}</strong>
                                                <span className={styles.badgeService}>{srv.estado}</span>
                                            </div>
                                            <div className={styles.serviceTallerActDesc}>{srv.diagnostico}</div>
                                            <small className={styles.serviceDateMeta}>
                                                Ingresó: {new Date(srv.fechaIngreso).toLocaleDateString()}
                                            </small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosActivos?.suscripcionesVigentes?.map((srv: any) => (
                                        <div key={`susc-act-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceSuscripAct}`}>
                                            <strong className={styles.serviceSuscripActTitle}>{srv.nombreServicio}</strong>
                                            <div className={styles.serviceSuscripActSub}>{srv.detallesCredenciales}</div>
                                            <small className={styles.dateActiveMeta}>
                                                Vence: {new Date(srv.fechaVencimiento).toLocaleDateString()}
                                            </small>
                                        </div>
                                    ))}

                                    {/* HISTORIAL / VENCIDOS */}
                                    {((historialData?.serviciosVencidos?.tallerEquiposEntregados?.length > 0) || 
                                      (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length > 0)) && (
                                        <div className={styles.sectionSubTitle}>HISTORIAL / VENCIDOS</div>
                                    )}

                                    {historialData?.serviciosVencidos?.tallerEquiposEntregados?.map((srv: any) => (
                                        <div key={`taller-ven-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceTallerHist}`}>
                                            <div className={styles.serviceTallerHistTitle}>{srv.dispositivo} (Entregado)</div>
                                            <div className={styles.serviceTallerHistDesc}>{srv.notas}</div>
                                            <small className={styles.serviceDateMeta}>
                                                Entregado: {new Date(srv.fechaEntrega).toLocaleDateString()}
                                            </small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosVencidos?.suscripcionesExpiradas?.map((srv: any) => (
                                        <div key={`susc-ven-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceSuscripExp}`}>
                                            <strong className={styles.serviceSuscripExpTitle}>{srv.nombreServicio}</strong>
                                            <div className={styles.serviceSuscripExpSub}>Estado: {srv.estado}</div>
                                            <small className={styles.serviceDateMeta}>
                                                Expiró: {new Date(srv.fechaVencimiento).toLocaleDateString()}
                                            </small>
                                        </div>
                                    ))}

                                    {/* SECCIÓN CUENTAS POR COBRAR / DEUDAS */}
                                    <div className={styles.deudaSection}>
                                        <h4 className={styles.deudaTitle}>Estado de Cuenta (Deudas)</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {historialData?.historialDeudas?.filter((d: any) => d.saldoPendiente > 0).map((deuda: any) => (
                                                <div key={deuda.id} className={styles.deudaCard}>
                                                    <div>
                                                        <span className={styles.deudaCode}>Deuda #{deuda.id} ({deuda.estado})</span>
                                                        <small className={styles.deudaDate}>
                                                            Vence el: {new Date(deuda.fechaVencimiento).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                    <span className={styles.deudaMonto}>C$ {deuda.saldoPendiente}</span>
                                                </div>
                                            ))}
                                            {historialData?.historialDeudas?.filter((d: any) => d.saldoPendiente > 0).length === 0 && (
                                                <small className={styles.noDeudaText}>El cliente no tiene saldos pendientes de pago.</small>
                                            )}
                                        </div>
                                    </div>

                                    {/* ESTADO VACÍO */}
                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.length === 0 &&
                                     historialData?.serviciosActivos?.suscripcionesVigentes?.length === 0 &&
                                     historialData?.serviciosVencidos?.tallerEquiposEntregados?.length === 0 &&
                                     historialData?.serviciosVencidos?.suscripcionesExpiradas?.length === 0 && (
                                        <small className={styles.emptyText}>Sin órdenes ni suscripciones.</small>
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