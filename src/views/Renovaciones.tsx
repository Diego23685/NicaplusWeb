import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FaWhatsapp } from 'react-icons/fa';
import styles from '../assets/styles/Renovaciones.module.css';

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

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Auditando cronología de vencimientos...</div>;

    return (
        <div className={styles.container}>
            {/* ENCABEZADO */}
            <div className={styles.header}>
                <h3>Control de Renovaciones y Alertas</h3>
                <p>Monitoreo preventivo de cuentas streaming y licencias activas.</p>
            </div>

            {/* FILTROS CRÍTICOS */}
            <div className={styles.filterContainer}>
                {['Todos', 'Vencido', 'Hoy', '1 Dia', '3 Dias', '7 Dias'].map((tipo) => (
                    <button 
                        key={tipo}
                        onClick={() => setFiltroAlerta(tipo)}
                        className={styles.filterBtn}
                        style={{
                            background: filtroAlerta === tipo ? '#581c7e' : '#1e293b'
                        }}
                    >
                        {tipo === 'Todos' ? '👁️ Ver Todas' : tipo === 'Vencido' ? '🛑 Vencidas' : `⏰ ${tipo}`}
                    </button>
                ))}
            </div>

            {/* BUSCADOR */}
            <div className={styles.searchContainer}>
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre de servicio o nombre de cliente..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                    className={styles.input} 
                />
            </div>

            {/* TABLA DE CONTENIDO CON SCROLL INTELIGENTE */}
            <div className={styles.tablePanel}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Servicio</th>
                                <th>Vencimiento</th>
                                <th style={{ textAlign: 'center' }}>Estatus Alerta</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suscripcionesFiltradas.map((s) => {
                                const configBadge = badgeEstilo(s.alertaFiltro);
                                return (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.cliente?.nombre || 'Cliente Genérico'}</strong>
                                            <small className={styles.subText}>📞 {s.cliente?.telefono || 'Sin número'}</small>
                                        </td>
                                        <td>
                                            <strong>{s.nombreServicio}</strong>
                                            <small className={styles.subTextCredenciales}>{s.detallesCredenciales}</small>
                                        </td>
                                        <td>
                                            {new Date(s.fechaVencimiento).toLocaleDateString()}
                                            <small style={{ display: 'block', color: s.diasRestantes < 0 ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>
                                                {s.diasRestantes < 0 ? `Hace ${Math.abs(s.diasRestantes)} días` : s.diasRestantes === 0 ? '¡Vence Hoy!' : `En ${s.diasRestantes} días`}
                                            </small>
                                        </td>
                                        
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={styles.badgeAlert} style={{ background: configBadge.bg, color: configBadge.color }}>
                                                {s.alertaFiltro === 'Normal' ? 'Vigente ✓' : s.alertaFiltro}
                                            </span>
                                            
                                            {s.estado === 'NoRenovar' && (
                                                <small style={{ display: 'block', color: '#f59e0b', marginTop: '4px', fontWeight: 'bold' }}>
                                                    🚫 No renovará
                                                </small>
                                            )}
                                        </td>

                                        <td style={{ textAlign: 'center' }}>
                                            <div className={styles.actionsCellWrapper}>
                                                <button onClick={() => dispararRecordatorioWhatsApp(s)} className={styles.btnAvisar}>
                                                    <FaWhatsapp /> Avisar
                                                </button>

                                                <button onClick={() => abrirHistorial(s)} className={styles.btnHistorialIcon}>
                                                    📜
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSuscripcionRenovar(s);
                                                        setMonto(s.costoRenovacion);
                                                        setFechaPago(obtenerFechaLocalHoy());
                                                        setMostrarRenovar(true);
                                                    }}
                                                    className={styles.btnRenovar}
                                                >
                                                    💵 Renovar
                                                </button>

                                                <button
                                                    disabled={s.estado === 'NoRenovar'}
                                                    onClick={() => {
                                                        setSuscripcionRenovar(s);
                                                        setMotivoCancelacion("");
                                                        setMostrarCancelar(true);
                                                    }}
                                                    className={styles.btnCancelarRow}
                                                    style={{
                                                        opacity: s.estado === 'NoRenovar' ? 0.5 : 1,
                                                        cursor: s.estado === 'NoRenovar' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {s.estado === 'NoRenovar' ? '🚫 Cancelado' : '❌ Cancelar'}
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
            </div>

            {/* MODAL HISTORIAL SIDEBAR */}
            {mostrarHistorial && (
                <div className={styles.sidebarHistorial}>
                    <div className={styles.sidebarHeader}>
                        <h3>📜 Historial</h3>
                        <button onClick={() => setMostrarHistorial(false)} className={styles.btnCloseSidebar}>X</button>
                    </div>
                    <hr style={{ borderColor: '#334155', margin: '15px 0' }}/>
                    {servicioSeleccionado && (
                        <div className={styles.infoCard}>
                            <strong>{servicioSeleccionado.nombreServicio}</strong>
                            <small>{servicioSeleccionado.cliente?.nombre}</small>
                        </div>
                    )}
                    {cargandoHistorial ? (
                        <p>Cargando historial...</p>
                    ) : historialRenovaciones.length === 0 ? (
                        <p style={{ color: '#94a3b8' }}>Esta suscripción todavía no tiene renovaciones.</p>
                    ) : (
                        historialRenovaciones.map((r) => (
                            <div key={r.id} className={styles.historialCard}>
                                <strong>💰 ${r.monto}</strong>
                                <small>Método: {r.metodoPago}</small>
                                <small>Fecha pago: {new Date(r.fechaPago).toLocaleDateString()}</small>
                                <small className={styles.vencimientoFuturo}>Nuevo vencimiento: {new Date(r.nuevaFechaVencimiento).toLocaleDateString()}</small>
                                <p>{r.observacion}</p>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL PROCESAR PAGO */}
            {mostrarRenovar && suscripcionRenovar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <h3 style={{ color: '#38bdf8', marginTop: 0 }}>💵 Procesar Renovación</h3>
                        <div className={styles.infoCard}>
                            <strong>{suscripcionRenovar.nombreServicio}</strong>
                            <small>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                            <small>Vencimiento actual: {new Date(suscripcionRenovar.fechaVencimiento).toLocaleDateString()}</small>
                        </div>

                        <label className={styles.label}>Fecha de Pago</label>
                        <input 
                            type="date" 
                            value={fechaPago} 
                            onChange={e => setFechaPago(e.target.value)} 
                            className={styles.input}
                            style={{ marginBottom: '15px' }} 
                        />

                        <label className={styles.label}>Monto</label>
                        <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} className={styles.input} style={{ marginBottom: '15px' }} />

                        <label className={styles.label}>Método de pago</label>
                        <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className={styles.select} style={{ marginBottom: '20px' }}>
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                        </select>

                        <div className={styles.modalActions}>
                            <button onClick={() => { setMostrarRenovar(false); setSuscripcionRenovar(null); }} className={styles.btnModalClose}>Cancelar</button>
                            <button onClick={procesarRenovacion} className={styles.btnModalConfirm}>Confirmar Pago</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CANCELAR */}
            {mostrarCancelar && suscripcionRenovar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <h3 style={{ color: '#ef4444', marginTop: 0 }}>❌ Cancelar Servicio</h3>
                        <div className={styles.infoCard}>
                            <strong>{suscripcionRenovar.nombreServicio}</strong>
                            <small>Cliente: {suscripcionRenovar.cliente?.nombre}</small>
                        </div>

                        <label className={styles.label} style={{ marginTop: '15px' }}>Motivo</label>
                        <textarea value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)} className={styles.textarea} />

                        <div className={styles.modalActions}>
                            <button onClick={() => setMostrarCancelar(false)} className={styles.btnModalClose}>Volver</button>
                            <button onClick={procesarCancelacion} className={styles.btnModalCancelAction}>Confirmar Cancelación</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};