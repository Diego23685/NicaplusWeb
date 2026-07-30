// ClientesCRM.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import api from '../services/api';
import { 
    FaSearch, FaWhatsapp, FaUserTag, FaHistory, FaCalendarAlt, 
    FaFolderOpen, FaUserPlus, FaEdit, FaTrash, FaSave, FaTimes 
} from 'react-icons/fa';
import styles from '../assets/styles/ClientesCRM.module.css';

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

export const ClientesCRM: React.FC = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
    const [historialData, setHistorialData] = useState<any>(null);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);

    // ESTADOS DEL FORMULARIO / MODAL ENRIQUECIDOS
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
    const [editandoClienteId, setEditandoClienteId] = useState<number | null>(null);
    const [cliNombre, setCliNombre] = useState('');
    const [cliTelefono, setCliTelefono] = useState('');
    const [cliEmail, setCliEmail] = useState('');
    const [cliPuntos, setCliPuntos] = useState(0);
    const [cliEtiquetas, setCliEtiquetas] = useState('');      // <-- Nuevo
    const [cliObservaciones, setCliObservaciones] = useState(''); // <-- Nuevo

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

    const seleccionarCliente = async (cliente: Cliente) => {
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

    // CONTROLADORES DE MODAL CRUDS
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

    const abrirModalClienteEditor = (c: Cliente, e: React.MouseEvent) => { 
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
                etiquetas: cliEtiquetas,       // <-- Agregado al payload
                observaciones: cliObservaciones // <-- Agregado al payload
            };
            
            if (editandoClienteId) {
                await api.put(`/clientes/${editandoClienteId}`, payload);
            } else {
                await api.post('/clientes', payload);
            }
            
            setMostrarModalCliente(false);
            cargarClientes();
            
            if (clienteSeleccionado && clienteSeleccionado.id === editandoClienteId) {
                // Forzamos la actualización completa volviendo a pedir el historial estructurado
                seleccionarCliente({ ...clienteSeleccionado, ...payload });
            }
        } catch (err: any) { 
            alert(err.response?.data || "Fallo transaccional al guardar cliente."); 
        }
    };

    const eliminarCliente = async (idTarget: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("¿Remover cliente del libro contable?")) return;
        try {
            await api.delete(`/clientes/${idTarget}`);
            if (clienteSeleccionado?.id === idTarget) {
                setClienteSeleccionado(null);
                setHistorialData(null);
            }
            cargarClientes();
        } catch (err: any) {
            alert("No se pudo eliminar el cliente por restricciones de integridad (posee transacciones vigentes).");
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 className={styles.sidebarTitle} style={{ margin: 0 }}>Directorio CRM</h3>
                    <button onClick={abrirModalClienteNuevo} className={styles.btnWhatsapp} style={{ background: '#581c7e', padding: '6px 10px', fontSize: '0.8rem' }}>
                        <FaUserPlus /> Nuevo
                    </button>
                </div>
                
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className={styles.clientName}>{c.nombre}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <FaEdit size={12} onClick={(e) => abrirModalClienteEditor(c, e)} style={{ color: '#f59e0b', cursor: 'pointer' }} />
                                        <FaTrash size={12} onClick={(e) => eliminarCliente(c.id, e)} style={{ color: '#ef4444', cursor: 'pointer' }} />
                                    </div>
                                </div>
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
                                    Registrado el: {historialData?.cliente.fechaRegistro ? new Date(historialData.cliente.fechaRegistro).toLocaleDateString() : 'N/A'}
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

                        {/* KPIS FINANCIEROS Y DE FIDELIZACIÓN DEL CLIENTE */}
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
                            {/* ¡MANDALO AQUÍ! Se alinea perfectamente en la rejilla */}
                            <div className={styles.kpiCardClub}>
                                <small className={styles.kpiLabel}>PUNTOS CLUB</small>
                                <h3 className={`${styles.kpiValue} ${styles.valueClub}`}>
                                    {historialData?.cliente?.puntosClub ?? 0} pts
                                </h3>
                            </div>
                        </div>

                        {/* SECCIÓN OBSERVACIONES (Ya no tendrá la tarjeta estorbando abajo) */}
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL ENTRADA/EDICIÓN DE CLIENTES INTEGRADO */}
            {mostrarModalCliente && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}> 
                        {/* Agrega una clase .modalContent en tu CSS o usa estilos inline controlados para el tamaño base */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.15rem', fontWeight: 700 }}>
                                {editandoClienteId ? <><FaEdit /> Modificar Cliente</> : <><FaUserPlus /> Registrar Cliente</>}
                            </h3>
                            <button onClick={() => setMostrarModalCliente(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Completo</label>
                                <input type="text" value={cliNombre} onChange={e => setCliNombre(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }} required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Teléfono Móvil</label>
                                <input type="text" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }} required />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Email</label>
                                <input type="email" value={cliEmail} onChange={e => setCliEmail(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                            </div>
                            
                            {/* NUEVO CAMPO: ETIQUETAS */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Etiquetas (Separadas por comas)</label>
                                <input type="text" value={cliEtiquetas} onChange={e => setCliEtiquetas(e.target.value)} placeholder="Ej: Frecuente, Taller, Mayorista" style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }} />
                            </div>

                            {/* NUEVO CAMPO: OBSERVACIONES */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Observaciones Internas</label>
                                <textarea value={cliObservaciones} onChange={e => setCliObservaciones(e.target.value)} rows={3} placeholder="Detalles de comportamiento o notas importantes del cliente..." style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px', resize: 'none', fontFamily: 'inherit' }} />
                            </div>

                            {editandoClienteId && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Puntos Club</label>
                                    <input type="number" value={cliPuntos} onChange={e => setCliPuntos(Number(e.target.value))} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '4px' }} min={0} />
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, background: '#38bdf8', color: '#0f172a', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FaSave /> Guardar</button>
                                <button type="button" onClick={() => setMostrarModalCliente(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};