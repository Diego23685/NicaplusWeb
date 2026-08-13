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
  FaHistory
} from 'react-icons/fa';
import styles from '../assets/styles/Proveedores.module.css';

export const Proveedores: React.FC = () => {
  const [subTab, setSubTab] = useState<'registro' | 'historial' | 'analisis'>('registro');

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [historialCompras, setHistorialCompras] = useState<any[]>([]);

  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);

  // FORMULARIO PROVEEDOR
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  // FORMULARIO COMPRA
  const [idProvSeleccionado, setIdProvSeleccionado] = useState('');
  const [idProdSeleccionado, setIdProdSeleccionado] = useState('');
  const [idVariacionSeleccionada, setIdVariacionSeleccionada] = useState(''); // <--- NUEVO
  const [variacionesDisponibles, setVariacionesDisponibles] = useState<any[]>([]); // <--- NUEVO

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
  };

  const cargarDatos = async () => {
    try {
      const [resProv, resProd, resMet, resComp] = await Promise.all([
        api.get('/proveedores'),
        api.get('/products'),
        api.get('/proveedores/analisis-rendimiento'),
        api.get('/proveedores/compras')
      ]);

      setProveedores(resProv.data);
      setProductos(resProd.data);
      setMetricas(resMet.data);
      setHistorialCompras(resComp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // SELECCIÓN DE PRODUCTO CON MANEJO DE VARIANTES
  const seleccionarProductoCompra = (idProdStr: string) => {
    setIdProdSeleccionado(idProdStr);
    setIdVariacionSeleccionada('');
    
    const prod = productos.find(p => (p.id ?? p.Id) === Number(idProdStr));
    
    if (prod) {
      // Normalizar la lectura de variaciones (soporta camelCase y PascalCase)
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
    } else {
      setVariacionesDisponibles([]);
    }
  };

  // SELECCIÓN DE VARIANTE
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
    setRuc(proveedor.ruc);
    setTelefono(proveedor.telefono);
    setEmail(proveedor.email);

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
      alert("Compra modificada con éxito. El inventario y dinero en caja han sido recalculados.");
      setCompraAEditar(null);
      await cargarDatos();
    } catch (err: any) {
      alert(err.response?.data?.mensaje || "Error al actualizar la compra.");
    }
  };

  const anularCompra = async (idCompra: number) => {
    if (!window.confirm(`¿Está seguro de ANULAR la Orden de Compra #${idCompra}? Se restará el stock ingresado y se revertirá el egreso en caja.`)) return;

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
    if (!idProvSeleccionado || !idProdSeleccionado) return;

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

  if (cargando) {
    return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Analizando abastecimiento...</div>;
  }

  return (
    <div className={styles.container}>
      {/* CABECERA */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3>Módulo de Proveedores y Logística</h3>
          <p>Administración de proveedores, abastecimiento y análisis.</p>
        </div>

        <div className={styles.tabContainer}>
          <button
            onClick={() => setSubTab('registro')}
            className={`${styles.tabBtn} ${subTab === 'registro' ? styles.tabBtnActive : ''}`}
          >
            📦 Abastecimiento
          </button>
          <button
            onClick={() => setSubTab('historial')}
            className={`${styles.tabBtn} ${subTab === 'historial' ? styles.tabBtnActive : ''}`}
          >
            📜 Historial Compras
          </button>
          <button
            onClick={() => setSubTab('analisis')}
            className={`${styles.tabBtn} ${subTab === 'analisis' ? styles.tabBtnActive : ''}`}
          >
            📊 Rentabilidad
          </button>
        </div>
      </div>

      {subTab === "registro" && (
        <>
          <div className={styles.flexLayout}>
            {/* FORMULARIO PROVEEDOR */}
            <div className={styles.formProveedorPanel}>
              <h4>
                <FaTruck /> {editando === null ? "Nuevo proveedor" : "Editar proveedor"}
              </h4>

              <form onSubmit={guardarProveedor} className={styles.verticalForm}>
                <div className={styles.formGroup}>
                  <label>Razón Social</label>
                  <input type="text" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                  <label>RUC</label>
                  <input type="text" value={ruc} onChange={e => setRuc(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Teléfono</label>
                  <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={styles.input} />
                </div>

                <div className={styles.btnActionsWrapper}>
                  <button type="submit" className={styles.btnGuardar}>
                    <FaSave /> {editando === null ? "Guardar proveedor" : "Actualizar proveedor"}
                  </button>
                  {editando !== null && (
                    <button type="button" onClick={limpiarFormularioProveedor} className={styles.btnCancelar}>
                      <FaTimes />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* FORMULARIO DE COMPRA */}
            <div className={styles.formCompraPanel}>
              <h4><FaShoppingCart /> Registrar compra</h4>
              <form onSubmit={registrarIngresoInventario} className={styles.gridForm}>
                <div className={styles.gridSpan2}>
                  <div className={styles.formGroup}>
                    <label>Proveedor</label>
                    <select value={idProvSeleccionado} onChange={e => setIdProvSeleccionado(e.target.value)} className={styles.input} required>
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.gridSpan2}>
                  <div className={styles.formGroup}>
                    <label>Producto</label>
                    <select value={idProdSeleccionado} onChange={e => seleccionarProductoCompra(e.target.value)} className={styles.input} required>
                      <option value="">Seleccionar producto</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.tieneVariaciones ? '(Tiene Variantes)' : `(Stock: ${p.stockActual})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SELECTOR DESPLEGABLE DE VARIANTES SI EXISTEN */}
                {variacionesDisponibles.length > 0 && (
                  <div className={styles.gridSpan2}>
                    <div className={styles.formGroup}>
                      <label style={{ color: '#38bdf8', fontWeight: 'bold' }}>Variante Específica *</label>
                      <select 
                        value={idVariacionSeleccionada} 
                        onChange={e => seleccionarVariacionCompra(e.target.value)} 
                        className={styles.input} 
                        style={{ border: '1px solid #38bdf8' }}
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
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input type="number" min={1} value={cantidadCompra} onChange={e => setCantidadCompra(Number(e.target.value))} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Costo Unit. (Compra)</label>
                  <input type="number" min={0} value={costoUnitarioCompra} onChange={e => setCostoUnitarioCompra(Number(e.target.value))} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio Venta (Catálogo)</label>
                  <input 
                    type="number" 
                    min={0} 
                    placeholder="Opcional"
                    value={nuevoPrecioVenta} 
                    onChange={e => setNuevoPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))} 
                    className={styles.input} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Días de entrega</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={tiempoEntregaRealDias} 
                    onChange={e => setTiempoEntregaRealDias(Number(e.target.value))} 
                    className={styles.input} 
                  />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Garantía (días)</label>
                  <input type="number" min={0} value={garantiaCompra} onChange={e => setGarantiaCompra(Number(e.target.value))} className={styles.input} />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Notas / Cuenta o Correo Renovado</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Cuenta renovada gomez@gmail.com o Lote #412" 
                    value={observacionesCompra} 
                    onChange={e => setObservacionesCompra(e.target.value)} 
                    className={styles.input} 
                  />
                </div>

                <button type="submit" className={styles.btnRegistrarCompra} style={{ gridColumn: 'span 2' }}>
                  <FaPlus /> Registrar compra e ingresar stock
                </button>
              </form>
            </div>
          </div>

          {/* TABLA DE PROVEEDORES REGISTRADOS */}
          <div className={styles.tablePanel}>
            <h4>Proveedores registrados</h4>
            <div className={styles.tableWrapper}>
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
                  {proveedores.map(p => (
                    <tr key={p.id}>
                      <td>{p.razonSocial}</td>
                      <td>{p.ruc}</td>
                      <td>{p.telefono}</td>
                      <td>{p.email}</td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => editarProveedor(p)} className={styles.btnEdit}><FaEdit /></button>
                        <button onClick={() => eliminarProveedor(p.id)} className={styles.btnDelete}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                  {proveedores.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 25, textAlign: "center", color: "#94a3b8" }}>
                        No existen proveedores registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === "historial" && (
        <div className={styles.tablePanel}>
          <h4><FaHistory /> Historial de Compras y Lotes Abastecidos</h4>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Detalle Items</th>
                  <th>Notas / Correos</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historialCompras.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 'bold', color: '#38bdf8' }}>#{c.id}</td>
                    <td>{new Date(c.fechaCompra).toLocaleDateString()}</td>
                    <td>{c.proveedorNombre}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {c.detalles?.map((d: any, idx: number) => (
                          <div key={idx}>
                            • {d.cantidad}x {d.productoNombre} 
                            {d.variacionNombre && <strong style={{ color: '#38bdf8' }}> ({d.variacionNombre})</strong>} 
                            (a C$ {d.costoUnitario})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#e2e8f0', fontStyle: c.observaciones ? 'normal' : 'italic' }}>
                        {c.observaciones || 'Sin notas'}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#ef4444" }}>
                      C$ {c.totalCompra.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => abrirModalEditarCompra(c)} className={styles.btnEdit} title="Editar Compra">
                          <FaEdit />
                        </button>
                        <button onClick={() => anularCompra(c.id)} className={styles.btnDelete} title="Anular Compra">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historialCompras.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                      No hay compras registradas en el historial.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "analisis" && (
        <div className={styles.tablePanel}>
          <h4><FaChartLine /> Ranking Estratégico de Proveedores</h4>
          <div className={styles.tableWrapper}>
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
                {metricas.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: "bold" }}>{m.razonSocial}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={styles.badgeMetrica}>
                        <FaBoxes size={11} /> {m.totalOrdenes}
                      </span>
                    </td>
                    <td>C$ {m.totalInvertido.toLocaleString()}</td>
                    <td style={{ fontWeight: "bold", color: "#4ade80" }}>C$ {m.margenGananciaHistorico.toLocaleString()}</td>
                    <td>{m.tiempoRespuestaPromedio} días</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={styles.badgeScore}
                        style={{
                          background: m.scoreConfiabilidad >= 80
                            ? "rgba(16,185,129,.15)"
                            : m.scoreConfiabilidad >= 50
                              ? "rgba(245,158,11,.15)"
                              : "rgba(239,68,68,.15)",
                          color: m.scoreConfiabilidad >= 80 ? "#10b981" : m.scoreConfiabilidad >= 50 ? "#f59e0b" : "#ef4444"
                        }}
                      >
                        <FaUserCheck size={10} /> {m.scoreConfiabilidad}%
                      </span>
                    </td>
                  </tr>
                ))}
                {metricas.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 30, textAlign: "center", color: "#94a3b8" }}>
                      No existen datos para analizar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE COMPRA */}
      {compraAEditar && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '750px', width: '90%' }}>
            <div className={styles.modalHeader}>
              <h4>🛠️ Auditoría de Compra #{compraAEditar.id}</h4>
              <button onClick={() => setCompraAEditar(null)} className={styles.btnCancelar}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={guardarEdicionCompra} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div className={styles.formGroup}>
                <label>Proveedor</label>
                <select 
                  value={compraAEditar.idProveedor} 
                  onChange={e => setCompraAEditar({ ...compraAEditar, idProveedor: Number(e.target.value) })}
                  className={styles.input}
                  required
                >
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Notas / Cuenta o Correo Renovado</label>
                <input 
                  type="text" 
                  value={compraAEditar.observaciones || ''} 
                  onChange={e => setCompraAEditar({ ...compraAEditar, observaciones: e.target.value })}
                  className={styles.input}
                  placeholder="Ej: Cuenta renovada gomez@gmail.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold' }}>Detalle de Lote e Ítems</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {compraAEditar.detalles?.map((det: any, idx: number) => {
                    const prodSeleccionado = productos.find(p => (p.id ?? p.Id) === det.idProducto);
                    const tieneVars = prodSeleccionado?.tieneVariaciones && prodSeleccionado?.variaciones?.length > 0;

                    return (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: tieneVars ? '1.5fr 1.5fr 1fr 1fr 1fr' : '2fr 1fr 1fr 1fr', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                        <div>
                          <small style={{ fontSize: '9px', color: '#94a3b8' }}>Producto</small>
                          <select 
                            value={det.idProducto} 
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              const newProdId = Number(e.target.value);
                              copia[idx].idProducto = newProdId;
                              copia[idx].idVariacion = null;
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.input}
                            style={{ fontSize: '0.75rem', padding: '4px' }}
                          >
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        </div>

                        {tieneVars && (
                          <div>
                            <small style={{ fontSize: '9px', color: '#38bdf8' }}>Variante</small>
                            <select 
                              value={det.idVariacion || ''} 
                              onChange={e => {
                                const copia = [...compraAEditar.detalles];
                                copia[idx].idVariacion = e.target.value ? Number(e.target.value) : null;
                                setCompraAEditar({ ...compraAEditar, detalles: copia });
                              }}
                              className={styles.input}
                              style={{ fontSize: '0.75rem', padding: '4px' }}
                              required
                            >
                              <option value="">Seleccionar variante</option>
                              {prodSeleccionado.variaciones.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.nombreVariacion}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <small style={{ fontSize: '9px', color: '#94a3b8' }}>Cantidad</small>
                          <input 
                            type="number" 
                            min={1} 
                            value={det.cantidad} 
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].cantidad = Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.input}
                            style={{ padding: '4px', textAlign: 'center' }}
                          />
                        </div>

                        <div>
                          <small style={{ fontSize: '9px', color: '#94a3b8' }}>Costo Unit.</small>
                          <input 
                            type="number" 
                            min={0} 
                            value={det.costoUnitario} 
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].costoUnitario = Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.input}
                            style={{ padding: '4px', textAlign: 'center' }}
                          />
                        </div>

                        <div>
                          <small style={{ fontSize: '9px', color: '#38bdf8' }}>Precio Venta</small>
                          <input 
                            type="number" 
                            min={0} 
                            value={det.nuevoPrecioVenta || ''} 
                            onChange={e => {
                              const copia = [...compraAEditar.detalles];
                              copia[idx].nuevoPrecioVenta = e.target.value === '' ? '' : Number(e.target.value);
                              setCompraAEditar({ ...compraAEditar, detalles: copia });
                            }}
                            className={styles.input}
                            style={{ padding: '4px', textAlign: 'center' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Nuevo Total Recalculado:</span>
                <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>
                  C$ {compraAEditar.detalles?.reduce((acc: number, item: any) => acc + (item.cantidad * item.costoUnitario), 0).toLocaleString()}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setCompraAEditar(null)} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnGuardar}>
                  Guardar y Recalcular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFLICTO */}
      {modalConflicto.visible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <span style={{ color: '#ef4444', fontSize: '1.5rem', display: 'flex' }}><FaTrash /></span>
              <h4>Acción Bloqueada</h4>
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {modalConflicto.mensaje}
            </p>

            <div className={styles.modalBodyList}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Compras que dependen de este proveedor:
              </span>
              <div className={styles.modalScrollBox}>
                {modalConflicto.compras.map(c => (
                  <div key={c.id} className={styles.modalRow}>
                    <span style={{ color: '#38bdf8', fontWeight: '500' }}>ID Compra: #{c.id}</span>
                    <span style={{ color: '#94a3b8' }}>{new Date(c.fecha).toLocaleDateString()}</span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>C$ {c.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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