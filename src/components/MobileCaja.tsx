import React, { useState, useMemo } from 'react';
import { 
  FaShoppingCart, FaSearch, FaTimes, FaUser, FaTrashAlt, 
  FaMoneyBillWave, FaExclamationTriangle, FaCheckCircle, 
  FaWhatsapp, FaPrint, FaChevronUp, FaBoxes, FaGamepad, FaTv, FaLayerGroup, FaTags
} from 'react-icons/fa';
import styles from '../assets/styles/Caja.module.css';

interface MobileCajaProps {
  productos: any[];
  categorias: any[];
  listaClientes: any[];
  carrito: any[];
  setCarrito: React.Dispatch<React.SetStateAction<any[]>>;
  metodoPago: string;
  setMetodoPago: (val: string) => void;
  fechaVenta: string;
  setFechaVenta: (val: string) => void;
  fechaVencimientoCredito: string;
  setFechaVencimientoCredito: (val: string) => void;
  idClienteSeleccionado: number | null;
  setIdClienteSeleccionado: (val: number | null) => void;
  diasCredito: number;
  setDiasCredito: (val: number) => void;
  alHacerClicProducto: (p: any) => void;
  agregarVarianteAlCarrito: (p: any, v: any) => void;
  cambiarCantidadManual: (idP: number, idV: number | null | undefined, cant: number) => void;
  cambiarPrecioUnitarioManual: (idP: number, idV: number | null | undefined, precio: number) => void;
  cambiarDescuentoManual: (idP: number, idV: number | null | undefined, desc: number) => void;
  actualizarDiasItemCarrito: (idP: number, idV: number | null | undefined, dias: number) => void;
  aplicarMesesExactosCarrito: (idP: number, idV: number | null | undefined, meses: number) => void;
  actualizarMetadata: (idP: number, idV: number | null | undefined, val: string) => void;
  eliminarDelCarrito: (idP: number, idV: number | null | undefined) => void;
  limpiarCarrito: () => void;
  finalizarVenta: () => void;
  productoParaSeleccionarVariante: any;
  setProductoParaSeleccionarVariante: (p: any) => void;
  mensajeErrorModal: string | null;
  setMensajeErrorModal: (m: string | null) => void;
  mostrarModalDespacho: boolean;
  setMostrarModalDespacho: (b: boolean) => void;
  datosUltimaVenta: any;
  setDatosUltimaVenta: (d: any) => void;
  enviarWhatsAppVenta: (datos: any) => void;
  imprimirTicketTermico: (datos: any) => void;
  obtenerFechaLocalISO: (offset?: number, base?: string) => string;
}

export const MobileCaja: React.FC<MobileCajaProps> = ({
  productos,
  categorias,
  listaClientes,
  carrito,
  metodoPago,
  setMetodoPago,
  fechaVenta,
  setFechaVenta,
  fechaVencimientoCredito,
  setFechaVencimientoCredito,
  idClienteSeleccionado,
  setIdClienteSeleccionado,
  diasCredito,
  setDiasCredito,
  alHacerClicProducto,
  agregarVarianteAlCarrito,
  cambiarCantidadManual,
  cambiarPrecioUnitarioManual,
  cambiarDescuentoManual,
  actualizarDiasItemCarrito,
  aplicarMesesExactosCarrito,
  actualizarMetadata,
  eliminarDelCarrito,
  limpiarCarrito,
  finalizarVenta,
  productoParaSeleccionarVariante,
  setProductoParaSeleccionarVariante,
  mensajeErrorModal,
  setMensajeErrorModal,
  mostrarModalDespacho,
  setMostrarModalDespacho,
  datosUltimaVenta,
  setDatosUltimaVenta,
  enviarWhatsAppVenta,
  imprimirTicketTermico,
  obtenerFechaLocalISO
}) => {
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [filtroRubro, setFiltroRubro] = useState<'todos' | 'fisico' | 'digital' | 'streaming'>('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null);
  
  // Estado para desplegar la hoja del carrito en móvil
  const [mostrarCarritoSheet, setMostrarCarritoSheet] = useState(false);

  const productosFiltrados = useMemo(() => {
    return productos
      .filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase());
        const coincideCat = categoriaFiltro ? p.categoriaId === categoriaFiltro : true;
        let coincideRubro = true;
        if (filtroRubro === 'fisico') coincideRubro = !p.esDigital;
        if (filtroRubro === 'digital') coincideRubro = p.esDigital && !p.esSuscripcion;
        if (filtroRubro === 'streaming') coincideRubro = p.esDigital && p.esSuscripcion;
        return coincideTexto && coincideCat && coincideRubro;
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, busquedaProducto, categoriaFiltro, filtroRubro]);

  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) return listaClientes.slice(0, 20);
    const t = busquedaCliente.toLowerCase();
    return listaClientes.filter(c => 
      c.nombre.toLowerCase().includes(t) || (c.telefono && c.telefono.includes(t))
    ).slice(0, 20);
  }, [listaClientes, busquedaCliente]);

  const totalVenta = useMemo(() => carrito.reduce((sum, i) => sum + i.subTotal, 0), [carrito]);
  const cantidadArticulos = useMemo(() => carrito.reduce((sum, i) => sum + i.cantidad, 0), [carrito]);

  return (
    <div className={styles.mobileContainer} style={{ paddingBottom: '90px' }}>
      
      {/* 1. BUSCADOR SUPERIOR */}
      <div className={styles.searchBoxWrapper}>
        <FaSearch className={styles.searchBoxIcon} />
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={busquedaProducto} 
          onChange={e => setBusquedaProducto(e.target.value)} 
          className={styles.searchBoxInput}
        />
        {busquedaProducto && (
          <FaTimes onClick={() => setBusquedaProducto('')} className={styles.clearIcon} />
        )}
      </div>

      {/* 2. FILTROS RÁPIDOS POR CATEGORÍA Y RUBRO */}
      <div className={styles.categoriasScroll} style={{ marginBottom: '8px' }}>
        <button 
          onClick={() => setFiltroRubro('todos')} 
          className={`${styles.catBtn} ${filtroRubro === 'todos' ? styles.catBtnActive : ''}`}
        >
          <FaLayerGroup size={11} /> Todos
        </button>
        <button 
          onClick={() => setFiltroRubro('fisico')} 
          className={`${styles.catBtn} ${filtroRubro === 'fisico' ? styles.catBtnActive : ''}`}
        >
          <FaBoxes size={11} /> Físicos
        </button>
        <button 
          onClick={() => setFiltroRubro('digital')} 
          className={`${styles.catBtn} ${filtroRubro === 'digital' ? styles.catBtnActive : ''}`}
        >
          <FaGamepad size={11} /> Digitales
        </button>
        <button 
          onClick={() => setFiltroRubro('streaming')} 
          className={`${styles.catBtn} ${filtroRubro === 'streaming' ? styles.catBtnActive : ''}`}
        >
          <FaTv size={11} /> Streaming
        </button>
      </div>

      <div className={styles.categoriasScroll} style={{ marginBottom: '12px' }}>
        <button 
          onClick={() => setCategoriaFiltro(null)} 
          className={`${styles.catBtn} ${categoriaFiltro === null ? styles.catBtnActive : ''}`}
        >
          Todas
        </button>
        {categorias.map(c => (
          <button 
            key={c.id} 
            onClick={() => setCategoriaFiltro(c.id)} 
            className={`${styles.catBtn} ${categoriaFiltro === c.id ? styles.catBtnActive : ''}`}
          >
            <FaTags size={10} /> {c.nombre}
          </button>
        ))}
      </div>

      {/* 3. GRILLA MÓVIL DE PRODUCTOS */}
      <div className={styles.productGrid} style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {productosFiltrados.map(p => (
          <div key={p.id} onClick={() => alHacerClicProducto(p)} className={styles.productCard}>
            <div className={styles.productImgContainer}>
              {p.imagenUrl ? (
                <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} />
              ) : (
                <div className={styles.productNoImg}>SIN FOTO</div>
              )}
            </div>
            <div className={styles.productDetails}>
              <div className={styles.productName}>{p.nombre}</div>
              <div className={styles.productPrice}>
                {p.tieneVariaciones ? "Varía" : `C$ ${p.precioVenta}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. BARRA INFERIOR FLOTANTE DE CARRITO */}
      <div className={styles.bottomNav} style={{ height: '70px', padding: '8px 14px', background: '#0f172a' }}>
        <button 
          onClick={() => setMostrarCarritoSheet(true)}
          className={styles.actionBtnPrimary}
          style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: '12px 18px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaShoppingCart size={18} />
            <span>Ver Orden ({cantidadArticulos})</span>
          </div>
          <strong style={{ fontSize: '1.05rem' }}>C$ {totalVenta}</strong>
        </button>
      </div>

      {/* 5. HOJA MÓVIL (BOTTOM SHEET) DEL CARRITO */}
      {mostrarCarritoSheet && (
        <div className={styles.modalOverlay} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div className={styles.modalContent} style={{ width: '100%', maxHeight: '90vh', borderRadius: '20px 20px 0 0', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>
                <FaShoppingCart style={{ color: '#38bdf8' }} /> Orden de Compra
              </h3>
              <button onClick={() => setMostrarCarritoSheet(false)} style={{ background: 'none', border: 'none', color: '#94a3b8' }}>
                <FaTimes size={18} />
              </button>
            </div>

            {/* ARTÍCULOS EN EL CARRITO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {carrito.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>Carrito vacío</p>}
              {carrito.map(item => {
                const pBase = productos.find(p => p.id === item.idProducto);
                return (
                  <div key={`${item.idProducto}-${item.idVariacion || 'base'}`} className={styles.cartItem}>
                    <div className={styles.cartItemMain}>
                      <span className={styles.cartItemName}>{item.nombre}</span>
                      <button onClick={() => eliminarDelCarrito(item.idProducto, item.idVariacion)} className={styles.eliminarItem}>
                        <FaTimes />
                      </button>
                    </div>
                    <div className={styles.cartItemSubRow} style={{ marginTop: '6px' }}>
                      <div className={styles.controlGroup}>
                        <span className={styles.cartLabel}>Cant:</span>
                        <input 
                          type="number" 
                          min={1} 
                          value={item.cantidad} 
                          onChange={e => cambiarCantidadManual(item.idProducto, item.idVariacion, Number(e.target.value))} 
                          className={styles.cantInput} 
                        />
                      </div>
                      <div className={styles.controlGroup}>
                        <span className={styles.cartLabel}>P.U:</span>
                        <input 
                          type="number" 
                          min={0} 
                          value={item.precioUnitario} 
                          onChange={e => cambiarPrecioUnitarioManual(item.idProducto, item.idVariacion, Number(e.target.value))} 
                          className={styles.smallInput} 
                        />
                      </div>
                      <strong>C$ {item.subTotal}</strong>
                    </div>

                    {pBase?.esDigital && (
                      <textarea 
                        rows={2} 
                        placeholder="Credenciales..." 
                        value={item.metadataDigital} 
                        onChange={e => actualizarMetadata(item.idProducto, item.idVariacion, e.target.value)} 
                        className={styles.metaInput}
                        style={{ width: '100%', marginTop: '6px', fontSize: '0.8rem' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* CONFIGURACIÓN DE FACTURACIÓN Y CLIENTE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}><FaUser size={10} /> Cliente</label>
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  value={busquedaCliente} 
                  onChange={e => setBusquedaCliente(e.target.value)} 
                  className={styles.searchInput}
                  style={{ padding: '8px', fontSize: '0.8rem', marginBottom: '4px' }}
                />
                <select 
                  value={idClienteSeleccionado || 0} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    setIdClienteSeleccionado(val);
                    const txt = e.target.options[e.target.selectedIndex].text;
                    if (val !== 0) setBusquedaCliente(txt.split(' (')[0]);
                  }} 
                  className={styles.selectControl}
                >
                  <option value={0}>Venta de Mostrador</option>
                  {clientesFiltrados.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Método de Pago</label>
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className={styles.selectControl}>
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Transferencia">🏦 Transferencia</option>
                  <option value="Tarjeta">💳 Tarjeta</option>
                  <option value="Crédito">🛑 Crédito</option>
                </select>
              </div>

              {metodoPago === "Crédito" && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: '#f87171' }}>Días Crédito</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={diasCredito} 
                    onChange={e => {
                      const d = Number(e.target.value);
                      setDiasCredito(d);
                      setFechaVencimientoCredito(obtenerFechaLocalISO(d, fechaVenta));
                    }} 
                    className={styles.searchInput}
                  />
                </div>
              )}

              <div className={styles.totalRow} style={{ marginTop: '10px' }}>
                <span>Total:</span>
                <strong className={styles.totalAmount}>C$ {totalVenta}</strong>
              </div>

              <button 
                onClick={() => {
                  setMostrarCarritoSheet(false);
                  finalizarVenta();
                }} 
                disabled={carrito.length === 0} 
                className={`${styles.submitBtn} ${carrito.length === 0 ? styles.submitBtnDisabled : styles.submitBtnActive}`}
              >
                Procesar Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VARIANTE */}
      {productoParaSeleccionarVariante && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', borderTop: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>
                Opciones: <span style={{ color: '#38bdf8' }}>{productoParaSeleccionarVariante.nombre}</span>
              </h3>
              <button onClick={() => setProductoParaSeleccionarVariante(null)} style={{ background: 'none', border: 'none', color: '#94a3b8' }}>
                <FaTimes />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productoParaSeleccionarVariante.variaciones?.map((v: any) => (
                <button
                  key={v.id}
                  disabled={v.stockActual <= 0}
                  onClick={() => agregarVarianteAlCarrito(productoParaSeleccionarVariante, v)}
                  className={styles.modalBtn}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '10px',
                    cursor: v.stockActual <= 0 ? 'not-allowed' : 'pointer',
                    opacity: v.stockActual <= 0 ? 0.5 : 1
                  }}
                >
                  <span style={{ color: '#fff' }}>{v.nombreVariacion}</span>
                  <strong style={{ color: '#38bdf8' }}>C$ {v.precioVenta}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ERROR */}
      {mensajeErrorModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ borderTop: '4px solid #ef4444' }}>
            <div className={styles.modalIcon} style={{ color: '#ef4444' }}><FaExclamationTriangle /></div>
            <h3 className={styles.modalTitle} style={{ color: '#f87171' }}>Operación Denegada</h3>
            <p className={styles.modalText}>{mensajeErrorModal}</p>
            <button onClick={() => setMensajeErrorModal(null)} className={styles.modalBtn} style={{ background: '#334155', color: '#fff' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DESPACHO */}
      {mostrarModalDespacho && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}><FaCheckCircle /></div>
            <h3 className={styles.modalTitle}>¡Venta Registrada!</h3>
            <div className={styles.modalActions}>
              {datosUltimaVenta?.cliente?.id ? (
                <button onClick={() => enviarWhatsAppVenta(datosUltimaVenta)} className={`${styles.modalBtn} ${styles.btnWhatsapp}`}>
                  <FaWhatsapp size={18} /> WhatsApp
                </button>
              ) : (
                <small style={{ color: '#94a3b8' }}>Venta Mostrador (sin WhatsApp)</small>
              )}
              <button onClick={() => imprimirTicketTermico(datosUltimaVenta)} className={`${styles.modalBtn} ${styles.btnPrint}`}>
                <FaPrint /> Imprimir Ticket
              </button>
              <button onClick={() => { setMostrarModalDespacho(false); setDatosUltimaVenta(null); }} className={`${styles.modalBtn} ${styles.btnClose}`}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};