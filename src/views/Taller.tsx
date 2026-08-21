import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FaUser, FaLaptop, FaTools, FaChevronRight, FaTimes, 
    FaMoneyBillWave, FaWrench, FaWhatsapp, FaPrint, 
    FaCheckCircle, FaSearch, FaFileContract, FaExclamationTriangle,
    FaConciergeBell, FaEdit, FaHistory, FaColumns
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

            setOrdenes(resOrdenes.data);
            setClientes(resClientes.data);

            const servicios = resProductos.data.filter((p: ProductoServicio) => p.requiereServicio === true);
            if (servicios.length > 0) {
                setServiciosCatalogo(servicios);
                setIdProductoServicioSeleccionado(servicios[0].id);
            } else if (resProductos.data.length > 0) {
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

    return (
        <div className={styles.tallerContainer}>

            {notificacion.mostrar && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderRadius: '8px', color: '#fff', fontWeight: '600', fontSize: '14px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)', backgroundColor: notificacion.tipo === 'exito' ? '#10b981' : notificacion.tipo === 'warning' ? '#f59e0b' : '#ef4444' }}>
                    {notificacion.tipo === 'exito' && <FaCheckCircle size={18} />}
                    {notificacion.tipo === 'warning' && <FaExclamationTriangle size={18} />}
                    {notificacion.tipo === 'error' && <FaTimes size={18} />}
                    <span>{notificacion.mensaje}</span>
                </div>
            )}

            {/* BARRA SUPERIOR DE PESTAÑAS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <button 
                    type="button" 
                    onClick={() => setPestanaActiva('tablero')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                        background: pestanaActiva === 'tablero' ? '#581c7e' : '#1e293b', color: '#fff'
                    }}
                >
                    <FaColumns /> Tablero Kanban Activo
                </button>
                <button 
                    type="button" 
                    onClick={() => setPestanaActiva('historial')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
                        background: pestanaActiva === 'historial' ? '#581c7e' : '#1e293b', color: '#fff'
                    }}
                >
                    <FaHistory /> Historial General de Trabajos
                </button>
            </div>

            {pestanaActiva === 'tablero' && (
                <>
                    {/* FORMULARIO DE INGRESO */}
                    <form onSubmit={registrarIngresoTaller} className={styles.formIngreso}>
                        <h3 className={styles.formTitle}>
                            <FaTools /> Registro de Ingreso de Equipos y Control Técnico
                        </h3>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <div className={styles.labelWrapper}>
                                    <label className={styles.label}><FaUser /> Cliente de la Orden</label>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    <button type="button" onClick={() => { setModoCliente('existente'); setNombreCliente(''); setTelefonoCliente(''); setEmailCliente(''); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: modoCliente === 'existente' ? '#581c7e' : '#fff', color: modoCliente === 'existente' ? '#fff' : '#334155' }}>
                                        Cliente existente
                                    </button>
                                    <button type="button" onClick={() => { setModoCliente('nuevo'); setIdClienteSeleccionado(null); setBusquedaCliente(''); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: modoCliente === 'nuevo' ? '#581c7e' : '#fff', color: modoCliente === 'nuevo' ? '#fff' : '#334155' }}>
                                        Nuevo cliente
                                    </button>
                                    <button type="button" onClick={() => { setModoCliente('no-identificado'); setIdClienteSeleccionado(null); setBusquedaCliente(''); setNombreCliente(''); setTelefonoCliente(''); setEmailCliente(''); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', background: modoCliente === 'no-identificado' ? '#dc2626' : '#fff', color: modoCliente === 'no-identificado' ? '#fff' : '#334155' }}>
                                        Sin identificar
                                    </button>
                                </div>

                                {modoCliente === 'existente' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div className={styles.inputIconWrapper}>
                                            <FaSearch className={styles.inputIcon} />
                                            <input type="text" placeholder="Filtrar clientes..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} className={`${styles.input} ${styles.inputWithIcon}`} />
                                        </div>
                                        <select value={idClienteSeleccionado || 0} onChange={e => { const valor = Number(e.target.value); setIdClienteSeleccionado(valor === 0 ? null : valor); }} className={styles.select}>
                                            <option value={0}>-- Selecciona el Cliente --</option>
                                            {clientesFiltrados.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {modoCliente === 'nuevo' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} className={styles.input} placeholder="Nombre completo" />
                                        <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} className={styles.input} placeholder="Teléfono" />
                                        <input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} className={styles.input} placeholder="Email (Opcional)" />
                                    </div>
                                )}

                                {modoCliente === 'no-identificado' && (
                                    <div style={{ padding: '12px', borderRadius: '8px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '13px' }}>
                                        <strong>Cliente no identificado</strong><br />
                                        El equipo será registrado como mostrador sin asociar a cuenta.
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaLaptop /> Dispositivo</label>
                                    <input type="text" value={dispositivo} onChange={e => setDispositivo(e.target.value)} className={styles.input} placeholder="Ej: PS5 Slim, Xbox Series X, Laptop Asus" required />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaMoneyBillWave /> Costo Estimado / Presupuesto Acordado (C$)</label>
                                    <input 
                                        type="number" 
                                        value={costoEstimado} 
                                        onChange={e => setCostoEstimado(e.target.value)} 
                                        className={`${styles.input} ${styles.inputCosto}`} 
                                        placeholder="0.00 (Monto inicial a cobrar)" 
                                        min={0} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                            <label className={styles.label}>Falla y Diagnóstico Inicial</label>
                            <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className={styles.textarea} placeholder="Detalles de la falla detectada..." required />
                        </div>

                        <div className={styles.formGroup} style={{ marginBottom: '16px' }}>
                            <label className={styles.label}>Condiciones y Póliza de Garantía a Imprimir</label>
                            <input type="text" value={notasGarantia} onChange={e => setNotasGarantia(e.target.value)} className={styles.input} />
                        </div>

                        <button type="submit" className={styles.btnSubmit}>
                            Ingresar Equipo e Imprimir Comprobante
                        </button>
                    </form>

                    {/* KANBAN */}
                    <div className={styles.kanbanTablero}>
                        {['Recibido', 'En Revisión', 'Listo'].map(columna => {
                            const ordenesColumna = ordenes.filter(o => o.estado === columna);
                            return (
                                <div className={styles.kanbanColumna} key={columna}>
                                    <h4 className={`${styles.columnHeader} ${getColumnHeaderClass(columna)}`}>
                                        {columna} ({ordenesColumna.length})
                                    </h4>

                                    <div className={styles.cardsContainer}>
                                        {ordenesColumna.map(orden => {
                                            const tieneTelefono = !!orden.clienteTelefono;
                                            return (
                                                <div key={orden.id} className={styles.card}>
                                                    <div className={styles.cardHeader}>
                                                        <strong className={styles.cardTitle}>{orden.dispositivo}</strong>
                                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <button 
                                                                type="button"
                                                                onClick={() => abrirModalEdicion(orden)} 
                                                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
                                                                title="Editar Orden"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <span className={styles.cardBadge}>#{orden.id}</span>
                                                        </div>
                                                    </div>

                                                    <p className={styles.cardDesc}>{orden.diagnostico}</p>

                                                    <div style={{ margin: '8px 0', fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                                                        Costo pactado: C$ {Number(orden.costoEstimado || 0).toLocaleString('es-NI')}
                                                    </div>

                                                    <div className={styles.cardDivider}>
                                                        <small className={styles.cardClientName}>Cliente: {orden.clienteNombre || 'No identificado'}</small>
                                                        <small className={styles.cardClientPhone}>Tel: {orden.clienteTelefono || 'No registrado'}</small>
                                                    </div>

                                                    <div className={styles.cardActions}>
                                                        <button onClick={() => avanzarEstado(orden.id, orden.estado)} className={styles.btnAvanzar}>
                                                            {orden.estado === 'Listo' ? 'Entregar y Cobrar' : 'Avanzar'}
                                                            <FaChevronRight size={10} />
                                                        </button>

                                                        {orden.estado === 'Listo' && tieneTelefono && (
                                                            <button title="Notificar por WhatsApp" onClick={() => abrirEnlaceWhatsApp(orden, 'Listo')} className={styles.btnWhatsAppQuick}>
                                                                <FaWhatsapp size={14} />
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
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Historial General de Reparaciones</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Registro de todos los equipos ingresados, entregados y en proceso.</p>
                        </div>
                        <div className={styles.inputIconWrapper} style={{ minWidth: '280px' }}>
                            <FaSearch className={styles.inputIcon} />
                            <input 
                                type="text" 
                                placeholder="Buscar por orden, cliente, equipo o estado..." 
                                value={busquedaHistorial} 
                                onChange={e => setBusquedaHistorial(e.target.value)} 
                                className={`${styles.input} ${styles.inputWithIcon}`} 
                            />
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#cbd5e1' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #475569', textAlign: 'left', background: '#0f172a' }}>
                                    <th style={{ padding: '10px' }}>N° Orden</th>
                                    <th style={{ padding: '10px' }}>Fecha Ingreso</th>
                                    <th style={{ padding: '10px' }}>Cliente</th>
                                    <th style={{ padding: '10px' }}>Equipo</th>
                                    <th style={{ padding: '10px' }}>Diagnóstico / Falla</th>
                                    <th style={{ padding: '10px' }}>Costo Est.</th>
                                    <th style={{ padding: '10px' }}>Estado</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenesHistorialFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No se encontraron órdenes registradas.</td>
                                    </tr>
                                ) : (
                                    ordenesHistorialFiltradas.map(o => (
                                        <tr key={o.id} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '10px', fontWeight: 'bold', color: '#38bdf8' }}>#ORD-{o.id}</td>
                                            <td style={{ padding: '10px' }}>{new Date(o.fechaIngreso || o.fechaIngreso).toLocaleDateString()}</td>
                                            <td style={{ padding: '10px' }}>
                                                <strong>{o.clienteNombre}</strong>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>{o.clienteTelefono || 'Sin teléfono'}</div>
                                            </td>
                                            <td style={{ padding: '10px' }}><strong>{o.dispositivo}</strong></td>
                                            <td style={{ padding: '10px', maxWidth: '250px' }}>{o.diagnostico}</td>
                                            <td style={{ padding: '10px', color: '#4ade80', fontWeight: 'bold' }}>
                                                C$ {Number(o.costoEstimado || 0).toLocaleString('es-NI')}
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ 
                                                    padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                                    background: o.estado === 'Entregado' ? '#065f46' : o.estado === 'Listo' ? '#1e3a8a' : '#854d0e',
                                                    color: '#fff'
                                                }}>
                                                    {o.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    {o.estado !== 'Entregado' && (
                                                        <button 
                                                            onClick={() => abrirModalEdicion(o)} 
                                                            style={{ background: '#581c7e', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                            title="Editar Orden"
                                                        >
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
                                                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                        title="Reimprimir Voucher"
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
                                <label className={styles.label}><FaMoneyBillWave /> Costo Estimado / Presupuesto (C$)</label>
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
                            <h3 className={styles.modalTitle}><FaTools /> Liquidación de Orden #{ordenAEntregar.id}</h3>
                            <button onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} className={styles.btnCloseModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={ejecutarEntregaFinal} className={styles.modalForm}>
                            <div className={styles.infoRow}>
                                <small className={styles.infoRowLabel}>Equipo a Retirar:</small>
                                <strong>{ordenAEntregar.dispositivo}</strong> ({ordenAEntregar.clienteNombre || 'Cliente no identificado'})
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaConciergeBell /> Concepto Contable del Servicio</label>
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
                                        <option value={1}>Mantenimiento / Servicio Técnico (Predeterminado #1)</option>
                                    )}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaUser /> Diagnóstico de Reparación Final</label>
                                <textarea value={diagnosticoFinal} onChange={e => setDiagnosticoFinal(e.target.value)} className={styles.textarea} placeholder="Escriba la solución aplicada..." required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaWrench /> Repuestos / Herramientas Utilizadas</label>
                                <input type="text" value={herramientasUsadas} onChange={e => setHerramientasUsadas(e.target.value)} className={styles.input} placeholder="Ej: Cambio de pantalla, flex, limpieza interna" required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave /> Método de Pago</label>
                                <select value={metodoPagoEntrega} onChange={e => setMetodoPagoEntrega(e.target.value)} className={styles.select} required>
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                    <option value="Tarjeta">💳 Tarjeta</option>
                                    <option value="Crédito">🛑 Crédito</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave /> Costo Final del Servicio (C$)</label>
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

                            <div className={styles.modalActions}>
                                <button type="submit" className={styles.btnModalConfirm}>Procesar Salida y Facturar</button>
                                <button type="button" onClick={() => { setMostrarModalEntrega(false); setOrdenAEntregar(null); }} className={styles.btnModalCancel}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ACCIONES */}
            {mostrarModalAccion && ordenParaAccion && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalSuccessContent}>
                        <FaCheckCircle size={50} className={styles.successIcon} />
                        <h3 className={styles.successTitle}>
                            {tipoAccionContexto === 'AlListo' ? '¡Equipo Marcado Como Listo!' : '¡Orden Procesada Exitosamente!'}
                        </h3>

                        <p className={styles.successDesc}>
                            Selecciona las acciones comerciales para la Orden <strong>#{ordenParaAccion.id}</strong> ({ordenParaAccion.dispositivo})
                        </p>

                        <div className={styles.actionButtonsContainer}>
                            <button onClick={() => abrirEnlaceWhatsApp(ordenParaAccion, tipoAccionContexto === 'AlListo' ? 'Listo' : 'Entregado', datosEntregaCache)} disabled={!ordenParaAccion.clienteTelefono} className={`${styles.btnActionBase} ${styles.btnActionWhatsApp}`} style={{ opacity: ordenParaAccion.clienteTelefono ? 1 : 0.5, cursor: ordenParaAccion.clienteTelefono ? 'pointer' : 'not-allowed' }}>
                                <FaWhatsapp size={18} />
                                {ordenParaAccion.clienteTelefono ? 'Avisar al Cliente por WhatsApp' : 'Sin teléfono para WhatsApp'}
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
                                <FaPrint size={18} /> Imprimir Ticket Comercial (Térmico)
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
                            }} className={styles.btnActionBase} style={{ backgroundColor: '#2563eb', color: '#fff' }}>
                                <FaFileContract size={18} /> Imprimir Contrato Garantía (Hoja Entera A4)
                            </button>

                            <button onClick={() => { setMostrarModalAccion(false); setOrdenParaAccion(null); setDatosEntregaCache(null); }} className={`${styles.btnActionBase} ${styles.btnActionReturn}`}>
                                Listo, Volver al Tablero
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};