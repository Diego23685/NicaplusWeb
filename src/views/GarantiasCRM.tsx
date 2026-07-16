import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    FaShieldAlt, FaHistory, FaPlus, FaFileContract, 
    FaSave, FaWhatsapp, FaPrint, FaLaptop 
} from 'react-icons/fa';
import styles from '../assets/styles/GarantiasCRM.module.css';

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

    // CONTROL DE BUSQUEDA Y ASIGNACIÓN
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
            setGarantias(resGarantias.data);
            setClientes(resClientes.data);
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

    // ACCIÓN: Enviar Póliza al Cliente por api.whatsapp.com
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

    const perdidaTotal = garantias.reduce((sum, g) => sum + g.costoReposicion, 0);

    if (cargando) return <div className={styles.emptyText} style={{ color: '#38bdf8' }}>Sincronizando pólizas de garantías...</div>;

    const clienteActivoObj = clientes.find(c => c.id === Number(idCliente));

    return (
        <div className={styles.container}>
            
            {/* ENCABEZADO METRICAS */}
            <div className={styles.headerWrapper}>
                <div>
                    <h3 className={styles.title}>Pólizas y Reposición de Garantías</h3>
                    <p className={styles.subtitle}>Registro de cuentas caídas, reemplazo de perfiles y emisión de contratos comerciales por fallas.</p>
                </div>
                <div className={styles.perdidaBox}>
                    <small className={styles.perdidaLabel}>PÉRDIDA EN CUENTAS/REPOSICIONES</small>
                    <strong className={styles.perdidaMonto}>C$ {perdidaTotal.toLocaleString()}</strong>
                </div>
            </div>

            <div className={styles.dashboardGrid}>
                
                {/* MODULO 1: GESTIÓN Y CREACIÓN DE PLANTILLAS */}
                <div className={styles.panelCard}>
                    <h4 className={`${styles.panelTitle} ${styles.titleGreen}`}><FaFileContract /> Configurar Plantillas Base</h4>
                    <form onSubmit={guardarPlantilla} className={styles.formGrid}>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Tipo de Línea o Producto</label>
                            <input type="text" placeholder="Ej: Celulares, Parlantes JBL, Controles" value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} className={styles.input} required />
                        </div>
                        <div>
                            <label className={styles.label}>Días de Garantía</label>
                            <input type="number" value={nuevosDias} onChange={e => setNuevosDias(Number(e.target.value))} className={styles.input} required />
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Cláusula de Cobertura (Lo que sí aplica)</label>
                            <textarea placeholder="Detalle qué componentes específicos tienen garantía..." value={nuevaCobertura} onChange={e => setNuevaCobertura(e.target.value)} className={styles.textarea} required />
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Exclusiones Imperdonables (Lo que no responde)</label>
                            <textarea placeholder="Ej: Sellos rotos, pantalla rota, humedad, sulfatación..." value={nuevasExclusiones} onChange={e => setNuevasExclusiones(e.target.value)} className={styles.textarea} />
                        </div>
                        <button type="submit" className={styles.btnSecondary}><FaSave /> Almacenar Configuración</button>
                    </form>
                </div>

                {/* MÓDULO 2: EMISOR DIGITAL DE PÓLIZAS EN VIVAS */}
                <div className={styles.panelCard}>
                    <h4 className={`${styles.panelTitle} ${styles.titleBlue}`}><FaLaptop /> Emitir Garantía de Venta</h4>
                    <div className={styles.formGrid}>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>1. Asignar Cliente de la Operación</label>
                            <input type="text" placeholder="🔍 Buscar por nombre o celular..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} className={styles.input} />
                            <select value={idCliente} onChange={e => {
                                setIdCliente(e.target.value);
                                const text = e.target.options[e.target.selectedIndex].text;
                                if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                            }} className={styles.select}>
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                            </select>
                        </div>

                        <div className={styles.fullWidth}>
                            <label className={styles.label}>2. Seleccionar Plantilla Predeterminada</label>
                            <select onChange={e => {
                                const seleccion = plantillas.find(p => p.id === e.target.value);
                                setPlantillaSeleccionada(seleccion || null);
                            }} className={styles.select}>
                                <option value="">-- Escoger Plantilla del Catálogo --</option>
                                {plantillas.map(p => <option key={p.id} value={p.id}>{p.tipoProducto} ({p.diasValidez} días)</option>)}
                            </select>
                        </div>

                        {plantillaSeleccionada && (
                            <>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>Modelo Específico vendido</label>
                                    <input type="text" placeholder="Ej: iPhone 13 Pro Max 256GB" value={modeloEspecifico} onChange={e => setModeloEspecifico(e.target.value)} className={styles.input} />
                                </div>
                                <div className={styles.fullWidth}>
                                    <label className={styles.label}>IMEI / Número de Serie</label>
                                    <input type="text" placeholder="Garantiza unicidad física" value={imeiSerie} onChange={e => setImeiSerie(e.target.value)} className={styles.input} />
                                </div>

                                <button 
                                    type="button" 
                                    onClick={() => {
                                        if(!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                        imprimirPolizaFormal(clienteActivoObj, plantillaSeleccionada);
                                    }}
                                    className={styles.btnPrimary} 
                                    style={{ background: '#3b82f6', color: '#fff' }}
                                >
                                    <FaPrint /> Imprimir Contrato Certificado
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        if(!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                        enviarPolizaWhatsApp(clienteActivoObj, plantillaSeleccionada);
                                    }}
                                    className={styles.btnSecondary}
                                >
                                    <FaWhatsapp /> Despachar Términos vía WhatsApp
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* FORMULARIO ANTIGUO: REGISTRAR REPOSICIÓN DE DIGITALES */}
                <div className={styles.panelCard}>
                    <h4 className={`${styles.panelTitle} ${styles.titleOrange}`}><FaShieldAlt /> Auditar Pérdida / Reemplazo Cuenta</h4>
                    <form onSubmit={procesarGarantia} className={styles.formGrid}>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Cliente Afectado</label>
                            <select value={idCliente} onChange={e => setIdCliente(e.target.value)} className={styles.select} required>
                                <option value="">-- Repetir Cliente Asignado --</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                            </select>
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Falla Técnica / Motivo Reclamación</label>
                            <input type="text" placeholder="Ej: Cuenta caída masiva" value={motivo} onChange={e => setMotivo(e.target.value)} className={styles.input} required />
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Cuenta Anterior Revocada</label>
                            <input type="text" placeholder="perfil3@mail.com" value={cuentaAnterior} onChange={e => setCuentaAnterior(e.target.value)} className={styles.input} required />
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Cuenta Nueva Entregada</label>
                            <input type="text" placeholder="nuevo3@mail.com" value={cuentaNueva} onChange={e => setCuentaNueva(e.target.value)} className={styles.input} required />
                        </div>
                        <div className={styles.fullWidth}>
                            <label className={styles.label}>Costo de Reposición / Pérdida Directa (C$)</label>
                            <input type="number" min={0} value={costoReposicion || ''} onChange={e => setCostoReposicion(Number(e.target.value))} className={styles.input} required />
                        </div>
                        <button type="submit" className={styles.btnPrimary}><FaPlus /> Autorizar Reposición</button>
                    </form>
                </div>

                {/* HISTORIAL GENERAL AUDITABLE */}
                <div className={styles.panelCardWide}>
                    <h4 className={`${styles.panelTitle} ${styles.titleBlue}`}><FaHistory /> Historial de Reemplazos Ejecutados</h4>
                    <div className={styles.listContainer}>
                        {garantias.map((g) => (
                            <div key={g.id} className={styles.historyCard}>
                                <div className={styles.cardHeader}>
                                    <strong>OS-G#{g.id} — {g.motivo}</strong>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>- C$ {g.costoReposicion}</span>
                                </div>
                                <div style={{ margin: '6px 0', color: '#cbd5e1' }}>
                                    <span style={{ color: '#ef4444', display: 'block' }}>❌ Anterior: <code>{g.cuentaAnterior}</code></span>
                                    <span style={{ color: '#10b981', display: 'block', marginTop: '2px' }}>✨ Nueva: <code>{g.cuentaNueva}</code></span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span>👤 Cliente: <strong>{g.clienteNombre}</strong></span>
                                    <span>🛠️ Autorizó: {g.responsableNombre}</span>
                                    <span>📅 {new Date(g.fechaRepo).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {garantias.length === 0 && (
                            <small className={styles.emptyText}>No se registran reemplazos por garantías en el periodo.</small>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};