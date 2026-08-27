import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FaTruck,
  FaShoppingCart,
  FaChartLine,
  FaUserCheck,
  FaSave,
  FaPlus,
  FaBoxes,
  FaEdit,
  FaTrash,
  FaTimes,
  FaHistory,
  FaSearch,
  FaChevronUp,
  FaPhoneAlt,
  FaCalendarAlt} from 'react-icons/fa';
import styles from '../assets/styles/Proveedores.module.css';

export const Proveedores: React.FC = () => {
  const [subTab, setSubTab] = useState<'registro' | 'historial' | 'analisis'>('registro');

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [historialCompras, setHistorialCompras] = useState<any[]>([]);

  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [mostrarFormProveedor, setMostrarFormProveedor] = useState(false);

  // ESTADO PARA LA TASA DE CAMBIO
  const [tasaCambio, setTasaCambio] = useState<number>(37);

  // BUSCADORES DE TABLAS Y FORMULARIOS
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdownProd, setMostrarDropdownProd] = useState(false);
  const [filtroTablaProveedores, setFiltroTablaProveedores] = useState('');
  const [filtroTablaHistorial, setFiltroTablaHistorial] = useState('');

  // FORMULARIO PROVEEDOR
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // FORMULARIO COMPRA
  const [idProvSeleccionado, setIdProvSeleccionado] = useState('');
  const [idProdSeleccionado, setIdProdSeleccionado] = useState('');
  const [idVariacionSeleccionada, setIdVariacionSeleccionada] = useState('');
  const [variacionesDisponibles, setVariacionesDisponibles] = useState<any[]>([]);

  const [cantidadCompra, setCantidadCompra] = useState(1);
  const [costoUnitarioCompra, setCostoUnitarioCompra] = useState(0);
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState<number | ''>('');
  const [garantiaCompra, setGarantiaCompra] = useState(30);
  const [tiempoEntregaRealDias, setTiempoEntregaRealDias] = useState(1);
  const [observacionesCompra, setObservacionesCompra] = useState('');

  // ESTADO PARA MODAL DE EDICIÓN DE COMPRA
  const [compraAEditar, setCompraAEditar] = useState<any | null>(null);

  const [modalConflicto, setModalConflicto] = useState<{
    visible: boolean;
    mensaje: string;
    compras: Array<{ id: number; fecha: string; total: number }>;
  }>({ visible: false, mensaje: '', compras: [] });

  const limpiarFormularioProveedor = () => {
    setEditando(null);
    setRazonSocial('');
    setRuc('');
    setTelefono('');
    setEmail('');
    setMostrarFormProveedor(false);
  };

  const cargarDatos = async () => {
    try {
      const [resProv, resProd, resMet, resComp, resTasa] = await Promise.all([
        api.get('/proveedores'),
        api.get('/products'),
        api.get('/proveedores/analisis-rendimiento'),
        api.get('/proveedores/compras'),
        api.get('/tasa-cambio').catch(() => ({ data: { valor: 37 } }))
      ]);

      setProveedores(resProv.data || []);
      setProductos(resProd.data || []);
      setMetricas(resMet.data || []);
      setHistorialCompras(resComp.data || []);
      if (resTasa.data) {
        const val = resTasa.data.valor ?? resTasa.data.Valor ?? 37;
        setTasaCambio(Number(val));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const calcularDolares = (montoCordobas: number) => {
    return tasaCambio > 0 ? montoCordobas / tasaCambio : 0;
  };

  const seleccionarProductoDesdeBuscador = (prod: any) => {
    const idProd = prod.id ?? prod.Id;
    setIdProdSeleccionado(String(idProd));
    setBusquedaProducto(prod.nombre ?? prod.Nombre);
    setMostrarDropdownProd(false);
    setIdVariacionSeleccionada('');

    const tieneVars = prod.tieneVariaciones ?? prod.TieneVariaciones ?? false;
    const vars = prod.variaciones ?? prod.Variaciones ?? [];

    if (tieneVars && vars.length > 0) {
      setVariacionesDisponibles(vars);
      setCostoUnitarioCompra(0);
      setNuevoPrecioVenta('');
    } else {
      setVariacionesDisponibles([]);
      setCostoUnitarioCompra(prod.precioCosto ?? prod.PrecioCosto ?? 0);
      setNuevoPrecioVenta(prod.precioVenta ?? prod.PrecioVenta ?? 0);
    }
  };

  const seleccionarVariacionCompra = (idVarStr: string) => {
    setIdVariacionSeleccionada(idVarStr);
    const variacion = variacionesDisponibles.find(v => (v.id ?? v.Id) === Number(idVarStr));
    if (variacion) {
      setCostoUnitarioCompra(variacion.precioCosto ?? variacion.PrecioCosto ?? 0);
      setNuevoPrecioVenta(variacion.precioVenta ?? variacion.PrecioVenta ?? 0);
    }
  };

  const editarProveedor = (proveedor: any) => {
    setEditando(proveedor.id);
    setRazonSocial(proveedor.razonSocial);
    setRuc(proveedor.ruc || '');
    setTelefono(proveedor.telefono || '');
    setEmail(proveedor.email || '');
    setMostrarFormProveedor(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarProveedor = async (id: number) => {
    if (!window.confirm("¿Desea eliminar este proveedor?")) return;

    try {
      await api.delete(`/proveedores/${id}`);
      await cargarDatos();

      if (editando === id) limpiarFormularioProveedor();
      alert("Proveedor eliminado.");
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.compras) {
        setModalConflicto({
          visible: true,
          mensaje: err.response.data.mensaje,
          compras: err.response.data.compras
        });
      } else {
        alert("No fue posible eliminar el proveedor.");
      }
    }
  };

  const abrirModalEditarCompra = (compra: any) => {
    const detallesFormateados = compra.detalles?.map((d: any) => {
      const prod = productos.find(p => (p.id ?? p.Id) === d.idProducto);
      let precioActual = 0;
      
      if (prod) {
        if (d.idVariacion && prod.variaciones) {
          const varEncontrada = prod.variaciones.find((v: any) => (v.id ?? v.Id) === d.idVariacion);
          precioActual = varEncontrada ? (varEncontrada.precioVenta ?? varEncontrada.PrecioVenta ?? 0) : 0;
        } else {
          precioActual = prod.precioVenta ?? prod.PrecioVenta ?? 0;
        }
      }

      return {
        ...d,
        idVariacion: d.idVariacion || null,
        nuevoPrecioVenta: precioActual
      };
    }) || [];

    setCompraAEditar({
      ...compra,
      detalles: detallesFormateados
    });
  };

  const guardarEdicionCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compraAEditar) return;

    const totalCalculado = compraAEditar.detalles.reduce((acc: number, item: any) => acc + (item.cantidad * item.costoUnitario), 0);

    const payload = {
      idProveedor: Number(compraAEditar.idProveedor),
      totalCompra: totalCalculado,
      observaciones: compraAEditar.observaciones || '',
      detalles: compraAEditar.detalles.map((d: any) => ({
        idProducto: Number(d.idProducto),
        idVariacion: d.idVariacion ? Number(d.idVariacion) : null,
        cantidad: Number(d.cantidad),
        costoUnitario: Number(d.costoUnitario),
        nuevoPrecioVenta: d.nuevoPrecioVenta !== '' ? Number(d.nuevoPrecioVenta) : null,
        garantiaDiasPactada: Number(d.garantiaDiasPactada || 0)
      }))
    };

    try {
      await api.put(`/proveedores/compras/${compraAEditar.id}`, payload);
      alert("Compra modificada con éxito.");
      setCompraAEditar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al actualizar la compra.");
    }
  };

  const anularCompra = async (idCompra: number) => {
    if (!window.confirm(`¿Está seguro de ANULAR la Orden de Compra #${idCompra}? Se revertirá el stock y egreso.`)) return;

    try {
      await api.delete(`/proveedores/compras/${idCompra}`);
      alert("Compra anulada exitosamente.");
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al anular la compra.");
    }
  };

  const guardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { razonSocial, ruc, telefono, email };

    try {
      if (editando === null) {
        await api.post("/proveedores", payload);
        alert("Proveedor registrado correctamente.");
      } else {
        await api.put(`/proveedores/${editando}`, { id: editando, ...payload });
        alert("Proveedor actualizado correctamente.");
      }
      limpiarFormularioProveedor();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar.");
    }
  };

  const registrarIngresoInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProvSeleccionado || !idProdSeleccionado) {
      alert("Debe seleccionar un proveedor y un producto válido.");
      return;
    }

    if (variacionesDisponibles.length > 0 && !idVariacionSeleccionada) {
      alert("Este producto requiere seleccionar una variante específica.");
      return;
    }

    const payload = {
      idProveedor: Number(idProvSeleccionado),
      totalCompra: cantidadCompra * costoUnitarioCompra,
      tiempoEntregaRealDias: Number(tiempoEntregaRealDias),
      observaciones: observacionesCompra,
      detalles: [
        {
          idProducto: Number(idProdSeleccionado),
          idVariacion: idVariacionSeleccionada ? Number(idVariacionSeleccionada) : null,
          cantidad: Number(cantidadCompra),
          costoUnitario: Number(costoUnitarioCompra),
          nuevoPrecioVenta: nuevoPrecioVenta !== '' ? Number(nuevoPrecioVenta) : null,
          garantiaDiasPactada: Number(garantiaCompra)
        }
      ]
    };

    try {
      await api.post('/proveedores/compras', payload);
      alert("Compra registrada correctamente.");
      setIdProdSeleccionado('');
      setBusquedaProducto('');
      setIdVariacionSeleccionada('');
      setVariacionesDisponibles([]);
      setCantidadCompra(1);
      setCostoUnitarioCompra(0);
      setNuevoPrecioVenta('');
      setObservacionesCompra('');
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "No fue posible registrar la compra.");
    }
  };

  const productosFiltradosBusqueda = productos.filter(p => {
    const query = busquedaProducto.toLowerCase().trim();
    if (!query) return true;
    const nombre = (p.nombre ?? p.Nombre ?? '').toLowerCase();
    return nombre.includes(query);
  });

  const proveedoresFiltradosTabla = proveedores.filter(p => {
    const q = filtroTablaProveedores.toLowerCase().trim();
    if (!q) return true;
    return (p.razonSocial || '').toLowerCase().includes(q) ||
           (p.ruc || '').toLowerCase().includes(q) ||
           (p.telefono || '').toLowerCase().includes(q);
  });

  const historialFiltradoTabla = historialCompras.filter(c => {
    const q = filtroTablaHistorial.toLowerCase().trim();
    if (!q) return true;
    const prov = (c.proveedorNombre || '').toLowerCase();
    const obs = (c.observaciones || '').toLowerCase();
    const idStr = String(c.id);
    const prodNames = c.detalles?.map((d: any) => (d.productoNombre || '').toLowerCase()).join(' ') || '';
    return prov.includes(q) || obs.includes(q) || idStr.includes(q) || prodNames.includes(q);
  });

  if (cargando) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loaderPulse} />
        <span>Analizando abastecimiento y logística...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 1. ENCABEZADO */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h3 className={styles.title}>Proveedores y Logística</h3>
          <p className={styles.subtitle}>Abastecimiento, historial de órdenes y rentabilidad.</p>
        </div>

        <div className={styles.tabContainer}>
          <button
            onClick={() => setSubTab('registro')}
            className={`${styles.tabBtn} ${subTab === 'registro' ? styles.tabBtnActive : ''}`}
          >
            📦 Abastecer
          </button>
          <button
            onClick={() => setSubTab('historial')}
            className={`${styles.tabBtn} ${subTab === 'historial' ? styles.tabBtnActive : ''}`}
          >
            📜 Compras ({historialCompras.length})
          </button>
          <button
            onClick={() => setSubTab('analisis')}
            className={`${styles.tabBtn} ${subTab === 'analisis' ? styles.tabBtnActive : ''}`}
          >
            📊 Rentabilidad
          </button>
        </div>
      </header>

      {/* 2. SUBTAB: ABASTECIMIENTO */}
      {subTab === "registro" && (
        <div className={styles.abastecimientoLayout}>
          
          {/* ACORDEÓN PROVEEDOR */}
          <div className={styles.panelCard}>
            <button 
              type="button" 
              onClick={() => setMostrarFormProveedor(!mostrarFormProveedor)}
              className={styles.accordionToggleBtn}
            >
              <span className={styles.accordionTitle}>
                <FaTruck /> {editando === null ? "Registrar Nuevo Proveedor" : `Editar: ${razonSocial}`}
              </span>
              {mostrarFormProveedor ? <FaChevronUp /> : <FaPlus />}
            </button>

            <form 
              onSubmit={guardarProveedor} 
              className={`${styles.formVertical} ${!mostrarFormProveedor ? styles.formCollapsed : ''}`}
            >
              <div className={styles.formGroup}>
                <label className={styles.label}>Razón Social / Nombre *</label>
                <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>RUC / Cédula</label>
                <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} className={styles.input} placeholder="Opcional" />
              </div>
              <div className={styles.formGroupDual}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Teléfono</label>
                  <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className={styles.input} placeholder="8888-8888" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} placeholder="correo@proveedor.com" />
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button type="submit" className={styles.btnGuardar}>
                  <FaSave /> {editando === null ? "Guardar Proveedor" : "Actualizar"}
                </button>
                {editando !== null && (
                  <button type="button" onClick={limpiarFormularioProveedor} className={styles.btnCancelar}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* FORMULARIO DE COMPRA E INGRESO DE STOCK */}
          <div className={styles.panelCard}>
            <h4 className={`${styles.panelTitle} ${styles.titleBlue}`}>
              <FaShoppingCart /> Ingreso de Stock / Orden de Compra
            </h4>

            <form onSubmit={registrarIngresoInventario} className={styles.formCompra}>
              <div className={styles.formGroup}>
                <label className={styles.label}>1. Proveedor *</label>
                <select value={idProvSeleccionado} onChange={e => setIdProvSeleccionado(e.target.value)} className={styles.select} required>
                  <option value="">-- Seleccionar Proveedor --</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                </select>
              </div>

              {/* BUSCADOR DE PRODUCTOS TOUCH */}
              <div className={styles.searchProdWrapper}>
                <label className={styles.label}>2. Buscar Producto *</label>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Escribe el nombre del artículo..."
                    value={busquedaProducto}
                    onChange={e => {
                      setBusquedaProducto(e.target.value);
                      setIdProdSeleccionado('');
                      setVariacionesDisponibles([]);
                      setMostrarDropdownProd(true);
                    }}
                    onFocus={() => setMostrarDropdownProd(true)}
                    className={styles.searchInput}
                    required
                  />
                  <FaSearch className={styles.searchIcon} />
                </div>

                {mostrarDropdownProd && (
                  <div className={styles.dropdownResults}>
                    {productosFiltradosBusqueda.length > 0 ? (
                      productosFiltradosBusqueda.map(p => {
                        const idProd = p.id ?? p.Id;
                        const tieneVars = p.tieneVariaciones ?? p.TieneVariaciones;
                        const stock = p.stockActual ?? p.StockActual;

                        return (
                          <div
                            key={idProd}
                            onClick={() => seleccionarProductoDesdeBuscador(p)}
                            className={styles.dropdownItem}
                          >
                            <span>{p.nombre}</span>
                            <small className={tieneVars ? styles.textCyan : styles.textMuted}>
                              {tieneVars ? '🎨 Variantes' : `Stock: ${stock}`}
                            </small>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.dropdownEmpty}>No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>

              {/* SELECTOR DE VARIANTES SI APLICA */}
              {variacionesDisponibles.length > 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.labelCyan}>Variante Específica *</label>
                  <select 
                    value={idVariacionSeleccionada} 
                    onChange={e => seleccionarVariacionCompra(e.target.value)} 
                    className={`${styles.select} ${styles.selectVariant}`}
                    required
                  >
                    <option value="">Seleccionar variante (Color/Capacidad/RAM)</option>
                    {variacionesDisponibles.map(v => {
                      const idVar = v.id ?? v.Id;
                      const nombreVar = v.nombreVariacion ?? v.NombreVariacion ?? 'Variante';
                      const colorVar = v.color ?? v.Color ?? '';
                      const almacVar = v.almacenamiento ?? v.Almacenamiento ?? '';
                      const stockVar = v.stockActual ?? v.StockActual ?? 0;

                      return (
                        <option key={idVar} value={idVar}>
                          {nombreVar} {colorVar && `- ${colorVar}`} {almacVar} (Stock: {stockVar})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* GRID FINANCIERO Y CANTIDADES */}
              <div className={styles.financialGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cantidad</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={cantidadCompra === 0 ? '' : cantidadCompra} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setCantidadCompra(e.target.value === '' ? 0 : Number(e.target.value))} 
                    onBlur={() => {
                      if (cantidadCompra < 1) setCantidadCompra(1);
                    }}
                    className={styles.touchInput} 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Costo Unit. (C$)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={costoUnitarioCompra === 0 ? '' : costoUnitarioCompra} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setCostoUnitarioCompra(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className={`${styles.touchInput} ${styles.textRed}`} 
                  />
                  <small style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                    ${calcularDolares(costoUnitarioCompra).toFixed(2)} USD
                  </small>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>P. Venta (C$)</label>
                  <input 
                    type="number" 
                    min={0} 
                    placeholder="Catálogo"
                    value={nuevoPrecioVenta} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setNuevoPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))} 
                    className={`${styles.touchInput} ${styles.textGreen}`} 
                  />
                  {typeof nuevoPrecioVenta === 'number' && nuevoPrecioVenta > 0 && (
                    <small style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginTop: '2px' }}>
                      ${calcularDolares(nuevoPrecioVenta).toFixed(2)} USD
                    </small>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Días Entrega</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={tiempoEntregaRealDias === 0 ? '' : tiempoEntregaRealDias} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setTiempoEntregaRealDias(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className={styles.touchInput} 
                  />
                </div>
              </div>

              <div className={styles.formGroupDual}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Garantía (Días)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={garantiaCompra === 0 ? '' : garantiaCompra} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => setGarantiaCompra(e.target.value === '' ? 0 : Number(e.target.value))} 
                    className={styles.input} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Notas / Cuenta Renovada</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Lote #412 o correo nuevo" 
                    value={observacionesCompra} 
                    onChange={e => setObservacionesCompra(e.target.value)} 
                    className={styles.input} 
                  />
                </div>
              </div>

              <button type="submit" className={styles.btnRegistrarCompra}>
                <FaPlus /> Registrar Ingreso (C$ {(cantidadCompra * costoUnitarioCompra).toLocaleString()} / ${calcularDolares(cantidadCompra * costoUnitarioCompra).toFixed(2)} USD)
              </button>
            </form>
          </div>

          {/* LISTA/DIRECTORIO DE PROVEEDORES */}
          <div className={styles.panelCard}>
            <div className={styles.cardHeaderWithFilter}>
              <h4 className={styles.panelTitle}><FaTruck /> Directorio Proveedores</h4>
              <div className={styles.miniSearchBox}>
                <FaSearch className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Filtrar..."
                  value={filtroTablaProveedores}
                  onChange={e => setFiltroTablaProveedores(e.target.value)}
                  className={styles.miniSearchInput}
                />
              </div>
            </div>

            {/* FEED MÓVIL DE PROVEEDORES */}
            <div className={styles.mobileProvidersFeed}>
              {proveedoresFiltradosTabla.map(p => (
                <div key={p.id} className={styles.providerCard}>
                  <div className={styles.providerCardHeader}>
                    <strong className={styles.providerName}>{p.razonSocial}</strong>
                    <div className={styles.providerActions}>
                      <button onClick={() => editarProveedor(p)} className={styles.btnEdit} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={() => eliminarProveedor(p.id)} className={styles.btnDelete} title="Eliminar">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className={styles.providerMetaRow}>
                    <span>RUC: {p.ruc || 'N/D'}</span>
                    <span><FaPhoneAlt size={9} /> {p.telefono || 'Sin tel'}</span>
                  </div>
                </div>
              ))}
              {proveedoresFiltradosTabla.length === 0 && (
                <div className={styles.emptyFeedText}>No existen proveedores coincidentes.</div>
              )}
            </div>

            {/* TABLA EN ESCRITORIO */}
            <div className={styles.desktopTableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>RUC</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th style={{ textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresFiltradosTabla.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.razonSocial}</strong></td>
                      <td>{p.ruc || 'N/A'}</td>
                      <td>{p.telefono || 'Sin teléfono'}</td>
                      <td>{p.email || 'Sin email'}</td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => editarProveedor(p)} className={styles.btnEdit}><FaEdit /></button>
                        <button onClick={() => eliminarProveedor(p.id)} className={styles.btnDelete}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBTAB: HISTORIAL DE COMPRAS */}
      {subTab === "historial" && (
        <div className={styles.panelCard}>
          <div className={styles.cardHeaderWithFilter}>
            <h4 className={styles.panelTitle}><FaHistory /> Historial de Lotes Abastecidos</h4>
            <div className={styles.miniSearchBox}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Buscar orden, ítem..."
                value={filtroTablaHistorial}
                onChange={e => setFiltroTablaHistorial(e.target.value)}
                className={styles.miniSearchInput}
              />
            </div>
          </div>

          {/* FEED MÓVIL HISTORIAL */}
          <div className={styles.mobileHistoryFeed}>
            {historialFiltradoTabla.map(c => {
              const totalDolarHist = calcularDolares(c.totalCompra);
              return (
                <div key={c.id} className={styles.historyCard}>
                  <div className={styles.historyCardHeader}>
                    <strong className={styles.orderNumber}>#ORD-{c.id}</strong>
                    <span className={styles.historyDate}><FaCalendarAlt size={10} /> {new Date(c.fechaCompra).toLocaleDateString()}</span>
                  </div>

                  <div className={styles.historyProvider}>
                    <span>Proveedor: <strong>{c.proveedorNombre}</strong></span>
                  </div>

                  <div className={styles.historyItemsBox}>
                    {c.detalles?.map((d: any, idx: number) => {
                      const subDolarHist = calcularDolares(d.costoUnitario);
                      return (
                        <div key={idx} className={styles.historyItemLine}>
                          • {d.cantidad}x {d.productoNombre} 
                          {d.variacionNombre && <strong className={styles.textCyan}> ({d.variacionNombre})</strong>} 
                          <span className={styles.textMuted}>(a C$ {d.costoUnitario} / ${subDolarHist.toFixed(2)})</span>
                        </div>
                      );
                    })}
                  </div>

                  {c.observaciones && (
                    <div className={styles.historyObs}>📝 {c.observaciones}</div>
                  )}

                  <div className={styles.historyFooter}>
                    <div style={{ textAlign: 'left' }}>
                      <strong className={styles.historyTotal}>C$ {c.totalCompra.toLocaleString()}</strong>
                      <small style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>${totalDolarHist.toFixed(2)} USD</small>
                    </div>
                    <div className={styles.historyActions}>
                      <button onClick={() => abrirModalEditarCompra(c)} className={styles.btnEdit} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={() => anularCompra(c.id)} className={styles.btnDelete} title="Anular">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {historialFiltradoTabla.length === 0 && (
              <div className={styles.emptyFeedText}>No hay compras coincidentes.</div>
            )}
          </div>

          {/* TABLA ESCRITORIO HISTORIAL */}
          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Detalle Items</th>
                  <th>Notas</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltradoTabla.map(c => {
                  const totalDolarDesk = calcularDolares(c.totalCompra);
                  return (
                    <tr key={c.id}>
                      <td className={styles.orderNumber}>#{c.id}</td>
                      <td>{new Date(c.fechaCompra).toLocaleDateString()}</td>
                      <td><strong>{c.proveedorNombre}</strong></td>
                      <td>
                        <div className={styles.textMuted}>
                          {c.detalles?.map((d: any, idx: number) => {
                            const subDolarDesk = calcularDolares(d.costoUnitario);
                            return (
                              <div key={idx}>
                                • {d.cantidad}x {d.productoNombre} 
                                {d.variacionNombre && <strong className={styles.textCyan}> ({d.variacionNombre})</strong>} 
                                (a C$ {d.costoUnitario} / ${subDolarDesk.toFixed(2)})
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td><span className={styles.textItalic}>{c.observaciones || 'Sin notas'}</span></td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>
                        C$ {c.totalCompra.toLocaleString()}
                        <small style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>
                          ${totalDolarDesk.toFixed(2)} USD
                        </small>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div className={styles.actionsDualCenter}>
                          <button onClick={() => abrirModalEditarCompra(c)} className={styles.btnEdit}><FaEdit /></button>
                          <button onClick={() => anularCompra(c.id)} className={styles.btnDelete}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SUBTAB: ANÁLISIS DE RENTABILIDAD */}
      {subTab === "analisis" && (
        <div className={styles.panelCard}>
          <h4 className={styles.panelTitle}><FaChartLine /> Ranking Estratégico de Proveedores</h4>
          
          {/* FEED MÓVIL MÉTRICAS */}
          <div className={styles.mobileMetricsFeed}>
            {metricas.map(m => {
              const invDolarMob = calcularDolares(m.totalInvertido);
              const ganDolarMob = calcularDolares(m.margenGananciaHistorico);
              return (
                <div key={m.id} className={styles.metricCard}>
                  <div className={styles.metricCardHeader}>
                    <strong className={styles.providerName}>{m.razonSocial}</strong>
                    <span className={`${styles.badgeScore} ${m.scoreConfiabilidad >= 80 ? styles.scoreGreen : m.scoreConfiabilidad >= 50 ? styles.scoreOrange : styles.scoreRed}`}>
                      <FaUserCheck size={10} /> {m.scoreConfiabilidad}%
                    </span>
                  </div>

                  <div className={styles.metricGrid}>
                    <div className={styles.metricItem}>
                      <small>Órdenes:</small>
                      <strong>{m.totalOrdenes} lotes</strong>
                    </div>
                    <div className={styles.metricItem}>
                      <small>Invertido:</small>
                      <div>
                        <strong>C$ {m.totalInvertido.toLocaleString()}</strong>
                        <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>${invDolarMob.toFixed(2)} USD</small>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <small>Margen Ganancia:</small>
                      <div>
                        <strong className={styles.textGreen}>C$ {m.margenGananciaHistorico.toLocaleString()}</strong>
                        <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>${ganDolarMob.toFixed(2)} USD</small>
                      </div>
                    </div>
                    <div className={styles.metricItem}>
                      <small>Entrega Promedio:</small>
                      <strong>{m.tiempoRespuestaPromedio} días</strong>
                    </div>
                  </div>
                </div>
              );
            })}
            {metricas.length === 0 && (
              <div className={styles.emptyFeedText}>No existen datos para analizar.</div>
            )}
          </div>

          {/* TABLA ESCRITORIO MÉTRICAS */}
          <div className={styles.desktopTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th style={{ textAlign: "center" }}>Órdenes</th>
                  <th>Total Invertido</th>
                  <th>Ganancia</th>
                  <th>Entrega</th>
                  <th style={{ textAlign: "center" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {metricas.map(m => {
                  const invDolarDesk = calcularDolares(m.totalInvertido);
                  const ganDolarDesk = calcularDolares(m.margenGananciaHistorico);
                  return (
                    <tr key={m.id}>
                      <td><strong>{m.razonSocial}</strong></td>
                      <td style={{ textAlign: "center" }}><span className={styles.badgeMetrica}><FaBoxes size={10} /> {m.totalOrdenes}</span></td>
                      <td>
                        C$ {m.totalInvertido.toLocaleString()}
                        <small style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>${invDolarDesk.toFixed(2)} USD</small>
                      </td>
                      <td>
                        <strong className={styles.textGreen}>C$ {m.margenGananciaHistorico.toLocaleString()}</strong>
                        <small style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>${ganDolarDesk.toFixed(2)} USD</small>
                      </td>
                      <td>{m.tiempoRespuestaPromedio} días</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`${styles.badgeScore} ${m.scoreConfiabilidad >= 80 ? styles.scoreGreen : m.scoreConfiabilidad >= 50 ? styles.scoreOrange : styles.scoreRed}`}>
                          <FaUserCheck size={10} /> {m.scoreConfiabilidad}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL DE EDICIÓN DE COMPRA */}
      {compraAEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>🛠️ Editar Compra #{compraAEditar.id}</h4>
              <button onClick={() => setCompraAEditar(null)} className={styles.modalCloseBtn}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={guardarEdicionCompra} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Proveedor</label>
                <select 
                  value={compraAEditar.idProveedor} 
                  onChange={e => setCompraAEditar({ ...compraAEditar, idProveedor: Number(e.target.value) })}
                  className={styles.select}
                  required
                >
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Notas / Lote</label>
                <input 
                  type="text" 
                  value={compraAEditar.observaciones || ''} 
                  onChange={e => setCompraAEditar({ ...compraAEditar, observaciones: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.loteEditList}>
                <label className={styles.label}>Detalle de Artículos:</label>
                {compraAEditar.detalles?.map((det: any, idx: number) => {
                  const prodSeleccionado = productos.find(p => (p.id ?? p.Id) === det.idProducto);
                  const tieneVars = prodSeleccionado?.tieneVariaciones && prodSeleccionado?.variaciones?.length > 0;

                  return (
                    <div key={idx} className={styles.itemEditCard}>
                      <div className={styles.formGroup}>
                        <label className={styles.miniLabel}>Producto</label>
                        <select 
                          value={det.idProducto} 
                          onChange={e => {
                            const copia = [...compraAEditar.detalles];
                            copia[idx].idProducto = Number(e.target.value);
                            copia[idx].idVariacion = null;
                            setCompraAEditar({ ...compraAEditar, detalles: copia });
                          }}
                          className={styles.select}
                        >
                          {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                      </div>

                      {tieneVars && (
                        <div className={styles.formGroup}>
                          <label className={styles.miniLabelCyan}>Variante</label>
                          <select 
                            value={det.idVariacion || ''} 
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].idVariacion = e.target.value ? Number(e.target.value) : null;
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.select}
                            required
                          >
                            <option value="">Seleccionar variante</option>
                            {prodSeleccionado.variaciones.map((v: any) => (
                              <option key={v.id} value={v.id}>{v.nombreVariacion}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={styles.itemEditInputsRow}>
                        <div className={styles.formGroup}>
                          <label className={styles.miniLabel}>Cant.</label>
                          <input 
                            type="number" 
                            min={1} 
                            value={det.cantidad === 0 ? '' : det.cantidad} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].cantidad = e.target.value === '' ? 0 : Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            onBlur={() => {
                              if (det.cantidad < 1) {
                                const copia = [...compraAEditar.detalles];
                                copia[idx].cantidad = 1;
                                setCompraAEditar({ ...compraAEditar, detalles: copia });
                              }
                            }}
                            className={styles.touchInput} 
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.miniLabel}>Costo U.</label>
                          <input 
                            type="number" 
                            min={0} 
                            value={det.costoUnitario === 0 ? '' : det.costoUnitario} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].costoUnitario = e.target.value === '' ? 0 : Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.touchInput} 
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.miniLabelCyan}>P. Venta</label>
                          <input 
                            type="number" 
                            min={0} 
                            value={det.nuevoPrecioVenta === 0 ? '' : det.nuevoPrecioVenta} 
                            onFocus={(e) => e.target.select()}
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].nuevoPrecioVenta = e.target.value === '' ? '' : Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.touchInput} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.recalcTotalRow}>
                <span>Total Recalculado:</span>
                <div style={{ textAlign: 'right' }}>
                  <strong className={styles.textRed}>
                    C$ {compraAEditar.detalles?.reduce((acc: number, item: any) => acc + (item.cantidad * item.costoUnitario), 0).toLocaleString()}
                  </strong>
                  <small style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal' }}>
                    ${calcularDolares(compraAEditar.detalles?.reduce((acc: number, item: any) => acc + (item.cantidad * item.costoUnitario), 0)).toFixed(2)} USD
                  </small>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setCompraAEditar(null)} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnGuardar}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CONFLICTO */}
      {modalConflicto.visible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentConflict}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitleRed}><FaTrash /> Acción Bloqueada</h4>
              <button onClick={() => setModalConflicto({ visible: false, mensaje: '', compras: [] })} className={styles.modalCloseBtn}>
                <FaTimes />
              </button>
            </div>

            <p className={styles.conflictText}>{modalConflicto.mensaje}</p>

            <div className={styles.conflictListBox}>
              <span className={styles.conflictSubhead}>Compras vinculadas a este proveedor:</span>
              <div className={styles.conflictScrollBox}>
                {modalConflicto.compras.map(c => (
                  <div key={c.id} className={styles.conflictRow}>
                    <span className={styles.textCyan}>ID: #{c.id}</span>
                    <span className={styles.textMuted}>{new Date(c.fecha).toLocaleDateString()}</span>
                    <strong className={styles.textGreen}>C$ {c.total.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalActionsEnd}>
              <button
                onClick={() => setModalConflicto({ visible: false, mensaje: '', compras: [] })}
                className={styles.btnEntendido}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};