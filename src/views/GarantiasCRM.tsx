import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    FaShieldAlt, FaHistory, FaPlus, FaFileContract, 
    FaSave, FaWhatsapp, FaPrint, FaLaptop
} from 'react-icons/fa';

interface Plantilla {
    id: string;
    tipoProducto: string;
    cobertura: string;
    exclusiones: string;
    diasValidez: number;
}

export const GarantiasCRM: React.FC = () => {
    const { usuario } = useAuth();
    const [garantias, setGarantias] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // CONTROL DE PESTAÑAS MÓVILES
    const [tabActiva, setTabActiva] = useState<'poliza' | 'reposicion' | 'historial' | 'plantillas'>('poliza');

    // CONTROL DE BÚSQUEDA Y ASIGNACIÓN
    const [idCliente, setIdCliente] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');

    // FORMULARIO: REGISTRO REPOSICIÓN CUENTAS
    const [motivo, setMotivo] = useState('');
    const [cuentaAnterior, setCuentaAnterior] = useState('');
    const [cuentaNueva, setCuentaNueva] = useState('');
    const [costoReposicion, setCostoReposicion] = useState(0);

    // SISTEMA DE PLANTILLAS PREGUARDADAS
    const [plantillas, setPlantillas] = useState<Plantilla[]>([
        { id: '1', tipoProducto: 'Celulares', cobertura: '1 mes en placa y pantalla (no golpes). 1 mes en batería.', exclusiones: 'Humedad, sellos rotos, golpes evidentes o sobrecargas.', diasValidez: 30 },
        { id: '2', tipoProducto: 'Parlantes y Audio', cobertura: '30 días en el módulo bluetooth y puerto de carga.', exclusiones: 'Saturación de bobina por exceso de volumen o uso de cargador inadecuado.', diasValidez: 30 }
    ]);
    const [nuevoTipo, setNuevoTipo] = useState('');
    const [nuevaCobertura, setNuevaCobertura] = useState('');
    const [nuevasExclusiones, setNuevasExclusiones] = useState('');
    const [nuevosDias, setNuevosDias] = useState(30);

    // FORMULARIO: EMISIÓN DE PÓLIZA A CLIENTE
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<Plantilla | null>(null);
    const [modeloEspecifico, setModeloEspecifico] = useState('');
    const [imeiSerie, setImeiSerie] = useState('');

    const cargarDatos = async () => {
        try {
            const [resGarantias, resClientes] = await Promise.all([
                api.get('/garantiastickets'),
                api.get('/clientes')
            ]);
            setGarantias(resGarantias.data || []);
            setClientes(resClientes.data || []);
        } catch (err) {
            console.error("Error sincronizando bitácora de garantías:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // ACCIÓN: Guardar nueva plantilla localmente
    const guardarPlantilla = (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevoTipo || !nuevaCobertura) return;

        const creada: Plantilla = {
            id: Date.now().toString(),
            tipoProducto: nuevoTipo,
            cobertura: nuevaCobertura,
            exclusiones: nuevasExclusiones,
            diasValidez: nuevosDias
        };

        setPlantillas([...plantillas, creada]);
        setNuevoTipo(''); setNuevaCobertura(''); setNuevasExclusiones(''); setNuevosDias(30);
        alert(`Plantilla para ${creada.tipoProducto} guardada.`);
    };

    // ACCIÓN: Procesar una reposición de cuenta/servicio caídos
    const procesarGarantia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idCliente) {
            alert("Seleccione un cliente verificado.");
            return;
        }

        const payload = {
            idCliente: Number(idCliente),
            idUsuarioResponsable: usuario?.id || 1,
            motivo,
            cuentaAnterior,
            cuentaNueva,
            costoReposicion: Number(costoReposicion)
        };

        try {
            await api.post('/garantiastickets', payload);
            alert("Reposición de garantía auditada y guardada.");
            setMotivo(''); setCuentaAnterior(''); setCuentaNueva(''); setCostoReposicion(0);
            setIdCliente(''); setBusquedaCliente('');
            setTabActiva('historial');
            cargarDatos();
        } catch {
            alert("Error de red al registrar la garantía.");
        }
    };

    // ACCIÓN: Imprimir Póliza A4/Carta
    const imprimirPolizaFormal = (cliente: any, p: Plantilla) => {
        const ventana = window.open('', '_blank');
        if (!ventana) return;

        const html = `
            <html>
            <head>
                <title>Poliza_Garantia_${imeiSerie || 'NICAPLUS'}</title>
                <style>
                    @page { size: letter; margin: 15mm; }
                    body { font-family: 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; }
                    .header { border-bottom: 3px solid #581c7e; padding-bottom: 10px; margin-bottom: 20px; }
                    .logo { font-size: 24px; font-weight: bold; color: #1e293b; }
                    .logo span { color: #581c7e; }
                    .title { text-align: right; font-size: 16px; font-weight: bold; text-transform: uppercase; }
                    .grid { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .grid td { padding: 8px; border: 1px solid #cbd5e1; }
                    .label { font-weight: bold; background: #f8fafc; width: 25%; }
                    .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
                    .signatures { width: 100%; margin-top: 60px; text-align: center; }
                    .line { width: 200px; border-bottom: 1px solid #64748b; margin: 0 auto 5px auto; }
                </style>
            </head>
            <body>
                <table style="width: 100%;" class="header">
                    <tr>
                        <td>
                            <div class="logo">NICAPLUS<span> GAMING</span></div>
                            <small>León, Nicaragua | Soporte y Ventas Oficial</small>
                        </td>
                        <td class="title">Certificado de Póliza de Garantía</td>
                    </tr>
                </table>

                <h3>1. Información de la Transacción</h3>
                <table class="grid">
                    <tr>
                        <td class="label">Cliente:</td><td>${cliente.nombre}</td>
                        <td class="label">Teléfono:</td><td>${cliente.telefono}</td>
                    </tr>
                    <tr>
                        <td class="label">Producto / Modelo:</td><td>${modeloEspecifico || p.tipoProducto}</td>
                        <td class="label">IMEI / N° Serie:</td><td>${imeiSerie || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="label">Vigencia:</td><td colspan="3">${p.diasValidez} días a partir de la fecha de emisión (${new Date().toLocaleDateString('es-NI')})</td>
                    </tr>
                </table>

                <h3>2. Términos y Cobertura</h3>
                <div class="box"><strong>Qué cubre:</strong><br>${p.cobertura}</div>

                <h3>3. Exclusiones Críticas</h3>
                <div class="box" style="border-left: 4px solid #581c7e;"><strong>Qué NO cubre (Anulación inmediata):</strong><br>${p.exclusiones}</div>

                <table class="signatures">
                    <tr>
                        <td><div class="line"></div><small>Entregado por Nicaplus</small></td>
                        <td><div class="line"></div><small>Cliente Conforme</small></td>
                    </tr>
                </table>

                <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }</script>
            </body>
            </html>
        `;
        ventana.document.write(html);
        ventana.document.close();
    };

    // ACCIÓN: Enviar Póliza al Cliente por WhatsApp
    const enviarPolizaWhatsApp = (cliente: any, p: Plantilla) => {
        let telefono = cliente.telefono.replace(/\s+/g, '').replace(/-/g, '');
        if (!telefono.startsWith('505')) telefono = '505' + telefono;

        const texto = `🛡️ *NICAPLUS GAMING - CERTIFICADO DE GARANTÍA* 🛡️\n\n` +
            `👤 *Cliente:* ${cliente.nombre}\n` +
            `📦 *Producto:* ${modeloEspecifico || p.tipoProducto}\n` +
            `🔢 *Serie/IMEI:* ${imeiSerie || 'N/A'}\n` +
            `📅 *Vigencia:* ${p.diasValidez} días desde hoy.\n\n` +
            `✅ *Cobertura:* ${p.cobertura}\n\n` +
            `❌ *Exclusiones:* ${p.exclusiones}\n\n` +
            `_Conserve este mensaje. La manipulación de los sellos de seguridad anulará este respaldo._`;

        const url = `https://api.whatsapp.com/send/?phone=${telefono}&text=${encodeURIComponent(texto)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.telefono.includes(busquedaCliente)
    );

    const perdidaTotal = garantias.reduce((sum, g) => sum + (g.costoReposicion || 0), 0);

    if (cargando) return (
        <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>
            Sincronizando pólizas de garantías...
        </div>
    );

    const clienteActivoObj = clientes.find(c => c.id === Number(idCliente));

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO Y BALANCE DE PÉRDIDAS */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Garantías y Reposiciones</h3>
                        <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Pólizas de venta y bitácora de reemplazos</small>
                    </div>

                    <div style={{ background: '#0f172a', border: '1px solid #ef4444', padding: '6px 10px', borderRadius: '8px', textAlign: 'right' }}>
                        <small style={{ color: '#ef4444', fontSize: '0.65rem', display: 'block', fontWeight: 700 }}>PÉRDIDA REPOSICIÓN</small>
                        <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>C$ {perdidaTotal.toLocaleString()}</strong>
                    </div>
                </div>

                {/* Conmutador de Pestañas Móviles */}
                <div style={{ display: 'flex', gap: '4px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155', overflowX: 'auto' }}>
                    <button 
                        onClick={() => setTabActiva('poliza')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'poliza' ? '#38bdf8' : 'transparent', color: tabActiva === 'poliza' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaLaptop /> Emitir Póliza
                    </button>
                    <button 
                        onClick={() => setTabActiva('reposicion')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'reposicion' ? '#38bdf8' : 'transparent', color: tabActiva === 'reposicion' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaShieldAlt /> Reemplazo
                    </button>
                    <button 
                        onClick={() => setTabActiva('historial')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'historial' ? '#38bdf8' : 'transparent', color: tabActiva === 'historial' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaHistory /> Historial
                    </button>
                    <button 
                        onClick={() => setTabActiva('plantillas')}
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: tabActiva === 'plantillas' ? '#38bdf8' : 'transparent', color: tabActiva === 'plantillas' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                        <FaFileContract /> Plantillas
                    </button>
                </div>
            </div>

            {/* PESTAÑA 1: EMISOR DIGITAL DE PÓLIZAS */}
            {tabActiva === 'poliza' && (
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaLaptop /> Emitir Póliza de Venta
                    </h4>

                    {/* Selector de Cliente */}
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>1. Asignar Cliente de la Operación</label>
                        <input 
                            type="text" 
                            placeholder="🔍 Filtrar cliente por nombre..." 
                            value={busquedaCliente} 
                            onChange={e => setBusquedaCliente(e.target.value)} 
                            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '4px', boxSizing: 'border-box' }}
                        />
                        <select 
                            value={idCliente} 
                            onChange={e => {
                                setIdCliente(e.target.value);
                                const text = e.target.options[e.target.selectedIndex].text;
                                if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                            }} 
                            style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                        >
                            <option value="">-- Seleccionar Cliente --</option>
                            {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                        </select>
                    </div>

                    {/* Selector de Plantilla */}
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', marginBottom: '2px' }}>2. Plantilla de Cobertura</label>
                        <select 
                            onChange={e => {
                                const seleccion = plantillas.find(p => p.id === e.target.value);
                                setPlantillaSeleccionada(seleccion || null);
                            }} 
                            style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                        >
                            <option value="">-- Escoger Plantilla --</option>
                            {plantillas.map(p => <option key={p.id} value={p.id}>{p.tipoProducto} ({p.diasValidez} días)</option>)}
                        </select>
                    </div>

                    {/* Especificaciones adicionales si hay plantilla seleccionada */}
                    {plantillaSeleccionada && (
                        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #38bdf8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Modelo Específico</label>
                                <input type="text" placeholder="Ej: iPhone 13 Pro Max" value={modeloEspecifico} onChange={e => setModeloEspecifico(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>IMEI / Serie Única</label>
                                <input type="text" placeholder="Garantiza unicidad física" value={imeiSerie} onChange={e => setImeiSerie(e.target.value)} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                            </div>

                            <button 
                                type="button" 
                                onClick={() => {
                                    if(!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                    imprimirPolizaFormal(clienteActivoObj, plantillaSeleccionada);
                                }}
                                style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
                            >
                                <FaPrint /> Imprimir Contrato PDF/Carta
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={() => {
                                    if(!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                    enviarPolizaWhatsApp(clienteActivoObj, plantillaSeleccionada);
                                }}
                                style={{ width: '100%', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <FaWhatsapp /> Despachar Póliza (WhatsApp)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* PESTAÑA 2: REGISTRO REPOSICIÓN DE DIGITALES / CUENTAS */}
            {tabActiva === 'reposicion' && (
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#fb923c', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaShieldAlt /> Auditar Reemplazo / Pérdida Cuenta
                    </h4>

                    <form onSubmit={procesarGarantia} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Cliente Afectado</label>
                            <select value={idCliente} onChange={e => setIdCliente(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Falla Técnica / Motivo</label>
                            <input type="text" placeholder="Ej: Cuenta caída masiva" value={motivo} onChange={e => setMotivo(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Cuenta Anterior Revocada</label>
                            <input type="text" placeholder="perfil3@mail.com" value={cuentaAnterior} onChange={e => setCuentaAnterior(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Cuenta Nueva Entregada</label>
                            <input type="text" placeholder="nuevo3@mail.com" value={cuentaNueva} onChange={e => setCuentaNueva(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Costo de Reposición / Pérdida (C$)</label>
                            <input type="number" min={0} value={costoReposicion || ''} onChange={e => setCostoReposicion(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            <FaPlus /> Autorizar Reposición
                        </button>
                    </form>
                </div>
            )}

            {/* PESTAÑA 3: HISTORIAL DE REEMPLAZOS */}
            {tabActiva === 'historial' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {garantias.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                            No se registran reemplazos de garantía en el periodo.
                        </div>
                    ) : (
                        garantias.map((g) => (
                            <div key={g.id} style={{ background: '#1e293b', borderLeft: '4px solid #ef4444', padding: '10px 12px', borderRadius: '10px', borderTop: '1px solid #334155', borderRight: '1px solid #334155', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ color: '#fff', fontSize: '0.82rem' }}>OS-G#{g.id} — {g.motivo}</strong>
                                    <strong style={{ color: '#ef4444', fontSize: '0.85rem' }}>- C$ {g.costoReposicion}</strong>
                                </div>

                                <div style={{ background: '#0f172a', padding: '6px 8px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                    <span style={{ color: '#ef4444' }}>❌ Revocada: <code>{g.cuentaAnterior}</code></span>
                                    <span style={{ color: '#10b981' }}>✨ Nueva: <code>{g.cuentaNueva}</code></span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.68rem', marginTop: '2px' }}>
                                    <span>👤 Cliente: {g.clienteNombre}</span>
                                    <span>📅 {new Date(g.fechaRepo).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* PESTAÑA 4: GESTIÓN DE PLANTILLAS BASE */}
            {tabActiva === 'plantillas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#10b981', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaFileContract /> Crear Nueva Plantilla
                        </h4>

                        <form onSubmit={guardarPlantilla} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Línea / Producto</label>
                                <input type="text" placeholder="Ej: Celulares, Parlantes, Mandos" value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Días Validez</label>
                                <input type="number" value={nuevosDias} onChange={e => setNuevosDias(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Cláusula de Cobertura (Lo que SÍ cubre)</label>
                                <textarea placeholder="Módulos cubiertos..." value={nuevaCobertura} onChange={e => setNuevaCobertura(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} rows={2} required />
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Exclusiones (Lo que NO cubre)</label>
                                <textarea placeholder="Humedad, golpes, etc." value={nuevasExclusiones} onChange={e => setNuevasExclusiones(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} rows={2} />
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                                <FaSave /> Almacenar Plantilla
                            </button>
                        </form>
                    </div>

                    {/* Lista de plantillas registradas */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <strong style={{ color: '#38bdf8', fontSize: '0.8rem' }}>Plantillas Disponibles en Sistema ({plantillas.length})</strong>
                        {plantillas.map(p => (
                            <div key={p.id} style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.82rem', color: '#fff' }}>
                                    <span>{p.tipoProducto}</span>
                                    <span style={{ color: '#38bdf8' }}>{p.diasValidez} días</span>
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>✅ Cobertura: {p.cobertura}</div>
                                {p.exclusiones && <div style={{ color: '#f87171', fontSize: '0.72rem' }}>❌ Exclusiones: {p.exclusiones}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};