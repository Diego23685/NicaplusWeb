import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaUser, FaLaptop, FaTools, FaChevronRight, FaTimes, 
    FaMoneyBillWave, FaWrench, FaWhatsapp, FaPrint, 
    FaCheckCircle, FaSearch, FaFileContract, FaExclamationTriangle,
    FaConciergeBell, FaEdit, FaHistory, FaColumns, FaPlus, FaChevronUp
} from 'react-icons/fa';
import styles from '../assets/styles/Taller.module.css';

interface Orden {
    id: number;
    idCliente?: number | null;
    clienteNombre: string;
    clienteTelefono: string;
    idUsuario?: number | null;
    tecnicoNombre: string;
    dispositivo: string;
    diagnostico: string;
    costoEstimado: number;
    estado: string;
    fechaIngreso: string;
    fechaEntrega?: string | null;
    notas: string;
}

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
}

interface DatosCliente {
    nombre: string;
    telefono: string;
    email: string;
}

interface ProductoServicio {
    id: number;
    nombre: string;
    precioVenta?: number;
    requiereServicio?: boolean;
}

export const Taller: React.FC = () => {
    const [pestanaActiva, setPestanaActiva] = useState<'tablero' | 'historial'>('tablero');
    const [columnaMovilActiva, setColumnaMovilActiva] = useState<'Recibido' | 'En Revisión' | 'Listo'>('Recibido');
    const [mostrarFormIngreso, setMostrarFormIngreso] = useState(false);

    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ProductoServicio[]>([]);

    const [dispositivo, setDispositivo] = useState('');
    const [diagnostico, setDiagnostico] = useState('');
    const [costoEstimado, setCostoEstimado] = useState<string>('');
    const [notasGarantia, setNotasGarantia] = useState('Garantía de 30 días sobre la reparación efectuada. No cubre sellos rotos o humedad.');

    const [busquedaHistorial, setBusquedaHistorial] = useState('');

    const [notificacion, setNotificacion] = useState<{ mostrar: boolean; mensaje: string; tipo: 'exito' | 'error' | 'warning'; }>({ mostrar: false, mensaje: '', tipo: 'exito' });

    const mostrarToast = (mensaje: string, tipo: 'exito' | 'error' | 'warning' = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => { setNotificacion(prev => ({ ...prev, mostrar: false })); }, 4000);
    };

    const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo' | 'no-identificado'>('existente');
    const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number | null>(null);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [telefonoCliente, setTelefonoCliente] = useState('');
    const [emailCliente, setEmailCliente] = useState('');

    const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
    const [ordenAEntregar, setOrdenAEntregar] = useState<Orden | null>(null);
    const [diagnosticoFinal, setDiagnosticoFinal] = useState('');
    const [herramientasUsadas, setHerramientasUsadas] = useState('');
    const [costoReparacion, setCostoReparacion] = useState<string>('');
    const [metodoPagoEntrega, setMetodoPagoEntrega] = useState('Efectivo');
    const [idProductoServicioSeleccionado, setIdProductoServicioSeleccionado] = useState<number>(1);

    const [ordenAEditar, setOrdenAEditar] = useState<Orden | null>(null);
    const [editDispositivo, setEditDispositivo] = useState('');
    const [editDiagnostico, setEditDiagnostico] = useState('');
    const [editCostoEstimado, setEditCostoEstimado] = useState<string>('');
    const [editIdCliente, setEditIdCliente] = useState<number | null>(null);
    const [editNotas, setEditNotas] = useState('');

    const [mostrarModalAccion, setMostrarModalAccion] = useState(false);
    const [ordenParaAccion, setOrdenParaAccion] = useState<Orden | null>(null);
    const [tipoAccionContexto, setTipoAccionContexto] = useState<'AlListo' | 'AlEntregar'>('AlListo');
    const [datosEntregaCache, setDatosEntregaCache] = useState<any>(null);

    const cargarDatos = async () => {
        try {
            const [resOrdenes, resClientes, resProductos] = await Promise.all([
                api.get('/ordenesservicio'),
                api.get('/clientes'),
                api.get('/products')
            ]);

            setOrdenes(resOrdenes.data || []);
            setClientes(resClientes.data || []);

            const servicios = (resProductos.data || []).filter((p: ProductoServicio) => p.requiereServicio === true);
            if (servicios.length > 0) {
                setServiciosCatalogo(servicios);
                setIdProductoServicioSeleccionado(servicios[0].id);
            } else if (resProductos.data?.length > 0) {
                setServiciosCatalogo(resProductos.data);
                setIdProductoServicioSeleccionado(resProductos.data[0].id);
            }
        } catch (err) {
            console.error('Error al cargar datos del taller:', err);
            mostrarToast('No se pudieron cargar los datos del taller.', 'error');
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
        c.telefono.includes(busquedaCliente)
    );

    const imprimirContratoGarantiaCompleto = (ordenId: number, datos: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) {
            mostrarToast('El navegador bloqueó la ventana de impresión.', 'warning');
            return;
        }

        const clienteNombre = datos.cliente?.nombre || 'Cliente no identificado';
        const clienteTelefono = datos.cliente?.telefono || 'N/D';
        const clienteEmail = datos.cliente?.email || 'N/D';

        const html = `
            <html>
            <head>
                <title>Contrato_Garantia_ORD-${ordenId}</title>
                <style>
                    @page { size: letter; margin: 15mm; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #581c7e; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
                    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
                    .header-logo { font-size: 24px; font-weight: 800; color: #581c7e; letter-spacing: -0.5px; }
                    .header-sub { font-size: 11px; color: #64748b; line-height: 1.3; }
                    .doc-title { text-align: right; font-size: 16px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
                    .doc-number { text-align: right; font-size: 18px; font-weight: 800; color: #dc2626; margin-top: 5px; }
                    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #581c7e; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin: 20px 0 10px 0; }
                    .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    .info-grid td { padding: 6px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
                    .info-label { font-weight: bold; color: #475569; width: 25%; background: #f8fafc; font-size: 11px; text-transform: uppercase; }
                    .info-value { color: #0f172a; }
                    .terms-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 11px; color: #334155; text-align: justify; }
                    .terms-box ol { margin: 0; padding-left: 18px; }
                    .terms-box li { margin-bottom: 8px; }
                    .signatures-table { width: 100%; margin-top: 50px; border-collapse: collapse; }
                    .signatures-table td { width: 50%; text-align: center; vertical-align: bottom; height: 80px; }
                    .linea-firma { width: 200px; border-bottom: 1px solid #94a3b8; margin: 0 auto 5px auto; }
                    .firma-label { font-size: 11px; color: #64748b; font-weight: bold; }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td>
                            <div class="header-logo">NICAPLUS GAMING</div>
                            <div class="header-sub">Venta de celulares y accesorios<br>De la estatua de la madre 1c y media al norte, León, Nicaragua<br>Soporte: +505 8787-0821 | taller@nicaplus.com</div>
                        </td>
                        <td style="text-align: right; vertical-align: top;">
                            <div class="doc-title">Póliza de Garantía de Servicio</div>
                            <div class="doc-number">ORD-${ordenId}</div>
                            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">Fecha de Emisión: ${new Date().toLocaleDateString('es-NI')}</div>
                        </td>
                    </tr>
                </table>

                <div class="section-title">Información del Beneficiario / Cliente</div>
                <table class="info-grid">
                    <tr>
                        <td class="info-label">Nombre del Cliente</td>
                        <td class="info-value"><strong>${clienteNombre}</strong></td>
                        <td class="info-label">Teléfono de Contacto</td>
                        <td class="info-value">${clienteTelefono}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Correo Electrónico</td>
                        <td class="info-value" colspan="3">${clienteEmail}</td>
                    </tr>
                </table>

                <div class="section-title">Especificaciones del Equipo y Trabajo Realizado</div>
                <table class="info-grid">
                    <tr>
                        <td class="info-label">Dispositivo / Consola</td>
                        <td class="info-value" colspan="3"><strong>${datos.dispositivo}</strong></td>
                    </tr>
                    <tr>
                        <td class="info-label">Reporte Inicial (Falla)</td>
                        <td class="info-value" colspan="3">${datos.diagnostico}</td>
                    </tr>
                    ${datos.costoEstimado ? `<tr><td class="info-label">Costo Presupuestado</td><td class="info-value" colspan="3">C$ ${Number(datos.costoEstimado).toLocaleString('es-NI')}</td></tr>` : ''}
                    ${datos.diagnosticoFinal ? `<tr><td class="info-label">Solución Aplicada</td><td class="info-value" colspan="3">${datos.diagnosticoFinal}</td></tr>` : ''}
                    ${datos.herramientasUsadas ? `<tr><td class="info-label">Repuestos / Insumos</td><td class="info-value" colspan="3">${datos.herramientasUsadas}</td></tr>` : ''}
                </table>

                <div class="section-title">Cláusulas y Condiciones de la Garantía Limitada</div>
                <div class="terms-box">
                    <ol>
                        <li><strong>Ámbito de Cobertura:</strong> La presente póliza cubre única y exclusivamente la mano de obra y los componentes sustituidos detallados en esta orden.</li>
                        <li><strong>Periodo de Validez:</strong> Las notas de tiempo establecidas para este servicio son: <strong>${datos.notasGarantia}</strong>.</li>
                        <li><strong>Exclusiones de Cobertura:</strong> La garantía quedará automáticamente anulada bajo rotura de sellos, humedad o golpes posteriores.</li>
                        <li><strong>Condiciones para Reclamación:</strong> Es requisito indispensable presentar este contrato o el comprobante oficial.</li>
                    </ol>
                </div>

                <table class="signatures-table">
                    <tr>
                        <td>
                            <div class="linea-firma"></div>
                            <div class="firma-label">NICAPLUS GAMING<br>Técnico Autorizado</div>
                        </td>
                        <td>
                            <div class="linea-firma"></div>
                            <div class="firma-label">Cliente Conforme<br>Firma o Cédula</div>
                        </td>
                    </tr>
                </table>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        ventana.document.write(html);
        ventana.document.close();
    };

    const imprimirDocumentosSoporte = (ordenId: number, datos: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) {
            mostrarToast('El navegador bloqueó la ventana de impresión.', 'warning');
            return;
        }

        const clienteNombre = datos.cliente?.nombre || 'Cliente no identificado';
        const clienteTelefono = datos.cliente?.telefono || 'N/D';

        const html = `
            <html>
            <head>
                <title>Comprobante_Taller_${ordenId}</title>
                <style>
                    @page { margin: 0; }
                    body { 
                        font-family: 'Courier New', monospace; 
                        width: 72mm; 
                        margin: 0 auto; 
                        padding: 5px 0;
                        font-size: 11px; 
                        color: #000; 
                        line-height: 1.2; 
                    }
                    .center { text-align: center; }
                    .linea { border-bottom: 1px dashed #000; margin: 6px 0; }
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
                <strong>CLIENTE:</strong> ${clienteNombre}<br>
                <strong>TELÉFONO:</strong> ${clienteTelefono}<br>
                <strong>FECHA:</strong> ${new Date().toLocaleDateString()}<br>
                <div class="linea"></div>
                <strong>EQUIPO:</strong> ${datos.dispositivo}<br>
                <strong>FALLA:</strong><br>${datos.diagnostico}<br>
                <strong>PRECIO ESTIMADO:</strong> C$ ${Number(datos.costoEstimado || 0).toLocaleString('es-NI')}<br>
                <div class="linea"></div>
                ${datos.notasGarantia ? `
                    <strong>CONDICIONES / GARANTÍA:</strong><br>
                    <p style="font-size: 9px; margin: 3px 0;">${datos.notasGarantia}</p>
                    <div class="linea"></div>
                ` : ''}
                <div class="center" style="margin-bottom: 5px;">Conserve este voucher para retirar su equipo.</div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        ventana.document.write(html);
        ventana.document.close();
    };

    const imprimirVoucherEntrega = (datosEntrega: any) => {
        const ventana = window.open('', '_blank');
        if (!ventana) {
            mostrarToast('El navegador bloqueó la ventana de impresión.', 'warning');
            return;
        }

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
                <strong>TELÉFONO:</strong> ${datosEntrega.clienteTelefono || 'N/D'}<br>
                <strong>FECHA SALIDA:</strong> ${new Date().toLocaleDateString()}<br>
                <div class="linea"></div>
                <strong>EQUIPO RETIRADO:</strong><br>${datosEntrega.dispositivo}<br><br>
                <strong>SOLUCIÓN TÉCNICA:</strong><br>${datosEntrega.diagnosticoFinal}<br><br>
                <strong>REPUESTOS:</strong><br>${datosEntrega.herramientasUsadas}<br>
                <div class="linea"></div>
                <div class="total-box">
                    TOTAL PAGADO: C$ ${Number(datosEntrega.costoReparacion).toLocaleString('es-NI')}<br>
                    MÉTODO: ${datosEntrega.metodoPago.toUpperCase()}
                </div>
                <div class="linea"></div>
                <center><strong>GARANTÍA EN TICKET</strong></center>
                <p style="font-size: 9px; text-align: justify;">${datosEntrega.notasGarantia}</p>
                <div class="linea"></div>
                <br><br>
                <div class="center">_______________________<br>Firma de Cliente Conforme</div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `;

        ventana.document.write(html);
        ventana.document.close();
    };

    const abrirEnlaceWhatsApp = (orden: Orden, tipo: 'Listo' | 'Entregado', datosAdicionales?: any) => {
        if (!orden.clienteTelefono) {
            mostrarToast('Esta orden no tiene teléfono de contacto. No se puede enviar WhatsApp.', 'warning');
            return;
        }

        let telefono = orden.clienteTelefono.replace(/\s+/g, '').replace(/-/g, '');
        if (!telefono.startsWith('505')) { telefono = '505' + telefono; }

        const nom = orden.clienteNombre || 'cliente';
        let textoMensaje = '';

        if (tipo === 'Listo') {
            const precioTxt = orden.costoEstimado > 0 ? ` Total a cancelar: *C$ ${Number(orden.costoEstimado).toLocaleString('es-NI')}*.` : '';
            textoMensaje = `¡Hola *${nom}*! 👋 Te saludamos de *NICAPLUS GAMING*. Te notificamos que tu equipo *${orden.dispositivo}* (Orden #${orden.id}) ya está reparado y listo para retiro.${precioTxt} 🛠️✨`;
        } else {
            const costo = datosAdicionales?.costoReparacion || orden.costoEstimado || 0;
            textoMensaje = `🧾 *NICAPLUS GAMING* \n\n¡Hola *${nom}*! Te confirmamos la entrega exitosa de tu *${orden.dispositivo}*. \n💰 *Total Pagado:* C$ ${Number(costo).toLocaleString('es-NI')}\n🛡️ Tu garantía de servicio técnico se encuentra activa. ¡Gracias por tu preferencia!`;
        }

        const url = `https://api.whatsapp.com/send/?phone=${telefono}&text=${encodeURIComponent(textoMensaje)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');
    };

    const registrarIngresoTaller = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!dispositivo.trim() || !diagnostico.trim()) {
            mostrarToast('Complete los datos requeridos del dispositivo.', 'warning');
            return;
        }

        let idClienteFinal: number | null = null;

        try {
            if (modoCliente === 'existente') {
                idClienteFinal = idClienteSeleccionado;
                if (!idClienteFinal) {
                    mostrarToast('Seleccione un cliente o marque "Cliente no identificado".', 'warning');
                    return;
                }
            }

            if (modoCliente === 'nuevo') {
                if (!nombreCliente.trim() || !telefonoCliente.trim()) {
                    mostrarToast('Complete el nombre y teléfono del nuevo cliente.', 'warning');
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

            if (modoCliente === 'no-identificado') { idClienteFinal = null; }

            const usuarioLogueado = JSON.parse(localStorage.getItem('usuario') || '{}');
            const costoFinal = costoEstimado === '' ? 0 : Number(costoEstimado);

            const payload = {
                idCliente: idClienteFinal,
                idUsuario: usuarioLogueado.id || null,
                dispositivo,
                diagnostico,
                costoEstimado: costoFinal,
                notas: notasGarantia
            };

            const resOrden = await api.post('/ordenesservicio', payload);
            const ordenCreada = resOrden.data?.orden || resOrden.data;

            let clienteParaImpresion: DatosCliente = { nombre: 'Cliente no identificado', telefono: '', email: '' };

            if (modoCliente === 'existente') {
                const cliente = clientes.find(c => c.id === idClienteFinal);
                if (cliente) {
                    clienteParaImpresion = { nombre: cliente.nombre, telefono: cliente.telefono, email: cliente.email };
                }
            }

            if (modoCliente === 'nuevo') {
                clienteParaImpresion = { nombre: nombreCliente, telefono: telefonoCliente, email: emailCliente };
            }

            mostrarToast(`Equipo #${ordenCreada.id} ingresado correctamente.`, 'exito');
            imprimirDocumentosSoporte(ordenCreada.id, { dispositivo, diagnostico, costoEstimado: costoFinal, notasGarantia, cliente: clienteParaImpresion });
            imprimirContratoGarantiaCompleto(ordenCreada.id, { dispositivo, diagnostico, costoEstimado: costoFinal, notasGarantia, cliente: clienteParaImpresion });

            setDispositivo('');
            setDiagnostico('');
            setCostoEstimado('');
            setIdClienteSeleccionado(null);
            setBusquedaCliente('');
            setNombreCliente('');
            setTelefonoCliente('');
            setEmailCliente('');
            setModoCliente('existente');
            setMostrarFormIngreso(false);

            await cargarDatos();

        } catch (err: any) {
            console.error('Error al registrar ingreso:', err);
            const mensaje = err?.response?.data?.message || err?.response?.data?.title || 'Error en el flujo de registro del taller.';
            mostrarToast(mensaje, 'error');
        }
    };

    const abrirModalEdicion = (orden: Orden) => {
        setOrdenAEditar(orden);
        setEditDispositivo(orden.dispositivo);
        setEditDiagnostico(orden.diagnostico);
        setEditCostoEstimado(orden.costoEstimado ? orden.costoEstimado.toString() : '');
        setEditIdCliente(orden.idCliente ?? null);
        setEditNotas(orden.notas || '');
    };

    const guardarEdicionOrden = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenAEditar) return;

        try {
            const payload = {
                idCliente: editIdCliente === 0 ? null : editIdCliente,
                dispositivo: editDispositivo,
                diagnostico: editDiagnostico,
                costoEstimado: editCostoEstimado === '' ? 0 : Number(editCostoEstimado),
                notas: editNotas
            };

            await api.put(`/ordenesservicio/${ordenAEditar.id}`, payload);
            mostrarToast(`Orden #${ordenAEditar.id} actualizada correctamente.`, 'exito');
            setOrdenAEditar(null);
            await cargarDatos();
        } catch (err: any) {
            console.error('Error al editar orden:', err);
            mostrarToast(err.response?.data?.mensaje || 'Error al actualizar la orden.', 'error');
        }
    };

    const avanzarEstado = async (id: number, estadoActual: string) => {
        const orden = ordenes.find(o => o.id === id);
        if (!orden) return;

        if (estadoActual === 'Listo') {
            setOrdenAEntregar(orden);
            setDiagnosticoFinal(`Se solucionó la falla: ${orden.diagnostico}`);
            setHerramientasUsadas('');
            setCostoReparacion(orden.costoEstimado ? orden.costoEstimado.toString() : '');
            setMetodoPagoEntrega('Efectivo');
            setMostrarModalEntrega(true);
            return;
        }

        let siguienteEstado = '';
        if (estadoActual === 'Recibido') { siguienteEstado = 'En Revisión'; }
        else if (estadoActual === 'En Revisión') { siguienteEstado = 'Listo'; }
        else { return; }

        try {
            await api.put(`/ordenesservicio/${id}/estado`, { nuevoEstado: siguienteEstado });
            await cargarDatos();

            if (siguienteEstado === 'Listo') {
                setOrdenParaAccion(orden);
                setTipoAccionContexto('AlListo');
                setMostrarModalAccion(true);
            } else {
                mostrarToast(`Orden #${id} movida a ${siguienteEstado}.`, 'exito');
            }
        } catch (err) {
            console.error(err);
            mostrarToast('Error al actualizar el estado técnico.', 'error');
        }
    };

    const ejecutarEntregaFinal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ordenAEntregar) return;

        try {
            const cobroFinal = costoReparacion === '' ? 0 : Number(costoReparacion);
            const payload = {
                diagnosticoFinal,
                herramientasUsed: herramientasUsadas || 'Herramientas de banco técnico',
                costoReparacion: cobroFinal,
                metodoPago: metodoPagoEntrega,
                idProductoServicio: idProductoServicioSeleccionado || 1
            };

            await api.put(`/ordenesservicio/${ordenAEntregar.id}/entregar`, payload);

            const datosImpresion = {
                ordenId: ordenAEntregar.id,
                dispositivo: ordenAEntregar.dispositivo,
                clienteNombre: ordenAEntregar.clienteNombre || 'Cliente no identificado',
                clienteTelefono: ordenAEntregar.clienteTelefono || 'N/D',
                clienteEmail: '',
                diagnosticoFinal,
                herramientasUsadas: payload.herramientasUsed,
                costoReparacion: cobroFinal,
                metodoPago: metodoPagoEntrega,
                notasGarantia
            };

            setDatosEntregaCache(datosImpresion);
            setOrdenParaAccion(ordenAEntregar);
            setTipoAccionContexto('AlEntregar');
            setMostrarModalEntrega(false);
            setOrdenAEntregar(null);

            await cargarDatos();
            setMostrarModalAccion(true);

        } catch (err: any) {
            console.error('Error en entrega:', err);
            mostrarToast(err?.response?.data?.mensaje || 'Error al procesar la entrega del equipo.', 'error');
        }
    };

    const getColumnHeaderClass = (columnaName: string) => {
        if (columnaName === 'Listo') return styles.colListo;
        if (columnaName === 'En Revisión') return styles.colRevision;
        return styles.colRecibido;
    };

    const ordenesHistorialFiltradas = ordenes.filter(o => 
        o.id.toString().includes(busquedaHistorial) ||
        o.dispositivo.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
        o.clienteNombre.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
        o.estado.toLowerCase().includes(busquedaHistorial.toLowerCase())
    );

    const getCantidadesEstado = (columna: string) => ordenes.filter(o => o.estado === columna).length;

    return (
        <div className={styles.tallerContainer}>

            {/* TOAST FLOTANTE */}
            {notificacion.mostrar && (
                <div className={`${styles.toast} ${styles[`toast_${notificacion.tipo}`]}`}>
                    {notificacion.tipo === 'exito' && <FaCheckCircle size={16} />}
                    {notificacion.tipo === 'warning' && <FaExclamationTriangle size={16} />}
                    {notificacion.tipo === 'error' && <FaTimes size={16} />}
                    <span>{notificacion.mensaje}</span>
                </div>
            )}

            {/* BARRA SUPERIOR DE PESTAÑAS */}
            <div className={styles.mainTabs}>
                <button 
                    type="button" 
                    onClick={() => setPestanaActiva('tablero')}
                    className={`${styles.tabBtn} ${pestanaActiva === 'tablero' ? styles.tabBtnActive : ''}`}
                >
                    <FaColumns /> Tablero Taller
                </button>
                <button 
                    type="button" 
                    onClick={() => setPestanaActiva('historial')}
                    className={`${styles.tabBtn} ${pestanaActiva === 'historial' ? styles.tabBtnActive : ''}`}
                >
                    <FaHistory /> Historial General
                </button>
            </div>

            {pestanaActiva === 'tablero' && (
                <>
                    {/* BOTÓN DESPLEGABLE DE REGISTRO EN MÓVIL / FORMULARIO */}
                    <div className={styles.formAccordion}>
                        <button 
                            type="button"
                            onClick={() => setMostrarFormIngreso(!mostrarFormIngreso)}
                            className={styles.accordionToggleBtn}
                        >
                            <span className={styles.accordionTitle}>
                                <FaTools /> Ingresar Nuevo Equipo al Taller
                            </span>
                            {mostrarFormIngreso ? <FaChevronUp /> : <FaPlus />}
                        </button>

                        <form 
                            onSubmit={registrarIngresoTaller} 
                            className={`${styles.formIngreso} ${!mostrarFormIngreso ? styles.formCollapsed : ''}`}
                        >
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaUser /> Cliente</label>
                                    <div className={styles.modoClienteGroup}>
                                        <button 
                                            type="button" 
                                            onClick={() => { setModoCliente('existente'); setNombreCliente(''); setTelefonoCliente(''); setEmailCliente(''); }} 
                                            className={`${styles.modoBtn} ${modoCliente === 'existente' ? styles.modoBtnActive : ''}`}
                                        >
                                            Existente
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setModoCliente('nuevo'); setIdClienteSeleccionado(null); setBusquedaCliente(''); }} 
                                            className={`${styles.modoBtn} ${modoCliente === 'nuevo' ? styles.modoBtnActive : ''}`}
                                        >
                                            Nuevo
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => { setModoCliente('no-identificado'); setIdClienteSeleccionado(null); setBusquedaCliente(''); setNombreCliente(''); setTelefonoCliente(''); setEmailCliente(''); }} 
                                            className={`${styles.modoBtn} ${modoCliente === 'no-identificado' ? styles.modoBtnDanger : ''}`}
                                        >
                                            Mostrador
                                        </button>
                                    </div>

                                    {modoCliente === 'existente' && (
                                        <div className={styles.clienteSelectorWrap}>
                                            <div className={styles.inputIconWrapper}>
                                                <FaSearch className={styles.inputIcon} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Buscar cliente..." 
                                                    value={busquedaCliente} 
                                                    onChange={e => setBusquedaCliente(e.target.value)} 
                                                    className={`${styles.input} ${styles.inputWithIcon}`} 
                                                />
                                            </div>
                                            <select 
                                                value={idClienteSeleccionado || 0} 
                                                onChange={e => { const valor = Number(e.target.value); setIdClienteSeleccionado(valor === 0 ? null : valor); }} 
                                                className={styles.select}
                                            >
                                                <option value={0}>-- Seleccionar Cliente --</option>
                                                {clientesFiltrados.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {modoCliente === 'nuevo' && (
                                        <div className={styles.nuevoClienteInputs}>
                                            <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} className={styles.input} placeholder="Nombre completo *" required />
                                            <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} className={styles.input} placeholder="Teléfono *" required />
                                            <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} className={styles.input} placeholder="Email (Opcional)" />
                                        </div>
                                    )}

                                    {modoCliente === 'no-identificado' && (
                                        <div className={styles.infoBannerWarning}>
                                            Registro rápido de mostrador (Sin cliente vinculado).
                                        </div>
                                    )}
                                </div>

                                <div className={styles.formGroupCol}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}><FaLaptop /> Dispositivo</label>
                                        <input type="text" value={dispositivo} onChange={e => setDispositivo(e.target.value)} className={styles.input} placeholder="Ej: PS5 Slim, iPhone 13, Laptop HP" required />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}><FaMoneyBillWave /> Costo Estimado (C$)</label>
                                        <input 
                                            type="number" 
                                            value={costoEstimado} 
                                            onChange={e => setCostoEstimado(e.target.value)} 
                                            className={`${styles.input} ${styles.inputCosto}`} 
                                            placeholder="0.00" 
                                            min={0} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Falla y Diagnóstico Inicial</label>
                                <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className={styles.textarea} placeholder="Detalles de la falla detectada..." rows={2} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Condiciones y Garantía</label>
                                <input type="text" value={notasGarantia} onChange={e => setNotasGarantia(e.target.value)} className={styles.input} />
                            </div>

                            <button type="submit" className={styles.btnSubmit}>
                                Registrar Ingreso e Imprimir Comprobantes
                            </button>
                        </form>
                    </div>

                    {/* SELECTOR DE ESTADOS KANBAN EN MÓVIL */}
                    <div className={styles.mobileKanbanTabs}>
                        <button 
                            type="button"
                            onClick={() => setColumnaMovilActiva('Recibido')}
                            className={`${styles.mobileTabCol} ${columnaMovilActiva === 'Recibido' ? styles.colRecibidoActive : ''}`}
                        >
                            Recibidos ({getCantidadesEstado('Recibido')})
                        </button>
                        <button 
                            type="button"
                            onClick={() => setColumnaMovilActiva('En Revisión')}
                            className={`${styles.mobileTabCol} ${columnaMovilActiva === 'En Revisión' ? styles.colRevisionActive : ''}`}
                        >
                            En Revisión ({getCantidadesEstado('En Revisión')})
                        </button>
                        <button 
                            type="button"
                            onClick={() => setColumnaMovilActiva('Listo')}
                            className={`${styles.mobileTabCol} ${columnaMovilActiva === 'Listo' ? styles.colListoActive : ''}`}
                        >
                            Listos ({getCantidadesEstado('Listo')})
                        </button>
                    </div>

                    {/* TABLERO KANBAN */}
                    <div className={styles.kanbanTablero}>
                        {(['Recibido', 'En Revisión', 'Listo'] as const).map(columna => {
                            const ordenesColumna = ordenes.filter(o => o.estado === columna);
                            return (
                                <div 
                                    className={`${styles.kanbanColumna} ${columnaMovilActiva !== columna ? styles.hideMobileCol : ''}`} 
                                    key={columna}
                                >
                                    <h4 className={`${styles.columnHeader} ${getColumnHeaderClass(columna)}`}>
                                        <span>{columna}</span>
                                        <span className={styles.colBadge}>{ordenesColumna.length}</span>
                                    </h4>

                                    <div className={styles.cardsContainer}>
                                        {ordenesColumna.map(orden => {
                                            const tieneTelefono = !!orden.clienteTelefono;
                                            return (
                                                <div key={orden.id} className={styles.card}>
                                                    <div className={styles.cardHeader}>
                                                        <strong className={styles.cardTitle}>{orden.dispositivo}</strong>
                                                        <div className={styles.cardHeaderRight}>
                                                            <button 
                                                                type="button"
                                                                onClick={() => abrirModalEdicion(orden)} 
                                                                className={styles.btnCardEdit}
                                                                title="Editar Orden"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <span className={styles.cardBadge}>#{orden.id}</span>
                                                        </div>
                                                    </div>

                                                    <p className={styles.cardDesc}>{orden.diagnostico}</p>

                                                    <div className={styles.cardCostRow}>
                                                        <span>Pactado:</span>
                                                        <strong>C$ {Number(orden.costoEstimado || 0).toLocaleString('es-NI')}</strong>
                                                    </div>

                                                    <div className={styles.cardDivider}>
                                                        <small className={styles.cardClientName}>👤 {orden.clienteNombre || 'No identificado'}</small>
                                                        <small className={styles.cardClientPhone}>📱 {orden.clienteTelefono || 'Sin tel'}</small>
                                                    </div>

                                                    <div className={styles.cardActions}>
                                                        <button onClick={() => avanzarEstado(orden.id, orden.estado)} className={styles.btnAvanzar}>
                                                            {orden.estado === 'Listo' ? 'Entregar y Cobrar' : 'Avanzar Estado'}
                                                            <FaChevronRight size={10} />
                                                        </button>

                                                        {orden.estado === 'Listo' && tieneTelefono && (
                                                            <button title="Notificar por WhatsApp" onClick={() => abrirEnlaceWhatsApp(orden, 'Listo')} className={styles.btnWhatsAppQuick}>
                                                                <FaWhatsapp size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {ordenesColumna.length === 0 && (
                                            <div className={styles.emptyColumnText}>Sin órdenes en este estado</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* PESTAÑA HISTORIAL DE TRABAJOS */}
            {pestanaActiva === 'historial' && (
                <div className={styles.historialContainer}>
                    <div className={styles.historialHeader}>
                        <div>
                            <h3 className={styles.historialTitle}>Historial de Reparaciones</h3>
                            <p className={styles.historialSubtitle}>Registro de equipos ingresados y entregados.</p>
                        </div>
                        <div className={styles.inputIconWrapper} style={{ minWidth: '240px' }}>
                            <FaSearch className={styles.inputIcon} />
                            <input 
                                type="text" 
                                placeholder="Buscar orden, cliente o equipo..." 
                                value={busquedaHistorial} 
                                onChange={e => setBusquedaHistorial(e.target.value)} 
                                className={`${styles.input} ${styles.inputWithIcon}`} 
                            />
                        </div>
                    </div>

                    {/* VISTA MÓVIL DEL HISTORIAL (FEED DE CARDS) */}
                    <div className={styles.mobileHistoryFeed}>
                        {ordenesHistorialFiltradas.length === 0 ? (
                            <div className={styles.emptyColumnText}>No se encontraron órdenes registradas.</div>
                        ) : (
                            ordenesHistorialFiltradas.map(o => (
                                <div key={o.id} className={styles.historyCard}>
                                    <div className={styles.historyCardHeader}>
                                        <strong className={styles.historyOrderNumber}>#ORD-{o.id}</strong>
                                        <span className={`${styles.statusBadge} ${styles[`status_${o.estado.replace(/\s+/g, '')}`]}`}>
                                            {o.estado}
                                        </span>
                                    </div>

                                    <div className={styles.historyCardBody}>
                                        <div className={styles.historyDevice}><strong>{o.dispositivo}</strong></div>
                                        <small className={styles.historyCustomer}>👤 {o.clienteNombre} ({o.clienteTelefono || 'Sin tel'})</small>
                                        <p className={styles.historyDiag}>{o.diagnostico}</p>
                                    </div>

                                    <div className={styles.historyCardFooter}>
                                        <strong className={styles.historyPrice}>C$ {Number(o.costoEstimado || 0).toLocaleString('es-NI')}</strong>
                                        <div className={styles.historyActions}>
                                            {o.estado !== 'Entregado' && (
                                                <button onClick={() => abrirModalEdicion(o)} className={styles.btnActionEdit} title="Editar">
                                                    <FaEdit size={12} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => imprimirDocumentosSoporte(o.id, {
                                                    dispositivo: o.dispositivo,
                                                    diagnostico: o.diagnostico,
                                                    costoEstimado: o.costoEstimado,
                                                    notasGarantia: o.notas,
                                                    cliente: { nombre: o.clienteNombre, telefono: o.clienteTelefono, email: '' }
                                                })} 
                                                className={styles.btnActionPrint} 
                                                title="Reimprimir Voucher"
                                            >
                                                <FaPrint size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* VISTA ESCRITORIO DEL HISTORIAL (TABLA) */}
                    <div className={styles.desktopHistoryTable}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>N° Orden</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Equipo</th>
                                    <th>Falla</th>
                                    <th>Costo</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenesHistorialFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className={styles.tableEmpty}>No se encontraron órdenes registradas.</td>
                                    </tr>
                                ) : (
                                    ordenesHistorialFiltradas.map(o => (
                                        <tr key={o.id}>
                                            <td className={styles.tdOrder}>#ORD-{o.id}</td>
                                            <td>{new Date(o.fechaIngreso).toLocaleDateString()}</td>
                                            <td>
                                                <strong>{o.clienteNombre}</strong>
                                                <div className={styles.textMuted}>{o.clienteTelefono || 'Sin teléfono'}</div>
                                            </td>
                                            <td><strong>{o.dispositivo}</strong></td>
                                            <td className={styles.tdDiag}>{o.diagnostico}</td>
                                            <td className={styles.tdCost}>
                                                C$ {Number(o.costoEstimado || 0).toLocaleString('es-NI')}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[`status_${o.estado.replace(/\s+/g, '')}`]}`}>
                                                    {o.estado}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className={styles.tableActionsRow}>
                                                    {o.estado !== 'Entregado' && (
                                                        <button onClick={() => abrirModalEdicion(o)} className={styles.btnActionEdit} title="Editar">
                                                            <FaEdit />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => imprimirDocumentosSoporte(o.id, {
                                                            dispositivo: o.dispositivo,
                                                            diagnostico: o.diagnostico,
                                                            costoEstimado: o.costoEstimado,
                                                            notasGarantia: o.notas,
                                                            cliente: { nombre: o.clienteNombre, telefono: o.clienteTelefono, email: '' }
                                                        })} 
                                                        className={styles.btnActionPrint} 
                                                        title="Reimprimir"
                                                    >
                                                        <FaPrint />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN DE ORDEN */}
            {ordenAEditar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}><FaEdit /> Editar Trabajo #{ordenAEditar.id}</h3>
                            <button onClick={() => setOrdenAEditar(null)} className={styles.btnCloseModal}><FaTimes /></button>
                        </div>

                        <form onSubmit={guardarEdicionOrden} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaUser /> Reasignar Cliente</label>
                                <select 
                                    value={editIdCliente || 0} 
                                    onChange={e => setEditIdCliente(Number(e.target.value) === 0 ? null : Number(e.target.value))} 
                                    className={styles.select}
                                >
                                    <option value={0}>Cliente no identificado / Mostrador</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaLaptop /> Dispositivo</label>
                                <input 
                                    type="text" 
                                    value={editDispositivo} 
                                    onChange={e => setEditDispositivo(e.target.value)} 
                                    className={styles.input} 
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave /> Costo Estimado (C$)</label>
                                <input 
                                    type="number" 
                                    value={editCostoEstimado} 
                                    onChange={e => setEditCostoEstimado(e.target.value)} 
                                    className={`${styles.input} ${styles.inputCosto}`} 
                                    min={0} 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Diagnóstico / Falla</label>
                                <textarea 
                                    value={editDiagnostico} 
                                    onChange={e => setEditDiagnostico(e.target.value)} 
                                    className={styles.textarea} 
                                    rows={3}
                                    required 
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Notas y Términos</label>
                                <input 
                                    type="text" 
                                    value={editNotas} 
                                    onChange={e => setEditNotas(e.target.value)} 
                                    className={styles.input} 
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnModalConfirm}>Guardar Modificaciones</button>
                                <button type="button" onClick={() => setOrdenAEditar(null)} className={styles.btnModalCancel}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ENTREGA */}
            {mostrarModalEntrega && ordenAEntregar && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}><FaTools /> Liquidación #{ordenAEntregar.id}</h3>
                            <button onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} className={styles.btnCloseModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={ejecutarEntregaFinal} className={styles.modalForm}>
                            <div className={styles.infoRow}>
                                <span className={styles.textMuted}>Equipo:</span>
                                <strong>{ordenAEntregar.dispositivo}</strong> ({ordenAEntregar.clienteNombre || 'Mostrador'})
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaConciergeBell /> Concepto Contable</label>
                                <select 
                                    value={idProductoServicioSeleccionado} 
                                    onChange={e => setIdProductoServicioSeleccionado(Number(e.target.value))} 
                                    className={styles.select} 
                                    required
                                >
                                    {serviciosCatalogo.length > 0 ? (
                                        serviciosCatalogo.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nombre} {s.precioVenta ? `(C$ ${s.precioVenta})` : ''}
                                            </option>
                                        ))
                                    ) : (
                                        <option value={1}>Mantenimiento / Servicio Técnico</option>
                                    )}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Solución Técnica Final</label>
                                <textarea value={diagnosticoFinal} onChange={e => setDiagnosticoFinal(e.target.value)} className={styles.textarea} placeholder="Escriba la solución aplicada..." rows={2} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaWrench /> Repuestos Utilizados</label>
                                <input type="text" value={herramientasUsadas} onChange={e => setHerramientasUsadas(e.target.value)} className={styles.input} placeholder="Ej: Flex, pantalla, pasta térmica" required />
                            </div>

                            <div className={styles.formRowDual}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Método Pago</label>
                                    <select value={metodoPagoEntrega} onChange={e => setMetodoPagoEntrega(e.target.value)} className={styles.select} required>
                                        <option value="Efectivo">💵 Efectivo</option>
                                        <option value="Transferencia">🏦 Transf.</option>
                                        <option value="Tarjeta">💳 Tarjeta</option>
                                        <option value="Crédito">🛑 Crédito</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Total Cobrado (C$)</label>
                                    <input 
                                        type="number" 
                                        value={costoReparacion} 
                                        onChange={e => setCostoReparacion(e.target.value)} 
                                        className={`${styles.input} ${styles.inputCosto}`} 
                                        placeholder="0.00" 
                                        min={0} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnModalConfirm}>Procesar Salida y Facturar</button>
                                <button type="button" onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} className={styles.btnModalCancel}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ACCIONES / FINALIZACIÓN */}
            {mostrarModalAccion && ordenParaAccion && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalSuccessContent}>
                        <FaCheckCircle size={44} className={styles.successIcon} />
                        <h3 className={styles.successTitle}>
                            {tipoAccionContexto === 'AlListo' ? '¡Equipo Listo para Retiro!' : '¡Entrega y Factura Procesada!'}
                        </h3>

                        <p className={styles.successDesc}>
                            Orden <strong>#{ordenParaAccion.id}</strong> ({ordenParaAccion.dispositivo})
                        </p>

                        <div className={styles.actionButtonsContainer}>
                            <button 
                                onClick={() => abrirEnlaceWhatsApp(ordenParaAccion, tipoAccionContexto === 'AlListo' ? 'Listo' : 'Entregado', datosEntregaCache)} 
                                disabled={!ordenParaAccion.clienteTelefono} 
                                className={`${styles.btnActionBase} ${styles.btnActionWhatsApp}`}
                            >
                                <FaWhatsapp size={18} />
                                {ordenParaAccion.clienteTelefono ? 'Avisar por WhatsApp' : 'Sin WhatsApp'}
                            </button>

                            <button onClick={() => {
                                if (tipoAccionContexto === 'AlListo') {
                                    imprimirDocumentosSoporte(ordenParaAccion.id, {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        costoEstimado: ordenParaAccion.costoEstimado,
                                        notasGarantia,
                                        cliente: { nombre: ordenParaAccion.clienteNombre || 'Cliente no identificado', telefono: ordenParaAccion.clienteTelefono || '', email: '' }
                                    });
                                } else if (datosEntregaCache) {
                                    imprimirVoucherEntrega(datosEntregaCache);
                                }
                            }} className={`${styles.btnActionBase} ${styles.btnActionPrint}`}>
                                <FaPrint size={16} /> Imprimir Ticket Térmico
                            </button>

                            <button onClick={() => {
                                const datosGarantiaParaImprimir = tipoAccionContexto === 'AlListo'
                                    ? {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        costoEstimado: ordenParaAccion.costoEstimado,
                                        notasGarantia,
                                        cliente: { nombre: ordenParaAccion.clienteNombre || 'Cliente no identificado', telefono: ordenParaAccion.clienteTelefono || '', email: '' }
                                    }
                                    : {
                                        dispositivo: ordenParaAccion.dispositivo,
                                        diagnostico: ordenParaAccion.diagnostico,
                                        diagnosticoFinal: datosEntregaCache?.diagnosticoFinal,
                                        herramientasUsadas: datosEntregaCache?.herramientasUsadas,
                                        costoEstimado: datosEntregaCache?.costoReparacion,
                                        notasGarantia,
                                        cliente: { nombre: datosEntregaCache?.clienteNombre || 'Cliente no identificado', telefono: datosEntregaCache?.clienteTelefono || '', email: datosEntregaCache?.clienteEmail || '' }
                                    };

                                imprimirContratoGarantiaCompleto(ordenParaAccion.id, datosGarantiaParaImprimir);
                            }} className={`${styles.btnActionBase} ${styles.btnActionContract}`}>
                                <FaFileContract size={16} /> Imprimir Póliza (A4/Carta)
                            </button>

                            <button onClick={() => { setMostrarModalAccion(false); setOrdenParaAccion(null); setDatosEntregaCache(null); }} className={`${styles.btnActionBase} ${styles.btnActionReturn}`}>
                                Volver al Tablero
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};