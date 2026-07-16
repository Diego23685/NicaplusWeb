// Taller.tsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaUser, FaLaptop, FaTools, FaChevronRight, FaTimes, 
    FaMoneyBillWave, FaWrench, FaWhatsapp, FaPrint, FaCheckCircle, FaSearch 
} from 'react-icons/fa';
import styles from '../assets/styles/Taller.module.css'; // Importación de estilos modulares

interface Orden {
    id: number;
    dispositivo: string;
    diagnostico: string;
    estado: string;
    fechaIngreso: string;
    notas: string;
    cliente?: { nombre: string; telefono: string; email: string };
}

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
}

export const Taller: React.FC = () => {
    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [dispositivo, setDispositivo] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [notasGarantia, setNotasGarantia] = useState('Garantía de 30 días sobre la reparación efectuada. No cubre sellos rotos o humedad.');
    
    // Gestión de Cliente (Selección o Registro Nuevo)
    const [modoNuevoCliente, setModoNuevoCliente] = useState(false);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [emailCliente, setEmailCliente] = useState('');

    // Estados para el Modal de Entrega Final
    const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
    const [ordenAEntregar, setOrdenAEntregar] = useState<Orden | null>(null);
    const [diagnosticoFinal, setDiagnosticoFinal] = useState('');
    const [herramientasUsadas, setHerramientasUsadas] = useState('');
    const [costoReparacion, setCostoReparacion] = useState<number>(0);
    const [metodoPagoEntrega, setMetodoPagoEntrega] = useState('Efectivo');

    // Estados para el modal de selección de Avisar / Imprimir
    const [mostrarModalAccion, setMostrarModalAccion] = useState(false);
    const [ordenParaAccion, setOrdenParaAccion] = useState<Orden | null>(null);
    const [tipoAccionContexto, setTipoAccionContexto] = useState<'AlListo' | 'AlEntregar'>('AlListo');
    const [datosEntregaCache, setDatosEntregaCache] = useState<any>(null);

    const cargarDatos = async () => {
        try {
            const [resOrdenes, resClientes] = await Promise.all([
                api.get('/ordenesservicio'),
                api.get('/clientes')
            ]);
            setOrdenes(resOrdenes.data);
            setClientes(resClientes.data);
        } catch (err) {
            console.error("Error al cargar datos del taller:", err);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
        c.telefono.includes(busquedaCliente)
    );

    const imprimirDocumentosSoporte = (ordenId: number, datos: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) return;

        const html = `
            <html>
            <head>
                <title>Comprobante_Taller_${ordenId}</title>
                <style>
                    body { font-family: 'Courier New', monospace; width: 200px; margin: 10px; font-size: 11px; color: #000; line-height: 1.2; }
                    .center { text-align: center; }
                    .linea { border-bottom: 1px dashed #000; margin: 8px 0; }
                    .titulo { font-weight: bold; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="center">
                    <span class="titulo">NICAPLUS GAMING</span><br>
                    Taller de Soporte Técnico<br>
                    León, Nicaragua<br>
                    <strong>INGRESO #ORD-${ordenId}</strong>
                </div>
                <div class="linea"></div>
                <strong>CLIENTE:</strong> ${datos.cliente.nombre}<br>
                <strong>TELÉFONO:</strong> ${datos.cliente.telefono}<br>
                <strong>FECHA:</strong> ${new Date().toLocaleDateString()}<br>
                <div class="linea"></div>
                <strong>EQUIPO:</strong> ${datos.dispositivo}<br>
                <strong>FALLA:</strong><br>${datos.diagnostico}<br>
                <div class="linea"></div>
                <div class="center" style="margin-bottom: 30px;">
                    Conserve este voucher para retirar su equipo.<br>
                </div>
                <div style="page-break-after: always;"></div>
                <div class="center">
                    <span class="titulo">NICAPLUS GAMING</span><br>
                    <strong>PÓLIZA DE GARANTÍA</strong><br>
                    Asociada a Orden: #ORD-${ordenId}
                </div>
                <div class="linea"></div>
                <strong>EQUIPO:</strong> ${datos.dispositivo}<br>
                <strong>DUEÑO:</strong> ${datos.cliente.nombre}<br>
                <div class="linea"></div>
                <strong>TÉRMINOS:</strong><br>
                ${datos.notasGarantia}<br>
                <div class="linea"></div>
                <br><br>
                <div class="center">
                    _______________________<br>
                    Firma Técnico Autorizado
                </div>
                <script>
                    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
                </script>
            </body>
            </html>
        `;
        ventana.document.write(html);
        ventana.document.close();
    };

    const imprimirVoucherEntrega = (datosEntrega: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) return;

        const html = `
            <html>
            <head>
                <title>Voucher_Entrega_${datosEntrega.ordenId}</title>
                <style>
                    body { font-family: 'Courier New', monospace; width: 200px; margin: 10px; font-size: 11px; color: #000; line-height: 1.2; }
                    .center { text-align: center; }
                    .linea { border-bottom: 1px dashed #000; margin: 8px 0; }
                    .titulo { font-weight: bold; font-size: 13px; }
                    .total-box { font-size: 12px; font-weight: bold; text-align: right; margin: 8px 0; }
                </style>
            </head>
            <body>
                <div class="center">
                    <span class="titulo">NICAPLUS GAMING</span><br>
                    Entrega Final de Taller<br>
                    León, Nicaragua<br>
                    <strong>ORDEN: #ORD-${datosEntrega.ordenId}</strong>
                </div>
                <div class="linea"></div>
                <strong>CLIENTE:</strong> ${datosEntrega.clienteNombre}<br>
                <strong>TELÉFONO:</strong> ${datosEntrega.clienteTelefono}<br>
                <strong>FECHA SALIDA:</strong> ${new Date().toLocaleDateString()}<br>
                <div class="linea"></div>
                <strong>EQUIPO RETIRADO:</strong><br>${datosEntrega.dispositivo}<br><br>
                <strong>SOLUCIÓN TÉCNICA:</strong><br>${datosEntrega.diagnosticoFinal}<br><br>
                <strong>REPUESTOS:</strong><br>${datosEntrega.herramientasUsadas}<br>
                <div class="linea"></div>
                
                <div class="total-box">
                    TOTAL PAGADO: C$ ${datosEntrega.costoReparacion.toLocaleString('es-NI')}<br>
                    MÉTODO: ${datosEntrega.metodoPago.toUpperCase()}
                </div>
                
                <div class="linea"></div>
                <center><strong>GARANTÍA</strong></center>
                <p style="font-size: 9px; text-align: justify;">
                    ${datosEntrega.notasGarantia}
                </p>
                <div class="linea"></div>
                <br><br>
                <div class="center">
                    _______________________<br>
                    Firma de Cliente Conforme
                </div>
                <script>
                    window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
                </script>
            </body>
            </html>
        `;
        ventana.document.write(html);
        ventana.document.close();
    };

    const abrirEnlaceWhatsApp = (orden: Orden, tipo: 'Listo' | 'Entregado', datosAdicionales?: any) => {
        if (!orden.cliente?.telefono) {
            alert("El cliente no tiene un teléfono válido registrado.");
            return;
        }

        let telefono = orden.cliente.telefono.replace(/\s+/g, '').replace(/-/g, '');
        if (!telefono.startsWith('505')) {
            telefono = '505' + telefono;
        }

        let textoMensaje = "";

        if (tipo === 'Listo') {
            textoMensaje = `¡Hola *${orden.cliente.nombre}*! 👋 Te saludamos de *NICAPLUS GAMING*. Te notificamos que tu equipo *${orden.dispositivo}* (Orden #${orden.id}) ya se encuentra reparado y listo para ser retirado en tienda. 🛠️✨`;
        } else {
            const costo = datosAdicionales?.costoReparacion || 0;
            textoMensaje = `🧾 *NICAPLUS GAMING* \n\n¡Hola *${orden.cliente.nombre}*! Te confirmamos la entrega exitosa de tu *${orden.dispositivo}*. \n💰 *Total Pagado:* C$ ${costo.toLocaleString('es-NI')}\n🛡️ Tu garantía de servicio técnico se encuentra activa a partir de hoy. ¡Gracias por tu preferencia!`;
        }

        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(textoMensaje)}`;
        window.open(url, '_blank');
    };

    const registrarIngresoTaller = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!dispositivo || !diagnostico) {
            alert("Complete los datos del dispositivo.");
            return;
        }

        let idClienteFinal = idClienteSeleccionado;

        try {
            if (modoNuevoCliente) {
                if (!nombreCliente || !telefonoCliente) {
                    alert("Complete los datos obligatorios del nuevo cliente.");
                    return;
                }
                const resCliente = await api.post('/clientes', {
                    nombre: nombreCliente,
                    telefono: telefonoCliente,
                    email: emailCliente || 'taller@nicaplus.com',
                    puntosAcumulados: 0
                });
                idClienteFinal = resCliente.data.id;
            }

            if (!idClienteFinal || idClienteFinal === 0) {
                alert("Debe seleccionar un cliente de la base de datos o registrar uno nuevo.");
                return;
            }

            const clienteAsociado = clientes.find(c => c.id === idClienteFinal) || { nombre: nombreCliente, telefono: telefonoCliente };

            const resOrden = await api.post('/ordenesservicio', {
                idCliente: idClienteFinal,
                dispositivo,
                diagnostico,
                notas: notasGarantia
            });

            alert("Equipo registrado con éxito.");
            
            imprimirDocumentosSoporte(resOrden.data.id, {
                dispositivo,
                diagnostico,
                notasGarantia,
                cliente: { nombre: clienteAsociado.nombre, telefono: clienteAsociado.telefono }
            });

            // Limpieza de campos
            setDispositivo(''); 
            setDiagnostico(''); 
            setIdClienteSeleccionado(null);
            setBusquedaCliente('');
            setNombreCliente(''); 
            setTelefonoCliente(''); 
            setEmailCliente('');
            setModoNuevoCliente(false);
            
            cargarDatos();
        } catch (err) {
            alert("Error en el flujo de registro del taller.");
        }
    };

    const avanzarEstado = async (id: number, estadoActual: string) => {
        const orden = ordenes.find(o => o.id === id);
        if (!orden) return;

        if (estadoActual === 'Listo') {
            setOrdenAEntregar(orden);
            setDiagnosticoFinal(`Se solucionó la falla original: ${orden.diagnostico}`);
            setHerramientasUsadas('');
            setCostoReparacion(0);
            setMetodoPagoEntrega('Efectivo');
            setMostrarModalEntrega(true);
            return;
        }

        let siguienteEstado = '';
        if (estadoActual === 'Recibido') siguienteEstado = 'En Revisión';
        else if (estadoActual === 'En Revisión') siguienteEstado = 'Listo';
        else return;

        try {
            await api.put(`/ordenesservicio/${id}/estado?nuevoEstado=${siguienteEstado}`, "");
            cargarDatos();

            if (siguienteEstado === 'Listo') {
                setOrdenParaAccion(orden);
                setTipoAccionContexto('AlListo');
                setMostrarModalAccion(true);
            }
        } catch (err) {
            alert("Error al actualizar el estado técnico.");
        }
    };

    const ejecutarEntregaFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenAEntregar) return;

        try {
            const payload = {
                diagnosticoFinal,
                herramientasUsed: herramientasUsadas || 'Herramientas básicas de banco técnico',
                costoReparacion: Number(costoReparacion),
                metodoPago: metodoPagoEntrega,
                idProductoServicio: 1 
            };

            await api.put(`/ordenesservicio/${ordenAEntregar.id}/entregar`, payload);
            
            const datosImpresion = {
                ordenId: ordenAEntregar.id,
                dispositivo: ordenAEntregar.dispositivo,
                clienteNombre: ordenAEntregar.cliente?.nombre || 'Cliente General',
                clienteTelefono: ordenAEntregar.cliente?.telefono || 'N/D',
                diagnosticoFinal,
                herramientasUsadas: payload.herramientasUsed,
                costoReparacion: payload.costoReparacion,
                metodoPago: metodoPagoEntrega,
                notasGarantia
            };

            setDatosEntregaCache(datosImpresion);
            setOrdenParaAccion(ordenAEntregar);
            setTipoAccionContexto('AlEntregar');
            
            setMostrarModalEntrega(false);
            setOrdenAEntregar(null);
            cargarDatos();

            setMostrarModalAccion(true);
        } catch (err) {
            alert("Error al procesar la entrega final del equipo.");
        }
    };

    // Helper para determinar la clase de color según la columna del Kanban
    const getColumnHeaderClass = (columnaName: string) => {
        if (columnaName === 'Listo') return styles.colListo;
        if (columnaName === 'En Revisión') return styles.colRevision;
        return styles.colRecibido;
    };

    return (
        <div className={styles.tallerContainer}>
            
            {/* FORMULARIO AVANZADO DE INGRESO */}
            <form onSubmit={registrarIngresoTaller} className={styles.formIngreso}>
                <h3 className={styles.formTitle}>
                    <FaTools /> Registro de Ingreso de Equipos y Control de Dueños
                </h3>
                
                <div className={styles.formGrid}>
                    
                    {/* BUSCADOR Y SELECTOR DE CLIENTE */}
                    <div className={styles.formGroup}>
                        <div className={styles.labelWrapper}>
                            <label className={styles.label}>
                                <FaUser /> Cliente de la Orden
                            </label>
                            <button 
                                type="button" 
                                onClick={() => { setModoNuevoCliente(!modoNuevoCliente); setIdClienteSeleccionado(null); }} 
                                className={styles.btnCambiarModo}
                            >
                                {modoNuevoCliente ? "🔍 Buscar en base de datos" : "➕ Crear nuevo cliente"}
                            </button>
                        </div>

                        {modoNuevoCliente ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    value={nombreCliente} 
                                    onChange={e => setNombreCliente(e.target.value)} 
                                    className={styles.input} 
                                    placeholder="Nombre completo" 
                                    required 
                                />
                                <input 
                                    type="text" 
                                    value={telefonoCliente} 
                                    onChange={e => setTelefonoCliente(e.target.value)} 
                                    className={styles.input} 
                                    placeholder="Teléfono" 
                                    required 
                                />
                                <input 
                                    type="email" 
                                    value={emailCliente} 
                                    onChange={e => setEmailCliente(e.target.value)} 
                                    className={styles.input} 
                                    placeholder="Email (Opcional)" 
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div className={styles.inputIconWrapper}>
                                    <FaSearch className={styles.inputIcon} />
                                    <input 
                                        type="text" 
                                        placeholder="Filtrar clientes por nombre o celular..." 
                                        value={busquedaCliente} 
                                        onChange={e => setBusquedaCliente(e.target.value)} 
                                        className={`${styles.input} ${styles.inputWithIcon}`} 
                                    />
                                </div>
                                <select 
                                    value={idClienteSeleccionado || 0} 
                                    onChange={e => setIdClienteSeleccionado(Number(e.target.value))} 
                                    className={styles.select} 
                                    required
                                >
                                    <option value={0}>-- Selecciona el Cliente --</option>
                                    {clientesFiltrados.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <FaLaptop /> Dispositivo corporativo
                        </label>
                        <input 
                            type="text" 
                            value={dispositivo} 
                            onChange={e => setDispositivo(e.target.value)} 
                            className={styles.input} 
                            placeholder="Ej: PS5 Slim o Nintendo Switch" 
                            required 
                        />
                    </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                    <label className={styles.label}>Falla y Diagnóstico Inicial</label>
                    <textarea 
                        value={diagnostico} 
                        onChange={e => setDiagnostico(e.target.value)} 
                        className={styles.textarea} 
                        placeholder="Detalles de la falla técnica detectada..." 
                        required 
                    />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                    <label className={styles.label}>Condiciones y Póliza de Garantía a Imprimir</label>
                    <input 
                        type="text" 
                        value={notasGarantia} 
                        onChange={e => setNotasGarantia(e.target.value)} 
                        className={styles.input} 
                    />
                </div>

                <button type="submit" className={styles.btnSubmit}>
                    Ingresar Equipo e Imprimir Soporte
                </button>
            </form>

            {/* TABLERO KANBAN ADAPTATIVO */}
            <div className={styles.kanbanTablero}>
                {['Recibido', 'En Revisión', 'Listo'].map(columna => (
                    <div className={styles.kanbanColumna} key={columna}>
                        <h4 className={`${styles.columnHeader} ${getColumnHeaderClass(columna)}`}>
                            {columna} ({ordenes.filter(o => o.estado === columna).length})
                        </h4>
                        
                        <div className={styles.cardsContainer}>
                            {ordenes.filter(o => o.estado === columna).map(orden => (
                                <div key={orden.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <strong className={styles.cardTitle}>{orden.dispositivo}</strong>
                                        <span className={styles.cardBadge}>#{orden.id}</span>
                                    </div>
                                    <p className={styles.cardDesc}>{orden.diagnostico}</p>
                                    <div className={styles.cardDivider}>
                                        <small className={styles.cardClientName}>Cliente: {orden.cliente?.nombre}</small>
                                        <small className={styles.cardClientPhone}>Tel: {orden.cliente?.telefono}</small>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button 
                                            onClick={() => avanzarEstado(orden.id, orden.estado)} 
                                            className={styles.btnAvanzar}
                                        >
                                            {orden.estado === 'Listo' ? 'Entregar y Cobrar' : 'Avanzar'} 
                                            <FaChevronRight size={10} />
                                        </button>
                                        {orden.estado === 'Listo' && (
                                            <button 
                                                title="Notificar por WhatsApp de inmediato" 
                                                onClick={() => abrirEnlaceWhatsApp(orden, 'Listo')} 
                                                className={styles.btnWhatsAppQuick}
                                            >
                                                <FaWhatsapp size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {ordenes.filter(o => o.estado === columna).length === 0 && (
                                <div className={styles.emptyColumnText}>
                                    Sin órdenes en este estado
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE LIQUIDACIÓN Y ENTREGA FINAL */}
            {mostrarModalEntrega && ordenAEntregar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>
                                <FaTools /> Liquidación de Orden #{ordenAEntregar.id}
                            </h3>
                            <button 
                                onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} 
                                className={styles.btnCloseModal}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={ejecutarEntregaFinal} className={styles.modalForm}>
                            <div className={styles.infoRow}>
                                <small className={styles.infoRowLabel}>Equipo a Retirar:</small>
                                <strong>{ordenAEntregar.dispositivo}</strong> ({ordenAEntregar.cliente?.nombre})
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaUser /> Diagnóstico de Reparación Final</label>
                                <textarea 
                                    value={diagnosticoFinal} 
                                    onChange={e => setDiagnosticoFinal(e.target.value)} 
                                    className={styles.textarea} 
                                    placeholder="Escriba la solución aplicada..." 
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaWrench /> Repuestos / Herramientas Utilizadas</label>
                                <input 
                                    type="text" 
                                    value={herramientasUsadas} 
                                    onChange={e => setHerramientasUsadas(e.target.value)} 
                                    className={styles.input} 
                                    placeholder="Ej: Cambio de puerto HDMI, limpieza interna" 
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave /> Método de Pago</label>
                                <select 
                                    value={metodoPagoEntrega} 
                                    onChange={e => setMetodoPagoEntrega(e.target.value)} 
                                    className={styles.select} 
                                    required
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito (Cuenta por Cobrar)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave /> Costo del Servicio Técnico (C$)</label>
                                <input 
                                    type="number" 
                                    value={costoReparacion || ''} 
                                    onChange={e => setCostoReparacion(Number(e.target.value))} 
                                    className={`${styles.input} ${styles.inputCosto}`} 
                                    placeholder="Monto cobrado en Córdobas" 
                                    min={0} 
                                    required 
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnModalConfirm}>
                                    Procesar Salida
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} 
                                    className={styles.btnModalCancel}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INTERACTIVO: ACCIÓN RÁPIDA / WHATSAPP / IMPRESIÓN */}
            {mostrarModalAccion && ordenParaAccion && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalSuccessContent}>
                        
                        <FaCheckCircle size={50} className={styles.successIcon} />
                        
                        <h3 className={styles.successTitle}>
                            {tipoAccionContexto === 'AlListo' ? '¡Equipo Marcado Como Listo!' : '¡Orden Procesada Exitosamente!'}
                        </h3>
                        <p className={styles.successDesc}>
                            Selecciona las acciones comerciales inmediatas para la Orden <strong>#{ordenParaAccion.id}</strong> ({ordenParaAccion.dispositivo}).
                        </p>

                        <div className={styles.actionButtonsContainer}>
                            
                            <button 
                                onClick={() => abrirEnlaceWhatsApp(ordenParaAccion, tipoAccionContexto === 'AlListo' ? 'Listo' : 'Entregado', datosEntregaCache)}
                                className={`${styles.btnActionBase} ${styles.btnActionWhatsApp}`}
                            >
                                <FaWhatsapp size={18} /> Avisar al Cliente por WhatsApp
                            </button>

                            <button 
                                onClick={() => {
                                    if (tipoAccionContexto === 'AlListo') {
                                        imprimirDocumentosSoporte(ordenParaAccion.id, {
                                            dispositivo: ordenParaAccion.dispositivo,
                                            diagnostico: ordenParaAccion.diagnostico,
                                            notasGarantia,
                                            cliente: { nombre: ordenParaAccion.cliente?.nombre || '', telefono: ordenParaAccion.cliente?.telefono || '' }
                                        });
                                    } else if (datosEntregaCache) {
                                        imprimirVoucherEntrega(datosEntregaCache);
                                    }
                                }}
                                className={`${styles.btnActionBase} ${styles.btnActionPrint}`}
                            >
                                <FaPrint size={18} /> Imprimir Ticket Comercial
                            </button>

                            <button 
                                onClick={() => { 
                                    setMostrarModalAccion(false); 
                                    setOrdenParaAccion(null); 
                                    setDatosEntregaCache(null); 
                                }}
                                className={`${styles.btnActionBase} ${styles.btnActionReturn}`}
                            >
                                Listo, Volver al Tablero
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};