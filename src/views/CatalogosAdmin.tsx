import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, FaTimes, FaUserPlus, FaSearch, FaSave } from 'react-icons/fa';

// INTERFACES
interface Producto {
    id: number;
    nombre: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    categoriaId: number | null;
    juegoId: number | null;
}

interface Categoria { id: number; nombre: string; imagenUrl: string; }
interface Juego { id: number; nombre: string; imagenUrl: string; }
interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    email: string;
    puntosAcumulados: number;
}

export const CatalogosAdmin: React.FC = () => {
    // Control de Pestañas Activas
    const [pestanaActiva, setPestanaActiva] = useState<'inventario' | 'clientes'>('inventario');

    // ESTADOS GLOBALES DE DATA
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO: PRODUCTOS
    const [editandoProducto, setEditandoProducto] = useState<number | null>(null);
    const [prodNombre, setProdNombre] = useState('');
    const [prodPrecio, setProdPrecio] = useState(0);
    const [prodCosto, setProdCosto] = useState(0);
    const [prodStock, setProdStock] = useState(0);
    const [prodImagenUrl, setProdImagenUrl] = useState('');
    const [esDigital, setEsDigital] = useState(false);
    const [catIdSeleccionada, setCatIdSeleccionada] = useState('');
    const [juegoIdSeleccionado, setJuegoIdSeleccionado] = useState('');

    // FORMULARIOS: JUEGOS Y CATEGORÍAS
    const [editandoJuego, setEditandoJuego] = useState<number | null>(null);
    const [nuevoJuego, setNuevoJuego] = useState('');
    const [juegoImagen, setJuegoImagen] = useState('');
    const [editandoCategoria, setEditandoCategoria] = useState<number | null>(null);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [categoriaImagen, setCategoriaImagen] = useState('');
    
    // FORMULARIO: CLIENTES
    const [editandoClienteId, setEditandoClienteId] = useState<number | null>(null);
    const [cliNombre, setCliNombre] = useState('');
    const [cliTelefono, setCliTelefono] = useState('');
    const [cliEmail, setCliEmail] = useState('');
    const [cliPuntos, setCliPuntos] = useState(0);
    const [mostrarModalCliente, setMostrarModalCliente] = useState(false);

    // FILTROS Y BUSQUEDAS
    const [filtroProd, setFiltroProd] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [juegoFiltroActivo, setJuegoFiltroActivo] = useState<number | null>(null);
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);

    // VENTANA MODAL DE ERROR RELACIONAL (BACKEND RESTRICTIONS)
    const [errorModal, setErrorModal] = useState<{ visible: boolean; mensaje: string; detalles: string; elementosVinculados: string[] }>({
        visible: false, mensaje: '', detalles: '', elementosVinculados: []
    });

    const cargarSincronizacionMaster = async () => {
        try {
            const [resProd, resCat, resJue, resCli] = await Promise.all([
                api.get('/products'),
                api.get('/categorias'),
                api.get('/juegos'),
                api.get('/clientes')
            ]);
            setProductos(resProd.data);
            setCategorias(resCat.data);
            setJuegos(resJue.data);
            setClientes(resCli.data);
        } catch (err) { 
            console.error("Error al sincronizar catálogos del sistema:", err); 
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarSincronizacionMaster(); }, []);

    // FILTRADOS DINÁMICOS
    const prodsFiltrados = productos.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(filtroProd.toLowerCase());
        const coincideJuego = juegoFiltroActivo ? p.juegoId === juegoFiltroActivo : true;
        const coincideCategoria = categoriaFiltroActiva ? p.categoriaId === categoriaFiltroActiva : true;
        return coincideTexto && coincideJuego && coincideCategoria;
    });

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(filtroCliente.toLowerCase()) || c.telefono.includes(filtroCliente)
    );

    // ==========================================
    // LOGICA CRUD: PRODUCTOS
    // ==========================================
    const guardarProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoProducto ? { id: editandoProducto } : {}), 
            nombre: prodNombre,
            descripcion: 'Inventario segmentado',
            precioVenta: prodPrecio,
            precioCosto: prodCosto,
            stockActual: esDigital ? 0 : prodStock,
            stockMinimo: 2,
            imagenUrl: prodImagenUrl || '',
            esDigital,
            categoriaId: catIdSeleccionada ? Number(catIdSeleccionada) : null,
            juegoId: esDigital && juegoIdSeleccionado ? Number(juegoIdSeleccionado) : null,
            visibleEnCatalogo: true
        };

        try {
            if (editandoProducto) {
                await api.put(`/products/${editandoProducto}`, payload);
                alert('Producto actualizado de forma conforme.');
            } else {
                await api.post('/products', payload);
                alert('Producto insertado en inventario.');
            }
            limpiarFormularioProducto();
            cargarSincronizacionMaster();
        } catch { alert('Error de red al procesar el producto.'); }
    };

    const limpiarFormularioProducto = () => {
        setProdNombre(''); setProdPrecio(0); setProdCosto(0); setProdStock(0);
        setProdImagenUrl(''); setEsDigital(false); setCatIdSeleccionada('');
        setJuegoIdSeleccionado(''); setEditandoProducto(null);
    };

    const editarProducto = (producto: Producto) => {
        setEditandoProducto(producto.id);
        setProdNombre(producto.nombre);
        setProdPrecio(producto.precioVenta);
        setProdCosto(producto.precioCosto);
        setProdStock(producto.stockActual);
        setProdImagenUrl(producto.imagenUrl);
        setEsDigital(producto.esDigital);
        setCatIdSeleccionada(producto.categoriaId?.toString() || '');
        setJuegoIdSeleccionado(producto.juegoId?.toString() || '');
    };

    const eliminarProducto = async (id: number) => {
        if (!window.confirm('¿Desea eliminar el artículo del catálogo?')) return;
        try {
            await api.delete(`/products/${id}`);
            cargarSincronizacionMaster();
        } catch { alert('Acción denegada por restricción de integridad.'); }
    };

    // ==========================================
    // LOGICA CRUD: JUEGOS
    // ==========================================
    const guardarJuego = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoJuego ? { id: editandoJuego } : {}), 
            nombre: nuevoJuego,
            imagenUrl: juegoImagen || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=256'
        };
        try {
            if (editandoJuego) {
                await api.put(`/juegos/${editandoJuego}`, payload);
            } else {
                await api.post('/juegos', payload);
            }
            setNuevoJuego(''); setJuegoImagen(''); setEditandoJuego(null);
            cargarSincronizacionMaster();
        } catch { alert("Error al guardar título."); }
    };

    const eliminarJuego = async (id: number) => {
        if (!window.confirm('¿Eliminar juego estratégico?')) return;
        try {
            await api.delete(`/juegos/${id}`);
            if (juegoFiltroActivo === id) setJuegoFiltroActivo(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            setErrorModal({
                visible: true,
                mensaje: "Restricción de Integridad en Título",
                detalles: "Existen artículos activos vinculados a este juego. Reasígnalos primero:",
                elementosVinculados: err.response?.data?.productos || []
            });
        }
    };

    // ==========================================
    // LOGICA CRUD: CATEGORÍAS
    // ==========================================
    const guardarCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoCategoria ? { id: editandoCategoria } : {}), 
            nombre: nuevaCategoria,
            imagenUrl: categoriaImagen || 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?q=80&w=256'
        };
        try {
            if (editandoCategoria) {
                await api.put(`/categorias/${editandoCategoria}`, payload);
            } else {
                await api.post('/categorias', payload);
            }
            setNuevaCategoria(''); setCategoriaImagen(''); setEditandoCategoria(null);
            cargarSincronizacionMaster();
        } catch { alert("Error al guardar categoría."); }
    };

    const eliminarCategoria = async (id: number) => {
        if (!window.confirm('¿Remover categoría del catálogo estructural?')) return;
        try {
            await api.delete(`/categorias/${id}`);
            if (categoriaFiltroActiva === id) setCategoriaFiltroActiva(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            setErrorModal({
                visible: true,
                mensaje: "Restricción de Integridad en Categoría",
                detalles: "Esta categoría cuenta con inventario físico asignado. Modifica los artículos:",
                elementosVinculados: err.response?.data?.productos || []
            });
        }
    };

    // ==========================================
    // LOGICA CRUD: CLIENTES
    // ==========================================
    const abrirModalClienteNuevo = () => {
        setEditandoClienteId(null);
        setCliNombre(''); setCliTelefono(''); setCliEmail(''); setCliPuntos(0);
        setMostrarModalCliente(true);
    };

    const abrirModalClienteEditor = (c: Cliente) => {
        setEditandoClienteId(c.id);
        setCliNombre(c.nombre);
        setCliTelefono(c.telefono);
        setCliEmail(c.email);
        setCliPuntos(c.puntosAcumulados);
        setMostrarModalCliente(true);
    };

    const guardarCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            id: editandoClienteId || 0,
            nombre: cliNombre,
            telefono: cliTelefono,
            email: cliEmail || 'taller@nicaplus.com',
            puntosAcumulados: cliPuntos
        };

        try {
            if (editandoClienteId) {
                await api.put(`/clientes/${editandoClienteId}`, payload);
                alert("Perfil de cliente modificado.");
            } else {
                await api.post('/clientes', payload);
                alert("Cliente registrado de forma conforme.");
            }
            setMostrarModalCliente(false);
            cargarSincronizacionMaster();
        } catch (err: any) {
            alert(err.response?.data || "Fallo en la transacción de base de datos.");
        }
    };

    const eliminarCliente = async (idTarget: number) => {
        if (!window.confirm("¿Remover cliente del libro contable?")) return;
        try {
            await api.delete(`/clientes/${idTarget}`);
            cargarSincronizacionMaster();
        } catch (err: any) {
            alert(err.response?.data || "Acción denegada: El cliente tiene historial de compras o tickets en taller.");
        }
    };

    const procesarSubidaImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onloadend = () => { if (lector.result) setProdImagenUrl(lector.result.toString()); };
        lector.readAsDataURL(archivo);
    };

    // CORREGIDO: Declaración explícita con React.CSSProperties para compatibilidad total con TypeScript
    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };
    
    const panelEstilo: React.CSSProperties = { 
        flex: '1 1 300px', 
        background: '#1e293b', 
        padding: '18px', 
        borderRadius: '12px', 
        border: '1px solid #334155', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        boxSizing: 'border-box' 
    };

    const miniListaEstilo = { maxHeight: '110px', overflowY: 'auto' as const, marginTop: '8px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #233249' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Sincronizando registros estructurales...</div>;

    return (
        <div style={{ color: '#fff', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box', width: '100%' }}>
            
            {/* ENCABEZADO Y TABS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Catálogos Maestros de Configuración</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Estructuración global de Inventario, Rubros Digitales y Clientes.</p>
                </div>
                <div style={{ display: 'flex', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button onClick={() => setPestanaActiva('inventario')} style={{ padding: '8px 16px', background: pestanaActiva === 'inventario' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>📦 Inventario y Rubros</button>
                    <button onClick={() => setPestanaActiva('clientes')} style={{ padding: '8px 16px', background: pestanaActiva === 'clientes' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>👥 Base de Clientes</button>
                </div>
            </div>

            {/* VISTA 1: CATALOGO DE INVENTARIO */}
            {pestanaActiva === 'inventario' && (
                <>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
                        {/* CATEGORIAS */}
                        <div style={panelEstilo}>
                            <h4 style={{ color: '#a855f7', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaTags /> {editandoCategoria ? 'Modificar' : 'Estructurar'} Categoría</h4>
                            <form onSubmit={guardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input type="text" placeholder="Nombre (Ej: Mandos, Monitores)" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} style={inputEstilo} required />
                                <input type="text" placeholder="URL Imagen Muestra" value={categoriaImagen} onChange={e => setCategoriaImagen(e.target.value)} style={inputEstilo} />
                                <button type="submit" style={{ padding: '8px', background: '#a855f7', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}>{editandoCategoria ? 'Actualizar' : 'Guardar'}</button>
                            </form>
                            <div style={miniListaEstilo}>
                                {categorias.map(c => (
                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px solid #1e293b', fontSize: '0.8rem' }}>
                                        <span>{c.nombre}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span onClick={() => { setEditandoCategoria(c.id); setNuevaCategoria(c.nombre); setCategoriaImagen(c.imagenUrl); }} style={{ color: '#f59e0b', cursor: 'pointer' }}><FaEdit /></span>
                                            <span onClick={() => eliminarCategoria(c.id)} style={{ color: '#ef4444', cursor: 'pointer' }}><FaTrash /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* JUEGOS */}
                        <div style={panelEstilo}>
                            <h4 style={{ color: '#f59e0b', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaGamepad /> {editandoJuego ? 'Modificar' : 'Registrar'} Juego objetivo</h4>
                            <form onSubmit={guardarJuego} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input type="text" placeholder="Nombre del Juego (Ej: Free Fire)" value={nuevoJuego} onChange={e => setNuevoJuego(e.target.value)} style={inputEstilo} required />
                                <input type="text" placeholder="URL Banner / Portada" value={juegoImagen} onChange={e => setJuegoImagen(e.target.value)} style={inputEstilo} />
                                <button type="submit" style={{ padding: '8px', background: '#f59e0b', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }}>{editandoJuego ? 'Actualizar' : 'Guardar'}</button>
                            </form>
                            <div style={miniListaEstilo}>
                                {juegos.map(j => (
                                    <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px solid #1e293b', fontSize: '0.8rem' }}>
                                        <span>{j.nombre}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <span onClick={() => { setEditandoJuego(j.id); setNuevoJuego(j.nombre); setJuegoImagen(j.imagenUrl); }} style={{ color: '#f59e0b', cursor: 'pointer' }}><FaEdit /></span>
                                            <span onClick={() => eliminarJuego(j.id)} style={{ color: '#ef4444', cursor: 'pointer' }}><FaTrash /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FORMULARIO MAESTRO DE PRODUCTOS */}
                    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', boxSizing: 'border-box' }}>
                        <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 700 }}><FaBoxOpen /> Ficha de Asignación de Inventario</h4>
                        <form onSubmit={guardarProducto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Comercial</label>
                                <input type="text" value={prodNombre} onChange={e => setProdNombre(e.target.value)} style={inputEstilo} required />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Costo (C$)</label>
                                        <input type="number" value={prodCosto || ''} onChange={e => setProdCosto(Number(e.target.value))} style={inputEstilo} required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Venta (C$)</label>
                                        <input type="number" value={prodPrecio || ''} onChange={e => setProdPrecio(Number(e.target.value))} style={inputEstilo} required />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Categoría Estructural</label>
                                <select value={catIdSeleccionada} onChange={e => setCatIdSeleccionada(e.target.value)} style={inputEstilo as any} required>
                                    <option value="">-- Seleccionar --</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '14px 0', cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <input type="checkbox" checked={esDigital} onChange={e => setEsDigital(e.target.checked)} /> ¿Es Recarga / Producto Digital?
                                </label>
                                {esDigital ? (
                                    <div>
                                        <select value={juegoIdSeleccionado} onChange={e => setJuegoIdSeleccionado(e.target.value)} style={inputEstilo as any} required>
                                            <option value="">-- Seleccionar Juego Base --</option>
                                            {juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <input type="number" placeholder="Existencias Físicas" value={prodStock || ''} onChange={e => setProdStock(Number(e.target.value))} style={inputEstilo} required />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cargar Foto de Muestra</label>
                                    <input type="file" accept="image/*" onChange={procesarSubidaImagen} style={{ ...inputEstilo, background: '#0f172a' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                    <button type="submit" style={{ flex: 1, padding: '10px', background: editandoProducto ? '#f59e0b' : '#38bdf8', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>{editandoProducto ? 'Actualizar' : 'Insertar'}</button>
                                    {editandoProducto && <button type="button" onClick={limpiarFormularioProducto} style={{ padding: '10px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff' }}><FaTimes /></button>}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* FILTROS VISUALES */}
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <div onClick={() => setCategoriaFiltroActiva(null)} style={{ padding: '6px 14px', background: categoriaFiltroActiva === null ? '#a855f7' : '#1e293b', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}><FaThList /> Todas</div>
                            {categorias.map(c => <div key={c.id} onClick={() => setCategoriaFiltroActiva(c.id)} style={{ padding: '6px 14px', background: categoriaFiltroActiva === c.id ? '#a855f7' : '#1e293b', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{c.nombre}</div>)}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <div onClick={() => setJuegoFiltroActivo(null)} style={{ padding: '6px 14px', background: juegoFiltroActivo === null ? '#f59e0b' : '#1e293b', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: juegoFiltroActivo === null ? '#000' : '#fff', whiteSpace: 'nowrap' }}>⭐ Todos los Títulos</div>
                            {juegos.map(j => <div key={j.id} onClick={() => setJuegoFiltroActivo(j.id)} style={{ padding: '6px 14px', background: juegoFiltroActivo === j.id ? '#f59e0b' : '#1e293b', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', color: juegoFiltroActivo === j.id ? '#000' : '#fff', whiteSpace: 'nowrap' }}>{j.nombre}</div>)}
                        </div>
                    </div>

                    {/* TABLA DE RENDIMIENTO INVENTARIO */}
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', overflowX: 'auto' }}>
                        <input type="text" placeholder="🔍 Filtrar inventario por coincidencia..." value={filtroProd} onChange={e => setFiltroProd(e.target.value)} style={{ ...inputEstilo, marginBottom: '12px', marginTop: 0 }} />
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Foto</th>
                                    <th style={{ padding: '8px' }}>Producto</th>
                                    <th style={{ padding: '8px' }}>Precio</th>
                                    <th style={{ padding: '8px' }}>Existencias</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prodsFiltrados.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '8px' }}>{p.imagenUrl ? <img src={p.imagenUrl} alt="P" style={{ width: '35px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} /> : <FaImage style={{ color: '#475569' }} />}</td>
                                        <td><strong>{p.nombre}</strong><br/><small style={{ color: '#94a3b8' }}>{p.esDigital ? 'Módulo Digital' : 'Físico'}</small></td>
                                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>C$ {p.precioVenta}</td>
                                        <td style={{ color: p.esDigital ? '#4ade80' : '#fff' }}>{p.esDigital ? 'Disponible ∞' : `${p.stockActual} u.`}</td>
                                        <td style={{ padding: '8px', textAlign: 'center' }}><div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}><button onClick={() => editarProducto(p)} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button><button onClick={() => eliminarProducto(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* VISTA 2: GESTIÓN DE CLIENTES */}
            {pestanaActiva === 'clientes' && (
                <>
                    <div style={{ background: '#1e293b', padding: '16px', border: '1px solid #334155', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.85rem' }} />
                            <input type="text" placeholder="Buscar por nombre o móvil..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={{ ...inputEstilo, marginTop: 0, paddingLeft: '32px' }} />
                        </div>
                        <button onClick={abrirModalClienteNuevo} style={{ padding: '10px 16px', background: '#581c7e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}><FaUserPlus /> Registrar Cliente</button>
                    </div>

                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>ID</th>
                                    <th style={{ padding: '10px' }}>Nombre</th>
                                    <th style={{ padding: '10px' }}>Teléfono</th>
                                    <th style={{ padding: '10px' }}>Correo Electrónico</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Club Puntos</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesFiltrados.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#94a3b8' }}>#{c.id}</td>
                                        <td style={{ padding: '10px', fontWeight: 600 }}>{c.nombre}</td>
                                        <td style={{ padding: '10px' }}>{c.telefono}</td>
                                        <td style={{ padding: '10px', color: '#cbd5e1' }}>{c.email}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '2px 6px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', color: '#c084fc', borderRadius: '4px', fontWeight: 'bold' }}>{c.puntosAcumulados} pts</span></td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}><div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}><button onClick={() => abrirModalClienteEditor(c)} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button><button onClick={() => eliminarCliente(c.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* MODAL RESPONSIVO: CREACIÓN Y EDICIÓN DE CLIENTES */}
            {mostrarModalCliente && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', maxWidth: '440px', width: '90%', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.15rem', fontWeight: 700 }}>{editandoClienteId ? <><FaEdit /> Modificar Cliente</> : <><FaUserPlus /> Registrar Perfil</>}</h3>
                            <button onClick={() => setMostrarModalCliente(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Completo</label><input type="text" value={cliNombre} onChange={e => setCliNombre(e.target.value)} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Teléfono Móvil</label><input type="text" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} style={inputEstilo} required /></div>
                            <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Email (Opcional)</label><input type="email" value={cliEmail} onChange={e => setCliEmail(e.target.value)} style={inputEstilo} /></div>
                            {editandoClienteId && <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Puntos Club</label><input type="number" value={cliPuntos} onChange={e => setCliPuntos(Number(e.target.value))} style={inputEstilo} min={0} /></div>}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}><FaSave /> Guardar</button>
                                <button type="button" onClick={() => setMostrarModalCliente(false)} style={{ padding: '12px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ERROR RELACIONAL */}
            {errorModal.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#1e293b', padding: '25px', borderRadius: '12px', maxWidth: '460px', width: '90%', border: '1px solid #ef4444' }}>
                        <div style={{ fontSize: '2.5rem', color: '#ef4444', textAlign: 'center', marginBottom: '8px' }}>⚠️</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.2rem', textAlign: 'center' }}>{errorModal.mensaje}</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '14px', textAlign: 'center' }}>{errorModal.detalles}</p>
                        {errorModal.elementosVinculados.length > 0 && (
                            <div style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #334155' }}>
                                <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Elementos vinculados ({errorModal.elementosVinculados.length}):</span>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {errorModal.elementosVinculados.map((item, idx) => <div key={idx} style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>• {item}</div>)}
                                </div>
                            </div>
                        )}
                        <button onClick={() => setErrorModal({ visible: false, mensaje: '', detalles: '', elementosVinculados: [] })} style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', width: '100%', cursor: 'pointer' }}>Entendido</button>
                    </div>
                </div>
            )}
        </div>
    );
};