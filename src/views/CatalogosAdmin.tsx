import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, FaTimes, FaUserPlus, FaSearch, FaSave, FaTruck, FaShieldAlt, FaCheckCircle, FaTv, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
// IMPORTACIÓN DE ESTILOS MODULARES
import styles from '../assets/styles/CatalogosAdmin.module.css';

// INTERFACES
interface Producto {
    id: number;
    nombre: string;
    descripcion: string; // <-- Corregido/Asegurado en interfaz
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

    // FORMULARIO: PRODUCTOS (Se añade prodDescripcion)
    const [editandoProducto, setEditandoProducto] = useState<number | null>(null);
    const [prodNombre, setProdNombre] = useState('');
    const [prodDescripcion, setProdDescripcion] = useState(''); // <-- NUEVO ESTADO
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
    // LOGICA CRUD: PRODUCTOS (Se mapea prodDescripcion)
    // ==========================================
    const guardarProducto = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoProducto ? { id: editandoProducto } : {}), 
            nombre: prodNombre,
            descripcion: prodDescripcion || 'Sin descripción detallada', // <-- USANDO EL ESTADO DINÁMICO
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
        setProdNombre(''); setProdDescripcion(''); setProdPrecio(0); setProdCosto(0); setProdStock(0);
        setProdImagenUrl(''); setEsDigital(false); setEsSuscripcion(false);
        setCatIdSeleccionada(''); setJuegoIdSeleccionado(''); setEditandoProducto(null);
        setGarantiaDias(30); setProveedor(''); setEstadoProd('Activo'); setDiasDuracion(30);
    };

    const editarProducto = (producto: Producto) => {
        setEditandoProducto(producto.id);
        setProdNombre(producto.nombre);
        setProdDescripcion(producto.descripcion || ''); // <-- CARGAR DESCRIPCION
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

    if (cargando) return <div style={{ color: '#38bdf8', padding: '30px', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Sincronizando registros estructurales...</div>;

    return (
        <div className={styles.container}>
            
            {/* ENCABEZADO Y TABS */}
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Catálogos Maestros de Configuración</h3>
                    <p className={styles.subtitle}>Estructuración global de Inventario, Rubros Digitales y Streaming.</p>
                </div>
                <div className={styles.tabContainer}>
                    <button 
                        onClick={() => setPestanaActiva('inventario')} 
                        className={`${styles.tabButton} ${pestanaActiva === 'inventario' ? styles.tabButtonActive : ''}`}
                    >
                        📦 Inventario y Rubros
                    </button>
                    <button 
                        onClick={() => setPestanaActiva('clientes')} 
                        className={`${styles.tabButton} ${pestanaActiva === 'clientes' ? styles.tabButtonActive : ''}`}
                    >
                        👥 Base de Clientes
                    </button>
                </div>
            </div>

            {/* VISTA 1: CATALOGO DE INVENTARIO */}
            {pestanaActiva === 'inventario' && (
                <>
                    {/* BARRA DE ACCIÓN PRINCIPAL - FLUJO ENFOCADO */}
                    <div className={styles.actionRow}>
                        <button 
                            onClick={() => {
                                if (mostrarFormularioProducto) limpiarFormularioProducto();
                                setMostrarFormularioProducto(!mostrarFormularioProducto);
                            }} 
                            className={`${styles.btn} ${mostrarFormularioProducto ? styles.btnSecondary : styles.btnPrimary}`}
                        >
                            {mostrarFormularioProducto ? <><FaTimes /> Cancelar Registro</> : <><FaPlus /> Registrar Nuevo Producto</>}
                        </button>

                        <button 
                            onClick={() => setMostrarEstructurasSecundarias(!mostrarEstructurasSecundarias)} 
                            className={`${styles.btn} ${styles.btnSecondary}`}
                        >
                            <FaTags /> Configurar Categorías y Juegos {mostrarEstructurasSecundarias ? <FaChevronUp size={12}/> : <FaChevronDown size={12}/>}
                        </button>
                    </div>

                    {/* SECCIÓN COLAPSABLE: CATEGORÍAS Y JUEGOS */}
                    {mostrarEstructurasSecundarias && (
                        <div className={styles.panelSubSections}>
                            {/* CATEGORIAS */}
                            <div className={styles.panelSub}>
                                <h4 style={{ color: '#a855f7', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaTags /> {editandoCategoria ? 'Modificar' : 'Estructurar'} Categoría</h4>
                                <form onSubmit={guardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input type="text" placeholder="Nombre (Ej: Streaming, Mandos)" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} className={styles.input} required />
                                    <input type="text" placeholder="URL Imagen Muestra" value={categoriaImagen} onChange={e => setCategoriaImagen(e.target.value)} className={styles.input} />
                                    <button type="submit" className={`${styles.btn}`} style={{ background: '#a855f7', color: '#fff', padding: '8px', justifyContent: 'center', width: '100%' }}>{editandoCategoria ? 'Actualizar' : 'Guardar'}</button>
                                </form>
                                <div className={styles.miniList}>
                                    {categorias.map(c => (
                                        <div key={c.id} className={styles.miniListItem}>
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
                            <div className={styles.panelSub}>
                                <h4 style={{ color: '#f59e0b', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaGamepad /> {editandoJuego ? 'Modificar' : 'Registrar'} Juego objetivo</h4>
                                <form onSubmit={guardarJuego} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <input type="text" placeholder="Nombre del Juego (Ej: Free Fire)" value={nuevoJuego} onChange={e => setNuevoJuego(e.target.value)} className={styles.input} required />
                                    <input type="text" placeholder="URL Banner / Portada" value={juegoImagen} onChange={e => setJuegoImagen(e.target.value)} className={styles.input} />
                                    <button type="submit" className={`${styles.btn}`} style={{ background: '#f59e0b', color: '#000', padding: '8px', justifyContent: 'center', width: '100%' }}>{editandoJuego ? 'Actualizar' : 'Guardar'}</button>
                                </form>
                                <div className={styles.miniList}>
                                    {juegos.map(j => (
                                        <div key={j.id} className={styles.miniListItem}>
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
                        <div className={styles.panel} style={{ borderColor: '#38bdf8' }}>
                            <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 700 }}><FaBoxOpen /> {editandoProducto ? 'Modificando Ficha Técnica' : 'Ficha de Asignación de Inventario'}</h4>
                            <form onSubmit={guardarProducto} className={styles.formGrid}>
                                {/* COLUMNA 1: IDENTIFICACIÓN, PRECIOS Y DESCRIPCIÓN */}
                                <div className={styles.formGroup}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nombre Comercial</label>
                                        <input type="text" value={prodNombre} onChange={e => setProdNombre(e.target.value)} className={styles.input} required />
                                    </div>

                                    {/* NUEVO CAMPO: DESCRIPCIÓN DEL PRODUCTO */}
                                    <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                                        <label className={styles.label}>Descripción / Notas</label>
                                        <textarea 
                                            value={prodDescripcion} 
                                            onChange={e => setProdDescripcion(e.target.value)} 
                                            placeholder="Detalla las características del producto, reglas de cuentas o especificaciones físicas..."
                                            className={styles.textarea}
                                        />
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.label}>Precio Compra (C$)</label>
                                            <input type="number" value={prodCosto || ''} onChange={e => setProdCosto(Number(e.target.value))} className={styles.input} required />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.label}>Precio Venta (C$)</label>
                                            <input type="number" value={prodPrecio || ''} onChange={e => setProdPrecio(Number(e.target.value))} className={styles.input} required />
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMNA 2: CATEGORÍA Y CONFIGURACIÓN DIGITAL */}
                                <div className={styles.formGroup}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Categoría Estructural</label>
                                        <select value={catIdSeleccionada} onChange={e => setCatIdSeleccionada(e.target.value)} className={styles.select} required>
                                            <option value="">-- Seleccionar --</option>
                                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ marginTop: '10px' }}>
                                        <label className={styles.label}><FaTruck /> Proveedor Homologado</label>
                                        <select value={proveedor} onChange={e => setProveedor(e.target.value)} className={styles.select} required>
                                            <option value="">-- Seleccionar Proveedor --</option>
                                            {listaProveedores.map((prov: any) => (
                                                <option key={prov.id} value={prov.razonSocial}>{prov.razonSocial}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.label}><FaShieldAlt /> Garantía (Días)</label>
                                            <input type="number" min={0} value={garantiaDias} onChange={e => setGarantiaDias(Number(e.target.value))} className={styles.input} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className={styles.label}><FaCheckCircle /> Estado</label>
                                            <select value={estadoProd} onChange={e => setEstadoProd(e.target.value)} className={styles.select}>
                                                <option value="Activo">Activo</option>
                                                <option value="Pausado">Pausado</option>
                                                <option value="Agotado">Agotado</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '12px 0 0 0' }}>
                                        <label className={styles.checkboxLabel}>
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
                                                <label className={styles.checkboxLabel} style={{ color: '#f43f5e' }}>
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
                                                            className={styles.input}
                                                            style={{ borderColor: '#f43f5e', padding: '6px 10px' }} 
                                                            placeholder="Ej: 30"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLUMNA 3: ASIGNACIÓN DE RELACIONES Y EXISTENCIAS */}
                                <div className={styles.formGroup} style={{ justifyContent: 'space-between' }}>
                                    {esDigital ? (
                                        <div>
                                            <label className={styles.label}>Juego Asociado (Opcional)</label>
                                            <select value={juegoIdSeleccionado} onChange={e => setJuegoIdSeleccionado(e.target.value)} className={styles.select}>
                                                <option value="">-- No aplica / Ninguno --</option>
                                                {juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                                            </select>
                                            
                                            <div style={{ marginTop: '10px' }}>
                                                <label className={styles.label}>Existencias Físicas / Cuentas Lote</label>
                                                <input type="number" value={prodStock || ''} onChange={e => setProdStock(Number(e.target.value))} className={styles.input} required />
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className={styles.label}>Existencias Físicas</label>
                                            <input type="number" placeholder="Existencias Físicas" value={prodStock || ''} onChange={e => setProdStock(Number(e.target.value))} className={styles.input} required />
                                        </div>
                                    )}

                                    {/* Sección de Foto de Muestra */}
                                    <div style={{ marginTop: '6px' }}>
                                        <label className={styles.label}>URL de Imagen o Subir Archivo</label>
                                        <input 
                                            type="text" 
                                            placeholder="https://ejemplo.com/foto.jpg" 
                                            value={prodImagenUrl} 
                                            onChange={e => setProdImagenUrl(e.target.value)} 
                                            className={styles.input} 
                                        />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={procesarSubidaImagen} 
                                            className={styles.input} 
                                            style={{ marginTop: '6px' }} 
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                        <button type="submit" className={`${styles.btn} ${editandoProducto ? styles.btnWarning : styles.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }}>{editandoProducto ? 'Actualizar Ficha' : 'Insertar Producto'}</button>
                                        <button type="button" onClick={() => { limpiarFormularioProducto(); setMostrarFormularioProducto(false); }} className={`${styles.btn} ${styles.btnSecondary}`}><FaTimes /></button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* FILTROS VISUALES */}
                    <div className={styles.filterCard}>
                        <div className={styles.scrollRow}>
                            <div onClick={() => setCategoriaFiltroActiva(null)} className={`${styles.pill} ${categoriaFiltroActiva === null ? styles.pillActivePurple : ''}`}><FaThList /> Todas</div>
                            {categorias.map(c => <div key={c.id} onClick={() => setCategoriaFiltroActiva(c.id)} className={`${styles.pill} ${categoriaFiltroActiva === c.id ? styles.pillActivePurple : ''}`}>{c.nombre}</div>)}
                        </div>
                        <div className={styles.scrollRow}>
                            <div onClick={() => setJuegoFiltroActivo(null)} className={`${styles.pill} ${juegoFiltroActivo === null ? styles.pillActiveAmber : ''}`}>⭐ Todos los Títulos</div>
                            {juegos.map(j => <div key={j.id} onClick={() => setJuegoFiltroActivo(j.id)} className={`${styles.pill} ${juegoFiltroActivo === j.id ? styles.pillActiveAmber : ''}`}>{j.nombre}</div>)}
                        </div>
                    </div>

                    {/* TABLA DE RENDIMIENTO INVENTARIO COMPLETA */}
                    <div className={styles.tableWrapper}>
                        <input type="text" placeholder="🔍 Filtrar inventario por coincidencia..." value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className={styles.input} style={{ marginBottom: '12px' }} />
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Foto</th>
                                    <th>Producto</th>
                                    <th>P. Compra</th>
                                    <th>P. Venta</th>
                                    <th>Duración</th>
                                    <th>Garantía</th>
                                    <th>Proveedor</th>
                                    <th>Estado</th>
                                    <th>Stock</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prodsFiltrados.map(p => (
                                    <React.Fragment key={p.id}>
                                        <tr style={{ borderBottom: productoIdPerfilAbierto === p.id ? 'none' : '' }}>
                                            <td>{p.imagenUrl ? <img src={p.imagenUrl} alt="P" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }} /> : <FaImage style={{ color: '#475569', fontSize: '1.2rem' }} />}</td>
                                            <td>
                                                <strong>{p.nombre}</strong><br/>
                                                <small style={{ color: '#94a3b8' }}>
                                                    {p.descripcion ? (p.descripcion.length > 50 ? `${p.descripcion.substring(0, 50)}...` : p.descripcion) : 'Sin descripción'}<br/>
                                                    <span style={{ color: '#0ea5e9' }}>{p.esDigital ? 'Módulo Digital' : 'Físico'}</span>
                                                    {p.esSuscripcion && <span style={{ color: '#f43f5e', marginLeft: '6px', fontWeight: 'bold' }}>[🔄 Recurrente]</span>}
                                                </small>
                                            </td>
                                            <td style={{ color: '#94a3b8' }}>C$ {p.precioCosto}</td>
                                            <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>C$ {p.precioVenta}</td>
                                            <td>{p.esDigital && p.esSuscripcion ? `${p.diasDuracion} días` : 'N/A'}</td>
                                            <td style={{ color: '#fb923c' }}>{p.garantiaDias} días</td>
                                            <td style={{ color: '#cbd5e1' }}>{p.proveedor || 'N/A'}</td>
                                            <td>
                                                <span className={styles.badge} style={{
                                                    background: p.estado === 'Pausado' ? 'rgba(245, 158, 11, 0.15)' : p.estado === 'Agotado' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                                                    color: p.estado === 'Pausado' ? '#f59e0b' : p.estado === 'Agotado' ? '#ef4444' : '#4ade80'
                                                }}>{p.estado || 'Activo'}</span>
                                            </td>
                                            <td style={{ color: p.esDigital ? '#4ade80' : '#fff', fontWeight: '600' }}>{p.stockActual} u.</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                                    {p.esSuscripcion && (
                                                        <button 
                                                            onClick={() => abrirGestionPerfiles(p)} 
                                                            className={styles.btn}
                                                            style={{ background: productoIdPerfilAbierto === p.id ? '#475569' : '#047688', color: '#fff', padding: '6px 10px', borderRadius: '4px' }}
                                                        >
                                                            <FaTv /> Perfiles
                                                        </button>
                                                    )}
                                                    <button onClick={() => editarProducto(p)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '6px 10px', borderRadius: '4px' }}>Editar</button>
                                                    <button onClick={() => eliminarProducto(p.id)} className={`${styles.btn} ${styles.btnDanger}`} style={{ padding: '6px 10px', borderRadius: '4px' }}>Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* SUB-PANEL EXPANDIBLE: PERFILES */}
                                        {productoIdPerfilAbierto === p.id && (
                                            <tr style={{ background: '#0f172a' }}>
                                                <td colSpan={10} style={{ padding: '16px' }}>
                                                    <div style={{ borderLeft: '4px solid #047688', paddingLeft: '14px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                            <h5 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 'bold' }}>Administración de Pantallas Libres / Ocupadas para: {p.nombre}</h5>
                                                            <button onClick={() => setProductoIdPerfilAbierto(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}><FaTimes /> Cerrar Panel</button>
                                                        </div>

                                                        <div className={styles.panel} style={{ background: '#1e293b', border: '1px solid #233249', marginBottom: '14px', padding: '14px' }}>
                                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                                <button type="button" onClick={() => setModoIngreso('individual')} className={styles.btn} style={{ background: modoIngreso === 'individual' ? '#047688' : '#334155', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}>
                                                                    👤 Perfil Individual
                                                                </button>
                                                                <button type="button" onClick={() => setModoIngreso('completa')} className={styles.btn} style={{ background: modoIngreso === 'completa' ? '#047688' : '#334155', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}>
                                                                    📺 Cuenta Completa (5 Perfiles)
                                                                </button>
                                                            </div>

                                                            {modoIngreso === 'individual' ? (
                                                                <form onSubmit={agregarPerfilManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                                                    <div>
                                                                        <label className={styles.label}>Nombre Perfil</label>
                                                                        <input type="text" value={perfNombre} onChange={e => setPerfNombre(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="Ej: Perfil 1" required />
                                                                    </div>
                                                                    <div>
                                                                        <label className={styles.label}>PIN Acceso</label>
                                                                        <input type="text" value={perfPin} onChange={e => setPerfPin(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="Ej: 1234" maxLength={6} />
                                                                    </div>
                                                                    <div>
                                                                        <label className={styles.label}>Correo Cuenta Base</label>
                                                                        <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="user@mail.com" required />
                                                                    </div>
                                                                    <div>
                                                                        <label className={styles.label}>Password Base</label>
                                                                        <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="Clave123" required />
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ width: '100%', padding: '8px', justifyContent: 'center', fontSize: '0.8rem' }}>
                                                                            <FaPlus /> Cargar Pantalla
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <form onSubmit={agregarCuentaCompletaManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                                                    <div>
                                                                        <label className={styles.label}>Correo de la Cuenta</label>
                                                                        <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="netflix@completo.com" required />
                                                                    </div>
                                                                    <div>
                                                                        <label className={styles.label}>Contraseña de la Cuenta</label>
                                                                        <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} style={{ padding: '6px 10px' }} placeholder="PasswordUnico123" required />
                                                                    </div>
                                                                    <div>
                                                                        <label className={styles.label}>Cantidad de Perfiles</label>
                                                                        <input type="number" value={cantidadPerfiles} onChange={e => setCantidadPerfiles(Number(e.target.value))} className={styles.input} style={{ padding: '6px 10px' }} min={1} max={10} />
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                                        <button type="submit" className={styles.btn} style={{ background: '#6366f1', color: '#fff', width: '100%', padding: '8px', justifyContent: 'center', fontSize: '0.8rem' }}>
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
                                                                                    <input type="text" value={perfilEditandoDatos.ExtNombrePerfil} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} className={styles.input} style={{ padding: '2px 6px', fontSize: '0.8rem', width: '90px' }} />
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
                                                                                    <input type="text" value={perfilEditandoDatos.pin} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} className={styles.input} style={{ padding: '2px 6px', fontSize: '0.8rem', width: '60px', fontWeight: 'bold', borderColor: '#fb923c', color: '#fb923c' }} maxLength={6} />
                                                                                ) : (
                                                                                    <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{perfil.pin || 'Sin PIN'}</span>
                                                                                )}
                                                                            </div>

                                                                            {perfil.ocupado && (
                                                                                <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '6px', fontWeight: '500', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                    <span>👤 Cliente: {perfil.nombreCliente || `ID: ${perfil.idClienteAsignado}`}</span>
                                                                                    <button onClick={() => liberarPerfilCliente(perfil.id)} className={styles.btn} style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', fontSize: '0.75rem', borderRadius: '4px' }}>
                                                                                        Quitar Persona
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                            {esEditando ? (
                                                                                <>
                                                                                    <button onClick={guardarCambiosPerfil} className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Guardar</button>
                                                                                    <button onClick={() => setPerfilEditandoId(null)} className={`${styles.btn} ${styles.btnSecondary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Cancelar</button>
                                                                                </>
                                                                            ) : (
                                                                                <button onClick={() => comenzarEdicionPerfil(perfil)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>
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
                    <div className={styles.panel} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                            <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.85rem' }} />
                            <input type="text" placeholder="Buscar por nombre o móvil..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className={styles.input} style={{ paddingLeft: '32px' }} />
                        </div>
                        <button onClick={() => abrirModalClienteNuevo()} className={styles.btn} style={{ background: '#581c7e', color: '#fff' }}><FaUserPlus /> Registrar Cliente</button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>Correo Electrónico</th>
                                    <th style={{ textAlign: 'center' }}>Club Puntos</th>
                                    <th style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesFiltrados.map(c => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>#{c.id}</td>
                                        <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                                        <td>{c.telefono}</td>
                                        <td style={{ color: '#cbd5e1' }}>{c.email}</td>
                                        <td style={{ textAlign: 'center' }}><span style={{ padding: '2px 6px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', color: '#c084fc', borderRadius: '4px', fontWeight: 'bold' }}>{c.puntosAcumulados} pts</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button onClick={() => abrirModalClienteEditor(c)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '4px 8px', borderRadius: '4px' }}>Editar</button>
                                                <button onClick={() => eliminarCliente(c.id)} className={`${styles.btn} ${styles.btnDanger}`} style={{ padding: '4px 8px', borderRadius: '4px' }}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* MODAL RESPONSIVO: CLIENTES */}
            {mostrarModalCliente && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.15rem', fontWeight: 700 }}>{editandoClienteId ? <><FaEdit /> Modificar Cliente</> : <><FaUserPlus /> Registrar Perfil</>}</h3>
                            <button onClick={() => setMostrarModalCliente(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className={styles.formGroup}><label className={styles.label}>Nombre Completo</label><input type="text" value={cliNombre} onChange={e => setCliNombre(e.target.value)} className={styles.input} required /></div>
                            <div className={styles.formGroup}><label className={styles.label}>Teléfono Móvil</label><input type="text" value={cliTelefono} onChange={e => setCliTelefono(e.target.value)} className={styles.input} required /></div>
                            <div className={styles.formGroup}><label className={styles.label}>Email (Opcional)</label><input type="email" value={cliEmail} onChange={e => setCliEmail(e.target.value)} className={styles.input} /></div>
                            {editandoClienteId && <div className={styles.formGroup}><label className={styles.label}>Puntos Club</label><input type="number" value={cliPuntos} onChange={e => setCliPuntos(Number(e.target.value))} className={styles.input} min={0} /></div>}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }}><FaSave /> Guardar</button>
                                <button type="button" onClick={() => setMostrarModalCliente(false)} className={`${styles.btn} ${styles.btnSecondary}`}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE ERROR RELACIONAL */}
            {errorModal.visible && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ borderColor: '#ef4444', maxWidth: '550px' }}>
                        <div className={styles.modalHeader}>
                            <h4 style={{ color: '#ef4444', margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTimes /> {errorModal.mensaje}
                            </h4>
                            <button onClick={() => setErrorModal({ visible: false, mensaje: '', detalles: '', elementosVinculados: [] })} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}><FaTimes /></button>
                        </div>
                        
                        <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>{errorModal.detalles}</p>
                        
                        {errorModal.elementosVinculados.length > 0 && (
                            <>
                                <label className={styles.label} style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Ventas que bloquean la eliminación:</label>
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
                            <button onClick={() => setErrorModal({ visible: false, mensaje: '', detalles: '', elementosVinculados: [] })} className={`${styles.btn} ${styles.btnSecondary}`}> Entendido </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};