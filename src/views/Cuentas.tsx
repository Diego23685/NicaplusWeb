import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    FaHandHoldingUsd, FaFileInvoiceDollar, FaCoins, FaCheckCircle, 
    FaExclamationTriangle, FaClock, FaPlus, FaTimes, FaTruck 
} from 'react-icons/fa';

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
    const [metodoPago, setMetodoPago] = useState<string>('Efectivo');

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
                api.get('/reportes/resumen-dashboard')
            ]).then(([resPagar]) => {
                setCuentasPagar(resPagar.data);
            }).catch(err => console.error(err));

            api.get('/Proveedores')
                .then(res => setListaProveedores(res.data))
                .catch(() => setListaProveedores([]));
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
            await api.post('/Proveedores', payload);
            alert("Proveedor registrado con éxito.");
            setMostrarModalProveedor(false);
            setRazonSocial(''); setRuc(''); setTelefono(''); setEmail('');
            api.get('/Proveedores').then(res => setListaProveedores(res.data)).catch(() => {});
        } catch {
            alert("Error de red al insertar proveedor.");
        }
    };

    const ejecutarAbono = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuentaSeleccionada || !montoAbono || Number(montoAbono) <= 0) return;

        const endpoint = subModulo === 'cobrar' ? 'CuentasPorCobrar' : 'CuentasPorPagar';
        
        const payload = {
            montoAbono: Number(montoAbono),
            metodoPago: metodoPago || 'Efectivo'
        };

        try {
            await api.put(`/${endpoint}/${cuentaSeleccionada.id}/abonar`, payload);
            alert("Abono procesado con éxito.");
            setCuentaSeleccionada(null);
            setMontoAbono('');
            setMetodoPago('Efectivo');
            cargarDatos();
        } catch (err: any) {
            alert(err.response?.data?.mensaje || err.response?.data || "Error al aplicar el abono contable.");
        }
    };

    const esVencida = (fechaVenc: string, estado: string) => {
        if (estado === 'Pagado') return false;
        return new Date(fechaVenc) < new Date();
    };

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO Y PESTAÑAS MÓVILES */}
            <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button 
                        onClick={() => { setSubModulo('cobrar'); setFiltroEstado('Todos'); }}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            background: subModulo === 'cobrar' ? '#38bdf8' : 'transparent',
                            color: subModulo === 'cobrar' ? '#0f172a' : '#94a3b8',
                            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        <FaHandHoldingUsd /> Cobrar
                    </button>
                    <button 
                        onClick={() => { setSubModulo('pagar'); setFiltroEstado('Todos'); }}
                        style={{
                            flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                            background: subModulo === 'pagar' ? '#38bdf8' : 'transparent',
                            color: subModulo === 'pagar' ? '#0f172a' : '#94a3b8',
                            fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                        }}
                    >
                        <FaFileInvoiceDollar /> Pagar
                    </button>
                </div>

                {/* Acciones para Cuentas por Pagar y Filtro de Estado */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {subModulo === 'pagar' && (
                        <>
                            <button 
                                onClick={() => setMostrarModalProveedor(true)} 
                                style={{ background: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <FaTruck /> + Prov.
                            </button>
                            <button 
                                onClick={() => setMostrarModalPago(true)} 
                                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <FaPlus /> + Deuda
                            </button>
                        </>
                    )}
                    
                    <select 
                        value={filtroEstado} 
                        onChange={e => setFiltroEstado(e.target.value)}
                        style={{ flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                        <option value="Todos">Ver Todos</option>
                        <option value="Pendiente">Pendientes</option>
                        <option value="Pagado">Liquidados</option>
                    </select>
                </div>
            </div>

            {/* FEED MÓVIL DE TARJETAS DE DEUDA Y CRÉDITO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subModulo === 'cobrar' ? (
                    cuentasCobrar.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                            No hay cuentas por cobrar registradas.
                        </div>
                    ) : (
                        cuentasCobrar.map(c => {
                            const vencio = esVencida(c.fechaVencimiento, c.estado);
                            return (
                                <div key={c.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                                                {c.nombreCliente || c.cliente?.nombre || 'Desconocido'}
                                            </strong>
                                            <small style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                                Tel: {c.telefonoCliente || c.cliente?.telefono || 'N/A'} • #{c.id}
                                            </small>
                                        </div>

                                        {c.estado === 'Pagado' ? (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaCheckCircle /> Pagado
                                            </span>
                                        ) : vencio ? (
                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaExclamationTriangle /> Vencido
                                            </span>
                                        ) : (
                                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaClock /> Pendiente
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155' }}>
                                        <div>
                                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>Monto Total</small>
                                            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>C$ {c.montoTotal}</strong>
                                        </div>
                                        <div>
                                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>Saldo Pendiente</small>
                                            <strong style={{ color: c.saldoPendiente > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>C$ {c.saldoPendiente}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                                        <small style={{ color: vencio ? '#ef4444' : '#94a3b8', fontSize: '0.7rem' }}>
                                            Vence: {new Date(c.fechaVencimiento).toLocaleDateString()}
                                        </small>

                                        {c.saldoPendiente > 0 && (
                                            <button 
                                                onClick={() => setCuentaSeleccionada(c)} 
                                                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                                            >
                                                Abonar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    cuentasPagar.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
                            No hay cuentas por pagar registradas.
                        </div>
                    ) : (
                        cuentasPagar.map(p => {
                            const vencio = esVencida(p.fechaVencimiento, p.estado);
                            return (
                                <div key={p.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'block' }}>
                                                Factura: {p.numeroFactura}
                                            </strong>
                                            <small style={{ color: '#38bdf8', fontSize: '0.7rem' }}>
                                                Proveedor ID: #{p.idProveedor}
                                            </small>
                                        </div>

                                        {p.estado === 'Pagado' ? (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaCheckCircle /> Liquidado
                                            </span>
                                        ) : vencio ? (
                                            <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaExclamationTriangle /> Vencido
                                            </span>
                                        ) : (
                                            <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FaClock /> Pendiente
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155' }}>
                                        <div>
                                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>Monto Total</small>
                                            <strong style={{ color: '#fff', fontSize: '0.85rem' }}>C$ {p.montoTotal}</strong>
                                        </div>
                                        <div>
                                            <small style={{ color: '#64748b', fontSize: '0.65rem', display: 'block' }}>Saldo Pendiente</small>
                                            <strong style={{ color: p.saldoPendiente > 0 ? '#ef4444' : '#10b981', fontSize: '0.85rem' }}>C$ {p.saldoPendiente}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                                        <small style={{ color: vencio ? '#ef4444' : '#94a3b8', fontSize: '0.7rem' }}>
                                            Vence: {new Date(p.fechaVencimiento).toLocaleDateString()}
                                        </small>

                                        {p.saldoPendiente > 0 && (
                                            <button 
                                                onClick={() => setCuentaSeleccionada(p)} 
                                                style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                                            >
                                                Abonar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* MODAL 1: REGISTRAR CUENTA POR PAGAR */}
            {mostrarModalPago && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <form onSubmit={guardarCuentaPorPagar} style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}><FaFileInvoiceDollar /> Nueva Cuenta por Pagar</h4>
                            <button type="button" onClick={() => setMostrarModalPago(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Proveedor</label>
                            <select value={idProveedor} onChange={e => setIdProveedor(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                                <option value="">-- Seleccionar --</option>
                                {listaProveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.razonSocial}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Número de Factura</label>
                            <input type="text" value={numeroFactura} onChange={e => setNumeroFactura(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required placeholder="Ej: FAC-4589" />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Monto Deuda (C$)</label>
                            <input type="number" step="0.01" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required placeholder="0.00" />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Vencimiento</label>
                            <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            Insertar Deuda
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL 2: NUEVO PROVEEDOR RÁPIDO */}
            {mostrarModalProveedor && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <form onSubmit={guardarProveedor} style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}><FaTruck /> Nuevo Proveedor</h4>
                            <button type="button" onClick={() => setMostrarModalProveedor(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Razón Social</label>
                            <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required placeholder="Ej: Distribuidora Claro" />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>RUC Comercial</label>
                            <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} placeholder="J03100000000" />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Teléfono</label>
                            <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} placeholder="8888-8888" />
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            Guardar Proveedor
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL 3: MODAL DE ABONOS */}
            {cuentaSeleccionada && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <form onSubmit={ejecutarAbono} style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}><FaCoins /> Registrar Abono</h4>
                            <button type="button" onClick={() => setCuentaSeleccionada(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>

                        <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                            Saldo actual: <strong style={{ color: '#ef4444' }}>C$ {cuentaSeleccionada.saldoPendiente}</strong>
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Monto a Abonar (C$)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0.01" 
                                max={cuentaSeleccionada.saldoPendiente} 
                                value={montoAbono} 
                                onChange={e => setMontoAbono(e.target.value)} 
                                placeholder="0.00" 
                                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                                required 
                            />
                        </div>

                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Método de Pago</label>
                            <select 
                                value={metodoPago} 
                                onChange={e => setMetodoPago(e.target.value)}
                                style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}
                            >
                                <option value="Efectivo">Efectivo</option>
                                <option value="Transferencia">Transferencia Bancaria</option>
                                <option value="Tarjeta">Tarjeta de Débito/Crédito</option>
                            </select>
                        </div>

                        <button type="submit" style={{ width: '100%', padding: '10px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                            Confirmar Abono
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};