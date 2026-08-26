import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    FaExclamationTriangle, FaSave, FaClock, FaTimes, FaTools, 
    FaUser, FaPlus, FaChevronUp, FaFilter, FaCheckCircle, 
    FaSearch, FaCommentDots
} from 'react-icons/fa';
import styles from '../assets/styles/TicketsSoporteCRM.module.css';

export const TicketsSoporteCRM: React.FC = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // Formulario colapsable en móvil
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
    const [busquedaTicket, setBusquedaTicket] = useState('');

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
            setTickets(resTickets.data || []);
            setClientes(resClientes.data || []);
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
            alert("Ticket de incidencia aperturado correctamente.");
            setDescripcionFalla('');
            setIdCliente('');
            setBusquedaCliente('');
            setMostrarFormulario(false);
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
            await api.put(`/ticketssoporte/${ticketSeleccionado.id}/estado`, {
                nuevoEstado: nuevoEstado,
                notasResolucion: notasResolucion
            });
            alert("Estado del reclamo actualizado.");
            setMostrarModalEstado(false);
            cargarDatos();
        } catch {
            alert("Fallo al actualizar el ticket.");
        }
    };

    const clientesFiltrados = useMemo(() => {
        return clientes.filter(c => 
            c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
            (c.telefono && c.telefono.includes(busquedaCliente))
        );
    }, [clientes, busquedaCliente]);

    const ticketsFiltrados = useMemo(() => {
        return tickets.filter(t => {
            const coincideEstado = filtroEstado === 'Todos' || t.estado === filtroEstado;
            const termino = busquedaTicket.toLowerCase();
            const coincideTexto = !termino || 
                t.id.toString().includes(termino) ||
                t.tipoTicket.toLowerCase().includes(termino) ||
                (t.clienteNombre && t.clienteNombre.toLowerCase().includes(termino)) ||
                (t.descripcionFalla && t.descripcionFalla.toLowerCase().includes(termino));

            return coincideEstado && coincideTexto;
        });
    }, [tickets, filtroEstado, busquedaTicket]);

    const colorBadgeEstado = (estado: string) => {
        switch (estado) {
            case 'Pendiente': return styles.badgePendiente;
            case 'En proceso': return styles.badgeEnProceso;
            case 'Esperando proveedor': return styles.badgeProveedor;
            case 'Resuelto': return styles.badgeResuelto;
            default: return styles.badgeDefault;
        }
    };

    if (cargando) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loaderPulse} />
                <span>Cargando bitácora de incidencias...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            
            {/* 1. ENCABEZADO PRINCIPAL */}
            <header className={styles.header}>
                <div>
                    <h3 className={styles.title}>Garantías y Tickets de Soporte</h3>
                    <p className={styles.subtitle}>Atención a cuentas caídas, reclamos de perfiles y reposiciones.</p>
                </div>
                <span className={styles.countBadge}>{ticketsFiltrados.length} incidencias</span>
            </header>

            {/* 2. BOTÓN ACCORDION PARA APERTURA DE TICKET EN MÓVIL */}
            <div className={styles.formAccordionWrap}>
                <button 
                    type="button" 
                    onClick={() => setMostrarFormulario(!mostrarFormulario)} 
                    className={styles.accordionToggleBtn}
                >
                    <span className={styles.accordionTitle}>
                        <FaExclamationTriangle className={styles.textRed} /> Reportar Nueva Falla / Reclamo
                    </span>
                    {mostrarFormulario ? <FaChevronUp /> : <FaPlus />}
                </button>

                <form 
                    onSubmit={crearTicket} 
                    className={`${styles.formContent} ${!mostrarFormulario ? styles.formCollapsed : ''}`}
                >
                    <div className={styles.formGroup}>
                        <label className={styles.label}><FaUser size={10} /> Cliente Afectado *</label>
                        <div className={styles.searchBoxInputWrap}>
                            <input 
                                type="text" 
                                placeholder="🔍 Filtrar por nombre o móvil..." 
                                value={busquedaCliente} 
                                onChange={e => setBusquedaCliente(e.target.value)} 
                                className={styles.input} 
                            />
                        </div>
                        <select 
                            value={idCliente} 
                            onChange={e => {
                                setIdCliente(e.target.value);
                                const text = e.target.options[e.target.selectedIndex].text;
                                if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                            }} 
                            className={styles.select} 
                            required
                        >
                            <option value="">-- Seleccionar Cliente --</option>
                            {clientesFiltrados.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tipo de Reclamo</label>
                        <select 
                            value={tipoTicket} 
                            onChange={e => setTipoTicket(e.target.value)} 
                            className={styles.select}
                        >
                            <option value="Garantía">Garantía</option>
                            <option value="Cambio de perfil">Cambio de perfil</option>
                            <option value="Cambio de contraseña">Cambio de contraseña</option>
                            <option value="Cliente no puede ingresar">Cliente no puede ingresar</option>
                            <option value="Reposición">Reposición</option>
                            <option value="Reembolso">Reembolso</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Descripción de la Falla *</label>
                        <textarea 
                            rows={3} 
                            value={descripcionFalla} 
                            onChange={e => setDescripcionFalla(e.target.value)} 
                            className={styles.textarea} 
                            placeholder="Ej: Netflix arroja clave incorrecta. Cuenta comprada hace 5 días." 
                            required 
                        />
                    </div>

                    <button type="submit" className={styles.btnCrearTicket}>
                        <FaTools /> Abrir Orden de Soporte
                    </button>
                </form>
            </div>

            {/* 3. BARRA DE BÚSQUEDA Y FILTROS POR ESTADO */}
            <div className={styles.controlsBar}>
                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por #ID, cliente, falla..." 
                        value={busquedaTicket} 
                        onChange={e => setBusquedaTicket(e.target.value)} 
                        className={styles.searchInput} 
                    />
                    {busquedaTicket && (
                        <button onClick={() => setBusquedaTicket('')} className={styles.clearBtn}>
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className={styles.filterPills}>
                    {['Todos', 'Pendiente', 'En proceso', 'Esperando proveedor', 'Resuelto'].map(st => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => setFiltroEstado(st)}
                            className={`${styles.filterPillBtn} ${filtroEstado === st ? styles.filterPillActive : ''}`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. FEED DE TICKETS RESPONSIVO */}
            <div className={styles.ticketsFeed}>
                {ticketsFiltrados.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FaCheckCircle size={32} className={styles.emptyIcon} />
                        <p>No se encontraron tickets de soporte con el criterio seleccionado.</p>
                    </div>
                ) : (
                    ticketsFiltrados.map(t => (
                        <div key={t.id} className={styles.ticketCard}>
                            <div className={styles.ticketCardHeader}>
                                <div className={styles.ticketBadgeWrap}>
                                    <span className={`${styles.badge} ${colorBadgeEstado(t.estado)}`}>
                                        {t.estado}
                                    </span>
                                    <strong className={styles.ticketType}>{t.tipoTicket}</strong>
                                    <span className={styles.ticketId}>#OS-{t.id}</span>
                                </div>
                                <button 
                                    onClick={() => abrirEditorEstado(t)} 
                                    className={styles.btnGestionar}
                                >
                                    Gestionar
                                </button>
                            </div>

                            <p className={styles.ticketDesc}>{t.descripcionFalla}</p>

                            <div className={styles.ticketFooter}>
                                <div className={styles.ticketMeta}>
                                    <span>👤 <strong>{t.clienteNombre || 'Genérico'}</strong> {t.clienteTelefono ? `(${t.clienteTelefono})` : ''}</span>
                                    <small className={styles.ticketDate}>📅 {new Date(t.fechaCreacion).toLocaleString()}</small>
                                </div>

                                {t.notasResolucion && (
                                    <div className={styles.resolutionBox}>
                                        <FaCommentDots className={styles.textOrange} />
                                        <span><strong>Resolución:</strong> {t.notasResolucion}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 5. MODAL: ACTUALIZACIÓN DE ESTADO Y RESOLUCIÓN */}
            {mostrarModalEstado && ticketSeleccionado && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                <FaClock /> Gestionar Ticket #{ticketSeleccionado.id}
                            </h3>
                            <button onClick={() => setMostrarModalEstado(false)} className={styles.modalCloseBtn}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={guardarCambioEstado} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Actualizar Estado</label>
                                <select 
                                    value={nuevoEstado} 
                                    onChange={e => setNuevoEstado(e.target.value)} 
                                    className={styles.select}
                                >
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Esperando proveedor">Esperando proveedor</option>
                                    <option value="Resuelto">Resuelto</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Diagnóstico de Cierre / Notas Internas *</label>
                                <textarea 
                                    rows={3} 
                                    value={notasResolucion} 
                                    onChange={e => setNotasResolucion(e.target.value)} 
                                    className={styles.textarea} 
                                    placeholder="Ej: Se repuso la cuenta con el proveedor. Se enviaron nuevas claves al cliente." 
                                    required 
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button 
                                    type="button" 
                                    onClick={() => setMostrarModalEstado(false)} 
                                    className={styles.btnModalCancel}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnModalConfirm}>
                                    <FaSave /> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};