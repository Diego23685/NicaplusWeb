import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaShieldAlt, FaUser, FaHistory, FaPlus } from 'react-icons/fa';

export const GarantiasCRM: React.FC = () => {
    const { usuario } = useAuth();
    const [garantias, setGarantias] = useState<any[]>([]);
    const [clientes, setClientes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO: REGISTRO GARANTÍA
    const [idCliente, setIdCliente] = useState('');
    const [motivo, setMotivo] = useState('');
    const [cuentaAnterior, setCuentaAnterior] = useState('');
    const [cuentaNueva, setCuentaNueva] = useState('');
    const [costoReposicion, setCostoReposicion] = useState(0);
    const [busquedaCliente, setBusquedaCliente] = useState('');

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

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.telefono.includes(busquedaCliente)
    );

    const perdidaTotal = garantias.reduce((sum, g) => sum + g.costoReposicion, 0);
    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Sincronizando pólizas de garantías...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', textAlign: 'left' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Pólizas y Reposición de Garantías</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Registro de cuentas caídas, reemplazo de perfiles y trazabilidad de costos por fallas.</p>
                </div>
                <div style={{ background: '#2d1e24', border: '1px solid #ef4444', padding: '10px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <small style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: '0.75rem' }}>PÉRDIDA POR GARANTÍAS</small>
                    <strong style={{ color: '#ef4444', fontSize: '1.2rem' }}>C$ {perdidaTotal.toLocaleString()}</strong>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* FORMULARIO: REGISTRAR REPOSICIÓN */}
                <div style={{ flex: '1 1 380px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', height: 'fit-content' }}>
                    <h4 style={{ color: '#fb923c', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><FaShieldAlt /> Aplicar Reemplazo de Cuenta</h4>
                    <form onSubmit={procesarGarantia} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaUser size={10} /> Buscar Cliente</label>
                            <input type="text" placeholder="🔍 Buscar por nombre o móvil..." value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} style={{ ...inputEstilo, padding: '6px 10px' }} />
                            <select value={idCliente} onChange={e => {
                                setIdCliente(e.target.value);
                                const text = e.target.options[e.target.selectedIndex].text;
                                if (e.target.value !== '') setBusquedaCliente(text.split(' (')[0]);
                            }} style={{ ...inputEstilo, cursor: 'pointer' }} required>
                                <option value="">-- Seleccionar Cliente --</option>
                                {clientesFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>)}
                            </select>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Motivo de la Reclamación</label>
                            <input type="text" placeholder="Ej: Cuenta caída / Caída de perfil masiva" value={motivo} onChange={e => setMotivo(e.target.value)} style={inputEstilo} required />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cuenta Anterior Revocada</label>
                            <input type="text" placeholder="Ej: perfil3@mail.com | PIN: 12" value={cuentaAnterior} onChange={e => setCuentaAnterior(e.target.value)} style={inputEstilo} required />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cuenta Nueva Entregada</label>
                            <input type="text" placeholder="Ej: nuevo3@mail.com | PIN: 45" value={cuentaNueva} onChange={e => setCuentaNueva(e.target.value)} style={inputEstilo} required />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Costo de Reposición / Pérdida (C$)</label>
                            <input type="number" min={0} value={costoReposicion || ''} onChange={e => setCostoReposicion(Number(e.target.value))} style={inputEstilo} required />
                        </div>

                        <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', background: '#fb923c', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}><FaPlus /> Autorizar Reposición</button>
                    </form>
                </div>

                {/* TABLA HISTÓRICA: AUDITORÍA DE GARANTÍAS APLICADAS */}
                <div style={{ flex: '1 1 500px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', overflowX: 'auto', height: 'fit-content' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0' }}><FaHistory /> Historial de Garantías Ejecutadas</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {garantias.map((g) => (
                            <div key={g.id} style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #fb923c', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ color: '#fff' }}>OS-G#{g.id} — {g.motivo}</strong>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>- C$ {g.costoReposicion}</span>
                                </div>
                                <div style={{ margin: '6px 0', color: '#cbd5e1' }}>
                                    <span style={{ color: '#ef4444', display: 'block' }}>❌ Anterior: <code style={{ background: '#1a1a1a', padding: '2px 4px', borderRadius: '4px' }}>{g.cuentaAnterior}</code></span>
                                    <span style={{ color: '#10b981', display: 'block', marginTop: '2px' }}>✨ Nueva: <code style={{ background: '#1a1a1a', padding: '2px 4px', borderRadius: '4px' }}>{g.cuentaNueva}</code></span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '6px', marginTop: '6px', color: '#64748b', fontSize: '0.75rem' }}>
                                    <span>👤 Cliente: <strong>{g.clienteNombre}</strong></span>
                                    <span>🛠️ Autorizó: {g.responsableNombre}</span>
                                    <span>📅 {new Date(g.fechaRepo).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {garantias.length === 0 && (
                            <small style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', display: 'block', padding: '20px' }}>No se registran reemplazos por garantías en el periodo.</small>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};