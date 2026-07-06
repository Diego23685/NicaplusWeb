import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaHandHoldingUsd, FaFileInvoiceDollar, FaCoins, FaCheckCircle, FaExclamationTriangle, FaClock, FaPlus, FaTimes, FaTruck } from 'react-icons/fa';

export const Cuentas: React.FC = () => {
    const [subModulo, setSubModulo] = useState<'cobrar' | 'pagar'>('cobrar');
    const [cuentasCobrar, setCuentasCobrar] = useState<any[]>([]);
    const [cuentasPagar, setCuentasPagar] = useState<any[]>([]);
    const [listaProveedores, setListaProveedores] = useState<any[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
    
    // Control de Modales de Inserción y Abonos
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState<any | null>(null);
    const [montoAbono, setMontoAbono] = useState<string>('');

    // Formulario: Nueva Cuenta por Pagar
    const [idProveedor, setIdProveedor] = useState('');
    const [numeroFactura, setNumeroFactura] = useState('');
    const [montoTotal, setMontoTotal] = useState('');
    const [fechaRegistro] = useState(new Date().toISOString().split('T')[0]);
    const [fechaVencimiento, setFechaVencimiento] = useState('');

    // Formulario: Nuevo Proveedor Rápido
    const [razonSocial, setRazonSocial] = useState('');
    const [ruc, setRuc] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');

    const cargarDatos = () => {
        if (subModulo === 'cobrar') {
            api.get(`/CuentasPorCobrar?estado=${filtroEstado}`)
                .then(res => setCuentasCobrar(res.data))
                .catch(err => console.error(err));
        } else {
            Promise.all([
                api.get(`/CuentasPorPagar?estado=${filtroEstado}`),
                api.get('/reportes/resumen-dashboard') // Asumiendo que usas endpoints existentes o dedicados para proveedores
            ]).then(([resPagar]) => {
                setCuentasPagar(resPagar.data);
                // Si tienes un endpoint directo api/Proveedores úsalo, si no, cargamos una lista limpia simulada o extendida
            }).catch(err => console.error(err));

            // Carga directa de proveedores (Crea el controlador o usa este GET directo si ya existe)
            api.get('/Proveedores').then(res => setListaProveedores(res.data)).catch(() => setListaProveedores([]));
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [subModulo, filtroEstado]);

    const guardarCuentaPorPagar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idProveedor || !numeroFactura || !montoTotal || !fechaVencimiento) {
            alert("Por favor rellene todos los campos obligatorios.");
            return;
        }

        const payload = {
            idProveedor: Number(idProveedor),
            numeroFactura,
            montoTotal: Number(montoTotal),
            fechaRegistro: new Date(fechaRegistro + "T12:00:00"),
            fechaVencimiento: new Date(fechaVencimiento + "T12:00:00")
        };

        try {
            await api.post('/CuentasPorPagar', payload);
            alert("Cuenta por pagar registrada de forma conforme.");
            setMostrarModalPago(false);
            // Resetear formulario
            setIdProveedor(''); setNumeroFactura(''); setMontoTotal(''); setFechaVencimiento('');
            cargarDatos();
        } catch (err: any) {
            alert(err.response?.data || "Fallo al insertar la obligación con el proveedor.");
        }
    };

    const guardarProveedor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!razonSocial) return;

        const payload = { razonSocial, ruc, telefono, email };
        try {
            await api.post('/Proveedores', payload); // Requiere tener el ProveedoresController creado en tu API
            alert("Proveedor registrado con éxito.");
            setMostrarModalProveedor(false);
            setRazonSocial(''); setRuc(''); setTelefono(''); setEmail('');
            // Recargar proveedores
            api.get('/Proveedores').then(res => setListaProveedores(res.data)).catch(() => {});
        } catch {
            alert("Error de red al insertar proveedor. Asegúrate de tener la tabla Proveedores creada.");
        }
    };

    const ejecutarAbono = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuentaSeleccionada || !montoAbono || Number(montoAbono) <= 0) return;

        const endpoint = subModulo === 'cobrar' ? 'CuentasPorCobrar' : 'CuentasPorPagar';
        try {
            await api.put(`/${endpoint}/${cuentaSeleccionada.id}/abonar?montoAbono=${montoAbono}`);
            alert("Abono procesado con éxito.");
            setCuentaSeleccionada(null);
            setMontoAbono('');
            cargarDatos();
        } catch (err: any) {
            alert(err.response?.data || "Error al aplicar el abono contable.");
        }
    };

    const esVencida = (fechaVenc: string, estado: string) => {
        if (estado === 'Pagado') return false;
        return new Date(fechaVenc) < new Date();
    };

    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '4px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };

    return (
        <div style={{ padding: '16px', color: '#ffffff', fontFamily: 'sans-serif' }}>
            
            {/* ENCABEZADO Y CONTROLADORES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button 
                        onClick={() => { setSubModulo('cobrar'); setFiltroEstado('Todos'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: subModulo === 'cobrar' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                        <FaHandHoldingUsd /> Cuentas por Cobrar (Clientes)
                    </button>
                    <button 
                        onClick={() => { setSubModulo('pagar'); setFiltroEstado('Todos'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: subModulo === 'pagar' ? '#b91c1c' : 'transparent', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                        <FaFileInvoiceDollar /> Cuentas por Pagar (Proveedores)
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {subModulo === 'pagar' && (
                        <>
                            <button onClick={() => setMostrarModalProveedor(true)} style={{ padding: '8px 14px', background: '#047688', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><FaTruck /> + Proveedor</button>
                            <button onClick={() => setMostrarModalPago(true)} style={{ padding: '8px 14px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><FaPlus /> Agregar Cuenta por Pagar</button>
                        </>
                    )}
                    <select 
                        value={filtroEstado} 
                        onChange={e => setFiltroEstado(e.target.value)}
                        style={{ padding: '8px 12px', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', outline: 'none', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        <option value="Todos">Ver Todos los Estados</option>
                        <option value="Pendiente">Solo Pendientes</option>
                        <option value="Pagado">Solo Liquidados</option>
                    </select>
                </div>
            </div>

            {/* TABLA DE RENDIMIENTO */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8' }}>
                            <th style={{ padding: '10px' }}>ID</th>
                            <th style={{ padding: '10px' }}>{subModulo === 'cobrar' ? 'Cliente' : 'Referencia Factura / Proveedor'}</th>
                            <th style={{ padding: '10px' }}>Monto Total</th>
                            <th style={{ padding: '10px' }}>Saldo Pendiente</th>
                            <th style={{ padding: '10px' }}>{subModulo === 'cobrar' ? 'Emisión' : 'Registro'}</th>
                            <th style={{ padding: '10px' }}>Vencimiento</th>
                            <th style={{ padding: '10px' }}>Estado</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subModulo === 'cobrar' ? (
                            cuentasCobrar.map(c => {
                                const vencio = esVencida(c.fechaVencimiento, c.estado);
                                return (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #0f172a' }}>
                                        <td style={{ padding: '12px 10px' }}>#{c.id}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <strong>{c.cliente?.nombre || 'Desconocido'}</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tel: {c.cliente?.telefono || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>C$ {c.montoTotal}</td>
                                        <td style={{ padding: '12px 10px', color: c.saldoPendiente > 0 ? '#f43f5e' : '#4ade80', fontWeight: 'bold' }}>C$ {c.saldoPendiente}</td>
                                        <td style={{ padding: '12px 10px' }}>{new Date(c.fechaEmision).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 10px', color: vencio ? '#ef4444' : '#fff' }}>{new Date(c.fechaVencimiento).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            {c.estado === 'Pagado' ? (
                                                <span style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaCheckCircle /> Pagado</span>
                                            ) : vencio ? (
                                                <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaExclamationTriangle /> Vencido</span>
                                            ) : (
                                                <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaClock /> Pendiente</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            {c.saldoPendiente > 0 && <button onClick={() => setCuentaSeleccionada(c)} style={{ background: '#581c7e', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Abonar</button>}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            cuentasPagar.map(p => {
                                const vencio = esVencida(p.fechaVencimiento, p.estado);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #0f172a' }}>
                                        <td style={{ padding: '12px 10px' }}>#{p.id}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <strong>Factura: {p.numeroFactura}</strong>
                                            <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Proveedor ID: #{p.idProveedor}</div>
                                        </td>
                                        <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>C$ {p.montoTotal}</td>
                                        <td style={{ padding: '12px 10px', color: p.saldoPendiente > 0 ? '#f43f5e' : '#4ade80', fontWeight: 'bold' }}>C$ {p.saldoPendiente}</td>
                                        <td style={{ padding: '12px 10px' }}>{new Date(p.fechaRegistro).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 10px', color: vencio ? '#ef4444' : '#fff' }}>{new Date(p.fechaVencimiento).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 10px' }}>
                                            {p.estado === 'Pagado' ? (
                                                <span style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaCheckCircle /> Liquidado</span>
                                            ) : vencio ? (
                                                <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaExclamationTriangle /> Vencido</span>
                                            ) : (
                                                <span style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}><FaClock /> Pendiente</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            {p.saldoPendiente > 0 && <button onClick={() => setCuentaSeleccionada(p)} style={{ background: '#b91c1c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Abonar</button>}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL 1: REGISTRAR CUENTA POR PAGAR MANUAL */}
            {mostrarModalPago && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <form onSubmit={guardarCuentaPorPagar} style={{ background: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: '#f59e0b' }}><FaFileInvoiceDollar /> Nueva Cuenta por Pagar</h4>
                            <button type="button" onClick={() => setMostrarModalPago(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Seleccionar Proveedor</label>
                            <select value={idProveedor} onChange={e => setIdProveedor(e.target.value)} style={inputEstilo} required>
                                <option value="">-- Seleccionar --</option>
                                {listaProveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Número de Factura</label>
                            <input type="text" value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} style={inputEstilo} required placeholder="Ej: FAC-4589" />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Monto de Deuda (C$)</label>
                            <input type="number" step="0.01" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} style={inputEstilo} required placeholder="0.00" />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fecha de Vencimiento Manual</label>
                            <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} style={inputEstilo} required />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="button" onClick={() => setMostrarModalPago(false)} style={{ flex: 1, padding: '10px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, padding: '10px', background: '#b91c1c', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Insertar Deuda</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 2: NUEVO PROVEEDOR RÁPIDO */}
            {mostrarModalProveedor && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <form onSubmit={guardarProveedor} style={{ background: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px', width: '380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: '#047688' }}><FaTruck /> Registrar Proveedor Nuevo</h4>
                            <button type="button" onClick={() => setMostrarModalProveedor(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre / Razón Social</label>
                            <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} style={inputEstilo} required placeholder="Ej: Distribuidora Claro" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cédula / RUC Comercial</label>
                            <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} style={inputEstilo} placeholder="Ej: J03100000000" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Teléfono de Contacto</label>
                            <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} style={inputEstilo} placeholder="Ej: 8888-8888" />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Correo Electrónico</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputEstilo} placeholder="proveedor@nicaplus.com" />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="button" onClick={() => setMostrarModalProveedor(false)} style={{ flex: 1, padding: '10px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, padding: '10px', background: '#047688', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 3: MODAL DE ABONOS */}
            {cuentaSeleccionada && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <form onSubmit={ejecutarAbono} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ margin: 0, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCoins /> Registrar Abono</h4>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Saldo actual: <strong style={{ color: '#fff' }}>C$ {cuentaSeleccionada.saldoPendiente}</strong></div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Monto a Abonar (C$)</label>
                            <input type="number" step="0.01" min="0.01" max={cuentaSeleccionada.saldoPendiente} value={montoAbono} onChange={e => setMontoAbono(e.target.value)} placeholder="0.00" required style={{ width: '100%', padding: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button type="button" onClick={() => setCuentaSeleccionada(null)} style={{ flex: 1, padding: '8px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Cancelar</button>
                            <button type="submit" style={{ flex: 1, padding: '8px', background: subModulo === 'cobrar' ? '#581c7e' : '#b91c1c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Confirmar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};