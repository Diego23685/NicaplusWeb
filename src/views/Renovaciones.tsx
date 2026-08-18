import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FaWhatsapp, FaTimes, FaUser, FaKey, FaCalendarAlt, FaHistory } from 'react-icons/fa';
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
    idVenta?: number;
}

export const Renovaciones: React.FC = () => {
    const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
    const [filtroAlerta, setFiltroAlerta] = useState<string>('Todos');
    const [busqueda, setBusqueda] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(true);

    const [registroDrawer, setRegistroDrawer] = useState<Suscripcion | null>(null);

    const [mostrarHistorial, setMostrarHistorial] = useState<boolean>(false);
    const [historialRenovaciones, setHistorialRenovaciones] = useState<HistorialRenovacion[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState<boolean>(false);

    // 🟢 ESTADOS DE RENOVACIÓN
    const [mostrarRenovar, setMostrarRenovar] = useState<boolean>(false);
    const [suscripcionRenovar, setSuscripcionRenovar] = useState<Suscripcion | null>(null);
    const [monto, setMonto] = useState<number>(0);
    const [diasRenovacion, setDiasRenovacion] = useState<number>(30);
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
            
            if (registroDrawer) {
                const actualizado = res.data.find(s => s.id === registroDrawer.id);
                if (actualizado) setRegistroDrawer(actualizado);
            }
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
                                  (s.cliente?.nombre?.toLowerCase().includes(termino) ?? false) ||
                                  s.detallesCredenciales.toLowerCase().includes(termino);
            const coincideAlerta = filtroAlerta === 'Todos' ? true : s.alertaFiltro === filtroAlerta;
            return coincideTexto && coincideAlerta;
        });
    }, [suscripciones, busqueda, filtroAlerta]);

    const handleCambioDias = (nuevosDias: number) => {
        setDiasRenovacion(nuevosDias);
        if (suscripcionRenovar) {
            const costoDiario = suscripcionRenovar.costoRenovacion / 30;
            const nuevoMonto = Math.round(costoDiario * nuevosDias);
            setMonto(nuevoMonto);
        }
    };

    const abrirModalRenovacion = (s: Suscripcion) => {
        setSuscripcionRenovar(s);
        setDiasRenovacion(30);
        setMonto(s.costoRenovacion);
        setMetodoPago('Efectivo'); // Default
        setFechaPago(obtenerFechaLocalHoy());
        setMostrarRenovar(true);
    };

    const dispararRecordatorioWhatsApp = (item: Suscripcion) => {
        if (!item.cliente || !item.cliente.telefono) {
            alert("Este cliente no cuenta con un teléfono registrado.");
            return;
        }

        const telefonoLimpio = item.cliente.telefono.replace(/[^0-9]/g, '');
        const clienteNombre = item.cliente.nombre || 'Cliente';
        const plataformaPlan = item.nombreServicio;
        const credenciales = item.detallesCredenciales || 'No especificada';
        const monto = item.costoRenovacion ?? 0;

        const fechaObj = new Date(item.fechaVencimiento);
        const fechaVencimiento = new Intl.DateTimeFormat('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(fechaObj).replace(' de ', ' de ').replace(/ de (\d{4})$/, ' del $1');

        let mensaje = '';

        if (item.diasRestantes === 0) {
            mensaje = `🎬 *NICAPLUS STREAM*\n\n` +
                `Hola, *${clienteNombre}*. 👋\n\n` +
                `Te saludamos de *NICAPLUS STREAM.*\n\n` +
                `Te recordamos que tu suscripción de *${plataformaPlan}*\n\n` +
                `- (${credenciales})\n\n` + 
                `- *Vence el día de hoy* (${fechaVencimiento}).\n\n` +
                `- 💳 *Costo de renovación:* C$ ${monto}\n\n` +
                `Para evitar la suspensión de tu servicio, realiza tu pago y envíanos el comprobante por este mismo chat.\n\n` +
                `¡Gracias por elegir *NICAPLUS STREAM*! 💙`;

        } else if (item.diasRestantes < 0) {
            mensaje = `🎬 *NICAPLUS STREAM*\n\n` +
                `Hola, *${clienteNombre}*. 👋\n\n` +
                `Te saludamos de *NICAPLUS STREAM.*\n\n` +
                `Te notificamos que tu suscripción de *${plataformaPlan}* \n\n` +
                `- (${credenciales})\n\n` + 
                `- *Se encuentra vencida desde el* ${fechaVencimiento}.\n\n` +
                `- 💳 *Costo de renovación:* C$ ${monto}\n\n` +
                `Para renovar tu servicio, realiza tu depósito o transferencia y envíanos el comprobante por este mismo chat.\n\n` +
                `- ⚠️ *Importante:* Si la renovación no se realiza a tiempo, el perfil podrá ser suspendido o reasignado de acuerdo con la disponibilidad del servicio.\n\n` +
                `¡Gracias por elegir *NICAPLUS STREAM*! 💙`;

        } else {
            const diasTexto = item.diasRestantes === 1 ? '1 día' : `${item.diasRestantes} días`;
            mensaje = `🎬 *NICAPLUS STREAM*\n\n` +
                `Hola, *${clienteNombre}*. 👋\n\n` +
                `Te saludamos de *NICAPLUS STREAM.*\n\n` +
                `Te informamos que tu suscripción de *${plataformaPlan}* (${credenciales})\n\n` +
                `- *Vence en* ${diasTexto}, el ${fechaVencimiento}.\n\n` +
                `- 💳 *Costo de renovación:* C$ ${monto}\n\n` +
                `Te recomendamos estar atento a la fecha de vencimiento para evitar interrupciones en tu servicio.\n\n` +
                `- 📎 Una vez realizado el pago, envíanos tu comprobante por este mismo chat para procesar tu renovación.\n\n` +
                `¡Gracias por elegir *NICAPLUS STREAM*! 💙`;
        }

        window.open(`https://api.whatsapp.com/send/?phone=505${telefonoLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const abrirHistorial = async (suscripcion: Suscripcion) => {
        try {
            setCargandoHistorial(true);
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
        if (diasRenovacion <= 0) {
            alert("Ingrese un número válido de días para la renovación.");
            return;
        }

        const esCredito = metodoPago === 'Credito';

        try {
            const datos = {
                idSuscripcion: suscripcionRenovar.id,
                monto: monto,
                dias: diasRenovacion,
                metodoPago: metodoPago,
                fechaPago: fechaPago,
                observacion: esCredito 
                    ? `[CRÉDITO PENDIENTE] Renovación por ${diasRenovacion} día(s) - ${suscripcionRenovar.nombreServicio}`
                    : `Renovación por ${diasRenovacion} día(s) - ${suscripcionRenovar.nombreServicio}`
            };

            await api.post('/renovaciones', datos);
            alert(esCredito ? "Renovación a CRÉDITO registrada correctamente." : "Renovación procesada correctamente.");
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
                    placeholder="Filtrar por servicio, cliente o correo/credencial..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                    className={styles.input} 
                />
            </div>

            {/* TABLA DE CONTENIDO */}
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
                                const esSeleccionado = registroDrawer?.id === s.id;

                                return (
                                    <tr 
                                        key={s.id} 
                                        onClick={() => setRegistroDrawer(s)}
                                        className={`${styles.tableRowClickable} ${esSeleccionado ? styles.rowSelected : ''}`}
                                    >
                                        <td>
                                            <strong>{s.cliente?.nombre || 'Cliente Genérico'}</strong>
                                            <small className={styles.subText}>📞 {s.cliente?.telefono || 'Sin número'}</small>
                                        </td>
                                        <td>
                                            <strong>{s.nombreServicio}</strong>
                                            <small className={styles.subTextCredencialesTruncate}>
                                                {s.detallesCredenciales}
                                            </small>
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

                                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <div className={styles.actionsCellWrapper}>
                                                <button onClick={() => dispararRecordatorioWhatsApp(s)} className={styles.btnAvisar}>
                                                    <FaWhatsapp /> Avisar
                                                </button>

                                                <button onClick={() => { setRegistroDrawer(s); abrirHistorial(s); }} className={styles.btnHistorialIcon}>
                                                    📜
                                                </button>

                                                <button
                                                    onClick={() => abrirModalRenovacion(s)}
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

            {/* DRAWER / GAVETA DESPLEGABLE */}
            {registroDrawer && (
                <>
                    <div className={styles.drawerOverlay} onClick={() => setRegistroDrawer(null)} />
                    <aside className={styles.drawerContainer}>
                        <div className={styles.drawerHeader}>
                            <div>
                                <h3>Detalle del Servicio</h3>
                                <span className={styles.drawerSubhead}>ID Registro: #{registroDrawer.id}</span>
                            </div>
                            <button onClick={() => setRegistroDrawer(null)} className={styles.btnCloseDrawer}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.drawerBody}>
                            <div className={styles.drawerBadgeWrapper}>
                                <span className={styles.badgeAlert} style={{ background: badgeEstilo(registroDrawer.alertaFiltro).bg, color: badgeEstilo(registroDrawer.alertaFiltro).color }}>
                                    Estatus: {registroDrawer.alertaFiltro === 'Normal' ? 'Vigente ✓' : registroDrawer.alertaFiltro}
                                </span>
                                {registroDrawer.estado === 'NoRenovar' && (
                                    <span className={styles.badgeNoRenovar}>🚫 Marcar como No Renovar</span>
                                )}
                            </div>

                            <div className={styles.drawerSection}>
                                <h4><FaUser /> Datos del Cliente</h4>
                                <div className={styles.drawerCard}>
                                    <p><strong>Nombre:</strong> {registroDrawer.cliente?.nombre || 'Cliente Genérico'}</p>
                                    <p><strong>Teléfono:</strong> {registroDrawer.cliente?.telefono || 'Sin número de contacto'}</p>
                                </div>
                            </div>

                            <div className={styles.drawerSection}>
                                <h4><FaKey /> Credenciales / Detalles de Cuenta</h4>
                                <div className={`${styles.drawerCard} ${styles.credentialsBox}`}>
                                    <p className={styles.servicioTitle}>{registroDrawer.nombreServicio}</p>
                                    <div className={styles.fullCredentialsText}>
                                        {registroDrawer.detallesCredenciales}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.drawerSection}>
                                <h4><FaCalendarAlt /> Estado Financiero</h4>
                                <div className={styles.drawerCardGrid}>
                                    <div>
                                        <small>Costo Base Mensual</small>
                                        <p className={styles.montoHighlight}>C$ {registroDrawer.costoRenovacion}</p>
                                    </div>
                                    <div>
                                        <small>Fecha Vencimiento</small>
                                        <p>{new Date(registroDrawer.fechaVencimiento).toLocaleDateString()}</p>
                                        <small style={{ color: registroDrawer.diasRestantes < 0 ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>
                                            {registroDrawer.diasRestantes < 0 ? `Vencido hace ${Math.abs(registroDrawer.diasRestantes)} días` : registroDrawer.diasRestantes === 0 ? '¡Vence Hoy!' : `Faltan ${registroDrawer.diasRestantes} días`}
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.drawerSection}>
                                <div className={styles.drawerSectionHeader}>
                                    <h4><FaHistory /> Historial de Pagos</h4>
                                    <button 
                                        onClick={() => abrirHistorial(registroDrawer)} 
                                        className={styles.btnVerHistorialDrawer}
                                    >
                                        Cargar Historial
                                    </button>
                                </div>

                                {mostrarHistorial && (
                                    <div className={styles.historialContainerDrawer}>
                                        {cargandoHistorial ? (
                                            <p className={styles.loadingText}>Cargando cronología...</p>
                                        ) : historialRenovaciones.length === 0 ? (
                                            <p className={styles.emptyHistorial}>Sin renovaciones previas registradas.</p>
                                        ) : (
                                            historialRenovaciones.map((r) => (
                                                <div key={r.id} className={styles.historialCard}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong>💰 C${r.monto}</strong>
                                                        {r.idVenta && (
                                                            <span className={styles.facturaBadge}>
                                                                Factura #{r.idVenta}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <small>Método: {r.metodoPago}</small>
                                                    <small>Pago: {new Date(r.fechaPago).toLocaleDateString()}</small>
                                                    <small className={styles.vencimientoFuturo}>
                                                        Nuevo Venc.: {new Date(r.nuevaFechaVencimiento).toLocaleDateString()}
                                                    </small>
                                                    {r.observacion && <p className={styles.obsText}>{r.observacion}</p>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.drawerFooter}>
                            <button 
                                onClick={() => dispararRecordatorioWhatsApp(registroDrawer)} 
                                className={styles.btnAvisarDrawer}
                            >
                                <FaWhatsapp /> Enviar Aviso WhatsApp
                            </button>
                            <button
                                onClick={() => abrirModalRenovacion(registroDrawer)}
                                className={styles.btnRenovarDrawer}
                            >
                                💵 Renovar
                            </button>
                        </div>
                    </aside>
                </>
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

                        <label className={styles.label}>Duración (Días)</label>
                        <input 
                            type="number"
                            min={1}
                            value={diasRenovacion} 
                            onChange={e => handleCambioDias(Number(e.target.value))} 
                            className={styles.input} 
                            style={{ marginBottom: '15px' }}
                            placeholder="Ej. 30, 60, 90..."
                        />

                        <label className={styles.label}>Fecha de Pago</label>
                        <input 
                            type="date" 
                            value={fechaPago} 
                            onChange={e => setFechaPago(e.target.value)} 
                            className={styles.input}
                            style={{ marginBottom: '15px' }} 
                        />

                        <label className={styles.label}>Monto Total (C$)</label>
                        <input 
                            type="number" 
                            value={monto} 
                            onChange={e => setMonto(Number(e.target.value))} 
                            className={styles.input} 
                            style={{ marginBottom: '15px' }} 
                        />

                        <label className={styles.label}>Método de Pago</label>
                        <select 
                            value={metodoPago} 
                            onChange={e => setMetodoPago(e.target.value)} 
                            className={styles.select} 
                            style={{ marginBottom: '20px' }}
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Credito">🔴 Crédito (Pendiente)</option>
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