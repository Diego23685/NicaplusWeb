import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FaUser, FaLaptop, FaTools, FaChevronRight, FaTimes, FaMoneyBillWave, FaWrench, FaWhatsapp, FaPrint, FaCheckCircle, FaSearch } from 'react-icons/fa';

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
    const [metodoPagoEntrega, setMetodoPagoEntrega] = useState('Efectivo'); // ◄ NUEVO: Método de pago real

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

    // Filtrado dinámico de clientes de la BD
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
            // Si el técnico decide registrar un cliente nuevo sobre la marcha
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
            setMetodoPagoEntrega('Efectivo'); // Resetear a efectivo por defecto
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
                metodoPago: metodoPagoEntrega, // ◄ CORREGIDO: Se envía el método de pago seleccionado
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
                metodoPago: metodoPagoEntrega, // ◄ CORREGIDO: También se refleja en el ticket físico impreso
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

    const estiloInputControlado = {
        width: '100%',
        padding: '10px 12px',
        marginTop: '6px',
        background: '#0f172a',
        color: '#ffffff',
        border: '1px solid #334155',
        borderRadius: '6px',
        boxSizing: 'border-box' as const,
        fontSize: '0.9rem',
        outline: 'none'
    };

    const estiloSelectControlado = {
        width: '100%',
        padding: '10px 12px',
        marginTop: '6px',
        background: '#0f172a',
        color: '#ffffff',
        border: '1px solid #334155',
        borderRadius: '6px',
        boxSizing: 'border-box' as const,
        fontSize: '0.9rem',
        outline: 'none',
        cursor: 'pointer'
    };

    const estiloBotonAccionRapida = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '14px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
        color: '#fff',
        transition: 'opacity 0.2s'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box', color: '#fff', fontFamily: 'sans-serif' }}>
            
            <style>{`
                @media (max-width: 767px) {
                    .kanban-tablero { grid-template-columns: 1fr !important; }
                    .kanban-columna { max-height: 350px; }
                }
                @media (min-width: 768px) and (max-width: 1023px) {
                    .kanban-tablero { grid-template-columns: repeat(3, minmax(220px, 1fr)) !important; overflow-x: auto; padding-bottom: 10px; }
                }
            `}</style>

            {/* FORMULARIO AVANZADO DE INGRESO */}
            <form onSubmit={registrarIngresoTaller} style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', boxSizing: 'border-box', width: '100%' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#38bdf8', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaTools /> Registro de Ingreso de Equipos y Control de Dueños
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    
                    {/* BUSCADOR Y SELECTOR DE CLIENTE (INTEGRADO DE CAJA) */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}><FaUser /> Cliente de la Orden</label>
                            <button type="button" onClick={() => { setModoNuevoCliente(!modoNuevoCliente); setIdClienteSeleccionado(null); }} style={{ background: '#581c7e', border: 'none', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                {modoNuevoCliente ? "🔍 Buscar en base de datos" : "➕ Crear nuevo cliente"}
                            </button>
                        </div>

                        {modoNuevoCliente ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} style={estiloInputControlado} placeholder="Nombre completo" required />
                                <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} style={estiloInputControlado} placeholder="Teléfono" required />
                                <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} style={estiloInputControlado} placeholder="Email (Opcional)" />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ position: 'relative' }}>
                                    <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-5%)', color: '#64748b', fontSize: '0.8rem' }} />
                                    <input type="text" placeholder="Filtrar clientes por nombre o celular..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} style={{ ...estiloInputControlado, paddingLeft: '30px' }} />
                                </div>
                                <select value={idClienteSeleccionado || 0} onChange={e => setIdClienteSeleccionado(Number(e.target.value))} style={estiloSelectControlado} required>
                                    <option value={0}>-- Selecciona el Cliente --</option>
                                    {clientesFiltrados.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}><FaLaptop /> Dispositivo corporativo</label>
                        <input type="text" value={dispositivo} onChange={e => setDispositivo(e.target.value)} style={estiloInputControlado} placeholder="Ej: PS5 Slim o Nintendo Switch" required />
                    </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Falla y Diagnóstico Inicial</label>
                    <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} style={{ ...estiloInputControlado, height: '70px', resize: 'none' }} placeholder="Detalles de la falla técnica detectada..." required />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Condiciones y Póliza de Garantía a Imprimir</label>
                    <input type="text" value={notasGarantia} onChange={e => setNotasGarantia(e.target.value)} style={estiloInputControlado} />
                </div>

                <button type="submit" style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s', width: '100%', maxWidth: '300px' }} onMouseEnter={(e) => e.currentTarget.style.background = '#059669'} onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}>
                    Ingresar Equipo e Imprimir Soporte
                </button>
            </form>

            {/* TABLERO KANBAN ADAPTATIVO */}
            <div className="kanban-tablero" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
                {['Recibido', 'En Revisión', 'Listo'].map(columna => (
                    <div className="kanban-columna" key={columna} style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', maxHeight: '500px', overflowY: 'auto' }}>
                        <h4 style={{ margin: '0 0 12px 0', borderBottom: '2px solid #334155', paddingBottom: '6px', color: columna === 'Listo' ? '#10b981' : columna === 'En Revisión' ? '#38bdf8' : '#f59e0b', fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {columna} ({ordenes.filter(o => o.estado === columna).length})
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                            {ordenes.filter(o => o.estado === columna).map(orden => (
                                <div key={orden.id} style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <strong style={{ fontSize: '0.9rem', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{orden.dispositivo}</strong>
                                        <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>#{orden.id}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>{orden.diagnostico}</p>
                                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '6px', marginTop: '2px' }}>
                                        <small style={{ color: '#cbd5e1', fontWeight: 600, display: 'block' }}>Cliente: {orden.cliente?.nombre}</small>
                                        <small style={{ color: '#64748b', display: 'block', marginTop: '1px' }}>Tel: {orden.cliente?.telefono}</small>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                        <button onClick={() => avanzarEstado(orden.id, orden.estado)} style={{ flex: 1, padding: '8px', background: '#581c7e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#4c1d95'} onMouseLeave={(e) => e.currentTarget.style.background = '#581c7e'}>
                                            {orden.estado === 'Listo' ? 'Entregar y Cobrar' : 'Avanzar Estado'} <FaChevronRight size={10} />
                                        </button>
                                        {orden.estado === 'Listo' && (
                                            <button title="Notificar por WhatsApp de inmediato" onClick={() => abrirEnlaceWhatsApp(orden, 'Listo')} style={{ padding: '8px 12px', background: '#25d366', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <FaWhatsapp size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {ordenes.filter(o => o.estado === columna).length === 0 && (
                                <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '20px 0', margin: 'auto' }}>
                                    Sin órdenes en este estado
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE LIQUIDACIÓN Y ENTREGA FINAL (CON MÉTODO DE PAGO CORREGIDO) */}
            {mostrarModalEntrega && ordenAEntregar && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem', fontWeight: 700 }}><FaTools /> Liquidación de Orden #{ordenAEntregar.id}</h3>
                            <button onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
                        </div>

                        <form onSubmit={ejecutarEntregaFinal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <small style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Equipo a Retirar:</small>
                                <strong>{ordenAEntregar.dispositivo}</strong> ({ordenAEntregar.cliente?.nombre})
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}><FaUser /> Diagnóstico de Reparación Final</label>
                                <textarea value={diagnosticoFinal} onChange={e => setDiagnosticoFinal(e.target.value)} style={{ ...estiloInputControlado, height: '60px', resize: 'none' }} placeholder="Escriba la solución aplicada..." required />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}><FaWrench /> Repuestos / Herramientas Utilizadas</label>
                                <input type="text" value={herramientasUsadas} onChange={e => setHerramientasUsadas(e.target.value)} style={estiloInputControlado} placeholder="Ej: Cambio de puerto HDMI, limpieza interna" required />
                            </div>

                            {/* NUEVO DROPDOWN: SELECCIÓN DEL MÉTODO DE PAGO REAL */}
                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}><FaMoneyBillWave /> Método de Pago</label>
                                <select value={metodoPagoEntrega} onChange={e => setMetodoPagoEntrega(e.target.value)} style={estiloSelectControlado} required>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito (Cuenta por Cobrar)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}><FaMoneyBillWave /> Costo del Servicio Técnico (C$)</label>
                                <input type="number" value={costoReparacion || ''} onChange={e => setCostoReparacion(Number(e.target.value))} style={{ ...estiloInputControlado, fontSize: '1.1rem', fontWeight: 'bold', color: '#10b981' }} placeholder="Monto cobrado en Córdobas" min={0} required />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Procesar Salida
                                </button>
                                <button type="button" onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} style={{ padding: '12px', background: '#475569', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL INTERACTIVO: CENTRO DE ALERTAS, WHATSAPP E IMPRESIÓN RÁPIDA */}
            {mostrarModalAccion && ordenParaAccion && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(6px)' }}>
                    <div style={{ background: '#1e293b', padding: '26px', borderRadius: '16px', maxWidth: '460px', width: '90%', border: '2px solid #334155', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
                        
                        <FaCheckCircle size={50} color="#10b981" style={{ marginBottom: '14px' }} />
                        
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#f8fafc' }}>
                            {tipoAccionContexto === 'AlListo' ? '¡Equipo Marcado Como Listo!' : '¡Orden Procesada Exitosamente!'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
                            Selecciona las acciones comerciales inmediatas para la Orden <strong>#{ordenParaAccion.id}</strong> ({ordenParaAccion.dispositivo}).
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            
                            <button 
                                onClick={() => abrirEnlaceWhatsApp(ordenParaAccion, tipoAccionContexto === 'AlListo' ? 'Listo' : 'Entregado', datosEntregaCache)}
                                style={{ ...estiloBotonAccionRapida, background: '#25d366' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
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
                                style={{ ...estiloBotonAccionRapida, background: '#3b82f6' }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                            >
                                <FaPrint size={18} /> Imprimir Ticket Comercial
                            </button>

                            <button 
                                onClick={() => { 
                                    setMostrarModalAccion(false); 
                                    setOrdenParaAccion(null); 
                                    setDatosEntregaCache(null); 
                                }}
                                style={{ ...estiloBotonAccionRapida, background: '#475569', marginTop: '10px' }}
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