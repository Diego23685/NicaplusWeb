import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaExclamationTriangle, FaSave, FaClock, FaTimes, FaTools, FaUser } from 'react-icons/fa';

export const TicketsSoporteCRM: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO: CREAR TICKET
    const [idCliente, setIdCliente] = useState('');
    const [tipoTicket, setTipoTicket] = useState('Garantía');
    const [descripcionFalla, setDescripcionFalla] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');

    // MODAL: CAMBIO DE ESTADO
    const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);
    const [nuevoEstado, setNuevoEstado] = useState('');
    const [notasResolucion, setNotasResolucion] = useState('');
    const [mostrarModalEstado, setMostrarModalEstado] = useState(false);

    const cargarDatos = async () => {
        try {
            const [resTickets, resClientes] = await Promise.all([
                api.get('/ticketssoporte'),
                api.get('/clientes')
            ]);
            setTickets(resTickets.data);
            setClientes(resClientes.data);
        } catch (err) {
            console.error("Error cargando tickets de soporte:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const crearTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idCliente) {
            alert("Debe seleccionar un cliente real de la lista.");
            return;
        }

        try {
            await api.post('/ticketssoporte', {
                idCliente: Number(idCliente),
                tipoTicket,
                descripcionFalla,
                estado: "Pendiente"
            });
            alert("Ticket de incidencia aperturado.");
            setDescripcionFalla('');
            setIdCliente('');
            setBusquedaCliente('');
            cargarDatos();
        } catch {
            alert("Error de red al guardar el ticket.");
        }
    };

    const abrirEditorEstado = (t: any) => {
        setTicketSeleccionado(t);
        setNuevoEstado(t.estado);
        setNotasResolucion(t.notasResolucion || '');
        setMostrarModalEstado(true);
    };

    const guardarCambioEstado = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/ticketssoporte/${ticketSeleccionado.id}/estado?nuevoEstado=${nuevoEstado}`, 
                JSON.stringify(notasResolucion), 
                { headers: { 'Content-Type': 'application/json' } }
            );
            alert("Estado del reclamo actualizado.");
            setMostrarModalEstado(false);
            cargarDatos();
        } catch {
            alert("Fallo al actualizar el ticket.");
        }
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.telefono.includes(busquedaCliente)
    );

    const colorEstado = (estado: string) => {
        const estilos: any = {
            'Pendiente': '#ef4444',
            'En proceso': '#f59e0b',
            'Esperando proveedor': '#38bdf8',
            'Resuelto': '#10b981'
        };
        return estilos[estado] || '#94a3b8';
    };

    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Cargando bitácora de incidencias...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
            
            {/* ENCABEZADO */}
            <div>
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Módulo de Reclamos, Garantías y Tickets</h3>
                <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Administración de cuentas caídas, reposiciones y flujos con proveedores.</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* PANEL IZQUIERDO: FORMULARIO APERTURA TICKET */}
                <div style={{ flex: '1 1 320px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
                    <h4 style={{ color: '#ef4444', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><FaExclamationTriangle /> Reportar Nueva Falla</h4>
                    <form onSubmit={crearTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaUser size={10} /> Buscar Cliente Afectado</label>
                            <input type="text" placeholder="🔍 Buscar por nombre o móvil..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} style={{ ...inputEstilo, padding: '6px 10px' }} />
                            <select value={idCliente} onChange={e => {
                                setIdCliente(e.target.value);
                                const text = e.target.options[e.target.selectedIndex].text;
                                if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                            }} style={{ ...inputEstilo, cursor: 'pointer' }} required>
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tipo de Incidencia / Reclamo</label>
                            <select value={tipoTicket} onChange={e => setTipoTicket(e.target.value)} style={{ ...inputEstilo, cursor: 'pointer' }}>
                                <option value="Garantía">Garantía</option>
                                <option value="Cambio de perfil">Cambio de perfil</option>
                                <option value="Cambio de contraseña">Cambio de contraseña</option>
                                <option value="Cliente no puede ingresar">Cliente no puede ingresar</option>
                                <option value="Reposición">Reposición</option>
                                <option value="Reembolso">Reembolso</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Descripción Detallada de la Falla</label>
                            <textarea rows={4} value={descripcionFalla} onChange={e => setDescripcionFalla(e.target.value)} style={{ ...inputEstilo, resize: 'none' }} placeholder="Ej: Netflix arroja clave incorrecta. Cuenta comprada hace 5 días." required />
                        </div>

                        <button type="submit" style={{ padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}><FaTools /> Abrir Orden Soporte</button>
                    </form>
                </div>

                {/* PANEL DERECHO: CRONOLOGÍA / GRILLA DE TICKETS */}
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {tickets.map(t => (
                        <div key={t.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ color: colorEstado(t.estado), fontWeight: 'bold', fontSize: '0.75rem', background: 'rgba(15,23,42,0.4)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${colorEstado(t.estado)}` }}>
                                        {t.estado.toUpperCase()}
                                    </span>
                                    <strong style={{ fontSize: '0.95rem', color: '#38bdf8' }}>{t.tipoTicket} (OS #{t.id})</strong>
                                </div>
                                <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>{t.descripcionFalla}</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #233249', paddingTop: '6px', marginTop: '6px' }}>
                                    <small style={{ color: '#94a3b8' }}>👤 Cliente: <strong style={{ color: '#fff' }}>{t.clienteNombre}</strong> ({t.clienteTelefono})</small>
                                    <small style={{ color: '#64748b' }}>📅 Reportado: {new Date(t.fechaCreacion).toLocaleString()}</small>
                                    {t.notasResolucion && (
                                        <small style={{ color: '#f59e0b', background: '#101f30', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', display: 'block', borderLeft: '3px solid #f59e0b' }}>
                                            📝 Resolución: {t.notasResolucion}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={() => abrirEditorEstado(t)}
                                style={{ padding: '6px 10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
                            >
                                Gestionar
                            </button>
                        </div>
                    ))}
                    {tickets.length === 0 && (
                        <div style={{ background: '#1e293b', border: '1px dashed #334155', padding: '40px', borderRadius: '12px', color: '#64748b', textAlign: 'center' }}>
                            No hay reclamos ni tickets de soporte técnico activos.
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: CAMBIO DE ESTADO Y NOTAS DE RESOLUCIÓN */}
            {mostrarModalEstado && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', maxWidth: '420px', width: '90%', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 'bold' }}><FaClock /> Gestionar Ticket #{ticketSeleccionado?.id}</h3>
                            <button onClick={() => setMostrarModalEstado(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <form onSubmit={guardarCambioEstado} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Actualizar Estado Operativo</label>
                                <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)} style={{ ...inputEstilo, cursor: 'pointer' }}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Esperando proveedor">Esperando proveedor</option>
                                    <option value="Resuelto">Resuelto</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Notas Internas / Diagnóstico de Cierre</label>
                                <textarea rows={3} value={notasResolucion} onChange={e => setNotasResolucion(e.target.value)} style={{ ...inputEstilo, resize: 'none' }} placeholder="Ej: Se repuso la pantalla con el proveedor VIP. Nueva clave enviada." required />
                            </div>
                            <button type="submit" style={{ padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}><FaSave /> Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};