import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, FaTimes, FaUserPlus, FaSearch, FaSave, FaTruck, FaShieldAlt, FaCheckCircle, FaTv, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// INTERFACES
interface Producto {
    id: number;
    nombre: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
    esSuscripcion: boolean;
    diasDuracion: number;
    categoriaId: number | null;
    juegoId: number | null;
    garantiaDias: number;
    proveedor: string;
    estado: string;
}

interface PerfilCuenta {
    id: number;
    idProducto: number;
    nombrePerfil: string;
    pin: string;
    correoCuenta: string;
    passwordCuenta: string;
    ocupado: boolean;
    idClienteAsignado: number | null;
    nombreCliente?: string;
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
    
    // Controles de Visibilidad para simplificar la UX
    const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
    const [mostrarEstructurasSecundarias, setMostrarEstructurasSecundarias] = useState(false);

    // ESTADOS GLOBALES DE DATA
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [cargando, setCargando] = useState(true);

    const [perfilEditandoId, setPerfilEditandoId] = useState<number | null>(null);
    const [perfilEditandoDatos, setPerfilEditandoDatos] = useState({ id: 0, idProducto: 0, ExtNombrePerfil: '', pin: '', correoCuenta: '', passwordCuenta: '' });

    const [modoIngreso, setModoIngreso] = useState('individual'); 
    const [cantidadPerfiles, setCantidadPerfiles] = useState(5);

    // GESTIÓN DE PERFILES (UI SUB-PANEL EXPANDIBLE)
    const [productoIdPerfilAbierto, setProductoIdPerfilAbierto] = useState<number | null>(null);
    const [perfilesActuales, setPerfilesActuales] = useState<PerfilCuenta[]>([]);
    
    // FORMULARIO NUEVO PERFIL INDIVIDUAL
    const [perfNombre, setPerfNombre] = useState('');
    const [perfPin, setPerfPin] = useState('');
    const [perfCorreo, setPerfCorreo] = useState('');
    const [perfPassword, setPerfPassword] = useState('');

    // FORMULARIO: PRODUCTOS
    const [editandoProducto, setEditandoProducto] = useState<number | null>(null);
    const [prodNombre, setProdNombre] = useState('');
    const [prodPrecio, setProdPrecio] = useState(0);
    const [prodCosto, setProdCosto] = useState(0);
    const [prodStock, setProdStock] = useState(0);
    const [prodImagenUrl, setProdImagenUrl] = useState('');
    const [esDigital, setEsDigital] = useState(false);
    const [esSuscripcion, setEsSuscripcion] = useState(false);
    const [catIdSeleccionada, setCatIdSeleccionada] = useState('');
    const [juegoIdSeleccionado, setJuegoIdSeleccionado] = useState('');
    const [diasDuracion, setDiasDuracion] = useState(30);
    const [garantiaDias, setGarantiaDias] = useState(30);
    const [proveedor, setProveedor] = useState('');
    const [estadoProd, setEstadoProd] = useState('Activo');

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
    const [listaProveedores, setListaProveedores] = useState<any[]>([]);

    // FILTROS Y BUSQUEDAS
    const [filtroProd, setFiltroProd] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [juegoFiltroActivo, setJuegoFiltroActivo] = useState<number | null>(null);
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);

    // VENTANA MODAL DE ERROR RELACIONAL
    const [errorModal, setErrorModal] = useState<{ visible: boolean; mensaje: string; detalles: string; elementosVinculados: string[] }>({
        visible: false, mensaje: '', detalles: '', elementosVinculados: []
    });

    const cargarSincronizacionMaster = async () => {
        try {
            const [resProd, resCat, resJue, resCli, resProv] = await Promise.all([
                api.get('/products'),
                api.get('/categorias'),
                api.get('/juegos'),
                api.get('/clientes'),
                api.get('/proveedores')
            ]);
            setProductos(resProd.data);
            setCategorias(resCat.data);
            setJuegos(resJue.data);
            setClientes(resCli.data);
            setListaProveedores(resProv.data);
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
    // LÓGICA: GESTIÓN DE PERFILES DE STREAMING
    // ==========================================
    const abrirGestionPerfiles = async (producto: Producto) => {
        if (productoIdPerfilAbierto === producto.id) {
            setProductoIdPerfilAbierto(null);
            setPerfilesActuales([]);
            return;
        }
        setProductoIdPerfilAbierto(producto.id);
        setPerfNombre(`Perfil ${((producto as any).perfilesCount ?? 0) + 1}`);
        setPerfPin('');
        
        try {
            const res = await api.get(`/perfilescuentas/producto/${producto.id}`);
            setPerfilesActuales(res.data);
            if (res.data.length > 0) {
                setPerfCorreo(res.data[0].correoCuenta);
                setPerfPassword(res.data[0].passwordCuenta);
                setPerfNombre(`Perfil ${res.data.length + 1}`);
            } else {
                setPerfCorreo('');
                setPerfPassword('');
            }
        } catch {
            setPerfilesActuales([]);
        }
    };

    const comenzarEdicionPerfil = (perfil: PerfilCuenta) => {
        setPerfilEditandoId(perfil.id);
        setPerfilEditandoDatos({ ...perfil, ExtNombrePerfil: perfil.nombrePerfil });
    };

    const guardarCambiosPerfil = async () => {
        try {
            await api.put(`/perfilescuentas/${perfilEditandoId}`, {
                ...perfilEditandoDatos,
                nombrePerfil: perfilEditandoDatos.ExtNombrePerfil
            });
            setPerfilEditandoId(null);
            alert("Perfil actualizado correctamente.");
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar los datos del perfil.");
        }
    };

    const liberarPerfilCliente = async (idPerfil: number) => {
        if (!window.confirm("¿Está seguro de quitar a esta persona del perfil? La pantalla volverá a quedar disponible para la venta.")) return;
        try {
            const response = await api.put(`/perfilescuentas/${idPerfil}/liberar`);
            alert(response.data.mensaje || "Perfil liberado con éxito.");
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (error) {
            console.error(error);
            alert("Error al liberar el perfil.");
        }
    };

    const agregarPerfilManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoIdPerfilAbierto) return;

        const payload = {
            idProducto: productoIdPerfilAbierto,
            nombrePerfil: perfNombre,
            pin: perfPin || '0000',
            correoCuenta: perfCorreo,
            passwordCuenta: perfPassword,
            ocupado: false,
            idClienteAsignado: null
        };

        try {
            await api.post('/perfilescuentas', payload);
            alert('Pantalla/Perfil inyectado con éxito al pool de la cuenta.');
            setPerfPin('');
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch {
            alert('Error de red al guardar el perfil.');
        }
    };

    const removerPerfilManual = async (idPerfil: number) => {
        if (!window.confirm('¿Desea eliminar de forma permanente esta pantalla del catálogo de accesos?')) return;
        try {
            await api.delete(`/perfilescuentas/${idPerfil}`);
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch {
            alert('Acción denegada por integridad: El perfil está vendido o vinculado a una suscripción.');
        }
    };

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
            stockActual: prodStock,
            stockMinimo: 2,
            imagenUrl: prodImagenUrl || '',
            esDigital,
            esSuscripcion: esDigital ? esSuscripcion : false, 
            diasDuracion: esDigital ? diasDuracion : 0,
            categoriaId: catIdSeleccionada ? Number(catIdSeleccionada) : null,
            juegoId: esDigital && juegoIdSeleccionado ? Number(juegoIdSeleccionado) : null,
            visibleEnCatalogo: true,
            garantiaDias: Number(garantiaDias),
            proveedor: proveedor,
            estado: estadoProd
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
            setMostrarFormularioProducto(false);
            cargarSincronizacionMaster();
        } catch { alert('Error de red al procesar el producto.'); }
    };

    const limpiarFormularioProducto = () => {
        setProdNombre(''); setProdPrecio(0); setProdCosto(0); setProdStock(0);
        setProdImagenUrl(''); setEsDigital(false); setEsSuscripcion(false);
        setCatIdSeleccionada(''); setJuegoIdSeleccionado(''); setEditandoProducto(null);
        setGarantiaDias(30); setProveedor(''); setEstadoProd('Activo'); setDiasDuracion(30);
    };

    const editarProducto = (producto: Producto) => {
        setEditandoProducto(producto.id);
        setProdNombre(producto.nombre);
        setProdPrecio(producto.precioVenta);
        setProdCosto(producto.precioCosto);
        setProdStock(producto.stockActual);
        setProdImagenUrl(producto.imagenUrl);
        setEsDigital(producto.esDigital);
        setEsSuscripcion(producto.esSuscripcion || false);
        setCatIdSeleccionada(producto.categoriaId?.toString() || '');
        setJuegoIdSeleccionado(producto.juegoId?.toString() || '');
        setDiasDuracion(producto.diasDuracion || 30);
        setGarantiaDias(producto.garantiaDias || 0);
        setProveedor(producto.proveedor || '');
        setEstadoProd(producto.estado || 'Activo');
        
        // Forzar scroll y visualización del formulario en edición
        setMostrarFormularioProducto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const agregarCuentaCompletaManual = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productoIdPerfilAbierto) return;

        try {
            const response = await api.post('/perfilescuentas/cuenta-completa', {
                idProducto: productoIdPerfilAbierto, 
                correoCuenta: perfCorreo,
                passwordCuenta: perfPassword,
                cantidadPerfiles: cantidadPerfiles 
            });
            
            alert(response.data.mensaje || "Cuenta autogenerada correctamente.");
            setPerfCorreo('');
            setPerfPassword('');
            setCantidadPerfiles(5);
            
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
        } catch (error) {
            console.error(error);
            alert("Error al auto-generar la cuenta.");
        }
    };

    const eliminarProducto = async (id: number) => {
        if (!window.confirm('¿Desea eliminar el artículo del catálogo?')) return;
        try {
            await api.delete(`/products/${id}`);
            cargarSincronizacionMaster();
        } catch { alert('Acción denegada por restriction de integridad.'); }
    };

    // ==========================================
    // LOGICA CRUD: JUEGOS Y CATEGORÍAS
    // ==========================================
    const guardarJuego = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...(editandoJuego ? { id: editandoJuego } : {}), nombre: nuevoJuego, imagenUrl: juegoImagen || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=256' };
        try {
            if (editandoJuego) await api.put(`/juegos/${editandoJuego}`, payload);
            else await api.post('/juegos', payload);
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
            setErrorModal({ visible: true, mensaje: "Restricción de Integridad en Título", detalles: "Existen artículos activos vinculados a este juego. Reasígnalos primero:", elementosVinculados: err.response?.data?.productos || [] });
        }
    };

    const guardarCategoria = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...(editandoCategoria ? { id: editandoCategoria } : {}), nombre: nuevaCategoria, imagenUrl: categoriaImagen || 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?q=80&w=256' };
        try {
            if (editandoCategoria) await api.put(`/categorias/${editandoCategoria}`, payload);
            else await api.post('/categorias', payload);
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
            setErrorModal({ visible: true, mensaje: "Restricción de Integridad en Categoría", detalles: "Esta categoría cuenta con inventario físico asignado. Modifica los artículos:", elementosVinculados: err.response?.data?.productos || [] });
        }
    };

    // ==========================================
    // LOGICA CRUD: CLIENTES
    // ==========================================
    const abrirModalClienteNuevo = () => { setEditandoClienteId(null); setCliNombre(''); setCliTelefono(''); setCliEmail(''); setCliPuntos(0); setMostrarModalCliente(true); };
    const abrirModalClienteEditor = (c: Cliente) => { setEditandoClienteId(c.id); setCliNombre(c.nombre); setCliTelefono(c.telefono); setCliEmail(c.email); setCliPuntos(c.puntosAcumulados); setMostrarModalCliente(true); };

    const guardarCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { id: editandoClienteId || 0, nombre: cliNombre, telefono: cliTelefono, email: cliEmail || 'taller@nicaplus.com', puntosAcumulados: cliPuntos };
        try {
            if (editandoClienteId) await api.put(`/clientes/${editandoClienteId}`, payload);
            else await api.post('/clientes', payload);
            setMostrarModalCliente(false);
            cargarSincronizacionMaster();
        } catch (err: any) { alert(err.response?.data || "Fallo en la base de datos."); }
    };

    const eliminarCliente = async (idTarget: number) => {
        if (!window.confirm("¿Remover cliente del libro contable?")) return;
        try {
            await api.delete(`/clientes/${idTarget}`);
            cargarSincronizacionMaster();
        } catch (err: any) {
            const errorData = err.response?.data;
            if (errorData && errorData.ventas) {
                const ventasFormateadas = errorData.ventas.map((v: any) => 
                    `ID Venta: #${v.id} | Fecha: ${new Date(v.fecha).toLocaleDateString()} | Total: $${v.total} (${v.metodoPago})`
                );
                setErrorModal({
                    visible: true,
                    mensaje: "Restricción de Integridad en Cliente",
                    detalles: errorData.mensaje || "No se puede eliminar porque tiene ventas registradas.",
                    elementosVinculados: ventasFormateadas
                });
            } else {
                setErrorModal({
                    visible: true,
                    mensaje: "Error del Sistema",
                    detalles: typeof errorData === 'string' ? errorData : "Fallo en la base de datos al procesar la solicitud.",
                    elementosVinculados: []
                });
            }
        }
    };

    const procesarSubidaImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onloadend = () => { if (lector.result) setProdImagenUrl(lector.result.toString()); };
        lector.readAsDataURL(archivo);
    };

    const inputEstilo = { width: '100%', padding: '10px 12px', marginTop: '6px', background: '#0f172a', color: '#ffffff', border: '1px solid #334155', borderRadius: '8px', boxSizing: 'border-box' as const, fontSize: '0.9rem', outline: 'none' };
    const panelEstilo: React.CSSProperties = { flex: '1 1 300px', background: '#1e293b', padding: '18px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' };
    const miniListaEstilo = { maxHeight: '110px', overflowY: 'auto' as const, marginTop: '8px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #233249' };

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Sincronizando registros estructurales...</div>;

    return (
        <div style={{ color: '#fff', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif', boxSizing: 'border-box', width: '100%' }}>
            
            {/* ENCABEZADO Y TABS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.4rem', fontWeight: 700 }}>Catálogos Maestros de Configuración</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.85rem' }}>Estructuración global de Inventario, Rubros Digitales y Streaming.</p>
                </div>
                <div style={{ display: 'flex', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <button onClick={() => setPestanaActiva('inventario')} style={{ padding: '8px 16px', background: pestanaActiva === 'inventario' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>📦 Inventario y Rubros</button>
                    <button onClick={() => setPestanaActiva('clientes')} style={{ padding: '8px 16px', background: pestanaActiva === 'clientes' ? '#581c7e' : 'transparent', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>👥 Base de Clientes</button>
                </div>
            </div>

            {/* VISTA 1: CATALOGO DE INVENTARIO */}
            {pestanaActiva === 'inventario' && (
                <>
                    {/* BARRA DE ACCIÓN PRINCIPAL - FLUJO ENFOCADO */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => {
                                if (mostrarFormularioProducto) limpiarFormularioProducto();
                                setMostrarFormularioProducto(!mostrarFormularioProducto);
                            }} 
                            style={{ padding: '12px 24px', background: mostrarFormularioProducto ? '#475569' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                        >
                            {mostrarFormularioProducto ? <><FaTimes /> Cancelar Registro</> : <><FaPlus /> Registrar Nuevo Producto</>}
                        </button>

                        <button 
                            onClick={() => setMostrarEstructurasSecundarias(!mostrarEstructurasSecundarias)} 
                            style={{ padding: '12px 20px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
                        >
                            <FaTags /> Configurar Categorías y Juegos {mostrarEstructurasSecundarias ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}
                        </button>
                    </div>

                    {/* SECCIÓN COLAPSABLE: CATEGORÍAS Y JUEGOS */}
                    {mostrarEstructurasSecundarias && (
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%', background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px dashed #334155' }}>
                            {/* CATEGORIAS */}
                            <div style={panelEstilo}>
                                <h4 style={{ color: '#a855f7', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaTags /> {editandoCategoria ? 'Modificar' : 'Estructurar'} Categoría</h4>
                                <form onSubmit={guardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input type="text" placeholder="Nombre (Ej: Streaming, Mandos)" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} style={inputEstilo} required />
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
                    )}

                    {/* SECCIÓN COLAPSABLE: FORMULARIO MAESTRO DE PRODUCTO */}
                    {mostrarFormularioProducto && (
                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #38bdf8', boxSizing: 'border-box' }}>
                            <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 700 }}><FaBoxOpen /> {editandoProducto ? 'Modificando Ficha Técnica' : 'Ficha de Asignación de Inventario'}</h4>
                            <form onSubmit={guardarProducto} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                                {/* COLUMNA 1: IDENTIFICACIÓN Y PRECIOS */}
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nombre Comercial</label>
                                    <input type="text" value={prodNombre} onChange={e => setProdNombre(e.target.value)} style={inputEstilo} required />
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Precio Compra (C$)</label>
                                            <input type="number" value={prodCosto || ''} onChange={e => setProdCosto(Number(e.target.value))} style={inputEstilo} required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Precio Venta (C$)</label>
                                            <input type="number" value={prodPrecio || ''} onChange={e => setProdPrecio(Number(e.target.value))} style={inputEstilo} required />
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaTruck /> Proveedor Homologado</label>
                                        <select value={proveedor} onChange={e => setProveedor(e.target.value)} style={inputEstilo as any} required>
                                            <option value="">-- Seleccionar Proveedor --</option>
                                            {listaProveedores.map((prov: any) => (
                                                <option key={prov.id} value={prov.razonSocial}>{prov.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* COLUMNA 2: CATEGORÍA Y CONFIGURACIÓN DIGITAL */}
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Categoría Estructural</label>
                                    <select value={catIdSeleccionada} onChange={e => setCatIdSeleccionada(e.target.value)} style={inputEstilo as any} required>
                                        <option value="">-- Seleccionar --</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaShieldAlt /> Garantía (Días)</label>
                                            <input type="number" min={0} value={garantiaDias} onChange={e => setGarantiaDias(Number(e.target.value))} style={inputEstilo} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}><FaCheckCircle /> Estado</label>
                                            <select value={estadoProd} onChange={e => setEstadoProd(e.target.value)} style={inputEstilo as any}>
                                                <option value="Activo">Activo</option>
                                                <option value="Pausado">Pausado</option>
                                                <option value="Agotado">Agotado</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '12px 0 0 0' }}>
                                        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input type="checkbox" checked={esDigital} onChange={e => {
                                                setEsDigital(e.target.checked);
                                                if(!e.target.checked) {
                                                    setEsSuscripcion(false);
                                                    setJuegoIdSeleccionado('');
                                                }
                                            }} /> ¿Es Recarga / Producto Digital?
                                        </label>
                                        
                                        {esDigital && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0' }}>
                                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: '#f43f5e' }}>
                                                    <input type="checkbox" checked={esSuscripcion} onChange={e => setEsSuscripcion(e.target.checked)} /> 🔄 ¿Es Suscripción Recurrente?
                                                </label>
                                                
                                                {esSuscripcion && (
                                                    <div style={{ paddingLeft: '20px' }}>
                                                        <label style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'block' }}>Días de Vigencia del Servicio</label>
                                                        <input 
                                                            type="number" 
                                                            min={1} 
                                                            value={diasDuracion} 
                                                            onChange={e => setDiasDuracion(Number(e.target.value))} 
                                                            style={{ ...inputEstilo, width: '100%', padding: '6px 10px', marginTop: '2px', borderColor: '#f43f5e' }} 
                                                            placeholder="Ej: 30"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA 3: ASIGNACIÓN DE RELACIONES Y EXISTENCIAS */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    {esDigital ? (
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Juego Asociado (Opcional)</label>
                                            <select value={juegoIdSeleccionado} onChange={e => setJuegoIdSeleccionado(e.target.value)} style={inputEstilo as any}>
                                                <option value="">-- No aplica / Ninguno --</option>
                                                {juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                                            </select>
                                            
                                            <div style={{ marginTop: '10px' }}>
                                                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Existencias Físicas / Cuentas Lote</label>
                                                <input type="number" value={prodStock || ''} onChange={e => setProdStock(Number(e.target.value))} style={inputEstilo} required />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Existencias Físicas</label>
                                            <input type="number" placeholder="Existencias Físicas" value={prodStock || ''} onChange={e => setProdStock(Number(e.target.value))} style={inputEstilo} required />
                                        </div>
                                    )}

                                    {/* Sección de Foto de Muestra */}
                                    <div style={{ marginTop: '6px' }}>
                                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>URL de Imagen o Subir Archivo</label>
                                        {/* Input para URL manual */}
                                        <input 
                                            type="text" 
                                            placeholder="https://ejemplo.com/foto.jpg" 
                                            value={prodImagenUrl} 
                                            onChange={e => setProdImagenUrl(e.target.value)} 
                                            style={inputEstilo} 
                                        />
                                        {/* Input para subir archivo (opcional) */}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={procesarSubidaImagen} 
                                            style={{ ...inputEstilo, background: '#0f172a', marginTop: '6px' }} 
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                        <button type="submit" style={{ flex: 1, padding: '10px', background: editandoProducto ? '#f59e0b' : '#38bdf8', color: '#000', border: 'none', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer' }}>{editandoProducto ? 'Actualizar Ficha' : 'Insertar Producto'}</button>
                                        <button type="button" onClick={() => { limpiarFormularioProducto(); setMostrarFormularioProducto(false); }} style={{ padding: '10px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff' }}><FaTimes /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

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

                    {/* TABLA DE RENDIMIENTO INVENTARIO COMPLETA */}
                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', overflowX: 'auto' }}>
                        <input type="text" placeholder="🔍 Filtrar inventario por coincidencia..." value={filtroProd} onChange={e => setFiltroProd(e.target.value)} style={{ ...inputEstilo, marginBottom: '12px', marginTop: 0 }} />
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Foto</th>
                                    <th style={{ padding: '8px' }}>Producto</th>
                                    <th style={{ padding: '8px' }}>P. Compra</th>
                                    <th style={{ padding: '8px' }}>P. Venta</th>
                                    <th style={{ padding: '8px' }}>Duración</th>
                                    <th style={{ padding: '8px' }}>Garantía</th>
                                    <th style={{ padding: '8px' }}>Proveedor</th>
                                    <th style={{ padding: '8px' }}>Estado</th>
                                    <th style={{ padding: '8px' }}>Stock</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prodsFiltrados.map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr style={{ borderBottom: productoIdPerfilAbierto === p.id ? 'none' : '1px solid #334155' }}>
                                            <td style={{ padding: '8px' }}>{p.imagenUrl ? <img src={p.imagenUrl} alt="P" style={{ width: '35px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} /> : <FaImage style={{ color: '#475569' }} />}</td>
                                            <td style={{ padding: '8px' }}>
                                                <strong>{p.nombre}</strong><br/>
                                                <small style={{ color: '#94a3b8' }}>
                                                    {p.esDigital ? 'Módulo Digital' : 'Físico'}
                                                    {p.esSuscripcion && <span style={{ color: '#f43f5e', marginLeft: '6px', fontWeight: 'bold' }}>[🔄 Recurrente]</span>}
                                                </small>
                                            </td>
                                            <td style={{ color: '#94a3b8', padding: '8px' }}>C$ {p.precioCosto}</td>
                                            <td style={{ color: '#38bdf8', fontWeight: 'bold', padding: '8px' }}>C$ {p.precioVenta}</td>
                                            <td style={{ padding: '8px' }}>{p.esDigital && p.esSuscripcion ? `${p.diasDuracion} días` : 'N/A'}</td>
                                            <td style={{ padding: '8px', color: '#fb923c' }}>{p.garantiaDias} días</td>
                                            <td style={{ padding: '8px', color: '#cbd5e1' }}>{p.proveedor || 'N/A'}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{
                                                    padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                    background: p.estado === 'Pausado' ? 'rgba(245, 158, 11, 0.1)' : p.estado === 'Agotado' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                                                    color: p.estado === 'Pausado' ? '#f59e0b' : p.estado === 'Agotado' ? '#ef4444' : '#4ade80'
                                                }}>{p.estado || 'Activo'}</span>
                                            </td>
                                            <td style={{ color: p.esDigital ? '#4ade80' : '#fff', padding: '8px' }}>{p.stockActual} u.</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                                    {p.esSuscripcion && (
                                                        <button 
                                                            onClick={() => abrirGestionPerfiles(p)} 
                                                            style={{ background: productoIdPerfilAbierto === p.id ? '#475569' : '#047688', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            <FaTv /> Perfiles
                                                        </button>
                                                    )}
                                                    <button onClick={() => editarProducto(p)} style={{ background: '#f59e0b', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Editar</button>
                                                    <button onClick={() => eliminarProducto(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* SUB-PANEL EXPANDIBLE: PERFILES */}
                                        {productoIdPerfilAbierto === p.id && (
                                            <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                                                <td colSpan={10} style={{ padding: '16px' }}>
                                                    <div style={{ borderLeft: '4px solid #047688', paddingLeft: '14px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <h5 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 'bold' }}>Administración de Pantallas Libres / Ocupadas para: {p.nombre}</h5>
                                                            <button onClick={() => setProductoIdPerfilAbierto(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}><FaTimes /> Cerrar Panel</button>
                                                        </div>

                                                        <div style={{ background: '#1e293b', padding: '14px', borderRadius: '8px', border: '1px solid #233249', marginBottom: '14px' }}>
                                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                                <button type="button" onClick={() => setModoIngreso('individual')} style={{ background: modoIngreso === 'individual' ? '#047688' : '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                    👤 Perfil Individual
                                                                </button>
                                                                <button type="button" onClick={() => setModoIngreso('completa')} style={{ background: modoIngreso === 'completa' ? '#047688' : '#334155', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                    📺 Cuenta Completa (5 Perfiles)
                                                                </button>
                                                            </div>

                                                            {modoIngreso === 'individual' ? (
                                                                <form onSubmit={agregarPerfilManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nombre Perfil</label>
                                                                        <input type="text" value={perfNombre} onChange={e => setPerfNombre(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="Ej: Perfil 1" required />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PIN Acceso</label>
                                                                        <input type="text" value={perfPin} onChange={e => setPerfPin(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="Ej: 1234" maxLength={6} />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Correo Cuenta Base</label>
                                                                        <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="user@mail.com" required />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Password Base</label>
                                                                        <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="Clave123" required />
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                                        <button type="submit" style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                                                            <FaPlus /> Cargar Pantalla
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <form onSubmit={agregarCuentaCompletaManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Correo de la Cuenta</label>
                                                                        <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="netflix@completo.com" required />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contraseña de la Cuenta</label>
                                                                        <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} placeholder="PasswordUnico123" required />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cantidad de Perfiles</label>
                                                                        <input type="number" value={cantidadPerfiles} onChange={e => setCantidadPerfiles(Number(e.target.value))} style={{ ...inputEstilo, marginTop: '2px', padding: '6px 10px' }} min={1} max={10} />
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                                        <button type="submit" style={{ width: '100%', padding: '8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                                                            <FaTv /> Auto-generar Cuenta
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                                            {perfilesActuales.map((perfil) => {
                                                                const esEditando = perfilEditandoId === perfil.id;

                                                                return (
                                                                    <div key={perfil.id} style={{ background: perfil.ocupado ? '#2d1e24' : '#142820', border: '1px solid', borderColor: perfil.ocupado ? '#ef4444' : '#10b981', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                {esEditando ? (
                                                                                    <input type="text" value={perfilEditandoDatos.ExtNombrePerfil} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', width: '90px' }} />
                                                                                ) : (
                                                                                    <strong style={{ fontSize: '0.85rem' }}>{perfil.nombrePerfil}</strong>
                                                                                )}
                                                                                <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', background: perfil.ocupado ? '#ef4444' : '#10b981', fontWeight: 'bold', color: '#fff' }}>
                                                                                    {perfil.ocupado ? "Ocupado" : "Libre"}
                                                                                </span>
                                                                            </div>
                                                                            {!perfil.ocupado && !esEditando && (
                                                                                <button onClick={() => removerPerfilManual(perfil.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Eliminar Perfil por completo">
                                                                                    <FaTrash size={12} />
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                                                            <div style={{ marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                ✉️ {perfil.correoCuenta}
                                                                            </div>
                                                                            <div>
                                                                                🔑 PIN: {esEditando ? (
                                                                                    <input type="text" value={perfilEditandoDatos.pin} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} style={{ background: '#0f172a', border: '1px solid #fb923c', color: '#fb923c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', width: '60px', fontWeight: 'bold' }} maxLength={6} />
                                                                                ) : (
                                                                                    <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{perfil.pin || 'Sin PIN'}</span>
                                                                                )}
                                                                            </div>

                                                                            {perfil.ocupado && (
                                                                                <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '6px', fontWeight: '500', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                    <span>👤 Cliente: {perfil.nombreCliente || `ID: ${perfil.idClienteAsignado}`}</span>
                                                                                    <button onClick={() => liberarPerfilCliente(perfil.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                                        Quitar Persona
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                            {esEditando ? (
                                                                                <>
                                                                                    <button onClick={guardarCambiosPerfil} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Guardar</button>
                                                                                    <button onClick={() => setPerfilEditandoId(null)} style={{ background: '#475569', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>Cancelar</button>
                                                                                </>
                                                                            ) : (
                                                                                <button onClick={() => comenzarEdicionPerfil(perfil)} style={{ background: '#f59e0b', color: '#000', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                                                    Editar PIN / Info
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {perfilesActuales.length === 0 && (
                                                                <small style={{ color: '#64748b', fontStyle: 'italic', padding: '4px' }}>No hay perfiles configurados. Ingrese los datos arriba.</small>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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
                        <button onClick={() => abrirModalClienteNuevo()} style={{ padding: '10px 16px', background: '#581c7e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}><FaUserPlus /> Registrar Cliente</button>
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

            {/* MODAL RESPONSIVO: CLIENTES */}
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
                                <button type="submit" style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}><FaSave /> Guardar</button>
                                <button type="button" onClick={() => setMostrarModalCliente(false)} style={{ padding: '12px', background: '#475569', border: 'none', borderRadius: '6px', color: '#fff' }}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ERROR RELACIONAL */}
            {errorModal.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '12px', maxWidth: '550px', width: '100%', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <h4 style={{ color: '#ef4444', margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTimes /> {errorModal.mensaje}
                            </h4>
                            <button onClick={() => setErrorModal({ visible: false, mensaje: '', detalles: '', elementosVinculados: [] })} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
                        </div>
                        
                        <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>{errorModal.detalles}</p>
                        
                        {errorModal.elementosVinculados.length > 0 && (
                            <>
                                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Ventas que bloquean la eliminación:</label>
                                <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {errorModal.elementosVinculados.map((item, idx) => (
                                        <div key={idx} style={{ color: '#f8fafc', fontSize: '0.8rem', padding: '6px 8px', background: '#1e293b', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setErrorModal({ visible: false, mensaje: '', detalles: '', elementosVinculados: [] })} style={{ padding: '8px 18px', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}> Entendido </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};