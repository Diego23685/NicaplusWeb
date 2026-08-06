import React, { useState, useEffect, useCallback, type FormEvent, type MouseEvent } from 'react';
import api from '../services/api';
import { 
    FaSearch, FaWhatsapp, FaUserTag, 
    FaUserPlus, FaEdit, FaTrash, FaSave, FaTimes, 
    FaExclamationTriangle, FaCheckCircle, FaBan, FaArrowLeft, FaPhoneAlt
} from 'react-icons/fa';

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

    // CONTROL DE PESTAÑAS MÓVILES EN EXPEDIENTE
    const [seccionExpediente, setSeccionExpediente] = useState<'resumen' | 'servicios' | 'compras' | 'deudas'>('resumen');

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
            setClientes(res.data);
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
        setSeccionExpediente('resumen');
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
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* VISTA 1: LISTA Y BÚSQUEDA DE CLIENTES (MÓVIL) */}
            {!clienteSeleccionado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Encabezado Directorio */}
                    <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Directorio de Clientes</h3>
                            <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Total: {clientes.length} registrados</small>
                        </div>
                        <button 
                            onClick={abrirModalClienteNuevo}
                            style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            <FaUserPlus /> Nuevo
                        </button>
                    </div>

                    {/* Buscador táctil */}
                    <div style={{ position: 'relative' }}>
                        <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o teléfono..." 
                            value={busqueda} 
                            onChange={(e) => setBusqueda(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 38px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Lista de clientes (Cards Ligeras) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {clientesFiltrados.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.85rem' }}>
                                No se encontraron clientes coincidentes.
                            </div>
                        ) : (
                            clientesFiltrados.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => seleccionarCliente(c)}
                                    style={{
                                        background: '#1e293b',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid #334155',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{c.nombre}</strong>
                                        <div style={{ display: 'flex', gap: '10px' }} onClick={e => e.stopPropagation()}>
                                            <FaEdit size={14} onClick={(e) => abrirModalClienteEditor(c, e)} style={{ color: '#f59e0b', cursor: 'pointer' }} />
                                            <FaTrash size={14} onClick={(e) => eliminarCliente(c.id, e)} style={{ color: '#ef4444', cursor: 'pointer' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                                        <span style={{ color: '#38bdf8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FaPhoneAlt size={10} /> {c.telefono}
                                        </span>
                                        {c.etiquetas && (
                                            <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid #38bdf8', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 600 }}>
                                                {c.etiquetas.split(',')[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* VISTA 2: EXPEDIENTE COMPLETO DEL CLIENTE SELECCIONADO (MÓVIL) */}
            {clienteSeleccionado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Botón de retorno al directorio */}
                    <button 
                        onClick={() => { setClienteSeleccionado(null); setHistorialData(null); }}
                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', width: 'fit-content' }}
                    >
                        <FaArrowLeft /> Volver al Directorio
                    </button>

                    {/* Tarjeta de Perfil del Cliente */}
                    <div style={{ background: '#1e293b', padding: '14px', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                                    {historialData?.cliente.nombre || clienteSeleccionado.nombre}
                                </h3>
                                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                    Registrado: {formatearFecha(historialData?.cliente.fechaRegistro || clienteSeleccionado.fechaRegistro)}
                                </small>
                            </div>

                            <a 
                                href={`https://wa.me/${sanitizarTelefonoWhatsapp(historialData?.cliente.telefono || clienteSeleccionado.telefono)}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ background: '#25D366', color: '#fff', textDecoration: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <FaWhatsapp size={16} /> WhatsApp
                            </a>
                        </div>

                        {/* Etiquetas */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {(historialData?.cliente.etiquetas || clienteSeleccionado.etiquetas) ? (
                                (historialData?.cliente.etiquetas || clienteSeleccionado.etiquetas || '')
                                    .split(',')
                                    .map((tag: string, i: number) => (
                                        <span key={i} style={{ background: '#0f172a', color: '#cbd5e1', border: '1px solid #334155', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <FaUserTag size={10} style={{ color: '#38bdf8' }} /> {tag.trim()}
                                        </span>
                                    ))
                            ) : (
                                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Sin etiquetas asignadas</small>
                            )}
                        </div>
                    </div>

                    {/* ESTADO DE CARGA */}
                    {cargandoHistorial ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#38bdf8', background: '#1e293b', borderRadius: '12px', fontSize: '0.85rem' }}>
                            Consultando expediente de transacciones...
                        </div>
                    ) : (
                        <>
                            {/* PESTAÑAS HORIZONTALES PARA EXPEDIENTE */}
                            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                                <button onClick={() => setSeccionExpediente('resumen')} style={{ background: seccionExpediente === 'resumen' ? '#38bdf8' : '#1e293b', color: seccionExpediente === 'resumen' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Resumen</button>
                                <button onClick={() => setSeccionExpediente('servicios')} style={{ background: seccionExpediente === 'servicios' ? '#38bdf8' : '#1e293b', color: seccionExpediente === 'servicios' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Servicios</button>
                                <button onClick={() => setSeccionExpediente('compras')} style={{ background: seccionExpediente === 'compras' ? '#38bdf8' : '#1e293b', color: seccionExpediente === 'compras' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Compras</button>
                                <button onClick={() => setSeccionExpediente('deudas')} style={{ background: seccionExpediente === 'deudas' ? '#38bdf8' : '#1e293b', color: seccionExpediente === 'deudas' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Deudas</button>
                            </div>

                            {/* PESTAÑA 1: RESUMEN Y KPIS */}
                            {seccionExpediente === 'resumen' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>TOTAL INVERTIDO</small>
                                            <strong style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 800 }}>
                                                {formatearCordobas(historialData?.totalGastado)}
                                            </strong>
                                        </div>

                                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>PUNTOS CLUB</small>
                                            <strong style={{ color: '#c084fc', fontSize: '1.1rem', fontWeight: 800 }}>
                                                {historialData?.cliente?.puntosClub ?? historialData?.cliente?.puntosAcumulados ?? clienteSeleccionado.puntosAcumulados ?? 0} pts
                                            </strong>
                                        </div>

                                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>SERVICIOS ACTIVOS</small>
                                            <strong style={{ color: '#38bdf8', fontSize: '1.1rem', fontWeight: 800 }}>
                                                {(historialData?.serviciosActivos?.tallerEquiposEnRevision?.length ?? 0) + 
                                                (historialData?.serviciosActivos?.suscripcionesVigentes?.length ?? 0)}
                                            </strong>
                                        </div>

                                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                                            <small style={{ color: '#64748b', fontSize: '0.68rem', display: 'block' }}>VENCIDOS / HISTORIAL</small>
                                            <strong style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: 800 }}>
                                                {(historialData?.serviciosVencidos?.tallerEquiposEntregados?.length ?? 0) + 
                                                (historialData?.serviciosVencidos?.suscripcionesExpiradas?.length ?? 0)}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
                                        <strong style={{ color: '#f59e0b', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Observaciones del CRM</strong>
                                        <p style={{ color: '#cbd5e1', fontSize: '0.8rem', margin: 0, lineHeight: '1.3' }}>
                                            {historialData?.cliente.observaciones || clienteSeleccionado.observaciones || "Sin observaciones registradas."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 2: ESTADO DE SERVICIOS */}
                            {seccionExpediente === 'servicios' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    
                                    {/* Activos */}
                                    <strong style={{ color: '#10b981', fontSize: '0.78rem' }}>SERVICIOS ACTIVOS Y EN CURSO</strong>
                                    
                                    {historialData?.serviciosActivos?.tallerEquiposEnRevision?.map((srv) => (
                                        <div key={`taller-act-${srv.id}`} style={{ background: '#1e293b', borderLeft: '4px solid #38bdf8', padding: '10px', borderRadius: '8px', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                                                <span>🛠️ {srv.dispositivo}</span>
                                                <span style={{ color: '#38bdf8' }}>{srv.estado || 'En Revisión'}</span>
                                            </div>
                                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '2px' }}>{srv.diagnostico || 'Diagnóstico pendiente'}</div>
                                            <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Ingresó: {formatearFecha(srv.fechaIngreso)}</small>
                                        </div>
                                    ))}

                                    {historialData?.serviciosActivos?.suscripcionesVigentes?.map((srv) => (
                                        <div key={`susc-act-${srv.id}`} style={{ background: '#1e293b', borderLeft: '4px solid #10b981', padding: '10px', borderRadius: '8px', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                                            <strong style={{ color: '#fff', fontSize: '0.82rem' }}>📺 {srv.nombreServicio}</strong>
                                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '2px' }}>{srv.detallesCredenciales}</div>
                                            <small style={{ color: '#10b981', fontSize: '0.68rem', fontWeight: 700 }}>Vence: {formatearFecha(srv.fechaVencimiento)}</small>
                                        </div>
                                    ))}

                                    {/* Vencidos */}
                                    <strong style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '8px' }}>HISTORIAL Y VENCIDOS</strong>

                                    {historialData?.serviciosVencidos?.suscripcionesExpiradas?.map((srv) => (
                                        <div key={`susc-ven-${srv.id}`} style={{ background: '#1e293b', borderLeft: '4px solid #ef4444', padding: '10px', borderRadius: '8px', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                                            <strong style={{ color: '#fff', fontSize: '0.82rem' }}>{srv.nombreServicio}</strong>
                                            <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Estado: {srv.estado || 'Expirado'}</div>
                                            <small style={{ color: '#ef4444', fontSize: '0.68rem' }}>Expiró: {formatearFecha(srv.fechaVencimiento)}</small>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* PESTAÑA 3: HISTORIAL DE COMPRAS */}
                            {seccionExpediente === 'compras' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(!historialData?.historialCompras || historialData.historialCompras.length === 0) ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', background: '#1e293b', borderRadius: '10px', fontSize: '0.8rem' }}>
                                            El cliente no registra compras.
                                        </div>
                                    ) : (
                                        historialData.historialCompras.map((compra) => (
                                            <div key={compra.id} style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ color: '#fff', fontSize: '0.82rem', display: 'block' }}>Factura #{compra.id}</strong>
                                                    <small style={{ color: '#64748b', fontSize: '0.7rem' }}>{formatearFecha(compra.fecha)}</small>
                                                </div>
                                                <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>{formatearCordobas(compra.total)}</strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* PESTAÑA 4: DEUDAS Y SALDOS */}
                            {seccionExpediente === 'deudas' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(!historialData?.historialDeudas || historialData.historialDeudas.filter(d => d.saldoPendiente > 0).length === 0) ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#10b981', background: '#1e293b', borderRadius: '10px', fontSize: '0.8rem' }}>
                                            El cliente no tiene saldos pendientes.
                                        </div>
                                    ) : (
                                        historialData.historialDeudas.filter(d => d.saldoPendiente > 0).map((deuda) => (
                                            <div key={deuda.id} style={{ background: '#1e293b', borderLeft: '4px solid #ef4444', padding: '10px', borderRadius: '8px', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ color: '#f87171', fontSize: '0.82rem', display: 'block' }}>Deuda #{deuda.id} ({deuda.estado})</strong>
                                                    <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Vence el: {formatearFecha(deuda.fechaVencimiento)}</small>
                                                </div>
                                                <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>{formatearCordobas(deuda.saldoPendiente)}</strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* MODAL CREACIÓN / EDICIÓN DE CLIENTE */}
            {mostrarModalCliente && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1rem', fontWeight: 700 }}>
                                {editandoClienteId ? 'Modificar Cliente' : 'Registrar Cliente'}
                            </h3>
                            <button onClick={() => setMostrarModalCliente(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        
                        <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Nombre Completo</label>
                                <input type="text" value={cliNombre} onChange={e => setCliNombre(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Teléfono Móvil</label>
                                <input type="text" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Email</label>
                                <input type="email" value={cliEmail} onChange={e => setCliEmail(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Etiquetas (Separadas por comas)</label>
                                <input type="text" value={cliEtiquetas} onChange={e => setCliEtiquetas(e.target.value)} placeholder="Ej: Frecuente, Taller" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Observaciones Internas</label>
                                <textarea value={cliObservaciones} onChange={e => setCliObservaciones(e.target.value)} rows={2} placeholder="Notas del cliente..." style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} />
                            </div>

                            {editandoClienteId && (
                                <div>
                                    <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Puntos Club</label>
                                    <input type="number" value={cliPuntos} onChange={e => setCliPuntos(Number(e.target.value))} min={0} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                                </div>
                            )}

                            <button type="submit" style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                                <FaSave /> Guardar Cliente
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL ERROR DE INTEGRIDAD AL ELIMINAR */}
            {errorEliminacion && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                        <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', margin: '0 auto' }} />
                        <h4 style={{ color: '#f87171', margin: 0 }}>No se puede eliminar</h4>
                        <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>{errorEliminacion.mensajePrincipal}</p>

                        {errorEliminacion.detalles && (
                            <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', fontSize: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {errorEliminacion.detalles.tieneVentas ? <FaBan color="#ef4444" /> : <FaCheckCircle color="#10b981" />}
                                    <span style={{ color: errorEliminacion.detalles.tieneVentas ? '#f87171' : '#94a3b8' }}>
                                        {errorEliminacion.detalles.tieneVentas ? "Tiene ventas o facturas" : "Sin ventas"}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {errorEliminacion.detalles.tieneTaller ? <FaBan color="#ef4444" /> : <FaCheckCircle color="#10b981" />}
                                    <span style={{ color: errorEliminacion.detalles.tieneTaller ? '#f87171' : '#94a3b8' }}>
                                        {errorEliminacion.detalles.tieneTaller ? "Tiene equipos en taller" : "Sin taller"}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {errorEliminacion.detalles.tieneDeudas ? <FaBan color="#ef4444" /> : <FaCheckCircle color="#10b981" />}
                                    <span style={{ color: errorEliminacion.detalles.tieneDeudas ? '#f87171' : '#94a3b8' }}>
                                        {errorEliminacion.detalles.tieneDeudas ? "Tiene saldos o deudas" : "Sin deudas"}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setErrorEliminacion(null)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', fontSize: '0.85rem' }}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};