import React, { useState, useEffect, useCallback, type FormEvent, type MouseEvent } from 'react';
import api from '../services/api';
import { 
    FaSearch, FaWhatsapp, FaUserTag, FaHistory, FaCalendarAlt, 
    FaFolderOpen, FaUserPlus, FaEdit, FaTrash, FaSave, FaTimes, 
    FaExclamationTriangle, FaCheckCircle, FaBan, FaArrowLeft,
    FaPhoneAlt, FaStar, FaCoins
} from 'react-icons/fa';
import styles from '../assets/styles/ClientesCRM.module.css';

// --- INTERFACES Y TIPOS ---
interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    puntosAcumulados: number;
    fechaRegistro?: string;
    etiquetas?: string;
    observaciones?: string;
}

interface CompraHistorial {
    id: number;
    fecha: string;
    total: number;
}

interface EquipoTaller {
    id: number;
    dispositivo: string;
    estado?: string;
    diagnostico?: string;
    notas?: string;
    fechaIngreso?: string;
    fechaEntrega?: string;
}

interface SuscripcionServicio {
    id: number;
    nombreServicio: string;
    detallesCredenciales?: string;
    estado?: string;
    fechaVencimiento: string;
}

interface DeudaCliente {
    id: number;
    estado: string;
    fechaVencimiento: string;
    saldoPendiente: number;
}

interface ExpedienteClienteData {
    cliente: Cliente & { puntosClub?: number };
    totalGastado: number;
    serviciosActivos: {
        tallerEquiposEnRevision: EquipoTaller[];
        suscripcionesVigentes: SuscripcionServicio[];
    };
    serviciosVencidos: {
        tallerEquiposEntregados: EquipoTaller[];
        suscripcionesExpiradas: SuscripcionServicio[];
    };
    historialCompras: CompraHistorial[];
    historialDeudas: DeudaCliente[];
}

interface ErrorIntegridadDetalles {
    tieneVentas?: boolean;
    tieneTaller?: boolean;
    tieneDeudas?: boolean;
}

// --- HELPERS DE FORMATEO ---
const formatearFecha = (fechaStr?: string): string => {
    if (!fechaStr) return 'N/A';
    const d = new Date(fechaStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('es-NI');
};

const formatearCordobas = (monto?: number): string => {
    return `C$ ${(monto || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const sanitizarTelefonoWhatsapp = (num: string): string => {
    const soloNumeros = num.replace(/\D/g, '');
    if (soloNumeros.startsWith('505') && soloNumeros.length === 11) {
        return soloNumeros;
    }
    return `505${soloNumeros}`;
};

export const ClientesCRM: React.FC = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [historialData, setHistorialData] = useState<ExpedienteClienteData | null>(null);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    // FORMULARIO Y MODALES
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
    const [editandoClienteId, setEditandoClienteId] = useState<number | null>(null);
    const [cliNombre, setCliNombre] = useState('');
    const [cliTelefono, setCliTelefono] = useState('');
    const [cliEmail, setCliEmail] = useState('');
    const [cliPuntos, setCliPuntos] = useState(0);
    const [cliEtiquetas, setCliEtiquetas] = useState('');      
    const [cliObservaciones, setCliObservaciones] = useState(''); 

    // MODAL DE INTEGRIDAD DE ELIMINACIÓN
    const [errorEliminacion, setErrorEliminacion] = useState<{
        mensajePrincipal: string;
        detalles?: ErrorIntegridadDetalles;
    } | null>(null);

    const cargarClientes = useCallback(async () => {
        try {
            const res = await api.get<Cliente[]>('/clientes');
            setClientes(res.data || []);
        } catch (err) {
            console.error("Error cargando base de clientes", err);
        }
    }, []);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    const seleccionarCliente = async (cliente: Cliente) => {
        setClienteSeleccionado(cliente);
        setCargandoHistorial(true);
        try {
            const res = await api.get<ExpedienteClienteData>(`/clientes/${cliente.id}/historial`);
            setHistorialData(res.data);
        } catch (err) {
            console.error("Error al obtener la historia del cliente", err);
            setHistorialData(null);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const abrirModalClienteNuevo = () => { 
        setEditandoClienteId(null); 
        setCliNombre(''); 
        setCliTelefono(''); 
        setCliEmail(''); 
        setCliPuntos(0); 
        setCliEtiquetas('');
        setCliObservaciones('');
        setMostrarModalCliente(true); 
    };

    const abrirModalClienteEditor = (c: Cliente, e: MouseEvent) => { 
        e.stopPropagation(); 
        setEditandoClienteId(c.id); 
        setCliNombre(c.nombre); 
        setCliTelefono(c.telefono); 
        setCliEmail(c.email); 
        setCliPuntos(c.puntosAcumulados || 0); 
        setCliEtiquetas(c.etiquetas || '');
        setCliObservaciones(c.observaciones || '');
        setMostrarModalCliente(true); 
    };

    const guardarCliente = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { 
                id: editandoClienteId || 0, 
                nombre: cliNombre, 
                telefono: cliTelefono, 
                email: cliEmail || 'taller@nicaplus.com', 
                puntosAcumulados: cliPuntos,
                etiquetas: cliEtiquetas,       
                observaciones: cliObservaciones 
            };
            
            if (editandoClienteId) {
                await api.put(`/clientes/${editandoClienteId}`, payload);
            } else {
                await api.post('/clientes', payload);
            }
            
            setMostrarModalCliente(false);
            cargarClientes();
            
            if (clienteSeleccionado && clienteSeleccionado.id === editandoClienteId) {
                seleccionarCliente({ ...clienteSeleccionado, ...payload });
            }
        } catch (err: any) { 
            const msg = err.response?.data?.mensaje || err.response?.data || "Fallo transaccional al guardar cliente.";
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg)); 
        }
    };

    const eliminarCliente = async (idTarget: number, e: MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("¿Está seguro de remover a este cliente de la base de datos?")) return;
        
        try {
            await api.delete(`/clientes/${idTarget}`);
            if (clienteSeleccionado?.id === idTarget) {
                setClienteSeleccionado(null);
                setHistorialData(null);
            }
            cargarClientes();
        } catch (err: any) {
            const data = err.response?.data;
            if (data && data.detalles) {
                setErrorEliminacion({
                    mensajePrincipal: data.mensaje || "No se puede eliminar el cliente porque posee historial activo o saldos asociados.",
                    detalles: data.detalles
                });
            } else {
                setErrorEliminacion({
                    mensajePrincipal: typeof data === 'string' ? data : "No se pudo completar la eliminación del cliente por vinculación de datos."
                });
            }
        }
    };

    const clientesFiltrados = clientes.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono.includes(busqueda)
    );

    return (
        <div className={styles.crmContainer}>
            
            {/* 1. PANEL IZQUIERDO: DIRECTORIO CRM */}
            <div className={`${styles.crmSidebar} ${clienteSeleccionado ? styles.sidebarHiddenMobile : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarTitleWrap}>
                        <h3 className={styles.sidebarTitle}>Directorio CRM</h3>
                        <span className={styles.totalBadge}>{clientesFiltrados.length}</span>
                    </div>
                    <button onClick={abrirModalClienteNuevo} className={styles.btnNuevoCliente}>
                        <FaUserPlus /> <span>Nuevo</span>
                    </button>
                </div>
                
                <div className={styles.searchWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o teléfono..." 
                        value={busqueda} 
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={styles.searchInput}
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda('')} className={styles.clearSearchBtn}>
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className={styles.clientList}>
                    {clientesFiltrados.length === 0 ? (
                        <div className={styles.emptyList}>No se encontraron clientes registrados.</div>
                    ) : (
                        clientesFiltrados.map(c => {
                            const esActivo = clienteSeleccionado?.id === c.id;
                            return (
                                <div 
                                    key={c.id} 
                                    onClick={() => seleccionarCliente(c)}
                                    className={`${styles.clientItem} ${esActivo ? styles.clientItemActive : ''}`}
                                >
                                    <div className={styles.clientItemTop}>
                                        <strong className={styles.clientName}>{c.nombre}</strong>
                                        <div className={styles.clientActions}>
                                            <button 
                                                onClick={(e) => abrirModalClienteEditor(c, e)} 
                                                className={styles.btnIconEdit}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                onClick={(e) => eliminarCliente(c.id, e)} 
                                                className={styles.btnIconDelete}
                                                title="Eliminar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    <div className={styles.clientMetaRow}>
                                        <span className={styles.clientPhone}><FaPhoneAlt size={9} /> {c.telefono}</span>
                                        {c.etiquetas && (
                                            <span className={styles.sidebarTag}>
                                                {c.etiquetas.split(',')[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. PANEL DERECHO: EXPEDIENTE COMPLETO */}
            <div className={`${styles.crmMainContent} ${!clienteSeleccionado ? styles.mainHiddenMobile : ''}`}>
                {!clienteSeleccionado ? (
                    <div className={styles.emptyState}>
                        <FaFolderOpen size={44} className={styles.emptyStateIcon} />
                        <p className={styles.emptyStateText}>
                            Seleccione un cliente del directorio para auditar su expediente y balances.
                        </p>
                    </div>
                ) : cargandoHistorial ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loaderPulse} />
                        <span>Consultando expediente de transacciones...</span>
                    </div>
                ) : (
                    <div className={styles.expedienteWrapper}>
                        
                        {/* BOTÓN VOLVER EN MÓVIL */}
                        <div className={styles.mobileBackHeader}>
                            <button 
                                onClick={() => setClienteSeleccionado(null)} 
                                className={styles.btnBackMobile}
                            >
                                <FaArrowLeft /> Volver al directorio
                            </button>
                        </div>

                        {/* ENCABEZADO EXPEDIENTE CLIENTE */}
                        <div className={styles.crmHeaderActions}>
                            <div className={styles.headerInfo}>
                                <h2 className={styles.clientTitle}>
                                    {historialData?.cliente.nombre || clienteSeleccionado.nombre}
                                </h2>
                                <p className={styles.registerDate}>
                                    Registrado: {formatearFecha(historialData?.cliente.fechaRegistro || clienteSeleccionado.fechaRegistro)}
                                </p>
                                <div className={styles.tagContainer}>
                                    {(historialData?.cliente.etiquetas || clienteSeleccionado.etiquetas) ? (
                                        (historialData?.cliente.etiquetas || clienteSeleccionado.etiquetas || '')
                                            .split(',')
                                            .map((tag: string, i: number) => (
                                                <span key={i} className={styles.tag}>
                                                    <FaUserTag size={10} /> {tag.trim()}
                                                </span>
                                            ))
                                    ) : (
                                        <span className={styles.noTags}>Sin etiquetas asignadas</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.headerContact}>
                                <a 
                                    href={`https://wa.me/${sanitizarTelefonoWhatsapp(historialData?.cliente.telefono || clienteSeleccionado.telefono)}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className={styles.btnWhatsapp}
                                >
                                    <FaWhatsapp size={18} /> <span>WhatsApp</span>
                                </a>
                            </div>
                        </div>

                        {/* KPIS FINANCIEROS Y DE FIDELIZACIÓN */}
                        <div className={styles.crmKpiGrid}>
                            <div className={`${styles.kpiCard} ${styles.kpiCardInvertido}`}>
                                <small className={styles.kpiLabel}>TOTAL COMPRAS</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueInvertido}`}>
                                    {formatearCordobas(historialData?.totalGastado)}
                                </h3>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiCardActivo}`}>
                                <small className={styles.kpiLabel}>SERVICIOS ACTIVOS</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueActivo}`}>
                                    {(historialData?.serviciosActivos?.tallerEquiposEnRevision?.length ?? 0) + 
                                    (historialData?.serviciosActivos?.suscripcionesVigentes?.length ?? 0)}
                                </h3>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiCardVencido}`}>
                                <small className={styles.kpiLabel}>SERVICIOS EXPIRADOS</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueVencido}`}>
                                    {(historialData?.serviciosVencidos?.tallerEquiposEntregados?.length ?? 0) + 
                                    (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length ?? 0)}
                                </h3>
                            </div>
                            <div className={`${styles.kpiCard} ${styles.kpiCardClub}`}>
                                <small className={styles.kpiLabel}>PUNTOS CLUB</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueClub}`}>
                                    <FaStar size={14} /> {historialData?.cliente?.puntosClub ?? historialData?.cliente?.puntosAcumulados ?? clienteSeleccionado.puntosAcumulados ?? 0}
                                </h3>
                            </div>
                        </div>

                        {/* OBSERVACIONES DEL CRM */}
                        <div className={styles.observacionesBox}>
                            <h4 className={styles.observacionesTitle}>Observaciones del Cliente</h4>
                            <p className={styles.observacionesContent}>
                                {historialData?.cliente.observaciones || clienteSeleccionado.observaciones || 
                                "Sin observaciones o notas internas de comportamiento."}
                            </p>
                        </div>

                        {/* HISTORIAL DIVIDIDO */}
                        <div className={styles.crmHistoryGrid}>
                            
                            {/* COLUMNA 1: HISTORIAL DE COMPRAS */}
                            <div className={styles.crmHistoryColumn}>
                                <h4 className={styles.columnHeaderCompras}>
                                    <FaHistory /> Compras Realizadas
                                </h4>
                                <div className={styles.listWrapper}>
                                    {historialData?.historialCompras?.map((compra) => (
                                        <div key={compra.id} className={styles.compraItem}>
                                            <div className={styles.compraInfo}>
                                                <strong className={styles.compraTitle}>Factura #{compra.id}</strong>
                                                <small className={styles.compraSub}>
                                                    {formatearFecha(compra.fecha)}
                                                </small>
                                            </div>
                                            <span className={styles.compraPrice}>
                                                {formatearCordobas(compra.total)}
                                            </span>
                                        </div>
                                    ))}
                                    {(!historialData?.historialCompras || historialData.historialCompras.length === 0) && (
                                        <small className={styles.emptyText}>El cliente no registra compras.</small>
                                    )}
                                </div>
                            </div>

                            {/* COLUMNA 2: ESTADO DE SERVICIOS Y DEUDAS */}
                            <div className={styles.crmHistoryColumn}>
                                <h4 className={styles.columnHeaderServicios}>
                                    <FaCalendarAlt /> Servicios y Suscripciones
                                </h4>
                                <div className={styles.listWrapper}>
                                    {(((historialData?.serviciosActivos?.tallerEquiposEnRevision?.length ?? 0) > 0) || 
                                      ((historialData?.serviciosActivos?.suscripcionesVigentes?.length ?? 0) > 0)) && (
                                        <div className={styles.sectionSubTitle}>ACTIVOS / EN REVISIÓN</div>
                                    )}

                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.map((srv) => (
                                        <div key={`taller-act-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceTallerAct}`}>
                                            <div className={styles.serviceHeaderRow}>
                                                <strong className={styles.serviceTitle}>{srv.dispositivo}</strong>
                                                <span className={styles.badgeService}>{srv.estado || 'En Revisión'}</span>
                                            </div>
                                            <div className={styles.serviceDesc}>{srv.diagnostico || 'Diagnóstico pendiente'}</div>
                                            <small className={styles.serviceDate}>
                                                Ingreso: {formatearFecha(srv.fechaIngreso)}
                                            </small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosActivos?.suscripcionesVigentes?.map((srv) => (
                                        <div key={`susc-act-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceSuscripAct}`}>
                                            <strong className={styles.serviceTitle}>{srv.nombreServicio}</strong>
                                            <div className={styles.serviceDesc}>{srv.detallesCredenciales}</div>
                                            <small className={styles.serviceDateActive}>
                                                Vence: {formatearFecha(srv.fechaVencimiento)}
                                            </small>
                                        </div>
                                    ))}

                                    {(((historialData?.serviciosVencidos?.tallerEquiposEntregados?.length ?? 0) > 0) || 
                                      ((historialData?.serviciosVencidos?.suscripcionesExpiradas?.length ?? 0) > 0)) && (
                                        <div className={styles.sectionSubTitle}>HISTORIAL / FINALIZADOS</div>
                                    )}

                                    {historialData?.serviciosVencidos?.tallerEquiposEntregados?.map((srv) => (
                                        <div key={`taller-ven-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceTallerHist}`}>
                                            <div className={styles.serviceTitle}>{srv.dispositivo} (Entregado)</div>
                                            <div className={styles.serviceDesc}>{srv.notas || 'Sin notas adicionadas'}</div>
                                            <small className={styles.serviceDate}>
                                                Entregado: {formatearFecha(srv.fechaEntrega)}
                                            </small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosVencidos?.suscripcionesExpiradas?.map((srv) => (
                                        <div key={`susc-ven-${srv.id}`} className={`${styles.serviceCard} ${styles.serviceSuscripExp}`}>
                                            <strong className={styles.serviceTitle}>{srv.nombreServicio}</strong>
                                            <div className={styles.serviceDesc}>Estado: {srv.estado || 'Expirado'}</div>
                                            <small className={styles.serviceDate}>
                                                Expiró: {formatearFecha(srv.fechaVencimiento)}
                                            </small>
                                        </div>
                                    ))}

                                    {/* SECCIÓN DE CUENTAS POR COBRAR (DEUDAS) */}
                                    <div className={styles.deudaSection}>
                                        <h4 className={styles.deudaTitle}><FaCoins /> Cuentas por Cobrar Pendientes</h4>
                                        <div className={styles.deudaList}>
                                            {historialData?.historialDeudas?.filter(d => d.saldoPendiente > 0).map((deuda) => (
                                                <div key={deuda.id} className={styles.deudaCard}>
                                                    <div className={styles.deudaInfo}>
                                                        <span className={styles.deudaCode}>Deuda #{deuda.id} ({deuda.estado})</span>
                                                        <small className={styles.deudaDate}>
                                                            Vencimiento: {formatearFecha(deuda.fechaVencimiento)}
                                                        </small>
                                                    </div>
                                                    <span className={styles.deudaMonto}>{formatearCordobas(deuda.saldoPendiente)}</span>
                                                </div>
                                            ))}
                                            {(!historialData?.historialDeudas || historialData.historialDeudas.filter(d => d.saldoPendiente > 0).length === 0) && (
                                                <small className={styles.noDeudaText}>El cliente no posee deudas activas.</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CREACIÓN / EDICIÓN DE CLIENTE */}
            {mostrarModalCliente && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}> 
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                {editandoClienteId ? <><FaEdit /> Editar Cliente</> : <><FaUserPlus /> Nuevo Cliente</>}
                            </h3>
                            <button onClick={() => setMostrarModalCliente(false)} className={styles.modalCloseBtn}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <form onSubmit={guardarCliente} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="cliNombre">Nombre Completo *</label>
                                <input id="cliNombre" type="text" value={cliNombre} onChange={e => setCliNombre(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cliTelefono">Teléfono Móvil *</label>
                                <input id="cliTelefono" type="text" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cliEmail">Email (Opcional)</label>
                                <input id="cliEmail" type="email" value={cliEmail} onChange={e => setCliEmail(e.target.value)} placeholder="cliente@nicaplus.com" />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cliEtiquetas">Etiquetas (Separadas por comas)</label>
                                <input id="cliEtiquetas" type="text" value={cliEtiquetas} onChange={e => setCliEtiquetas(e.target.value)} placeholder="Ej: Frecuente, Taller, VIP" />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="cliObservaciones">Observaciones Internas</label>
                                <textarea id="cliObservaciones" value={cliObservaciones} onChange={e => setCliObservaciones(e.target.value)} rows={3} placeholder="Notas de comportamiento del cliente..." />
                            </div>

                            {editandoClienteId && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="cliPuntos">Puntos Fidelización Club</label>
                                    <input id="cliPuntos" type="number" value={cliPuntos} onChange={e => setCliPuntos(Number(e.target.value))} min={0} />
                                </div>
                            )}
                            
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setMostrarModalCliente(false)} className={styles.btnCancelar}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnGuardar}>
                                    <FaSave /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE INTEGRIDAD DE ELIMINACIÓN */}
            {errorEliminacion && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentIntegridad}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitleRed}>
                                <FaExclamationTriangle /> Operación Denegada
                            </h3>
                            <button onClick={() => setErrorEliminacion(null)} className={styles.modalCloseBtn}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.integridadBody}>
                            <p className={styles.integridadText}>{errorEliminacion.mensajePrincipal}</p>

                            {errorEliminacion.detalles && (
                                <div className={styles.motivosBox}>
                                    <span className={styles.motivosTitle}>
                                        Motivos detectados en el sistema:
                                    </span>
                                    
                                    <div className={styles.motivoItem}>
                                        {errorEliminacion.detalles.tieneVentas ? <FaBan className={styles.iconRed} /> : <FaCheckCircle className={styles.iconGreen} />}
                                        <span className={errorEliminacion.detalles.tieneVentas ? styles.textRed : styles.textMuted}>
                                            {errorEliminacion.detalles.tieneVentas ? "Posee ventas o facturas en historial" : "Sin historial de ventas"}
                                        </span>
                                    </div>

                                    <div className={styles.motivoItem}>
                                        {errorEliminacion.detalles.tieneTaller ? <FaBan className={styles.iconRed} /> : <FaCheckCircle className={styles.iconGreen} />}
                                        <span className={errorEliminacion.detalles.tieneTaller ? styles.textRed : styles.textMuted}>
                                            {errorEliminacion.detalles.tieneTaller ? "Posee órdenes activas en taller" : "Sin servicios de taller"}
                                        </span>
                                    </div>

                                    <div className={styles.motivoItem}>
                                        {errorEliminacion.detalles.tieneDeudas ? <FaBan className={styles.iconRed} /> : <FaCheckCircle className={styles.iconGreen} />}
                                        <span className={errorEliminacion.detalles.tieneDeudas ? styles.textRed : styles.textMuted}>
                                            {errorEliminacion.detalles.tieneDeudas ? "Mantiene cuentas por cobrar pendientes" : "Sin saldos adeudados"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActionsEnd}>
                            <button 
                                onClick={() => setErrorEliminacion(null)} 
                                className={styles.btnEntendido}
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};