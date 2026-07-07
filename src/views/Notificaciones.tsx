import React, { useEffect, useState } from "react";
import { 
    FaArrowDown, 
    FaCalendarTimes, 
    FaShieldAlt, 
    FaTicketAlt, 
    FaWhatsapp, 
    FaSave 
} from "react-icons/fa";
import api from "../services/api";

// ==========================================
// ESTILOS EN LINEA (Manteniendo tu paleta oscura)
// ==========================================
const alertCardStyle = (type: 'warn' | 'info' | 'error' | 'success') => {
    const colors = {
        warn: { bg: '#fffbeb', text: '#b45309', border: '#fcd34d', icon: '#f59e0b' },
        info: { bg: '#e0f7fa', text: '#0288d1', border: '#4fc3f7', icon: '#03a9f4' },
        error: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', icon: '#ef4444' },
        success: { bg: '#ecfdf5', text: '#166534', border: '#a7f3d0', icon: '#10b981' }
    };
    
    return {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '16px',
        fontSize: '1rem',
        fontWeight: '500',
        backgroundColor: colors[type].bg,
        color: colors[type].text,
        border: `1px solid ${colors[type].border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    };
};

const iconStyle = (type: 'warn' | 'info' | 'error' | 'success') => {
    const colors = {
        warn: { icon: '#f59e0b' },
        info: { icon: '#03a9f4' },
        error: { icon: '#ef4444' },
        success: { icon: '#10b981' }
    };
    return {
        fontSize: '1.5rem',
        color: colors[type].icon,
        flexShrink: 0
    };
};

// ==========================================
// COMPONENTE: CENTRO DE NOTIFICACIONES (INTERNAS)
// ==========================================
interface CentroNotificacionesProps {
    alertas: any;
    loading: boolean;
}

const CentroNotificaciones: React.FC<CentroNotificacionesProps> = ({ alertas, loading }) => {
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#94a3b8', fontSize: '1.2rem' }}>
                <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 2s linear infinite', marginRight: '10px' }}></div>
                Cargando alertas profesionales...
            </div>
        );
    }

    const renovaciones = alertas?.renovaciones || [];
    const tickets = alertas?.tickets || [];
    const stockBajo = alertas?.stockBajo || [];
    const garantias = alertas?.garantias || [];

    const total = renovaciones.length + tickets.length + stockBajo.length + garantias.length;

    if (total === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', border: '2px dashed #475569', borderRadius: '12px', backgroundColor: '#1e293b' }}>
                <FaShieldAlt style={{ fontSize: '3rem', marginBottom: '15px' }} />
                <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>¡Todo bajo control!</p>
                <p>No tienes alertas pendientes en este momento.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#f8fafc', margin: 0 }}>Centro de Alertas</h3>
                <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
                    {total} Pendientes
                </span>
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                {renovaciones.map((r: any, idx: number) => (
                    <div key={`renov-${idx}`} style={alertCardStyle('warn')}>
                        <FaCalendarTimes style={iconStyle('warn')} /> 
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: '600' }}>Renovación de Servicio</p>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{r.nombreServicio} vence el {new Date(r.fechaVencimiento).toLocaleDateString()}</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: '600' }}>Vence pronto</span>
                    </div>
                ))}
                
                {tickets.map((t: any, idx: number) => (
                    <div key={`tick-${idx}`} style={alertCardStyle('info')}>
                        <FaTicketAlt style={iconStyle('info')} /> 
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: '600' }}>Ticket de Soporte #{t.id}</p>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Tipo: {t.tipoTicket} - Estado: Pendiente</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#0288d1', fontWeight: '600' }}>Soporte</span>
                    </div>
                ))}
                
                {stockBajo.map((s: any, idx: number) => (
                    <div key={`stock-${idx}`} style={alertCardStyle('error')}>
                        <FaArrowDown style={iconStyle('error')} /> 
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: '600' }}>Stock Crítico: {s.nombre}</p>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>Quedan solo {s.stockActual} unidades disponibles.</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: '600' }}>¡Urgente!</span>
                    </div>
                ))}

                {garantias.map((g: any, idx: number) => (
                    <div key={`gar-${idx}`} style={alertCardStyle('success')}>
                        <FaShieldAlt style={iconStyle('success')} /> 
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: '600' }}>Garantía de Producto</p>
                            <p style={{ margin: 0, fontSize: '0.9rem' }}>{g.detalle || 'Revisión pendiente para este artículo.'}</p>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>Verificada</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL: EXPORT VISTA GENERAL
// ==========================================
export const Notificaciones: React.FC = () => {
    const [pestaña, setPestaña] = useState<'alertas' | 'whatsapp'>('alertas');
    
    // Estados para alertas internas
    const [alertas, setAlertas] = useState<any>(null);
    const [loadingAlertas, setLoadingAlertas] = useState(true);
    
    // Estados para automatizaciones de WhatsApp
    const [configs, setConfigs] = useState<any[]>([]);
    const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);

    // Carga inicial de alertas del sistema
    useEffect(() => {
        api.get('/notificaciones/pendientes')
            .then(res => {
                setAlertas(res.data);
                setLoadingAlertas(false);
            })
            .catch(() => setLoadingAlertas(false));
    }, []);

    // Carga bajo demanda de configuraciones de WhatsApp al cambiar de pestaña
    useEffect(() => {
        if (pestaña === 'whatsapp' && configs.length === 0) {
            setLoadingWhatsApp(true);
            api.get('/ConfiguracionMensajes')
                .then(res => {
                    setConfigs(res.data);
                    setLoadingWhatsApp(false);
                })
                .catch(() => setLoadingWhatsApp(false));
        }
    }, [pestaña, configs.length]);

    // Manejadores para actualizar los inputs locales antes de guardar en backend
    const handleInputChange = (id: number, campo: 'plantillaTexto' | 'diasAnticipacion', valor: any) => {
        setConfigs(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
    };

    const handleGuardarPlantilla = (id: number) => {
        const configAGuardar = configs.find(c => c.id === id);
        if (!configAGuardar) return;

        api.put(`/Configuracionmensajes/${id}`, { 
            plantillaTexto: configAGuardar.plantillaTexto, 
            diasAnticipacion: Number(configAGuardar.diasAnticipacion) 
        })
        .then(() => alert("Configuración de WhatsApp guardada con éxito."))
        .catch(() => alert("Error al guardar la configuración."));
    };

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', background: '#0f172a', padding: '35px', borderRadius: '16px', color: '#fff', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            
            <h2 style={{ marginBottom: '25px', fontSize: '1.8rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.025em' }}>
                Panel de Notificaciones y Automatizaciones
            </h2>

            {/* Selectores de Pestaña */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
                <button 
                    onClick={() => setPestaña('alertas')} 
                    style={{ background: pestaña === 'alertas' ? '#38bdf8' : 'transparent', color: pestaña === 'alertas' ? '#0f172a' : '#fff', border: pestaña === 'alertas' ? 'none' : '1px solid #334155', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                >
                    Centro de Alertas Internas
                </button>
                <button 
                    onClick={() => setPestaña('whatsapp')} 
                    style={{ background: pestaña === 'whatsapp' ? '#10b981' : 'transparent', color: '#fff', border: pestaña === 'whatsapp' ? 'none' : '1px solid #334155', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                    <FaWhatsapp /> Automatizaciones WhatsApp
                </button>
            </div>

            {/* Renderizado Condicional de Pestañas */}
            {pestaña === 'alertas' ? (
                <CentroNotificaciones alertas={alertas} loading={loadingAlertas} />
            ) : (
                <div>
                    <h3 style={{ marginBottom: '10px', color: '#f8fafc' }}>Configuración de Mensajes Automatizados</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '25px' }}>
                        Usa etiquetas dinámicas como <code>{"{cliente}"}</code>, <code>{"{servicio}"}</code>, <code>{"{credenciales}"}</code> o <code>{"{dispositivo}"}</code> para personalizar el envío.
                    </p>

                    {loadingWhatsApp ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Cargando plantillas...</div>
                    ) : configs.length === 0 ? (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No hay plantillas de configuración configuradas en el backend.</div>
                    ) : (
                        configs.map((c) => (
                            // Dentro del configs.map((c) => ( ... )) en tu archivo React:

                            <div key={c.id} style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem' }}>
                                        {c.tipoDisparador === 'TallerListo' ? '🔧 Notificación de Taller Terminado' : '🧾 Envío de Comprobante de Pago'}
                                    </h4>
                                    
                                    {/* Solo mostrar input de días si NO es del taller (las facturas se envían de inmediato, día 0) */}
                                    {c.tipoDisparador === 'RecordatorioRenovacion' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Anticipación:</span>
                                            <input 
                                                type="number" 
                                                value={c.diasAnticipacion ?? 3} 
                                                onChange={(e) => handleInputChange(c.id, 'diasAnticipacion', e.target.value)}
                                                style={{ width: '60px', background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px', borderRadius: '4px', textAlign: 'center' }} 
                                            />
                                            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>días antes</span>
                                        </div>
                                    )}
                                </div>

                                {/* 💡 CHIPS INTERACTIVOS: El usuario hace clic y la variable se mete sola en el texto */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Haz clic para insertar:</span>
                                    <button type="button" onClick={() => handleInputChange(c.id, 'plantillaTexto', c.plantillaTexto + ' {cliente}')} style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+{'{cliente}'}</button>
                                    <button type="button" onClick={() => handleInputChange(c.id, 'plantillaTexto', c.plantillaTexto + ' {dispositivo}')} style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+{'{dispositivo}'}</button>
                                    <button type="button" onClick={() => handleInputChange(c.id, 'plantillaTexto', c.plantillaTexto + ' {factura}')} style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+{'{factura}'}</button>
                                    <button type="button" onClick={() => handleInputChange(c.id, 'plantillaTexto', c.plantillaTexto + ' {total}')} style={{ background: '#334155', color: '#38bdf8', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+{'{total}'}</button>
                                </div>

                                <textarea 
                                    style={{ width: '100%', height: '80px', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '10px', boxSizing: 'border-box', fontFamily: 'sans-serif', resize: 'vertical' }}
                                    value={c.plantillaTexto || ''}
                                    onChange={(e) => handleInputChange(c.id, 'plantillaTexto', e.target.value)}
                                    placeholder="Escribe el cuerpo del mensaje aquí..."
                                />
                                
                                <button 
                                    onClick={() => handleGuardarPlantilla(c.id)}
                                    style={{ marginTop: '10px', background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                                >
                                    <FaSave /> Guardar Configuración
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};