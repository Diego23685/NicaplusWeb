import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaTools, FaChevronRight, FaTimes, 
    FaWhatsapp, FaPrint, FaCheckCircle, FaFileContract, FaExclamationTriangle, FaPlus
} from 'react-icons/fa';

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
    const [cargando, setCargando] = useState(true);

    // CONTROL DE PESTAÑAS MÓVILES
    const [tabActiva, setTabActiva] = useState<'kanban' | 'ingreso'>('kanban');
    const [columnaFiltroKanban, setColumnaFiltroKanban] = useState<'Recibido' | 'En Revisión' | 'Listo'>('Recibido');

    const [dispositivo, setDispositivo] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [notasGarantia, setNotasGarantia] = useState('Garantía de 30 días sobre la reparación efectuada. No cubre sellos rotos o humedad.');
    
    // Sistema de Notificaciones / Toast
    const [notificacion, setNotificacion] = useState<{ mostrar: boolean; mensaje: string; tipo: 'exito' | 'error' | 'warning' }>({
        mostrar: false,
        mensaje: '',
        tipo: 'exito'
    });

    const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' | 'warning' = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => {
            setNotificacion(prev => ({ ...prev, mostrar: false }));
        }, 4000);
    };

    // Gestión de Cliente
    const [modoNuevoCliente, setModoNuevoCliente] = useState(false);
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [emailCliente, setEmailCliente] = useState('');

    // Modal de Entrega Final
    const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
    const [ordenAEntregar, setOrdenAEntregar] = useState<Orden | null>(null);
    const [diagnosticoFinal, setDiagnosticoFinal] = useState('');
    const [herramientasUsadas, setHerramientasUsadas] = useState('');
    const [costoReparacion, setCostoReparacion] = useState<number>(0);
    const [metodoPagoEntrega, setMetodoPagoEntrega] = useState('Efectivo');

    // Modal de Acciones Comerciales
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
            setOrdenes(resOrdenes.data || []);
            setClientes(resClientes.data || []);
        } catch (err) {
            console.error("Error al cargar datos del taller:", err);
            mostrarToast("No se pudieron cargar los datos del taller.", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
        c.telefono.includes(busquedaCliente)
    );

    const imprimirContratoGarantiaCompleto = (ordenId: number, datos: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) return;

        const html = `
            <html>
            <head>
                <title>Contrato_Garantia_ORD-${ordenId}</title>
                <style>
                    @page { size: letter; margin: 15mm; }
                    body { font-family: 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px; margin: 0; padding: 0; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .header-logo { font-size: 22px; font-weight: 800; color: #581c7e; }
                    .doc-title { text-align: right; font-size: 14px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
                    .doc-number { text-align: right; font-size: 16px; font-weight: 800; color: #dc2626; }
                    .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #581c7e; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin: 15px 0 8px 0; }
                    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                    .info-grid td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 11px; }
                    .info-label { font-weight: bold; color: #475569; width: 25%; background: #f8fafc; }
                    .terms-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; font-size: 10px; color: #334155; }
                    .signatures-table { width: 100%; margin-top: 40px; border-collapse: collapse; text-align: center; }
                    .linea-firma { width: 180px; border-bottom: 1px solid #94a3b8; margin: 0 auto 4px auto; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="header-logo">NICAPLUS GAMING</div>
                            <small>León, Nicaragua | Soporte: +505 8787-0821</small>
                        </td>
                        <td style="text-align: right;">
                            <div class="doc-title">Póliza de Garantía de Servicio</div>
                            <div class="doc-number">ORD-${ordenId}</div>
                        </td>
                    </tr>
                </table>

                <div class="section-title">Información del Cliente</div>
                <table class="info-grid">
                    <tr>
                        <td class="info-label">Cliente</td><td><strong>${datos.cliente.nombre}</strong></td>
                        <td class="info-label">Teléfono</td><td>${datos.cliente.telefono || 'N/D'}</td>
                    </tr>
                </table>

                <div class="section-title">Especificaciones del Equipo</div>
                <table class="info-grid">
                    <tr><td class="info-label">Dispositivo</td><td colspan="3"><strong>${datos.dispositivo}</strong></td></tr>
                    <tr><td class="info-label">Falla Reportada</td><td colspan="3">${datos.diagnostico}</td></tr>
                    ${datos.diagnosticoFinal ? `<tr><td class="info-label">Solución</td><td colspan="3">${datos.diagnosticoFinal}</td></tr>` : ''}
                </table>

                <div class="section-title">Términos y Condiciones</div>
                <div class="terms-box">
                    <strong>Póliza de Servicio Técnico:</strong> ${datos.notasGarantia}. La garantía no cubre sellos de seguridad violados, humedad o golpes posteriores a la entrega.
                </div>

                <table class="signatures-table">
                    <tr>
                        <td><div class="linea-firma"></div><small>NICAPLUS GAMING</small></td>
                        <td><div class="linea-firma"></div><small>Cliente Conforme</small></td>
                    </tr>
                </table>

                <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
            </body>
            </html>
        `;
        ventana.document.write(html);
        ventana.document.close();
    };

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
                </style>
            </head>
            <body>
                <div class="center">
                    <strong>NICAPLUS GAMING</strong><br>
                    Taller de Soporte Técnico<br>
                    <strong>INGRESO #ORD-${ordenId}</strong>
                </div>
                <div class="linea"></div>
                <strong>CLIENTE:</strong> ${datos.cliente.nombre}<br>
                <strong>TELÉFONO:</strong> ${datos.cliente.telefono}<br>
                <div class="linea"></div>
                <strong>EQUIPO:</strong> ${datos.dispositivo}<br>
                <strong>FALLA:</strong><br>${datos.diagnostico}<br>
                <div class="linea"></div>
                <div class="center">Conserve este comprobante para retirar.</div>
                <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
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
                </style>
            </head>
            <body>
                <div class="center">
                    <strong>NICAPLUS GAMING</strong><br>
                    Entrega Final de Taller<br>
                    <strong>ORDEN: #ORD-${datosEntrega.ordenId}</strong>
                </div>
                <div class="linea"></div>
                <strong>CLIENTE:</strong> ${datosEntrega.clienteNombre}<br>
                <strong>EQUIPO:</strong> ${datosEntrega.dispositivo}<br>
                <div class="linea"></div>
                <strong>TOTAL PAGADO: C$ ${datosEntrega.costoReparacion.toLocaleString('es-NI')}</strong><br>
                <strong>MÉTODO:</strong> ${datosEntrega.metodoPago.toUpperCase()}
                <div class="linea"></div>
                <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
            </body>
            </html>
        `;
        ventana.document.write(html);
        ventana.document.close();
    };

    const abrirEnlaceWhatsApp = (orden: Orden, tipo: 'Listo' | 'Entregado', datosAdicionales?: any) => {
        if (!orden.cliente?.telefono) {
            mostrarToast("El cliente no tiene un teléfono válido registrado.", "warning");
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

        const url = `https://api.whatsapp.com/send/?phone=${telefono}&text=${encodeURIComponent(textoMensaje)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');
    };

    const registrarIngresoTaller = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!dispositivo || !diagnostico) {
            mostrarToast("Complete los datos requeridos del dispositivo.", "warning");
            return;
        }

        let idClienteFinal = idClienteSeleccionado;

        try {
            if (modoNuevoCliente) {
                if (!nombreCliente || !telefonoCliente) {
                    mostrarToast("Complete los datos del nuevo cliente.", "warning");
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
                mostrarToast("Debe seleccionar o registrar un cliente.", "warning");
                return;
            }

            const clienteAsociado = clientes.find(c => c.id === idClienteFinal) || { nombre: nombreCliente, telefono: telefonoCliente, email: emailCliente };
            const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');

            const resOrden = await api.post('/ordenesservicio', {
                idCliente: idClienteFinal,
                idUsuario: usuarioLogueado.id,
                dispositivo,
                diagnostico,
                notas: notasGarantia
            });

            mostrarToast(`Equipo #${resOrden.data.id} ingresado.`, "exito");
            
            imprimirDocumentosSoporte(resOrden.data.id, {
                dispositivo,
                diagnostico,
                notasGarantia,
                cliente: { nombre: clienteAsociado.nombre, telefono: clienteAsociado.telefono }
            });

            imprimirContratoGarantiaCompleto(resOrden.data.id, {
                dispositivo,
                diagnostico,
                notasGarantia,
                cliente: clienteAsociado
            });

            setDispositivo(''); 
            setDiagnostico(''); 
            setIdClienteSeleccionado(null);
            setBusquedaCliente('');
            setNombreCliente(''); 
            setTelefonoCliente(''); 
            setEmailCliente('');
            setModoNuevoCliente(false);
            setTabActiva('kanban');
            
            cargarDatos();
        } catch (err) {
            mostrarToast("Error al registrar en el taller.", "error");
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
            const payload = { nuevoEstado: siguienteEstado };

            await api.put(`/ordenesservicio/${id}/estado`, payload);
            cargarDatos();

            if (siguienteEstado === 'Listo') {
                setOrdenParaAccion(orden);
                setTipoAccionContexto('AlListo');
                setMostrarModalAccion(true);
            } else {
                mostrarToast(`Orden #${id} movida a ${siguienteEstado}.`, "exito");
            }
        } catch (err) {
            mostrarToast("Error al actualizar el estado.", "error");
        }
    };

    const ejecutarEntregaFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenAEntregar) return;

        try {
            const payload = {
                diagnosticoFinal,
                herramientasUsed: herramientasUsadas || 'Herramientas de banco técnico',
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
                clienteEmail: ordenAEntregar.cliente?.email || '',
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
            mostrarToast("Error al procesar la entrega final.", "error");
        }
    };

    if (cargando) return (
        <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>
            Cargando tablero del taller...
        </div>
    );

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* NOTIFICACIÓN TIPO TOAST */}
            {notificacion.mostrar && (
                <div 
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 99999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        backgroundColor: notificacion.tipo === 'exito' ? '#10b981' : notificacion.tipo === 'warning' ? '#f59e0b' : '#ef4444'
                    }}
                >
                    {notificacion.tipo === 'exito' && <FaCheckCircle />}
                    {notificacion.tipo === 'warning' && <FaExclamationTriangle />}
                    {notificacion.tipo === 'error' && <FaTimes />}
                    <span>{notificacion.mensaje}</span>
                </div>
            )}

            {/* ENCABEZADO Y TABS DE NAVEGACIÓN MÓVIL */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Taller y Soporte Técnico</h3>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Recepción, reparación y entrega de equipos</small>
                </div>

                {/* Conmutador de Pestañas Móviles */}
                <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button 
                        onClick={() => setTabActiva('kanban')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'kanban' ? '#38bdf8' : 'transparent', color: tabActiva === 'kanban' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaTools /> Tablero ({ordenes.length})
                    </button>
                    <button 
                        onClick={() => setTabActiva('ingreso')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'ingreso' ? '#38bdf8' : 'transparent', color: tabActiva === 'ingreso' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaPlus /> + Ingresar
                    </button>
                </div>
            </div>

            {/* PESTAÑA 1: TABLERO KANBAN MÓVIL */}
            {tabActiva === 'kanban' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Filtro de Columna Kanban */}
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                        {(['Recibido', 'En Revisión', 'Listo'] as const).map(col => {
                            const cant = ordenes.filter(o => o.estado === col).length;
                            return (
                                <button 
                                    key={col}
                                    onClick={() => setColumnaFiltroKanban(col)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        borderRadius: '16px',
                                        border: '1px solid #334155',
                                        background: columnaFiltroKanban === col ? '#38bdf8' : '#1e293b',
                                        color: columnaFiltroKanban === col ? '#0f172a' : '#94a3b8',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {col === 'Recibido' ? '📥 Recibido' : col === 'En Revisión' ? '🛠️ En Revisión' : '✅ Listos'} ({cant})
                                </button>
                            );
                        })}
                    </div>

                    {/* Feed de Órdenes filtradas por la columna activa */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ordenes.filter(o => o.estado === columnaFiltroKanban).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                                No hay equipos en estado "{columnaFiltroKanban}".
                            </div>
                        ) : (
                            ordenes.filter(o => o.estado === columnaFiltroKanban).map(orden => (
                                <div key={orden.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>{orden.dispositivo}</strong>
                                            <small style={{ color: '#38bdf8', fontSize: '0.72rem' }}>
                                                👤 {orden.cliente?.nombre || 'Cliente General'} • 📞 {orden.cliente?.telefono || 'N/D'}
                                            </small>
                                        </div>
                                        <span style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '2px 6px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                                            #ORD-{orden.id}
                                        </span>
                                    </div>

                                    <div style={{ background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                        {orden.diagnostico}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                        <small style={{ color: '#64748b', fontSize: '0.68rem' }}>
                                            Ingresó: {new Date(orden.fechaIngreso).toLocaleDateString()}
                                        </small>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {orden.estado === 'Listo' && (
                                                <button 
                                                    onClick={() => abrirEnlaceWhatsApp(orden, 'Listo')}
                                                    style={{ background: '#25D366', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <FaWhatsapp /> Avisar
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => avanzarEstado(orden.id, orden.estado)}
                                                style={{ background: orden.estado === 'Listo' ? '#10b981' : '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {orden.estado === 'Listo' ? 'Entregar y Cobrar' : 'Avanzar'} <FaChevronRight size={10} />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                </div>
            )}

            {/* PESTAÑA 2: INGRESO DE NUEVOS EQUIPOS */}
            {tabActiva === 'ingreso' && (
                <form onSubmit={registrarIngresoTaller} style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaTools /> Registrar Ingreso de Equipo
                    </h4>

                    {/* Alternar modo cliente */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Cliente Asignado</label>
                        <button 
                            type="button" 
                            onClick={() => setModoNuevoCliente(!modoNuevoCliente)}
                            style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            {modoNuevoCliente ? "🔍 Buscar Cliente Existente" : "+ Registrar Cliente Nuevo"}
                        </button>
                    </div>

                    {modoNuevoCliente ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155' }}>
                            <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Nombre completo *" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem' }} required />
                            <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} placeholder="Teléfono *" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem' }} required />
                            <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="Email (Opcional)" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem' }} />
                        </div>
                    ) : (
                        <div>
                            <input 
                                type="text" 
                                placeholder="🔍 Filtrar cliente por nombre..." 
                                value={busquedaCliente} 
                                onChange={e => setBusquedaCliente(e.target.value)} 
                                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '4px', boxSizing: 'border-box' }}
                            />
                            <select 
                                value={idClienteSeleccionado || 0} 
                                onChange={e => setIdClienteSeleccionado(Number(e.target.value))} 
                                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                required
                            >
                                <option value={0}>-- Selecciona el Cliente --</option>
                                {clientesFiltrados.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Dispositivo / Consola</label>
                        <input 
                            type="text" 
                            value={dispositivo} 
                            onChange={e => setDispositivo(e.target.value)} 
                            placeholder="Ej: PS5 Slim o Nintendo Switch" 
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                            required 
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Falla y Diagnóstico Inicial</label>
                        <textarea 
                            value={diagnostico} 
                            onChange={e => setDiagnostico(e.target.value)} 
                            placeholder="Detalles de la falla técnica..." 
                            rows={3}
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }}
                            required 
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>Póliza de Garantía a Imprimir</label>
                        <input 
                            type="text" 
                            value={notasGarantia} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotasGarantia(e.target.value)} 
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                        Ingresar e Imprimir Contrato
                    </button>
                </form>
            )}

            {/* MODAL LIQUIDACIÓN Y ENTREGA FINAL */}
            {mostrarModalEntrega && ordenAEntregar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '85vh', overflowY: 'auto' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>🛠️ Liquidación #{ordenAEntregar.id}</h4>
                            <button onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={ejecutarEntregaFinal} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                <strong style={{ color: '#fff', display: 'block' }}>{ordenAEntregar.dispositivo}</strong>
                                <span>Cliente: {ordenAEntregar.cliente?.nombre}</span>
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Solución Técnica Aplicada</label>
                                <textarea value={diagnosticoFinal} onChange={e => setDiagnosticoFinal(e.target.value)} rows={2} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Repuestos Utilizados</label>
                                <input type="text" value={herramientasUsadas} onChange={e => setHerramientasUsadas(e.target.value)} placeholder="Ej: Cambio de puerto HDMI" style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Método de Pago</label>
                                <select value={metodoPagoEntrega} onChange={e => setMetodoPagoEntrega(e.target.value)} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ color: '#10b981', fontSize: '0.7rem', display: 'block', fontWeight: 700 }}>Costo del Servicio (C$)</label>
                                <input type="number" value={costoReparacion || ''} onChange={e => setCostoReparacion(Number(e.target.value))} min={0} style={{ width: '100%', background: '#0f172a', border: '1px solid #10b981', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 800, boxSizing: 'border-box' }} required />
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                                Procesar Salida y Cobro
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INTERACTIVO ACCIONES COMERCIALES */}
            {mostrarModalAccion && ordenParaAccion && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                        <FaCheckCircle style={{ color: '#10b981', fontSize: '2.5rem', margin: '0 auto' }} />
                        <h4 style={{ color: '#fff', margin: 0, fontSize: '1rem' }}>
                            {tipoAccionContexto === 'AlListo' ? '¡Equipo Marcado Como Listo!' : '¡Orden Entregada!'}
                        </h4>
                        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            Orden #{ordenParaAccion.id} ({ordenParaAccion.dispositivo})
                        </small>

                        <button 
                            onClick={() => abrirEnlaceWhatsApp(ordenParaAccion, tipoAccionContexto === 'AlListo' ? 'Listo' : 'Entregado', datosEntregaCache)}
                            style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            <FaWhatsapp /> Avisar por WhatsApp
                        </button>

                        <button 
                            onClick={() => {
                                if (tipoAccionContexto === 'AlListo') {
                                    imprimirDocumentosSoporte(ordenParaAccion.id, {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        notasGarantia,
                                        cliente: { nombre: ordenParaAccion.cliente?.nombre || '', telefono: ordenParaAccion.cliente?.telefono || '', email: ordenParaAccion.cliente?.email || '' }
                                    });
                                } else if (datosEntregaCache) {
                                    imprimirVoucherEntrega(datosEntregaCache);
                                }
                            }}
                            style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            <FaPrint /> Imprimir Ticket
                        </button>

                        <button 
                            onClick={() => {
                                const datosGarantiaParaImprimir = tipoAccionContexto === 'AlListo' 
                                    ? {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        notasGarantia,
                                        cliente: ordenParaAccion.cliente || { nombre: 'Cliente General', telefono: 'N/D', email: '' }
                                      }
                                    : {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        diagnosticoFinal: datosEntregaCache?.diagnosticoFinal,
                                        herramientasUsadas: datosEntregaCache?.herramientasUsadas,
                                        notasGarantia,
                                        cliente: { 
                                            nombre: datosEntregaCache?.clienteNombre, 
                                            telefono: datosEntregaCache?.clienteTelefono, 
                                            email: datosEntregaCache?.clienteEmail 
                                        }
                                      };
                                imprimirContratoGarantiaCompleto(ordenParaAccion.id, datosGarantiaParaImprimir);
                            }}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                        >
                            <FaFileContract /> Contrato de Garantía (A4)
                        </button>

                        <button 
                            onClick={() => { setMostrarModalAccion(false); setOrdenParaAccion(null); setDatosEntregaCache(null); }}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', marginTop: '4px' }}
                        >
                            Volver al Tablero
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};