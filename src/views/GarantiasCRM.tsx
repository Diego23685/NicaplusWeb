import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    FaShieldAlt, FaHistory, FaPlus, FaFileContract, 
    FaSave, FaWhatsapp, FaPrint, FaLaptop, FaChevronDown,
    FaChevronUp, FaUser, FaMoneyBillWave, FaCheckCircle
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

    // Navegación por Pestañas
    const [seccionActiva, setSeccionActiva] = useState<'emitir' | 'reposicion' | 'historial'>('emitir');
    const [mostrarConfigPlantilla, setMostrarConfigPlantilla] = useState(false);

    // CONTROL DE BUSQUEDA Y ASIGNACIÓN
    const [idCliente, setIdCliente] = useState('');
    const [busquedaCliente, setBusquedaCliente] = useState('');

    // FORMULARIO: REGISTRO REPOSICIÓN CUENTAS
    const [motivo, setMotivo] = useState('');
    const [cuentaAnterior, setCuentaAnterior] = useState('');
    const [cuentaNueva, setCuentaNueva] = useState('');
    const [costoReposicion, setCostoReposicion] = useState(0);

    // SISTEMA DE PLANTILLAS
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
        setMostrarConfigPlantilla(false);
        alert(`Plantilla para "${creada.tipoProducto}" guardada.`);
    };

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
            setSeccionActiva('historial');
        } catch {
            alert("Error de red al registrar la garantía.");
        }
    };

    const imprimirPolizaFormal = (cliente: any, p: Plantilla) => {
        const ventana = window.open('', '_blank');
        if (!ventana) return;

        const html = `
            <html>
            <head>
                <title>Poliza_Garantia_${imeiSerie || 'NICAPLUS'}</title>
                <style>
                    @page { size: letter; margin: 15mm; }
                    body { font-family: 'Segoe UI', sans-serif; color: #1e293b; line-height: 1.5; font-size: 13px; margin: 0; padding: 0; }
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
                        <td class="label">Teléfono:</td><td>${cliente.telefono || 'N/A'}</td>
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
                <div class="box" style="border-left: 4px solid #581c7e;"><strong>Qué NO cubre (Anulación inmediata):</strong><br>${p.exclusiones || 'Daños por humedad o sellos rotos.'}</div>

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

    const enviarPolizaWhatsApp = (cliente: any, p: Plantilla) => {
        if (!cliente?.telefono) {
            alert("El cliente no posee número telefónico asignado.");
            return;
        }

        let telefono = cliente.telefono.replace(/\s+/g, '').replace(/-/g, '');
        if (!telefono.startsWith('505')) telefono = '505' + telefono;

        const texto = `🛡️ *NICAPLUS GAMING - CERTIFICADO DE GARANTÍA* 🛡️\n\n` +
            `👤 *Cliente:* ${cliente.nombre}\n` +
            `📦 *Producto:* ${modeloEspecifico || p.tipoProducto}\n` +
            `🔢 *Serie/IMEI:* ${imeiSerie || 'N/A'}\n` +
            `📅 *Vigencia:* ${p.diasValidez} días desde hoy.\n\n` +
            `✅ *Cobertura:* ${p.cobertura}\n\n` +
            `❌ *Exclusiones:* ${p.exclusiones || 'Sellos rotos o humedad.'}\n\n` +
            `_Conserve este mensaje. La manipulación de los sellos de seguridad anulará este respaldo._`;

        const url = `https://api.whatsapp.com/send/?phone=${telefono}&text=${encodeURIComponent(texto)}&type=phone_number&app_absent=0`;
        window.open(url, '_blank');
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
        (c.telefono && c.telefono.includes(busquedaCliente))
    );

    const perdidaTotal = garantias.reduce((sum, g) => sum + (Number(g.costoReposicion) || 0), 0);
    const clienteActivoObj = clientes.find(c => c.id === Number(idCliente));

    if (cargando) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loaderPulse} />
                <span>Sincronizando pólizas de garantías...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            
            {/* 1. ENCABEZADO Y RESUMEN FINANCIERO */}
            <header className={styles.header}>
                <div className={styles.headerTitleWrap}>
                    <h3 className={styles.title}>Pólizas y Garantías</h3>
                    <p className={styles.subtitle}>Emisión de certificados y auditoría de reposiciones.</p>
                </div>
                <div className={styles.perdidaCard}>
                    <small className={styles.perdidaLabel}>Pérdida en Reposiciones</small>
                    <strong className={styles.perdidaMonto}>C$ {perdidaTotal.toLocaleString()}</strong>
                </div>
            </header>

            {/* 2. SELECTOR DE PESTAÑAS TÁCTIL */}
            <div className={styles.tabsHeader}>
                <button 
                    type="button"
                    onClick={() => setSeccionActiva('emitir')}
                    className={`${styles.tabBtn} ${seccionActiva === 'emitir' ? styles.tabBtnActive : ''}`}
                >
                    <FaLaptop /> Emitir Póliza
                </button>
                <button 
                    type="button"
                    onClick={() => setSeccionActiva('reposicion')}
                    className={`${styles.tabBtn} ${seccionActiva === 'reposicion' ? styles.tabBtnActiveOrange : ''}`}
                >
                    <FaShieldAlt /> Reposición Cuenta
                </button>
                <button 
                    type="button"
                    onClick={() => setSeccionActiva('historial')}
                    className={`${styles.tabBtn} ${seccionActiva === 'historial' ? styles.tabBtnActiveBlue : ''}`}
                >
                    <FaHistory /> Historial ({garantias.length})
                </button>
            </div>

            {/* 3. VISTAS OPERATIVAS */}
            <div className={styles.contentWrapper}>
                
                {/* PESTAÑA 1: EMITIR PÓLIZA DE VENTA */}
                {seccionActiva === 'emitir' && (
                    <div className={styles.panelCard}>
                        <div className={styles.cardHeaderWithAction}>
                            <h4 className={`${styles.panelTitle} ${styles.titleBlue}`}>
                                <FaLaptop /> Emisión de Garantía Comercial
                            </h4>
                            <button 
                                type="button"
                                onClick={() => setMostrarConfigPlantilla(!mostrarConfigPlantilla)}
                                className={styles.btnToggleAccordion}
                            >
                                <FaFileContract size={12} /> 
                                <span>{mostrarConfigPlantilla ? 'Cerrar Plantillas' : '+ Nueva Plantilla'}</span>
                                {mostrarConfigPlantilla ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                            </button>
                        </div>

                        {/* ACCORDEÓN PARA CREAR PLANTILLAS */}
                        {mostrarConfigPlantilla && (
                            <form onSubmit={guardarPlantilla} className={styles.formPlantilla}>
                                <div className={styles.plantillaHeader}>
                                    <strong>Nueva Plantilla de Cobertura</strong>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Tipo de Línea o Producto *</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Celulares, Audio JBL, Mandos" 
                                        value={nuevoTipo} 
                                        onChange={e => setNuevoTipo(e.target.value)} 
                                        className={styles.input} 
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Días de Validez *</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        value={nuevosDias} 
                                        onChange={e => setNuevosDias(Number(e.target.value))} 
                                        className={styles.input} 
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Cobertura *</label>
                                    <textarea 
                                        rows={2}
                                        placeholder="Qué piezas o fallas cubre..." 
                                        value={nuevaCobertura} 
                                        onChange={e => setNuevaCobertura(e.target.value)} 
                                        className={styles.textarea} 
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Exclusiones</label>
                                    <textarea 
                                        rows={2}
                                        placeholder="Sellos rotos, golpes, humedad..." 
                                        value={nuevasExclusiones} 
                                        onChange={e => setNuevasExclusiones(e.target.value)} 
                                        className={styles.textarea} 
                                    />
                                </div>
                                <button type="submit" className={styles.btnSavePlantilla}>
                                    <FaSave /> Guardar en Catálogo
                                </button>
                            </form>
                        )}

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaUser size={10} /> 1. Cliente</label>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Buscar por nombre o celular..." 
                                    value={busquedaCliente} 
                                    onChange={e => setBusquedaCliente(e.target.value)} 
                                    className={styles.input} 
                                />
                                <select 
                                    value={idCliente} 
                                    onChange={e => {
                                        setIdCliente(e.target.value);
                                        const text = e.target.options[e.target.selectedIndex].text;
                                        if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                                    }} 
                                    className={styles.select}
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clientesFiltrados.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaFileContract size={10} /> 2. Plantilla de Garantía</label>
                                <select 
                                    onChange={e => {
                                        const seleccion = plantillas.find(p => p.id === e.target.value);
                                        setPlantillaSeleccionada(seleccion || null);
                                    }} 
                                    className={styles.select}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Escoger Plantilla --</option>
                                    {plantillas.map(p => (
                                        <option key={p.id} value={p.id}>{p.tipoProducto} ({p.diasValidez} días)</option>
                                    ))}
                                </select>
                            </div>

                            {plantillaSeleccionada && (
                                <>
                                    <div className={styles.plantillaResumenBox}>
                                        <span className={styles.plantillaResumenTitle}>
                                            <FaCheckCircle className={styles.textGreen} /> {plantillaSeleccionada.tipoProducto} ({plantillaSeleccionada.diasValidez} días)
                                        </span>
                                        <p className={styles.plantillaResumenText}><strong>Cubre:</strong> {plantillaSeleccionada.cobertura}</p>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Modelo / Descripción</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: iPhone 13 Pro Max 256GB" 
                                            value={modeloEspecifico} 
                                            onChange={e => setModeloEspecifico(e.target.value)} 
                                            className={styles.input} 
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>IMEI / Número de Serie</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: 356789012345678" 
                                            value={imeiSerie} 
                                            onChange={e => setImeiSerie(e.target.value)} 
                                            className={styles.input} 
                                        />
                                    </div>

                                    <div className={styles.actionsDual}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                                imprimirPolizaFormal(clienteActivoObj, plantillaSeleccionada);
                                            }}
                                            className={styles.btnPrint} 
                                        >
                                            <FaPrint /> Imprimir Contrato
                                        </button>
                                        
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (!clienteActivoObj) return alert("Seleccione un cliente primero.");
                                                enviarPolizaWhatsApp(clienteActivoObj, plantillaSeleccionada);
                                            }}
                                            className={styles.btnWhatsapp}
                                        >
                                            <FaWhatsapp size={16} /> Enviar WhatsApp
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* PESTAÑA 2: AUDITAR REPOSICIÓN DE CUENTA CAÍDA */}
                {seccionActiva === 'reposicion' && (
                    <div className={styles.panelCard}>
                        <h4 className={`${styles.panelTitle} ${styles.titleOrange}`}>
                            <FaShieldAlt /> Registrar Reemplazo de Cuenta Caída
                        </h4>
                        <form onSubmit={procesarGarantia} className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaUser size={10} /> Cliente Afectado *</label>
                                <input 
                                    type="text" 
                                    placeholder="🔍 Buscar cliente..." 
                                    value={busquedaCliente} 
                                    onChange={e => setBusquedaCliente(e.target.value)} 
                                    className={styles.input} 
                                />
                                <select 
                                    value={idCliente} 
                                    onChange={e => {
                                        setIdCliente(e.target.value);
                                        const text = e.target.options[e.target.selectedIndex].text;
                                        if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                                    }} 
                                    className={styles.select} 
                                    required
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clientesFiltrados.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Motivo de la Reclamación *</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Cuenta caída masiva, clave cambiada" 
                                    value={motivo} 
                                    onChange={e => setMotivo(e.target.value)} 
                                    className={styles.input} 
                                    required 
                                />
                            </div>

                            <div className={styles.formGroupDual}>
                                <div className={styles.formGroup}>
                                    <label className={styles.labelRed}>Cuenta / Perfil Anterior *</label>
                                    <input 
                                        type="text" 
                                        placeholder="perfil_viejo@correo.com" 
                                        value={cuentaAnterior} 
                                        onChange={e => setCuentaAnterior(e.target.value)} 
                                        className={styles.input} 
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.labelGreen}>Cuenta / Perfil Nuevo Entregado *</label>
                                    <input 
                                        type="text" 
                                        placeholder="perfil_nuevo@correo.com" 
                                        value={cuentaNueva} 
                                        onChange={e => setCuentaNueva(e.target.value)} 
                                        className={styles.input} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaMoneyBillWave size={10} /> Costo de Reposición / Pérdida (C$)</label>
                                <input 
                                    type="number" 
                                    min={0} 
                                    value={costoReposicion === 0 ? '' : costoReposicion} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setCostoReposicion(e.target.value === '' ? 0 : Number(e.target.value))} 
                                    placeholder="0.00"
                                    className={`${styles.input} ${styles.inputCost}`} 
                                    required 
                                />
                            </div>

                            <button type="submit" className={styles.btnSubmitReposicion}>
                                <FaPlus /> Autorizar y Guardar Reposición
                            </button>
                        </form>
                    </div>
                )}

                {/* PESTAÑA 3: HISTORIAL AUDITABLE */}
                {seccionActiva === 'historial' && (
                    <div className={styles.panelCard}>
                        <h4 className={`${styles.panelTitle} ${styles.titleBlue}`}>
                            <FaHistory /> Historial de Garantías Ejecutadas
                        </h4>
                        <div className={styles.historyFeed}>
                            {garantias.length === 0 ? (
                                <div className={styles.emptyText}>No se registran reemplazos en el periodo.</div>
                            ) : (
                                garantias.map((g) => (
                                    <div key={g.id} className={styles.historyCard}>
                                        <div className={styles.historyCardHeader}>
                                            <strong className={styles.historyTitle}>#OS-G{g.id} — {g.motivo}</strong>
                                            <span className={styles.historyCost}>- C$ {Number(g.costoReposicion || 0).toLocaleString()}</span>
                                        </div>

                                        <div className={styles.historyDetailsBox}>
                                            <div className={styles.historyLineRed}>❌ Anterior: <code>{g.cuentaAnterior}</code></div>
                                            <div className={styles.historyLineGreen}>✨ Nueva: <code>{g.cuentaNueva}</code></div>
                                        </div>

                                        <div className={styles.historyMeta}>
                                            <span>👤 <strong>{g.clienteNombre}</strong></span>
                                            <span>🛠️ {g.responsableNombre || 'Técnico'}</span>
                                            <span>📅 {new Date(g.fechaRepo).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};