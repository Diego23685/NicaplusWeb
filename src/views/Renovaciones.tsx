import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FaWhatsapp } from 'react-icons/fa';

// Interfaces de tipado estricto
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

    const [mostrarHistorial, setMostrarHistorial] = useState<boolean>(false);
    const [historialRenovaciones, setHistorialRenovaciones] = useState<HistorialRenovacion[]>([]);
    const [servicioSeleccionado, setServicioSeleccionado] = useState<Suscripcion | null>(null);
    const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);

    const [mostrarRenovar, setMostrarRenovar] = useState<boolean>(false);
    const [suscripcionRenovar, setSuscripcionRenovar] = useState<Suscripcion | null>(null);
    const [monto, setMonto] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
    
    // NUEVO ESTADO: Manejo manual de la fecha de pago
    const [fechaPago, setFechaPago] = useState<string>('');

    const [mostrarCancelar, setMostrarCancelar] = useState<boolean>(false);
    const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');

    // Función auxiliar para obtener la fecha de hoy en formato local YYYY-MM-DD
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
            setSuscripciones(res.data);
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
            setHistorialRenovaciones(res.data);
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
                fechaPago: fechaPago, // Se envía de forma estricta la fecha manual del input
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
            await api.post('/renovaciones/cancelar', {
                idSuscripcion: suscripcionRenovar.id,
                motivo: motivoCancelacion
            });

            alert("Servicio cancelado correctamente");
            setMostrarCancelar(false);
            setSuscripcionRenovar(null);
            setMotivoCancelacion("");

            setCargando(true);
            await cargarSuscripciones();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data || "No se pudo cancelar el servicio.");
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

    const inputEstilo = { padding: '10px 12px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Auditando cronología de vencimientos...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
            
            {/* ENCABEZADO */}
            <div>
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Control de Renovaciones y Alertas</h3>
                <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Monitoreo preventivo de cuentas streaming y licencias activas.</p>
            </div>

            {/* FILTROS CRÍTICOS */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                {['Todos', 'Vencido', 'Hoy', '1 Dia', '3 Dias', '7 Dias'].map((tipo) => (
                    <button 
                        key={tipo}
                        onClick={() => setFiltroAlerta(tipo)}
                        style={{
                            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s',
                            background: filtroAlerta === tipo ? '#581c7e' : '#1e293b',
                            color: '#fff'
                        }}
                    >
                        {tipo === 'Todos' ? '👁️ Ver Todas' : tipo === 'Vencido' ? '🛑 Vencidas' : `⏰ ${tipo}`}
                    </button>
                ))}
            </div>

            {/* BUSCADOR */}
            <div style={{ position: 'relative', width: '100%' }}>
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre de servicio o nombre de cliente..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                    style={{ ...inputEstilo, width: '100%' }} 
                />
            </div>

            {/* TABLA DE CONTENIDO */}
            <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Cliente</th>
                            <th style={{ padding: '10px' }}>Servicio</th>
                            <th style={{ padding: '10px' }}>Vencimiento</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Estatus Alerta</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suscripcionesFiltradas.map((s) => {
                            const configBadge = badgeEstilo(s.alertaFiltro);
                            return (
                                <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '10px' }}>
                                        <strong>{s.cliente?.nombre || 'Cliente Genérico'}</strong>
                                        <small style={{ display: 'block', color: '#64748b' }}>📞 {s.cliente?.telefono || 'Sin número'}</small>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <strong>{s.nombreServicio}</strong>
                                        <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.detallesCredenciales}</small>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {new Date(s.fechaVencimiento).toLocaleDateString()}
                                        <small style={{ display: 'block', color: s.diasRestantes < 0 ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>
                                            {s.diasRestantes < 0 ? `Hace ${Math.abs(s.diasRestantes)} días` : s.diasRestantes === 0 ? '¡Vence Hoy!' : `En ${s.diasRestantes} días`}
                                        </small>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: configBadge.bg, color: configBadge.color }}>
                                            {s.alertaFiltro === 'Normal' ? 'Vigente ✓' : s.alertaFiltro}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                            <button 
                                                onClick={() => dispararRecordatorioWhatsApp(s)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25d366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                <FaWhatsapp /> Avisar
                                            </button>

                                            <button
                                                onClick={() => abrirHistorial(s)}
                                                style={{ background: '#334155', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                📜
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setSuscripcionRenovar(s);
                                                    setMonto(s.costoRenovacion);
                                                    setFechaPago(obtenerFechaLocalHoy()); // Se inicializa con la fecha del navegador
                                                    setMostrarRenovar(true);
                                                }}
                                                style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                💵 Renovar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSuscripcionRenovar(s);
                                                    setMotivoCancelacion("");
                                                    setMostrarCancelar(true);
                                                }}
                                                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                ❌ Cancelar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {suscripcionesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '20px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                                    No se registran renovaciones que requieran atención bajo este criterio.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL HISTORIAL */}
            {mostrarHistorial && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: '380px', height: '100vh', background: '#0f172a', borderLeft: '1px solid #334155', padding: '20px', overflowY: 'auto', zIndex: 1000, boxShadow: '-5px 0 20px rgba(0,0,0,.4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: '#38bdf8', margin: 0 }}>📜 Historial</h3>
                        <button onClick={() => setMostrarHistorial(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px' }}>X</button>
                    </div>
                    <hr style={{ borderColor: '#334155' }}/>
                    {servicioSeleccionado && (
                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                            <strong>{servicioSeleccionado.nombreServicio}</strong>
                            <small style={{ display: 'block', color: '#94a3b8' }}>{servicioSeleccionado.cliente?.nombre}</small>
                        </div>
                    )}
                    {cargandoHistorial ? (
                        <p>Cargando historial...</p>
                    ) : historialRenovaciones.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Esta suscripción todavía no tiene renovaciones.</p>
                    ) : (
                        historialRenovaciones.map((r) => (
                            <div key={r.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                                <strong>💰 ${r.monto}</strong>
                                <small style={{ display: 'block' }}>Método: {r.metodoPago}</small>
                                <small style={{ display: 'block' }}>Fecha pago: {new Date(r.fechaPago).toLocaleDateString()}</small>
                                <small style={{ display: 'block', marginTop: '8px', color: '#4ade80' }}>Nuevo vencimiento: {new Date(r.nuevaFechaVencimiento).toLocaleDateString()}</small>
                                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{r.observacion}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL PROCESAR PAGO (CON CAMPO DE FECHA MANUAL) */}
            {mostrarRenovar && suscripcionRenovar && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                    <div style={{ width: '420px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '25px', color: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,.5)' }}>
                        <h3 style={{ color: '#38bdf8', marginTop: 0 }}>💵 Procesar Renovación</h3>
                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                            <strong>{suscripcionRenovar.nombreServicio}</strong>
                            <small style={{ display: 'block', color: '#94a3b8' }}>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                            <small style={{ display: 'block', color: '#94a3b8' }}>Vencimiento actual: {new Date(suscripcionRenovar.fechaVencimiento).toLocaleDateString()}</small>
                        </div>

                        {/* NUEVO INPUT: Selección Manual de Fecha */}
                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#94a3b8' }}>Fecha de Pago</label>
                        <input 
                            type="date" 
                            value={fechaPago} 
                            onChange={e => setFechaPago(e.target.value)} 
                            style={{ ...inputEstilo, width: '100%', marginBottom: '15px' }} 
                        />

                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#94a3b8' }}>Monto</label>
                        <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} style={{ ...inputEstilo, width: '100%', marginBottom: '15px' }} />

                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: '#94a3b8' }}>Método de pago</label>
                        <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={{ ...inputEstilo, width: '100%', marginBottom: '20px' }}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => { setMostrarRenovar(false); setSuscripcionRenovar(null); }} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Cancelar</button>
                            <button onClick={procesarRenovacion} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CANCELAR */}
            {mostrarCancelar && suscripcionRenovar && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
                    <div style={{ width: '420px', background: '#0f172a', padding: '25px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h3 style={{ color: '#ef4444' }}>❌ Cancelar Servicio</h3>
                        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                            <strong>{suscripcionRenovar.nombreServicio}</strong>
                            <small style={{ display: 'block', color: '#94a3b8' }}>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                        </div>

                        <label style={{ display: 'block', marginTop: '15px', color: '#94a3b8' }}>Motivo</label>
                        <textarea value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} style={{ width: '100%', height: '90px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px', resize: 'none', outline: 'none' }} />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button onClick={() => setMostrarCancelar(false)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Volver</button>
                            <button onClick={procesarCancelacion} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Confirmar Cancelación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};