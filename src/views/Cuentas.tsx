import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    FaHandHoldingUsd, FaFileInvoiceDollar, FaCoins, FaCheckCircle, 
    FaExclamationTriangle, FaClock, FaPlus, FaTimes, FaTruck,
    FaCalendarAlt, FaPhoneAlt
} from 'react-icons/fa';
import styles from '../assets/styles/Cuenta.module.css';

export const Cuentas: React.FC = () => {
    const [subModulo, setSubModulo] = useState<'cobrar' | 'pagar'>('cobrar');
    const [cuentasCobrar, setCuentasCobrar] = useState<any[]>([]);
    const [cuentasPagar, setCuentasPagar] = useState<any[]>([]);
    const [listaProveedores, setListaProveedores] = useState<any[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
    
    // Control de Modales
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
                .then(res => setCuentasCobrar(res.data || []))
                .catch(err => console.error(err));
        } else {
            Promise.all([
                api.get(`/CuentasPorPagar?estado=${filtroEstado}`),
                api.get('/reportes/resumen-dashboard')
            ]).then(([resPagar]) => {
                setCuentasPagar(resPagar.data || []);
            }).catch(err => console.error(err));

            api.get('/Proveedores')
                .then(res => setListaProveedores(res.data || []))
                .catch(() => setListaProveedores([]));
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [subModulo, filtroEstado]);

    const guardarCuentaPorPagar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idProveedor || !numeroFactura || !montoTotal || !fechaVencimiento) {
            alert("Por favor complete todos los campos obligatorios.");
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

    // Resumen financiero rápido
    const listaActual = subModulo === 'cobrar' ? cuentasCobrar : cuentasPagar;
    const totalSaldoPendiente = useMemo(() => {
        return listaActual.reduce((acc, curr) => acc + (Number(curr.saldoPendiente) || 0), 0);
    }, [listaActual]);

    return (
        <div className={styles.cuentasContainer}>
            
            {/* 1. SELECTOR PRINCIPAL DE SUB-MÓDULOS */}
            <header className={styles.headerTabsWrap}>
                <div className={styles.subModuloTabs}>
                    <button 
                        onClick={() => { setSubModulo('cobrar'); setFiltroEstado('Todos'); }}
                        className={`${styles.tabBtn} ${subModulo === 'cobrar' ? styles.tabBtnCobrarActive : ''}`}
                    >
                        <FaHandHoldingUsd /> Por Cobrar
                    </button>
                    <button 
                        onClick={() => { setSubModulo('pagar'); setFiltroEstado('Todos'); }}
                        className={`${styles.tabBtn} ${subModulo === 'pagar' ? styles.tabBtnPagarActive : ''}`}
                    >
                        <FaFileInvoiceDollar /> Por Pagar
                    </button>
                </div>
            </header>

            {/* 2. CARD DE BALANCE Y ACCIONES RÁPIDAS */}
            <div className={styles.summaryBar}>
                <div className={styles.summaryInfo}>
                    <small className={styles.summaryLabel}>
                        Total Pendiente {subModulo === 'cobrar' ? '(Clientes)' : '(Proveedores)'}
                    </small>
                    <strong className={styles.summaryAmount}>C$ {totalSaldoPendiente.toLocaleString('es-NI')}</strong>
                </div>

                <div className={styles.controlsRow}>
                    <select 
                        value={filtroEstado} 
                        onChange={e => setFiltroEstado(e.target.value)}
                        className={styles.selectFilter}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Pendiente">Solo Pendientes</option>
                        <option value="Pagado">Solo Liquidados</option>
                    </select>

                    {subModulo === 'pagar' && (
                        <div className={styles.buttonsActionGroup}>
                            <button 
                                onClick={() => setMostrarModalProveedor(true)} 
                                className={`${styles.btnAction} ${styles.btnProveedor}`}
                                title="Nuevo Proveedor"
                            >
                                <FaTruck /> <span>Proveedor</span>
                            </button>
                            <button 
                                onClick={() => setMostrarModalPago(true)} 
                                className={`${styles.btnAction} ${styles.btnCuentaPagar}`}
                            >
                                <FaPlus /> <span>Nueva Deuda</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. VISTA MÓVIL Y TABLET (FEED DE TARJETAS TÁCTILES) */}
            <div className={styles.mobileCardsFeed}>
                {listaActual.length === 0 ? (
                    <div className={styles.emptyCard}>No hay registros para este criterio.</div>
                ) : (
                    listaActual.map((item: any) => {
                        const vencio = esVencida(item.fechaVencimiento, item.estado);
                        const esCobrar = subModulo === 'cobrar';
                        const nombrePrincipal = esCobrar 
                            ? (item.nombreCliente || item.cliente?.nombre || 'Cliente General')
                            : `Factura: ${item.numeroFactura}`;
                        const subInfo = esCobrar 
                            ? (item.telefonoCliente || item.cliente?.telefono || 'Sin Teléfono')
                            : `Proveedor ID #${item.idProveedor}`;

                        return (
                            <div key={item.id} className={styles.accountCard}>
                                <div className={styles.accountCardHeader}>
                                    <span className={styles.accountId}>#{item.id}</span>
                                    {item.estado === 'Pagado' ? (
                                        <span className={`${styles.badge} ${styles.badgePagado}`}>
                                            <FaCheckCircle /> {esCobrar ? 'Pagado' : 'Liquidado'}
                                        </span>
                                    ) : vencio ? (
                                        <span className={`${styles.badge} ${styles.badgeVencido}`}>
                                            <FaExclamationTriangle /> Vencido
                                        </span>
                                    ) : (
                                        <span className={`${styles.badge} ${styles.badgePendiente}`}>
                                            <FaClock /> Pendiente
                                        </span>
                                    )}
                                </div>

                                <div className={styles.accountCardBody}>
                                    <strong className={styles.cardTitle}>{nombrePrincipal}</strong>
                                    <small className={styles.cardSubTitle}>
                                        {esCobrar && <FaPhoneAlt size={9} />} {subInfo}
                                    </small>
                                </div>

                                <div className={styles.accountFinancials}>
                                    <div className={styles.financialCol}>
                                        <span className={styles.financialLabel}>Total:</span>
                                        <strong>C$ {Number(item.montoTotal).toLocaleString('es-NI')}</strong>
                                    </div>
                                    <div className={styles.financialCol}>
                                        <span className={styles.financialLabel}>Saldo:</span>
                                        <strong className={item.saldoPendiente > 0 ? styles.saldoPendiente : styles.saldoSaldado}>
                                            C$ {Number(item.saldoPendiente).toLocaleString('es-NI')}
                                        </strong>
                                    </div>
                                </div>

                                <div className={styles.accountDates}>
                                    <div className={styles.dateItem}>
                                        <FaCalendarAlt size={10} /> 
                                        <span>Emisión: {new Date(item.fechaEmision || item.fechaRegistro).toLocaleDateString()}</span>
                                    </div>
                                    <div className={`${styles.dateItem} ${vencio ? styles.fechaVencida : ''}`}>
                                        <FaClock size={10} /> 
                                        <span>Vence: {new Date(item.fechaVencimiento).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {item.saldoPendiente > 0 && (
                                    <button 
                                        onClick={() => setCuentaSeleccionada(item)} 
                                        className={`${styles.btnAbonarMobile} ${esCobrar ? styles.btnAbonarCobrar : styles.btnAbonarPagar}`}
                                    >
                                        <FaCoins /> Registrar Abono
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 4. VISTA ESCRITORIO (TABLA DE ALTA DENSIDAD) */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{subModulo === 'cobrar' ? 'Cliente' : 'Referencia Factura / Proveedor'}</th>
                            <th>Monto Total</th>
                            <th>Saldo Pendiente</th>
                            <th>{subModulo === 'cobrar' ? 'Emisión' : 'Registro'}</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subModulo === 'cobrar' ? (
                            cuentasCobrar.map(c => {
                                const vencio = esVencida(c.fechaVencimiento, c.estado);
                                return (
                                    <tr key={c.id}>
                                        <td className={styles.idCell}>#{c.id}</td>
                                        <td>
                                            <span className={styles.bold}>{c.nombreCliente || c.cliente?.nombre || 'Desconocido'}</span>
                                            <div className={styles.subText}>Tel: {c.telefonoCliente || c.cliente?.telefono || 'N/A'}</div>
                                        </td>
                                        <td className={styles.bold}>C$ {Number(c.montoTotal).toLocaleString('es-NI')}</td>
                                        <td className={c.saldoPendiente > 0 ? styles.saldoPendiente : styles.saldoSaldado}>
                                            C$ {Number(c.saldoPendiente).toLocaleString('es-NI')}
                                        </td>
                                        <td>{new Date(c.fechaEmision).toLocaleDateString()}</td>
                                        <td className={vencio ? styles.fechaVencida : ''}>
                                            {new Date(c.fechaVencimiento).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {c.estado === 'Pagado' ? (
                                                <span className={`${styles.badge} ${styles.badgePagado}`}><FaCheckCircle /> Pagado</span>
                                            ) : vencio ? (
                                                <span className={`${styles.badge} ${styles.badgeVencido}`}><FaExclamationTriangle /> Vencido</span>
                                            ) : (
                                                <span className={`${styles.badge} ${styles.badgePendiente}`}><FaClock /> Pendiente</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {c.saldoPendiente > 0 && (
                                                <button 
                                                    onClick={() => setCuentaSeleccionada(c)} 
                                                    className={`${styles.btnAbonar} ${styles.btnAbonarCobrar}`}
                                                >
                                                    Abonar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            cuentasPagar.map(p => {
                                const vencio = esVencida(p.fechaVencimiento, p.estado);
                                return (
                                    <tr key={p.id}>
                                        <td className={styles.idCell}>#{p.id}</td>
                                        <td>
                                            <span className={styles.bold}>Factura: {p.numeroFactura}</span>
                                            <div className={`${styles.subText} ${styles.subTextBlue}`}>Proveedor ID: #{p.idProveedor}</div>
                                        </td>
                                        <td className={styles.bold}>C$ {Number(p.montoTotal).toLocaleString('es-NI')}</td>
                                        <td className={p.saldoPendiente > 0 ? styles.saldoPendiente : styles.saldoSaldado}>
                                            C$ {Number(p.saldoPendiente).toLocaleString('es-NI')}
                                        </td>
                                        <td>{new Date(p.fechaRegistro).toLocaleDateString()}</td>
                                        <td className={vencio ? styles.fechaVencida : ''}>
                                            {new Date(p.fechaVencimiento).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {p.estado === 'Pagado' ? (
                                                <span className={`${styles.badge} ${styles.badgePagado}`}><FaCheckCircle /> Liquidado</span>
                                            ) : vencio ? (
                                                <span className={`${styles.badge} ${styles.badgeVencido}`}><FaExclamationTriangle /> Vencido</span>
                                            ) : (
                                                <span className={`${styles.badge} ${styles.badgePendiente}`}><FaClock /> Pendiente</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {p.saldoPendiente > 0 && (
                                                <button 
                                                    onClick={() => setCuentaSeleccionada(p)} 
                                                    className={`${styles.btnAbonar} ${styles.btnAbonarPagar}`}
                                                >
                                                    Abonar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL 1: REGISTRAR CUENTA POR PAGAR */}
            {mostrarModalPago && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={guardarCuentaPorPagar} className={styles.modalForm}>
                        <div className={styles.modalHeader}>
                            <h4 className={`${styles.modalTitle} ${styles.titlePagar}`}>
                                <FaFileInvoiceDollar /> Nueva Cuenta por Pagar
                            </h4>
                            <button 
                                type="button" 
                                onClick={() => setMostrarModalPago(false)} 
                                className={styles.btnCloseModal}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Seleccionar Proveedor</label>
                            <select 
                                value={idProveedor} 
                                onChange={e => setIdProveedor(e.target.value)} 
                                className={styles.select} 
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                {listaProveedores.map(p => (
                                    <option key={p.id} value={p.id}>{p.razonSocial}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Número de Factura</label>
                            <input 
                                type="text" 
                                value={numeroFactura} 
                                onChange={e => setNumeroFactura(e.target.value)} 
                                className={styles.input} 
                                required 
                                placeholder="Ej: FAC-4589" 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monto de Deuda (C$)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                value={montoTotal} 
                                onChange={e => setMontoTotal(e.target.value)} 
                                className={styles.input} 
                                required 
                                placeholder="0.00" 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Fecha de Vencimiento</label>
                            <input 
                                type="date" 
                                value={fechaVencimiento} 
                                onChange={e => setFechaVencimiento(e.target.value)} 
                                className={styles.input} 
                                required 
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button 
                                type="button" 
                                onClick={() => setMostrarModalPago(false)} 
                                className={styles.btnCancel}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className={`${styles.btnSubmit} ${styles.btnSubmitPagar}`}
                            >
                                Insertar Deuda
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 2: NUEVO PROVEEDOR RÁPIDO */}
            {mostrarModalProveedor && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={guardarProveedor} className={styles.modalForm}>
                        <div className={styles.modalHeader}>
                            <h4 className={`${styles.modalTitle} ${styles.titleProveedor}`}>
                                <FaTruck /> Registrar Proveedor
                            </h4>
                            <button 
                                type="button" 
                                onClick={() => setMostrarModalProveedor(false)} 
                                className={styles.btnCloseModal}
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre / Razón Social</label>
                            <input 
                                type="text" 
                                value={razonSocial} 
                                onChange={e => setRazonSocial(e.target.value)} 
                                className={styles.input} 
                                required 
                                placeholder="Ej: Distribuidora Claro" 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cédula / RUC Comercial</label>
                            <input 
                                type="text" 
                                value={ruc} 
                                onChange={e => setRuc(e.target.value)} 
                                className={styles.input} 
                                placeholder="Ej: J03100000000" 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Teléfono de Contacto</label>
                            <input 
                                type="text" 
                                value={telefono} 
                                onChange={e => setTelefono(e.target.value)} 
                                className={styles.input} 
                                placeholder="Ej: 8888-8888" 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Correo Electrónico</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className={styles.input} 
                                placeholder="proveedor@nicaplus.com" 
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button 
                                type="button" 
                                onClick={() => setMostrarModalProveedor(false)} 
                                className={styles.btnCancel}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className={`${styles.btnSubmit} ${styles.btnSubmitProveedor}`}
                            >
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* MODAL 3: REGISTRO DE ABONO */}
            {cuentaSeleccionada && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={ejecutarAbono} className={styles.modalForm}>
                        <div className={styles.modalHeader}>
                            <h4 className={`${styles.modalTitle} ${styles.titleAbono}`}>
                                <FaCoins /> Registrar Abono #{cuentaSeleccionada.id}
                            </h4>
                            <button 
                                type="button" 
                                onClick={() => setCuentaSeleccionada(null)} 
                                className={styles.btnCloseModal}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className={styles.saldoOverviewBox}>
                            <small>Saldo Pendiente Actual:</small>
                            <strong className={styles.saldoDestacado}>
                                C$ {Number(cuentaSeleccionada.saldoPendiente).toLocaleString('es-NI')}
                            </strong>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monto a Abonar (C$)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                min="0.01" 
                                max={cuentaSeleccionada.saldoPendiente} 
                                value={montoAbono} 
                                onChange={e => setMontoAbono(e.target.value)} 
                                placeholder="0.00" 
                                className={styles.input}
                                required 
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Método de Pago</label>
                            <select 
                                value={metodoPago} 
                                onChange={e => setMetodoPago(e.target.value)}
                                className={styles.select}
                            >
                                <option value="Efectivo">💵 Efectivo</option>
                                <option value="Transferencia">🏦 Transferencia Bancaria</option>
                                <option value="Tarjeta">💳 Tarjeta de Débito/Crédito</option>
                            </select>
                        </div>

                        <div className={styles.modalActions}>
                            <button 
                                type="button" 
                                onClick={() => setCuentaSeleccionada(null)} 
                                className={styles.btnCancel}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className={`${styles.btnSubmit} ${
                                    subModulo === 'cobrar' ? styles.btnSubmitAbonoCobrar : styles.btnSubmitAbonoPagar
                                }`}
                            >
                                Confirmar Abono
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};