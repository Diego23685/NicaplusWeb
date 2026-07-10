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

export const Proveedores: React.FC = () => {
  const [subTab, setSubTab] = useState<'registro' | 'analisis'>('registro');

  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);

  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);

  //==============================
  // FORMULARIO PROVEEDOR
  //==============================
  const [razonSocial, setRazonSocial] = useState('');
  const [ruc, setRuc] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  //==============================
  // FORMULARIO COMPRA
  //==============================
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

  const inputEstilo = {
    width: '100%',
    padding: '10px 12px',
    marginTop: '6px',
    background: '#0f172a',
    color: '#ffffff',
    border: '1px solid #334155',
    borderRadius: '8px',
    boxSizing: 'border-box' as const,
    fontSize: '0.9rem',
    outline: 'none'
  };

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

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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

    const payload = {
      razonSocial,
      ruc,
      telefono,
      email
    };

    try {
      if (editando === null) {
        await api.post("/proveedores", payload);
        alert("Proveedor registrado correctamente.");
      } else {
        await api.put(`/proveedores/${editando}`, {
          id: editando,
          ...payload
        });
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
    return (
      <div
        style={{
          color: '#38bdf8',
          padding: '30px',
          fontWeight: 'bold'
        }}
      >
        Analizando rentabilidad...
      </div>
    );
  }

  return (
    <div
      style={{
        color: '#fff',
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%'
      }}
    >
      {/* CABECERA */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid #334155',
          paddingBottom: '12px'
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: '#38bdf8',
              fontSize: '1.4rem',
              fontWeight: 700
            }}
          >
            Módulo de Proveedores y Logística
          </h3>
          <p style={{ color: '#94a3b8', marginTop: 4 }}>
            Administración de proveedores, abastecimiento y análisis.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            background: '#1e293b',
            padding: 4,
            borderRadius: 8,
            border: '1px solid #334155'
          }}
        >
          <button
            onClick={() => setSubTab('registro')}
            style={{
              padding: '8px 16px',
              background: subTab === 'registro' ? '#581c87' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            📦 Abastecimiento
          </button>
          <button
            onClick={() => setSubTab('analisis')}
            style={{
              padding: '8px 16px',
              background: subTab === 'analisis' ? '#581c87' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            📊 Rentabilidad
          </button>
        </div>
      </div>

      {subTab === "registro" ? (
        <>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* FORMULARIO PROVEEDOR */}
            <div
              style={{
                flex: "1 1 350px",
                background: "#1e293b",
                padding: 20,
                borderRadius: 12,
                border: "1px solid #334155"
              }}
            >
              <h4 style={{ marginTop: 0, color: "#a855f7" }}>
                <FaTruck /> {" "} {editando === null ? "Nuevo proveedor" : "Editar proveedor"}
              </h4>

              <form onSubmit={guardarProveedor} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label>Razón Social</label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={e => setRazonSocial(e.target.value)}
                    style={inputEstilo}
                    required
                  />
                </div>

                <div>
                  <label>RUC</label>
                  <input
                    type="text"
                    value={ruc}
                    onChange={e => setRuc(e.target.value)}
                    style={inputEstilo}
                  />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    style={inputEstilo}
                    required
                  />
                </div>

                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputEstilo}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: 12,
                      background: "#8b5cf6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    <FaSave /> {" "} {editando === null ? "Guardar proveedor" : "Actualizar proveedor"}
                  </button>
                  {editando !== null && (
                    <button
                      type="button"
                      onClick={limpiarFormularioProveedor}
                      style={{
                        padding: "12px 18px",
                        background: "#ef4444",
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* FORMULARIO DE COMPRA */}
            <div
              style={{
                flex: "1 1 500px",
                background: "#1e293b",
                padding: 20,
                borderRadius: 12,
                border: "1px solid #334155"
              }}
            >
              <h4 style={{ marginTop: 0, color: "#10b981" }}>
                <FaShoppingCart /> Registrar compra
              </h4>

              <form
                onSubmit={registrarIngresoInventario}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12
                }}
              >
                <div style={{ gridColumn: "span 2" }}>
                  <label>Proveedor</label>
                  <select
                    value={idProvSeleccionado}
                    onChange={e => setIdProvSeleccionado(e.target.value)}
                    style={inputEstilo}
                    required
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.razonSocial}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label>Producto</label>
                  <select
                    value={idProdSeleccionado}
                    onChange={e => setIdProdSeleccionado(e.target.value)}
                    style={inputEstilo}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock: {p.stockActual})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={cantidadCompra}
                    onChange={e => setCantidadCompra(Number(e.target.value))}
                    style={inputEstilo}
                  />
                </div>

                <div>
                  <label>Costo Unitario</label>
                  <input
                    type="number"
                    min={0}
                    value={costoUnitarioCompra}
                    onChange={e => setCostoUnitarioCompra(Number(e.target.value))}
                    style={inputEstilo}
                  />
                </div>

                <div>
                  <label>Días de entrega</label>
                  <input
                    type="number"
                    min={0}
                    value={tiempoEntregaDias}
                    onChange={e => setTiempoEntregaRealDias(Number(e.target.value))}
                    style={inputEstilo}
                  />
                </div>

                <div>
                  <label>Garantía (días)</label>
                  <input
                    type="number"
                    min={0}
                    value={garantiaCompra}
                    onChange={e => setGarantiaCompra(Number(e.target.value))}
                    style={inputEstilo}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    gridColumn: "span 2",
                    padding: 12,
                    border: "none",
                    borderRadius: 8,
                    background: "#10b981",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  <FaPlus /> {" "} Registrar compra
                </button>
              </form>
            </div>
          </div>

          {/* TABLA DE PROVEEDORES */}
          <div
            style={{
              background: "#1e293b",
              borderRadius: 12,
              border: "1px solid #334155",
              padding: 20,
              overflowX: "auto"
            }}
          >
            <h4 style={{ marginTop: 0, color: "#38bdf8" }}>
              Proveedores registrados
            </h4>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #334155" }}>
                  <th style={{ padding: 10, textAlign: "left" }}>Proveedor</th>
                  <th style={{ padding: 10, textAlign: "left" }}>RUC</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Teléfono</th>
                  <th style={{ padding: 10, textAlign: "left" }}>Email</th>
                  <th style={{ padding: 10, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: 10 }}>{p.razonSocial}</td>
                    <td style={{ padding: 10 }}>{p.ruc}</td>
                    <td style={{ padding: 10 }}>{p.telefono}</td>
                    <td style={{ padding: 10 }}>{p.email}</td>
                    <td style={{ padding: 10, textAlign: "center" }}>
                      <button
                        onClick={() => editarProveedor(p)}
                        style={{
                          marginRight: 10,
                          padding: "6px 12px",
                          background: "#3b82f6",
                          border: "none",
                          borderRadius: 6,
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => eliminarProveedor(p.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#ef4444",
                          border: "none",
                          borderRadius: 6,
                          color: "#fff",
                          cursor: "pointer"
                        }}
                      >
                        <FaTrash />
                      </button>
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
        </>
      ) : (
        /* TABLA DE RENDIMIENTO */
        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: 20,
            overflowX: "auto"
          }}
        >
          <h4 style={{ marginTop: 0, color: "#38bdf8" }}>
            <FaChartLine /> {" "} Ranking Estratégico de Proveedores
          </h4>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8" }}>
                <th style={{ padding: 10, textAlign: "left" }}>Proveedor</th>
                <th style={{ padding: 10, textAlign: "center" }}>Órdenes</th>
                <th style={{ padding: 10 }}>Total Invertido</th>
                <th style={{ padding: 10 }}>Ganancia</th>
                <th style={{ padding: 10 }}>Entrega</th>
                <th style={{ padding: 10, textAlign: "center" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map(m => (
                <tr key={m.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={{ padding: 10, fontWeight: "bold" }}>{m.razonSocial}</td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    <span style={{ background: "#0f172a", padding: "5px 10px", borderRadius: 6 }}>
                      <FaBoxes size={11} /> {" "} {m.totalOrdenes}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>C$ {m.totalInvertido.toLocaleString()}</td>
                  <td style={{ padding: 10, fontWeight: "bold", color: "#4ade80" }}>
                    C$ {m.margenGananciaHistorico.toLocaleString()}
                  </td>
                  <td style={{ padding: 10 }}>{m.tiempoRespuestaPromedio} días</td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    <span
                      style={{
                        padding: "5px 12px",
                        borderRadius: 30,
                        fontWeight: "bold",
                        background: m.scoreConfiabilidad >= 80
                          ? "rgba(16,185,129,.15)"
                          : m.scoreConfiabilidad >= 50
                            ? "rgba(245,158,11,.15)"
                            : "rgba(239,68,68,.15)",
                        color: m.scoreConfiabilidad >= 80
                          ? "#10b981"
                          : m.scoreConfiabilidad >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                      }}
                    >
                      <FaUserCheck size={10} /> {" "} {m.scoreConfiabilidad}%
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
      )}

      {/* MODAL DE CONFLICTO / RESTRICCIÓN DE ELIMINACIÓN */}
      {modalConflicto.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ color: '#ef4444', fontSize: '1.5rem', display: 'flex' }}>
                <FaTrash />
              </span>
              <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Acción Bloqueada
              </h4>
            </div>

            <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {modalConflicto.mensaje}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Compras que dependen de este proveedor:
              </span>
              
              <div 
                style={{ 
                  maxHeight: '180px', 
                  overflowY: 'auto', 
                  marginTop: '8px',
                  background: '#0f172a',
                  borderRadius: '6px',
                  border: '1px solid #334155'
                }}
              >
                {modalConflicto.compras.map(c => (
                  <div 
                    key={c.id} 
                    style={{ 
                      padding: '10px 12px', 
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span style={{ color: '#38bdf8', fontWeight: '500' }}>
                      ID Compra: #{c.id}
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      {new Date(c.fecha).toLocaleDateString()}
                    </span>
                    <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                      C$ {c.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModalConflicto({ visible: false, mensaje: '', compras: [] })}
                style={{
                  padding: '8px 20px',
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
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