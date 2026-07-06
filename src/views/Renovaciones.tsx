import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaWhatsapp } from 'react-icons/fa';

export const Renovaciones: React.FC = () => {
    const [suscripciones, setSuscripciones] = useState<any[]>([]);
    const [filtroAlerta, setFiltroAlerta] = useState<string>('Todos');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);

    const cargarSuscripciones = async () => {
        try {
            const res = await api.get('/suscripciones/alertas');
            setSuscripciones(res.data);
        } catch (err) {
            console.error("Error al traer alertas de renovación:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarSuscripciones(); }, []);

    const dispararRecordatorioWhatsApp = (item: any) => {
        if (!item.cliente || !item.cliente.telefono) {
            alert("Este cliente no cuenta con un teléfono registrado.");
            return;
        }

        const telefonoLimpio = item.cliente.telefono.replace(/[^0-9]/g, '');
        const fechaFormateada = new Date(item.fechaVencimiento).toLocaleDateString();

        let saludoUrgencia = `vence el ${fechaFormateada}`;
        if (item.diasRestantes === 0) saludoUrgencia = "*VENCE HOY MISM0*";
        if (item.diasRestantes < 0) saludoUrgencia = "*SE ENCUENTRA VENCIDO*";

        const mensaje = `*NICAPLUS GAMING & TECH*\n` +
            `Hola ${item.cliente.nombre}, te saludamos de NICAPLUS.\n` +
            `Te notificamos que tu servicio de *${item.nombreServicio}* ${saludoUrgencia}.\n\n` +
            `Puedes realizar tu depósito o transferencia para procesar tu renovación y evitar la caída o corte de tu perfil.\n\n` +
            `¡Gracias por tu preferencia!`;

        window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    const suscripcionesFiltradas = suscripciones.filter(s => {
        const coincideTexto = s.nombreServicio.toLowerCase().includes(busqueda.toLowerCase()) || 
                              (s.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ?? false);
        const coincideAlerta = filtroAlerta === 'Todos' ? true : s.alertaFiltro === filtroAlerta;
        return coincideTexto && coincideAlerta;
    });

    const badgeEstilo = (alerta: string) => {
        const estilos: any = {
            'Vencido': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
            'Hoy': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
            '1 Dia': { bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },
            '3 Dias': { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' },
            '7 Dias': { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' },
            'Normal': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }
        };
        return estilos[alerta] || estilos['Normal'];
    };

    const inputEstilo = { padding: '10px 12px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Auditando cronología de vencimientos...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
            
            {/* ENCABEZADO */}
            <div>
                <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Control de Renovaciones y Alertas</h3>
                <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Monitoreo preventivo de cuentas streaming y licencias activas.</p>
            </div>

            {/* CONTROL DE FILTROS CRÍTICOS */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
                {['Todos', 'Vencido', 'Hoy', '1 Dia', '3 Dias', '7 Dias'].map((tipo) => (
                    <button 
                        key={tipo}
                        onClick={() => setFiltroAlerta(tipo)}
                        style={{
                            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s',
                            background: filtroAlerta === tipo ? '#581c7e' : '#1e293b',
                            color: '#fff'
                        }}
                    >
                        {tipo === 'Todos' ? '👁️ Ver Todas' : tipo === 'Vencido' ? '🛑 Vencidas' : `⏰ ${tipo}`}
                    </button>
                ))}
            </div>

            {/* BUSCADOR */}
            <div style={{ position: 'relative', width: '100%' }}>
                <input 
                    type="text" 
                    placeholder="Filtrar por nombre de servicio o nombre de cliente..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)} 
                    style={{ ...inputEstilo, width: '100%' }} 
                />
            </div>

            {/* TABLA DE RENDIMIENTO CRONOLÓGICO */}
            <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Cliente</th>
                            <th style={{ padding: '10px' }}>Servicio</th>
                            <th style={{ padding: '10px' }}>Vencimiento</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Estatus Alerta</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suscripcionesFiltradas.map((s) => {
                            const configBadge = badgeEstilo(s.alertaFiltro);
                            return (
                                <tr key={s.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '10px' }}>
                                        <strong>{s.cliente?.nombre || 'Cliente Genérico'}</strong>
                                        <small style={{ display: 'block', color: '#64748b' }}>📞 {s.cliente?.telefono || 'Sin número'}</small>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <strong>{s.nombreServicio}</strong>
                                        <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.detallesCredenciales}</small>
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        {new Date(s.fechaVencimiento).toLocaleDateString()}
                                        <small style={{ display: 'block', color: s.diasRestantes < 0 ? '#ef4444' : '#4ade80', fontWeight: 'bold' }}>
                                            {s.diasRestantes < 0 ? `Hace ${Math.abs(s.diasRestantes)} días` : s.diasRestantes === 0 ? '¡Vence Hoy!' : `En ${s.diasRestantes} días`}
                                        </small>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', background: configBadge.bg, color: configBadge.color }}>
                                            {s.alertaFiltro === 'Normal' ? 'Vigente ✓' : s.alertaFiltro}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => dispararRecordatorioWhatsApp(s)}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#25d366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            <FaWhatsapp /> Avisar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {suscripcionesFiltradas.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '20px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>No se registran renovaciones que requieran atención bajo este criterio.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};