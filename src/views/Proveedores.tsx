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
  FaTimes
} from 'react-icons/fa';
import styles from '../assets/styles/Proveedores.module.css';

export const Proveedores: React.FC = () => {
  const [subTab, setSubTab] = useState<'registro' | 'analisis'>('registro');

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);

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
  const [cantidadCompra, setCantidadCompra] = useState(1);
  const [costoUnitarioCompra, setCostoUnitarioCompra] = useState(0);
  const [garantiaCompra, setGarantiaCompra] = useState(30);
  const [tiempoEntregaDias, setTiempoEntregaRealDias] = useState(1);

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
      const [resProv, resProd, resMet] = await Promise.all([
        api.get('/proveedores'),
        api.get('/products'),
        api.get('/proveedores/analisis-rendimiento')
      ]);

      setProveedores(resProv.data);
      setProductos(resProd.data);
      setMetricas(resMet.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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

  const guardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { razonSocial, ruc, telephone: telefono, email };

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

    const payload = {
      idProveedor: Number(idProvSeleccionado),
      totalCompra: cantidadCompra * costoUnitarioCompra,
      tiempoEntregaRealDias: Number(tiempoEntregaDias),
      detalles: [
        {
          idProducto: Number(idProdSeleccionado),
          cantidad: Number(cantidadCompra),
          costoUnitario: Number(costoUnitarioCompra),
          garantiaDiasPactada: Number(garantiaCompra)
        }
      ]
    };

    try {
      await api.post('/proveedores/compras', payload);
      alert("Compra registrada correctamente.");
      setIdProdSeleccionado('');
      setCantidadCompra(1);
      setCostoUnitarioCompra(0);
      await cargarDatos();
    } catch {
      alert("No fue posible registrar la compra.");
    }
  };

  if (cargando) {
    return <div style={{ color: '#38bdf8', padding: '30px', fontWeight: 'bold' }}>Analizando rentabilidad...</div>;
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
            onClick={() => setSubTab('analisis')}
            className={`${styles.tabBtn} ${subTab === 'analisis' ? styles.tabBtnActive : ''}`}
          >
            📊 Rentabilidad
          </button>
        </div>
      </div>

      {subTab === "registro" ? (
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
                    <select value={idProdSeleccionado} onChange={e => setIdProdSeleccionado(e.target.value)} className={styles.input} required>
                      <option value="">Seleccionar producto</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual})</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Cantidad</label>
                  <input type="number" min={1} value={cantidadCompra} onChange={e => setCantidadCompra(Number(e.target.value))} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Costo Unitario</label>
                  <input type="number" min={0} value={costoUnitarioCompra} onChange={e => setCostoUnitarioCompra(Number(e.target.value))} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Días de entrega</label>
                  <input type="number" min={0} value={tiempoEntregaDias} onChange={e => setTiempoEntregaRealDias(Number(e.target.value))} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Garantía (días)</label>
                  <input type="number" min={0} value={garantiaCompra} onChange={e => setGarantiaCompra(Number(e.target.value))} className={styles.input} />
                </div>

                <button type="submit" className={styles.btnRegistrarCompra}>
                  <FaPlus /> Registrar compra
                </button>
              </form>
            </div>
          </div>

          {/* TABLA DE PROVEEDORES REGISTRADOS CON SCROLL */}
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
      ) : (
        /* TABLA DE RENDIMIENTO / RENTABILIDAD CON SCROLL */
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