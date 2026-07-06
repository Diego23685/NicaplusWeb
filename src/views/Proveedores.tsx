import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTruck, FaShoppingCart, FaChartLine, FaUserCheck, FaSave, FaPlus, FaBoxes } from 'react-icons/fa';

export const Proveedores: React.FC = () => {
    const [subTab, setSubTab] = useState<'registro' | 'analisis'>('registro');
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [metricas, setMetricas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO PROVEEDOR
    const [razonSocial, setRazonSocial] = useState('');
    const [ruc, setRuc] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');

    // FORMULARIO ORDEN DE COMPRA (INGRESO)
    const [idProvSeleccionado, setIdProvSeleccionado] = useState('');
    const [idProdSeleccionado, setIdProdSeleccionado] = useState('');
    const [cantidadCompra, setCantidadCompra] = useState(1);
    const [costoUnitarioCompra, setCostoUnitarioCompra] = useState(0);
    const [garantiaCompra, setGarantiaCompra] = useState(30);
    const [tiempoEntregaDias, setTiempoEntregaRealDias] = useState(1);

    const cargarDatos = async () => {
        try {
            const [resProv, resProd, resMet] = await Promise.all([
                api.get('/proveedores'),
                api.get('/products'),
                api.get('/proveedores/analisis-rendimiento')
            ]);
            setProveedores(resProv.data);
            setProductos(resProd.data);
            setMetricas(resMet.data);
        } catch (err) {
            console.error("Error sincronizando proveedores:", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const guardarProveedor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/proveedores', { razonSocial, ruc, telefono, email });
            alert("Proveedor homologado correctamente.");
            setRazonSocial(''); setRuc(''); setTelefono(''); setEmail('');
            cargarDatos();
        } catch { alert("Error al registrar proveedor."); }
    };

    const registrarIngresoInventario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idProvSeleccionado || !idProdSeleccionado) return;

        const payload = {
            idProveedor: Number(idProvSeleccionado),
            totalCompra: cantidadCompra * costoUnitarioCompra,
            tiempoEntregaRealDias: Number(tiempoEntregaDias),
            detalles: [{
                idProducto: Number(idProdSeleccionado),
                cantidad: Number(cantidadCompra),
                costoUnitario: Number(costoUnitarioCompra),
                garantiaDiasPactada: Number(garantiaCompra)
            }]
        };

        try {
            await api.post('/proveedores/compras', payload);
            alert("Compra registrada. Inventario incrementado en base de datos.");
            setIdProdSeleccionado(''); setCantidadCompra(1); setCostoUnitarioCompra(0);
            cargarDatos();
        } catch { alert("Fallo al registrar la compra."); }
    };

    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Analizando rentabilidad de proveedores...</div>;

    return (
        <div style={{ color: '#fff', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* ENCABEZADO Y PESTAÑAS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Módulo de Proveedores y Logística</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Análisis de confiabilidad, costos de adquisición e ingresos a almacén.</p>
                </div>
                <div style={{ display: 'flex', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button onClick={() => setSubTab('registro')} style={{ padding: '8px 16px', background: subTab === 'registro' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>📦 Abastecimiento</button>
                    <button onClick={() => setSubTab('analisis')} style={{ padding: '8px 16px', background: subTab === 'analisis' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>📊 Análisis de Rentabilidad</button>
                </div>
            </div>

            {subTab === 'registro' ? (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {/* FORMULARIO 1: REGISTRAR FICHA PROVEEDOR */}
                    <div style={{ flex: '1 1 350px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#a855f7', margin: '0 0 14px 0' }}><FaTruck /> Alta de Proveedor Comercial</h4>
                        <form onSubmit={guardarProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre / Razón Social</label><input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>RUC Comercial / Cédula</label><input type="text" value={ruc} onChange={e => setRuc(e.target.value)} style={inputEstilo} /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Teléfono de Contacto</label><input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Correo Electrónico</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputEstilo} /></div>
                            <button type="submit" style={{ padding: '10px', background: '#a855f7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}><FaSave /> Guardar Ficha</button>
                        </form>
                    </div>

                    {/* FORMULARIO 2: REGISTRAR TRANSACCIÓN DE COMPRA / ACTUALIZA INVENTARIO */}
                    <div style={{ flex: '1 1 450px', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <h4 style={{ color: '#10b981', margin: '0 0 14px 0' }}><FaShoppingCart /> Ingresar Compra de Lote (Sumar Stock)</h4>
                        <form onSubmit={registrarIngresoInventario} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Seleccionar Proveedor Emisor</label>
                                <select value={idProvSeleccionado} onChange={e => setIdProvSeleccionado(e.target.value)} style={inputEstilo as any} required>
                                    <option value="">-- Seleccionar --</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                                </select>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Artículo a Reabastecer</label>
                                <select value={idProdSeleccionado} onChange={e => setIdProdSeleccionado(e.target.value)} style={inputEstilo as any} required>
                                    <option value="">-- Seleccionar Producto --</option>
                                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual})</option>)}
                                </select>
                            </div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cantidad Comprada</label><input type="number" min={1} value={cantidadCompra} onChange={e => setCantidadCompra(Number(e.target.value))} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Costo Unitario (C$)</label><input type="number" min={0} value={costoUnitarioCompra || ''} onChange={e => setCostoUnitarioCompra(Number(e.target.value))} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Días que Tardó en Entregar</label><input type="number" min={0} value={tiempoEntregaDias} onChange={e => setTiempoEntregaRealDias(Number(e.target.value))} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Garantía Otorgada (Días)</label><input type="number" min={0} value={garantiaCompra} onChange={e => setGarantiaCompra(Number(e.target.value))} style={inputEstilo} required /></div>
                            <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}><FaPlus /> Procesar Ingreso Almacén</button>
                        </form>
                    </div>
                </div>
            ) : (
                /* TABLA ANALÍTICA: AUDITORÍA DE RENTABILIDAD Y SCORE DE CONFIABILIDAD */
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0' }}><FaChartLine /> Ranking Estratégico de Proveedores</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Proveedor</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Órdenes</th>
                                <th style={{ padding: '10px' }}>Total Invertido</th>
                                <th style={{ padding: '10px', color: '#4ade80' }}>Utilidad Generada</th>
                                <th style={{ padding: '10px' }}>Demora Promedio</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Score Confiabilidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metricas.map((m) => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #334155' }}>
                                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{m.razonSocial}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ background: '#0f172a', padding: '4px 8px', borderRadius: '6px' }}><FaBoxes size={11} /> {m.totalOrdenes} lotes</span></td>
                                    <td style={{ padding: '10px' }}>C$ {m.totalInvertido.toLocaleString()}</td>
                                    <td style={{ padding: '10px', color: '#4ade80', fontWeight: 'bold' }}>C$ {m.margenGananciaHistorico.toLocaleString()}</td>
                                    <td style={{ padding: '10px' }}>{m.tiempoRespuestaPromedio} días</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                            background: m.scoreConfiabilidad >= 80 ? 'rgba(16, 185, 129, 0.15)' : m.scoreConfiabilidad >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: m.scoreConfiabilidad >= 80 ? '#10b981' : m.scoreConfiabilidad >= 50 ? '#f59e0b' : '#ef4444'
                                        }}>
                                            <FaUserCheck size={10} /> {m.scoreConfiabilidad}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {metricas.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '20px', fontStyle: 'italic', color: '#64748b', textAlign: 'center' }}>No se registran órdenes de compra para auditar métricas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};