import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FaWhatsapp, FaHistory, FaTimes, FaSearch, FaDollarSign, FaBan, FaCalendarAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface Cliente {
    nombre: string;
    telefono?: string;
}

interface Suscripcion {
    id: number;
    nombreServicio: string;
    detallesCredenciales: string;
    fechaVencimiento: string;
    diasRestantes: number;
    alertaFiltro: string;
    costoRenovacion: number;
    cliente?: Cliente;
    estado?: string;
}

interface HistorialRenovacion {
    id: number;
    monto: number;
    metodoPago: string;
    fechaPago: string;
    nuevaFechaVencimiento: string;
    observacion: string;
}

export const Renovaciones: React.FC = () => {
    const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
    const [filtroAlerta, setFiltroAlerta] = useState<string>('Todos');
    const [busqueda, setBusqueda] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);

    // ESTADO PARA EXPANDIR / COLAPSAR TARJETAS POR ID
    const [tarjetaExpandidaId, setTarjetaExpandidaId] = useState<number | null>(null);

    const [mostrarHistorial, setMostrarHistorial] = useState<boolean>(false);
    const [historialRenovaciones, setHistorialRenovaciones] = useState<HistorialRenovacion[]>([]);
    const [servicioSeleccionado, setServicioSeleccionado] = useState<Suscripcion | null>(null);
    const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);

    const [mostrarRenovar, setMostrarRenovar] = useState<boolean>(false);
    const [suscripcionRenovar, setSuscripcionRenovar] = useState<Suscripcion | null>(null);
    const [monto, setMonto] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
    const [fechaPago, setFechaPago] = useState<string>('');

    const [mostrarCancelar, setMostrarCancelar] = useState<boolean>(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');

    const obtenerFechaLocalHoy = (): string => {
        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const cargarSuscripciones = async () => {
        try {
            const res = await api.get<Suscripcion[]>('/suscripciones/alertas');
            setSuscripciones(res.data || []);
        } catch (err) {
            console.error("Error al traer alertas de renovación:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { 
        cargarSuscripciones(); 
    }, []);

    const suscripcionesFiltradas = useMemo(() => {
        const termino = busqueda.toLowerCase();
        return suscripciones.filter(s => {
            const coincideTexto = s.nombreServicio.toLowerCase().includes(termino) || 
                                  (s.cliente?.nombre?.toLowerCase().includes(termino) ?? false);
            const coincideAlerta = filtroAlerta === 'Todos' ? true : s.alertaFiltro === filtroAlerta;
            return coincideTexto && coincideAlerta;
        });
    }, [suscripciones, busqueda, filtroAlerta]);

    const toggleExpandirTarjeta = (id: number) => {
        setTarjetaExpandidaId(prevId => (prevId === id ? null : id));
    };

    const dispararRecordatorioWhatsApp = (item: Suscripcion) => {
        if (!item.cliente || !item.cliente.telefono) {
            alert("Este cliente no cuenta con un teléfono registrado.");
            return;
        }
        const telefonoLimpio = item.cliente.telefono.replace(/[^0-9]/g, '');
        const fechaFormateada = new Date(item.fechaVencimiento).toLocaleDateString();

        let saludoUrgencia = `vence el ${fechaFormateada}`;
        if (item.diasRestantes === 0) saludoUrgencia = "*VENCE HOY MISMO*";
        if (item.diasRestantes < 0) saludoUrgencia = "*SE ENCUENTRA VENCIDO*";

        const mensaje = `*NICAPLUS GAMING & TECH*\n` +
            `Hola ${item.cliente.nombre}, te saludamos de NICAPLUS.\n` +
            `Te notificamos que tu servicio de *${item.nombreServicio}* ${saludoUrgencia}.\n\n` +
            `Puedes realizar tu depósito o transferencia para procesar tu renovación y evitar la caída o corte de tu perfil.\n\n` +
            `¡Gracias por tu preferencia!`;

        window.open(`https://wa.me/505${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const abrirHistorial = async (suscripcion: Suscripcion) => {
        try {
            setCargandoHistorial(true);
            setServicioSeleccionado(suscripcion);
            const res = await api.get<HistorialRenovacion[]>(`/renovaciones/suscripcion/${suscripcion.id}`);
            setHistorialRenovaciones(res.data || []);
            setMostrarHistorial(true);
        } catch (error) {
            console.error("Error cargando historial:", error);
            alert("No se pudo cargar el historial de renovaciones.");
        } finally {
            setCargandoHistorial(false);
        }
    };

    const procesarRenovacion = async () => {
        if (!suscripcionRenovar) return;
        if (!fechaPago) {
            alert("Por favor seleccione una fecha válida.");
            return;
        }

        try {
            const datos = {
                idSuscripcion: suscripcionRenovar.id,
                monto: monto,
                metodoPago: metodoPago,
                fechaPago: fechaPago,
                observacion: `Renovación ${suscripcionRenovar.nombreServicio}`
            };

            await api.post('/renovaciones', datos);
            alert("Renovación procesada correctamente.");
            setMostrarRenovar(false);
            setSuscripcionRenovar(null);
            setCargando(true);
            await cargarSuscripciones();
        } catch (error: any) {
            console.error("Error procesando renovación:", error);
            alert(error.response?.data || "No se pudo procesar la renovación.");
        }
    };

    const procesarCancelacion = async () => {
        if (!suscripcionRenovar) return;
        if (!motivoCancelacion.trim()) {
            alert("Debe ingresar un motivo.");
            return;
        }

        try {
            const res = await api.post('/renovaciones/cancelar', {
                idSuscripcion: suscripcionRenovar.id,
                motivo: motivoCancelacion
            });
            
            alert(res.data.mensaje || "Operación procesada correctamente."); 
            
            setMostrarCancelar(false);
            setSuscripcionRenovar(null);
            setMotivoCancelacion("");
            setCargando(true);
            await cargarSuscripciones();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.mensaje || error.response?.data || "No se pudo cancelar el servicio.");
        }
    };

    const badgeEstilo = (alerta: string) => {
        const estilos: Record<string, { bg: string; color: string }> = {
            'Vencido': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
            'Hoy': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
            '1 Dia': { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },
            '3 Dias': { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
            '7 Dias': { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
            'Normal': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
        };
        return estilos[alerta] || estilos['Normal'];
    };

    if (cargando) return (
        <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>
            Auditando cronología de vencimientos...
        </div>
    );

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Alertas de Renovación</h3>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Monitoreo de cuentas streaming y licencias</small>
                </div>

                {/* Filtros horizontales por estatus de alerta */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                    {['Todos', 'Vencido', 'Hoy', '1 Dia', '3 Dias', '7 Dias'].map((tipo) => (
                        <button 
                            key={tipo}
                            onClick={() => setFiltroAlerta(tipo)}
                            style={{
                                background: filtroAlerta === tipo ? '#38bdf8' : '#0f172a',
                                color: filtroAlerta === tipo ? '#0f172a' : '#94a3b8',
                                border: '1px solid #334155',
                                padding: '6px 12px',
                                borderRadius: '16px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                            }}
                        >
                            {tipo === 'Todos' ? '👁️ Ver Todas' : tipo === 'Vencido' ? '🛑 Vencidas' : `⏰ ${tipo}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* BÚSQUEDA INPUT */}
            <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente o servicio..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
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

            {/* FEED MÓVIL EN ACORDEÓN COMPACTO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {suscripcionesFiltradas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                        No hay renovaciones que requieran atención con este criterio.
                    </div>
                ) : (
                    suscripcionesFiltradas.map((s) => {
                        const configBadge = badgeEstilo(s.alertaFiltro);
                        const estaExpandido = tarjetaExpandidaId === s.id;

                        return (
                            <div 
                                key={s.id} 
                                style={{ 
                                    background: '#1e293b', 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    border: '1px solid #334155', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '8px' 
                                }}
                            >
                                {/* FILA COMPACTA PRINCIPAL: CLIENTE + INDICADOR + BOTÓN DESPLEGABLE */}
                                <div 
                                    onClick={() => toggleExpandirTarjeta(s.id)}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: '#38bdf8', fontSize: '0.8rem' }}>
                                            {estaExpandido ? <FaChevronUp /> : <FaChevronDown />}
                                        </span>
                                        <div>
                                            <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>
                                                {s.cliente?.nombre || 'Cliente Genérico'}
                                            </strong>
                                            <small style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                📞 {s.cliente?.telefono || 'Sin número'}
                                            </small>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ background: configBadge.bg, color: configBadge.color, border: `1px solid ${configBadge.color}`, padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                                            {s.alertaFiltro === 'Normal' ? 'Vigente ✓' : s.alertaFiltro}
                                        </span>
                                    </div>
                                </div>

                                {/* CONTENIDO AMPLIADO / DESPLEGABLE (SOLO SE MUESTRA AL TOCAR LA TARJETA) */}
                                {estaExpandido && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #334155', paddingTop: '8px', marginTop: '2px' }}>
                                        {/* Detalle del producto / servicio a renovar */}
                                        <div style={{ background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>📺 {s.nombreServicio}</strong>
                                                <strong style={{ color: '#10b981', fontSize: '0.82rem' }}>C$ {s.costoRenovacion}</strong>
                                            </div>
                                            <small style={{ color: '#cbd5e1', fontSize: '0.72rem', wordBreak: 'break-all' }}>
                                                {s.detallesCredenciales}
                                            </small>
                                        </div>

                                        {/* Fechas de vencimiento y estatus */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaCalendarAlt size={10} /> Vence: {new Date(s.fechaVencimiento).toLocaleDateString()}
                                            </span>
                                            <strong style={{ color: s.diasRestantes < 0 ? '#ef4444' : '#10b981', fontSize: '0.75rem' }}>
                                                {s.diasRestantes < 0 ? `Hace ${Math.abs(s.diasRestantes)} días` : s.diasRestantes === 0 ? '¡Vence Hoy!' : `En ${s.diasRestantes} días`}
                                            </strong>
                                        </div>
                                    </div>
                                )}

                                {/* BARRA FIJA DE BOTONES DE ACCIÓN (SIEMPRE VISIBLES) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); dispararRecordatorioWhatsApp(s); }}
                                        style={{ background: '#25D366', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                                        title="Enviar aviso por WhatsApp"
                                    >
                                        <FaWhatsapp /> Avisar
                                    </button>

                                    <button 
                                        onClick={(e) => { e.stopPropagation(); abrirHistorial(s); }}
                                        style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px', borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                                        title="Ver historial de pagos"
                                    >
                                        <FaHistory /> Hist.
                                    </button>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSuscripcionRenovar(s);
                                            setMonto(s.costoRenovacion);
                                            setFechaPago(obtenerFechaLocalHoy());
                                            setMostrarRenovar(true);
                                        }}
                                        style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                                    >
                                        <FaDollarSign /> Renovar
                                    </button>

                                    <button 
                                        disabled={s.estado === 'NoRenovar'}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSuscripcionRenovar(s);
                                            setMotivoCancelacion("");
                                            setMostrarCancelar(true);
                                        }}
                                        style={{ background: s.estado === 'NoRenovar' ? '#334155' : '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '6px', fontWeight: 700, fontSize: '0.72rem', cursor: s.estado === 'NoRenovar' ? 'not-allowed' : 'pointer', opacity: s.estado === 'NoRenovar' ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                                    >
                                        <FaBan /> Cancelar
                                    </button>
                                </div>

                            </div>
                        );
                    })
                )}
            </div>

            {/* MODAL HISTORIAL SIDEBAR */}
            {mostrarHistorial && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>📜 Historial de Pagos</h4>
                            <button onClick={() => setMostrarHistorial(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        {servicioSeleccionado && (
                            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                                <strong style={{ color: '#fff', display: 'block' }}>{servicioSeleccionado.nombreServicio}</strong>
                                <small style={{ color: '#94a3b8' }}>Cliente: {servicioSeleccionado.cliente?.nombre}</small>
                            </div>
                        )}

                        {cargandoHistorial ? (
                            <p style={{ color: '#38bdf8', fontSize: '0.8rem', textAlign: 'center' }}>Cargando historial...</p>
                        ) : historialRenovaciones.length === 0 ? (
                            <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', margin: '14px 0' }}>Esta suscripción todavía no tiene renovaciones.</p>
                        ) : (
                            historialRenovaciones.map((r) => (
                                <div key={r.id} style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong style={{ color: '#10b981' }}>C$ {r.monto}</strong>
                                        <span style={{ color: '#94a3b8' }}>{r.metodoPago}</span>
                                    </div>
                                    <small style={{ color: '#64748b' }}>Pago: {new Date(r.fechaPago).toLocaleDateString()}</small>
                                    <small style={{ color: '#38bdf8', fontWeight: 700 }}>Nuevo vencimiento: {new Date(r.nuevaFechaVencimiento).toLocaleDateString()}</small>
                                    {r.observacion && <p style={{ margin: '2px 0 0 0', color: '#cbd5e1', fontSize: '0.7rem' }}>{r.observacion}</p>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* MODAL PROCESAR RENOVACIÓN PAGO */}
            {mostrarRenovar && suscripcionRenovar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>💵 Procesar Renovación</h4>
                            <button onClick={() => { setMostrarRenovar(false); setSuscripcionRenovar(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#fff', display: 'block' }}>{suscripcionRenovar.nombreServicio}</strong>
                            <small style={{ color: '#94a3b8', display: 'block' }}>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                            <small style={{ color: '#f59e0b', display: 'block' }}>Vencimiento actual: {new Date(suscripcionRenovar.fechaVencimiento).toLocaleDateString()}</small>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Fecha de Pago</label>
                            <input 
                                type="date" 
                                value={fechaPago} 
                                onChange={e => setFechaPago(e.target.value)} 
                                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} 
                            />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Monto (C$)</label>
                            <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Método de Pago</label>
                            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia</option>
                                <option value="Tarjeta">Tarjeta</option>
                            </select>
                        </div>

                        <button onClick={procesarRenovacion} style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            Confirmar Pago
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL CANCELAR SERVICIO */}
            {mostrarCancelar && suscripcionRenovar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#f87171', fontSize: '0.95rem' }}>❌ Cancelar Servicio</h4>
                            <button onClick={() => setMostrarCancelar(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            <strong style={{ color: '#fff', display: 'block' }}>{suscripcionRenovar.nombreServicio}</strong>
                            <small style={{ color: '#94a3b8' }}>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Motivo de Cancelación</label>
                            <textarea value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} rows={2} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} />
                        </div>

                        <button onClick={procesarCancelacion} style={{ width: '100%', padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            Confirmar Cancelación
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};