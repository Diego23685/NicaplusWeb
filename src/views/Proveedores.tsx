import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FaTruck,
  FaShoppingCart,
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes} from 'react-icons/fa';

export const Proveedores: React.FC = () => {
  const [subTab, setSubTab] = useState<'registro' | 'historial' | 'analisis' | 'proveedores'>('registro');

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
  const [cantidadCompra, setCantidadCompra] = useState(1);
  const [costoUnitarioCompra, setCostoUnitarioCompra] = useState(0);
  const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState<number | ''>('');
  const [garantiaCompra, setGarantiaCompra] = useState(30);
  const [tiempoEntregaRealDias] = useState(1);
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

      setProveedores(resProv.data || []);
      setProductos(resProd.data || []);
      setMetricas(resMet.data || []);
      setHistorialCompras(resComp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const seleccionarProductoCompra = (idProdStr: string) => {
    setIdProdSeleccionado(idProdStr);
    const prod = productos.find(p => (p.id ?? p.Id) === Number(idProdStr));
    if (prod) {
      setCostoUnitarioCompra(prod.precioCosto ?? prod.PrecioCosto ?? 0);
      setNuevoPrecioVenta(prod.precioVenta ?? prod.PrecioVenta ?? 0);
    }
  };

  const editarProveedor = (proveedor: any) => {
    setEditando(proveedor.id);
    setRazonSocial(proveedor.razonSocial);
    setRuc(proveedor.ruc);
    setTelefono(proveedor.telefono);
    setEmail(proveedor.email);
    setSubTab('proveedores');
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
      return {
        ...d,
        nuevoPrecioVenta: prod ? (prod.precioVenta ?? prod.PrecioVenta ?? 0) : 0
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
        cantidad: Number(d.cantidad),
        costoUnitario: Number(d.costoUnitario),
        nuevoPrecioVenta: d.nuevoPrecioVenta ? Number(d.nuevoPrecioVenta) : null,
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
    if (!window.confirm(`¿Está seguro de ANULAR la Orden de Compra #${idCompra}?`)) return;

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
      tiempoEntregaRealDias: Number(tiempoEntregaRealDias),
      observaciones: observacionesCompra,
      detalles: [
        {
          idProducto: Number(idProdSeleccionado),
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
      setCantidadCompra(1);
      setCostoUnitarioCompra(0);
      setNuevoPrecioVenta('');
      setObservacionesCompra('');
      setSubTab('historial');
      await cargarDatos();
    } catch {
      alert("No fue posible registrar la compra.");
    }
  };

  if (cargando) {
    return <div style={{ color: '#38bdf8', padding: '30px', textAlign: 'center', fontSize: '0.85rem' }}>Analizando abastecimiento...</div>;
  }

  return (
    <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
      
      {/* ENCABEZADO Y TABS */}
      <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>Logística y Proveedores</h3>
          <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Abastecimiento de inventario y rendimiento</small>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#0f172a', padding: '4px', borderRadius: '8px', border: '1px solid #334155', overflowX: 'auto' }}>
          <button
            onClick={() => setSubTab('registro')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: subTab === 'registro' ? '#38bdf8' : 'transparent', color: subTab === 'registro' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📦 Comprar
          </button>
          <button
            onClick={() => setSubTab('historial')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: subTab === 'historial' ? '#38bdf8' : 'transparent', color: subTab === 'historial' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📜 Historial
          </button>
          <button
            onClick={() => setSubTab('analisis')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: subTab === 'analisis' ? '#38bdf8' : '#1e293b', color: subTab === 'analisis' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            📊 Ránking
          </button>
          <button
            onClick={() => setSubTab('proveedores')}
            style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: subTab === 'proveedores' ? '#38bdf8' : 'transparent', color: subTab === 'proveedores' ? '#0f172a' : '#94a3b8', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            🚚 Proveedores
          </button>
        </div>
      </div>

      {/* PESTAÑA 1: REGISTRAR COMPRA */}
      {subTab === 'registro' && (
        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaShoppingCart /> Registrar Compra e Ingresar Stock
          </h4>

          <form onSubmit={registrarIngresoInventario} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Proveedor</label>
              <select value={idProvSeleccionado} onChange={e => setIdProvSeleccionado(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                <option value="">-- Seleccionar Proveedor --</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
              </select>
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Producto a Abastecer</label>
              <select value={idProdSeleccionado} onChange={e => seleccionarProductoCompra(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                <option value="">-- Seleccionar Producto --</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stockActual})</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Cantidad</label>
                <input type="number" min={1} value={cantidadCompra} onChange={e => setCantidadCompra(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Costo Unit. (C$)</label>
                <input type="number" min={0} value={costoUnitarioCompra} onChange={e => setCostoUnitarioCompra(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ color: '#38bdf8', fontSize: '0.72rem', display: 'block' }}>Nuevo Precio Venta</label>
                <input type="number" min={0} placeholder="Opcional" value={nuevoPrecioVenta} onChange={e => setNuevoPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Garantía (Días)</label>
                <input type="number" min={0} value={garantiaCompra} onChange={e => setGarantiaCompra(Number(e.target.value))} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Notas / Correos Renovados</label>
              <input type="text" placeholder="Ej: Lote #412 o Cuenta renovada..." value={observacionesCompra} onChange={e => setObservacionesCompra(e.target.value)} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>

            <div style={{ background: '#0f172a', padding: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>Total calculado:</span>
              <strong style={{ color: '#ef4444' }}>C$ {(cantidadCompra * costoUnitarioCompra).toLocaleString()}</strong>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
              <FaPlus /> Confirmar e Ingresar Stock
            </button>
          </form>
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL DE COMPRAS */}
      {subTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {historialCompras.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
              No hay compras registradas en el historial.
            </div>
          ) : (
            historialCompras.map(c => (
              <div key={c.id} style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Orden #{c.id} — {c.proveedorNombre}</strong>
                  <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>C$ {c.totalCompra.toLocaleString()}</strong>
                </div>

                <div style={{ background: '#0f172a', padding: '6px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  {c.detalles?.map((d: any, idx: number) => (
                    <div key={idx}>• {d.cantidad}x {d.productoNombre} (a C$ {d.costoUnitario})</div>
                  ))}
                  {c.observaciones && <div style={{ color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>Note: {c.observaciones}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Fecha: {new Date(c.fechaCompra).toLocaleDateString()}</small>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirModalEditarCompra(c)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}><FaEdit /></button>
                    <button onClick={() => anularCompra(c.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}><FaTrash /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PESTAÑA 3: RÁNKING / RENTABILIDAD PROVEEDORES */}
      {subTab === 'analisis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {metricas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px', fontSize: '0.8rem' }}>
              No existen datos de métricas disponibles.
            </div>
          ) : (
            metricas.map(m => (
              <div key={m.id} style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{m.razonSocial}</strong>
                  <span style={{ background: m.scoreConfiabilidad >= 80 ? 'rgba(16,185,129,.2)' : 'rgba(245,158,11,.2)', color: m.scoreConfiabilidad >= 80 ? '#10b981' : '#f59e0b', padding: '2px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                    Score: {m.scoreConfiabilidad}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: '#0f172a', padding: '6px', borderRadius: '6px', fontSize: '0.7rem' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Órdenes</span>
                    <strong style={{ color: '#fff' }}>{m.totalOrdenes}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Invertido</span>
                    <strong style={{ color: '#ef4444' }}>C$ {m.totalInvertido.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Margen</span>
                    <strong style={{ color: '#10b981' }}>C$ {m.margenGananciaHistorico.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PESTAÑA 4: DIRECTORIO DE PROVEEDORES */}
      {subTab === 'proveedores' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Formulario Proveedor */}
          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaTruck /> {editando === null ? "Nuevo Proveedor" : "Editar Proveedor"}
            </h4>

            <form onSubmit={guardarProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input type="text" placeholder="Razón Social" value={razonSocial} onChange={e => setRazonSocial(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.78rem' }} required />
              <input type="text" placeholder="RUC Comercial" value={ruc} onChange={e => setRuc(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.78rem' }} />
              <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.78rem' }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.78rem' }} />
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button type="submit" style={{ flex: 1, padding: '8px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <FaSave /> {editando === null ? "Guardar" : "Actualizar"}
                </button>
                {editando !== null && (
                  <button type="button" onClick={limpiarFormularioProveedor} style={{ background: '#475569', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                    <FaTimes />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Proveedores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {proveedores.map(p => (
              <div key={p.id} style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#fff', fontSize: '0.85rem', display: 'block' }}>{p.razonSocial}</strong>
                  <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Tel: {p.telefono || 'N/A'} • RUC: {p.ruc || 'N/A'}</small>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => editarProveedor(p)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}><FaEdit /></button>
                  <button onClick={() => eliminarProveedor(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL EDITAR COMPRA */}
      {compraAEditar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ background: '#1e293b', border: '1px solid #38bdf8', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem' }}>🛠️ Editar Compra #{compraAEditar.id}</h4>
              <button onClick={() => setCompraAEditar(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
            </div>

            <form onSubmit={guardarEdicionCompra} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Proveedor</label>
                <select value={compraAEditar.idProveedor} onChange={e => setCompraAEditar({ ...compraAEditar, idProveedor: Number(e.target.value) })} style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Observaciones</label>
                <input type="text" value={compraAEditar.observaciones || ''} onChange={e => setCompraAEditar({ ...compraAEditar, observaciones: e.target.value })} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setCompraAEditar(null)} style={{ flex: 1, background: '#475569', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFLICTO */}
      {modalConflicto.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
            <h4 style={{ color: '#f87171', margin: 0 }}>Acción Bloqueada</h4>
            <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>{modalConflicto.mensaje}</p>
            <button onClick={() => setModalConflicto({ visible: false, mensaje: '', compras: [] })} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', fontSize: '0.85rem' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};