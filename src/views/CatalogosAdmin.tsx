// CatalogosAdmin.tsx
import React, { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { 
    FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, 
    FaTimes, FaPlus, FaChevronDown, FaChevronUp, FaTruck, FaShieldAlt, 
    FaCheckCircle, FaTv
} from 'react-icons/fa';
import styles from '../assets/styles/CatalogosAdmin.module.css';

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
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
    perfilesCount?: number;
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
interface Proveedor { id: number; razonSocial: string; }

const productoFormInicial = {
    nombre: '',
    descripcion: '',
    precioVenta: 0,
    precioCosto: 0,
    stockActual: 0,
    imagenUrl: '',
    esDigital: false,
    esSuscripcion: false,
    categoriaId: '',
    juegoId: '',
    diasDuracion: 30,
    garantiaDias: 30,
    proveedor: '',
    estado: 'Activo'
};

export const CatalogosAdmin: React.FC = () => {
    const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);
    const [mostrarEstructurasSecundarias, setMostrarEstructurasSecundarias] = useState(false);

    // DATOS DE APIS
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [juegos, setJuegos] = useState<Juego[]>([]);
    const [listaProveedores, setListaProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO UNIFICADO DE PRODUCTOS
    const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);
    const [formProducto, setFormProducto] = useState(productoFormInicial);

    // GESTIÓN DE PERFILES Y CUENTAS BATCH
    const [productoIdPerfilAbierto, setProductoIdPerfilAbierto] = useState<number | null>(null);
    const [perfilesActuales, setPerfilesActuales] = useState<PerfilCuenta[]>([]);
    const [perfilEditandoId, setPerfilEditandoId] = useState<number | null>(null);
    const [perfilEditandoDatos, setPerfilEditandoDatos] = useState({ id: 0, idProducto: 0, ExtNombrePerfil: '', pin: '', correoCuenta: '', passwordCuenta: '' });
    
    const [modoIngreso, setModoIngreso] = useState('individual'); 
    const [cantidadPerfiles, setCantidadPerfiles] = useState(5);
    const [perfNombre, setPerfNombre] = useState('');
    const [perfPin, setPerfPin] = useState('');
    const [perfCorreo, setPerfCorreo] = useState('');
    const [perfPassword, setPerfPassword] = useState('');

    // ESTRUCTURAS AUXILIARES (JUEGOS / CATEGORIAS)
    const [editandoJuego, setEditandoJuego] = useState<number | null>(null);
    const [nuevoJuego, setNuevoJuego] = useState('');
    const [juegoImagen, setJuegoImagen] = useState('');
    const [editandoCategoria, setEditandoCategoria] = useState<number | null>(null);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [categoriaImagen, setCategoriaImagen] = useState('');
    
    // QUERIES DE FILTROS
    const [filtroProd, setFiltroProd] = useState('');
    const [juegoFiltroActivo, setJuegoFiltroActivo] = useState<number | null>(null);
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);

    // MODAL CONTROLADO DE EXCEPCIONES Y ADVERTENCIAS
    const [errorModal, setErrorModal] = useState({
        visible: false, mensaje: '', detalles: '', elementosVinculados: [] as string[]
    });

    const dispararErrorVisual = (mensaje: string, detalles: string, vinculados: string[] = []) => {
        setErrorModal({ visible: true, mensaje, detalles, elementosVinculados: vinculados });
    };

    const cargarSincronizacionMaster = async () => {
        try {
            const [resProd, resCat, resJue, resProv] = await Promise.all([
                api.get('/products'),
                api.get('/categorias'),
                api.get('/juegos'),
                api.get('/proveedores')
            ]);
            setProductos(resProd.data);
            setCategorias(resCat.data);
            setJuegos(resJue.data);
            setListaProveedores(resProv.data);
        } catch (err) { 
            console.error("Error al sincronizar catálogos:", err); 
            dispararErrorVisual("Error de Red", "No se pudo sincronizar la información del servidor central.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarSincronizacionMaster(); }, []);

    const prodsFiltrados = productos.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(filtroProd.toLowerCase());
        const coincideJuego = juegoFiltroActivo ? p.juegoId === juegoFiltroActivo : true;
        const coincideCategoria = categoriaFiltroActiva ? p.categoriaId === categoriaFiltroActiva : true;
        return coincideTexto && coincideJuego && coincideCategoria;
    });

    const handleProductoInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const valorFinal = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormProducto(prev => {
            const nuevoEstado = { ...prev, [name]: valorFinal };
            if (name === 'esDigital' && !valorFinal) {
                nuevoEstado.esSuscripcion = false;
                nuevoEstado.juegoId = '';
            }
            return nuevoEstado;
        });
    };

    // POOL DE OPERACIONES: PERFILES
    const abrirGestionPerfiles = async (producto: Producto) => {
        if (productoIdPerfilAbierto === producto.id) {
            setProductoIdPerfilAbierto(null);
            setPerfilesActuales([]);
            return;
        }
        setProductoIdPerfilAbierto(producto.id);
        setPerfNombre(`Perfil ${(producto.perfilesCount ?? 0) + 1}`);
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
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch {
            dispararErrorVisual("Error de Envío", "Hubo problemas al guardar el PIN o datos del perfil.");
        }
    };

    const liberarPerfilCliente = async (idPerfil: number) => {
        if (!window.confirm("¿Quitar cliente asignado? La pantalla quedará disponible en caja inmediata.")) return;
        try {
            await api.put(`/perfilescuentas/${idPerfil}/liberar`);
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch {
            dispararErrorVisual("Error Operacional", "No se logró desvincular al cliente de la pantalla.");
        }
    };

    const agregarPerfilManual = async (e: FormEvent) => {
        e.preventDefault();
        if (!productoIdPerfilAbierto) return;

        try {
            await api.post('/perfilescuentas', {
                idProducto: productoIdPerfilAbierto,
                nombrePerfil: perfNombre,
                pin: perfPin || '0000',
                correoCuenta: perfCorreo,
                passwordCuenta: perfPassword,
                ocupado: false,
                idClienteAsignado: null
            });
            setPerfPin('');
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch {
            dispararErrorVisual("Fallo de Registro", "Imposible inyectar perfil.");
        }
    };

    const removerPerfilManual = async (idPerfil: number) => {
        if (!window.confirm('¿Desea eliminar la pantalla de forma irreversible?')) return;
        try {
            await api.delete(`/perfilescuentas/${idPerfil}`);
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch {
            dispararErrorVisual("Integridad Bloqueada", "El perfil se encuentra activo dentro de una suscripción vigente.");
        }
    };

    const agregarCuentaCompletaManual = async (e: FormEvent) => {
        e.preventDefault();
        if (!productoIdPerfilAbierto) return;

        try {
            await api.post('/perfilescuentas/cuenta-completa', {
                idProducto: productoIdPerfilAbierto, 
                correoCuenta: perfCorreo,
                passwordCuenta: perfPassword,
                cantidadPerfiles
            });
            setPerfCorreo('');
            setPerfPassword('');
            setCantidadPerfiles(5);
            
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
        } catch {
            dispararErrorVisual("Fallo Multipantalla", "No se generó el lote completo.");
        }
    };

    // CRUD: INVENTARIO
    const guardarProducto = async (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoProductoId ? { id: editandoProductoId } : {}), 
            ...formProducto,
            descripcion: formProducto.descripcion || 'Sin descripción detallada',
            stockMinimo: 2,
            categoriaId: formProducto.categoriaId ? Number(formProducto.categoriaId) : null,
            juegoId: formProducto.esDigital && formProducto.juegoId ? Number(formProducto.juegoId) : null,
            visibleEnCatalogo: true,
            diasDuracion: formProducto.esDigital ? Number(formProducto.diasDuracion) : 0,
            garantiaDias: Number(formProducto.garantiaDias)
        };

        try {
            if (editandoProductoId) {
                await api.put(`/products/${editandoProductoId}`, payload);
            } else {
                await api.post('/products', payload);
            }
            limpiarFormularioProducto();
            setMostrarFormularioProducto(false);
            cargarSincronizacionMaster();
        } catch { 
            dispararErrorVisual("Fallo de Procesamiento", "Error crítico al guardar la ficha técnica."); 
        }
    };

    const limpiarFormularioProducto = () => {
        setFormProducto(productoFormInicial);
        setEditandoProductoId(null);
    };

    const editarProducto = (producto: Producto) => {
        setEditandoProductoId(producto.id);
        setFormProducto({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precioVenta: producto.precioVenta,
            precioCosto: producto.precioCosto,
            stockActual: producto.stockActual,
            imagenUrl: producto.imagenUrl || '',
            esDigital: producto.esDigital,
            esSuscripcion: producto.esSuscripcion || false,
            categoriaId: producto.categoriaId?.toString() || '',
            juegoId: producto.juegoId?.toString() || '',
            diasDuracion: producto.diasDuracion || 30,
            garantiaDias: producto.garantiaDias || 0,
            proveedor: producto.proveedor || '',
            estado: producto.estado || 'Activo'
        });
        setMostrarFormularioProducto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const eliminarProducto = async (id: number) => {
        if (!window.confirm('¿Remover artículo del inventario permanente?')) return;
        try {
            await api.delete(`/products/${id}`);
            cargarSincronizacionMaster();
        } catch { 
            dispararErrorVisual("Acción Denegada", "Integridad referencial activa: Este producto tiene facturas o perfiles anclados."); 
        }
    };

    // CRUD: AUXILIARES
    const guardarJuego = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nombre: nuevoJuego, imagenUrl: juegoImagen || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=256' };
            if (editandoJuego) await api.put(`/juegos/${editandoJuego}`, { id: editandoJuego, ...payload });
            else await api.post('/juegos', payload);
            setNuevoJuego(''); setJuegoImagen(''); setEditandoJuego(null);
            cargarSincronizacionMaster();
        } catch { dispararErrorVisual("Error", "No se procesó el título."); }
    };

    const eliminarJuego = async (id: number) => {
        if (!window.confirm('¿Eliminar juego estratégico del catálogo?')) return;
        try {
            await api.delete(`/juegos/${id}`);
            if (juegoFiltroActivo === id) setJuegoFiltroActivo(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Restricción de Integridad", "Existen artículos vinculados a este título:", err.response?.data?.productos || []);
        }
    };

    const guardarCategoria = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nombre: nuevaCategoria, imagenUrl: categoriaImagen || 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?q=80&w=256' };
            if (editandoCategoria) await api.put(`/categorias/${editandoCategoria}`, { id: editandoCategoria, ...payload });
            else await api.post('/categorias', payload);
            setNuevaCategoria(''); setCategoriaImagen(''); setEditandoCategoria(null);
            cargarSincronizacionMaster();
        } catch { dispararErrorVisual("Error", "No se guardó la categoría."); }
    };

    const eliminarCategoria = async (id: number) => {
        if (!window.confirm('¿Remover categoría estructural?')) return;
        try {
            await api.delete(`/categorias/${id}`);
            if (categoriaFiltroActiva === id) setCategoriaFiltroActiva(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Restricción de Integridad", "Esta categoría cuenta con inventario asignado:", err.response?.data?.productos || []);
        }
    };

    const procesarSubidaImagen = (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        const lector = new FileReader();
        lector.onloadend = () => { 
            if (lector.result) setFormProducto(prev => ({ ...prev, imagenUrl: lector.result!.toString() })); 
        };
        lector.readAsDataURL(archivo);
    };

    if (cargando) return <div className={styles.loading}>Sincronizando registros estructurales...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>Catálogos Maestros de Configuración</h3>
                    <p className={styles.subtitle}>Estructuración global de Inventario, Rubros Digitales y Streaming.</p>
                </div>
            </div>

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

            {mostrarEstructurasSecundarias && (
                <div className={styles.panelSubSections}>
                    <div className={styles.panelSub}>
                        <h4 style={{ color: '#a855f7', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaTags /> {editandoCategoria ? 'Modificar' : 'Estructurar'} Categoría</h4>
                        <form onSubmit={guardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="text" placeholder="Nombre (Ej: Streaming)" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} className={styles.input} required />
                            <input type="text" placeholder="URL Imagen" value={categoriaImagen} onChange={e => setCategoriaImagen(e.target.value)} className={styles.input} />
                            <button type="submit" className={styles.btn} style={{ background: '#a855f7', color: '#fff', padding: '8px', justifyContent: 'center' }}>{editandoCategoria ? 'Actualizar' : 'Guardar'}</button>
                        </form>
                        <div className={styles.miniList}>
                            {categorias.map(({ id, nombre, imagenUrl }) => (
                                <div key={id} className={styles.miniListItem}>
                                    <span>{nombre}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span onClick={() => { setEditandoCategoria(id); setNuevaCategoria(nombre); setCategoriaImagen(imagenUrl); }} style={{ color: '#f59e0b', cursor: 'pointer' }}><FaEdit /></span>
                                        <span onClick={() => eliminarCategoria(id)} style={{ color: '#ef4444', cursor: 'pointer' }}><FaTrash /></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.panelSub}>
                        <h4 style={{ color: '#f59e0b', margin: 0, fontSize: '1rem', fontWeight: 700 }}><FaGamepad /> {editandoJuego ? 'Modificar' : 'Registrar'} Juego</h4>
                        <form onSubmit={guardarJuego} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="text" placeholder="Nombre del Juego" value={nuevoJuego} onChange={e => setNuevoJuego(e.target.value)} className={styles.input} required />
                            <input type="text" placeholder="URL Banner" value={juegoImagen} onChange={e => setJuegoImagen(e.target.value)} className={styles.input} />
                            <button type="submit" className={styles.btn} style={{ background: '#f59e0b', color: '#000', padding: '8px', justifyContent: 'center' }}>{editandoJuego ? 'Actualizar' : 'Guardar'}</button>
                        </form>
                        <div className={styles.miniList}>
                            {juegos.map(({ id, nombre, imagenUrl }) => (
                                <div key={id} className={styles.miniListItem}>
                                    <span>{nombre}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span onClick={() => { setEditandoJuego(id); setNuevoJuego(nombre); setJuegoImagen(imagenUrl); }} style={{ color: '#f59e0b', cursor: 'pointer' }}><FaEdit /></span>
                                        <span onClick={() => eliminarJuego(id)} style={{ color: '#ef4444', cursor: 'pointer' }}><FaTrash /></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* FORMULARIO ÚNICO CENTRALIZADO */}
            {mostrarFormularioProducto && (
                <div className={styles.panel} style={{ borderColor: '#38bdf8' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 700 }}><FaBoxOpen /> {editandoProductoId ? 'Modificando Ficha Técnica' : 'Ficha de Asignación de Inventario'}</h4>
                    <form onSubmit={guardarProducto} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre Comercial</label>
                                <input type="text" name="nombre" value={formProducto.nombre} onChange={handleProductoInputChange} className={styles.input} required />
                            </div>
                            <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                                <label className={styles.label}>Descripción / Notas</label>
                                <textarea name="descripcion" value={formProducto.descripcion} onChange={handleProductoInputChange} placeholder="Especificaciones físicas..." className={styles.textarea} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>Precio Compra (C$)</label>
                                    <input type="number" name="precioCosto" value={formProducto.precioCosto || ''} onChange={handleProductoInputChange} className={styles.input} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}>Precio Venta (C$)</label>
                                    <input type="number" name="precioVenta" value={formProducto.precioVenta || ''} onChange={handleProductoInputChange} className={styles.input} required />
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Categoría Estructural</label>
                                <select name="categoriaId" value={formProducto.categoriaId} onChange={handleProductoInputChange} className={styles.select} required>
                                    <option value="">-- Seleccionar --</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <label className={styles.label}><FaTruck /> Proveedor Homologado</label>
                                <select name="proveedor" value={formProducto.proveedor} onChange={handleProductoInputChange} className={styles.select} required>
                                    <option value="">-- Seleccionar Proveedor --</option>
                                    {listaProveedores.map(p => <option key={p.id} value={p.razonSocial}>{p.razonSocial}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}><FaShieldAlt /> Garantía (Días)</label>
                                    <input type="number" name="garantiaDias" min={0} value={formProducto.garantiaDias} onChange={handleProductoInputChange} className={styles.input} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label className={styles.label}><FaCheckCircle /> Estado</label>
                                    <select name="estado" value={formProducto.estado} onChange={handleProductoInputChange} className={styles.select}>
                                        <option value="Activo">Activo</option>
                                        <option value="Pausado">Pausado</option>
                                        <option value="Agotado">Agotado</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '12px 0 0 0' }}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" name="esDigital" checked={formProducto.esDigital} onChange={handleProductoInputChange} /> ¿Es Recarga / Producto Digital?
                                </label>
                                {formProducto.esDigital && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '6px 0' }}>
                                        <label className={styles.checkboxLabel} style={{ color: '#f43f5e' }}>
                                            <input type="checkbox" name="esSuscripcion" checked={formProducto.esSuscripcion} onChange={handleProductoInputChange} /> 🔄 ¿Es Suscripción Recurrente?
                                        </label>
                                        {formProducto.esSuscripcion && (
                                            <div style={{ paddingLeft: '20px' }}>
                                                <label style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'block' }}>Días de Vigencia</label>
                                                <input type="number" name="diasDuracion" min={1} value={formProducto.diasDuracion} onChange={handleProductoInputChange} className={styles.input} style={{ borderColor: '#f43f5e', padding: '6px 10px' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ justifyContent: 'space-between' }}>
                            <div>
                                {formProducto.esDigital && (
                                    <>
                                        <label className={styles.label}>Juego Asociado (Opcional)</label>
                                        <select name="juegoId" value={formProducto.juegoId} onChange={handleProductoInputChange} className={styles.select}>
                                            <option value="">-- Ninguno --</option>
                                            {juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                                        </select>
                                    </>
                                )}
                                <div style={{ marginTop: '10px' }}>
                                    <label className={styles.label}>Existencias Físicas o Lote</label>
                                    <input type="number" name="stockActual" value={formProducto.stockActual || ''} onChange={handleProductoInputChange} className={styles.input} required />
                                </div>
                            </div>
                            <div style={{ marginTop: '6px' }}>
                                <label className={styles.label}>URL Imagen o Archivo</label>
                                <input type="text" name="imagenUrl" placeholder="https://..." value={formProducto.imagenUrl} onChange={handleProductoInputChange} className={styles.input} />
                                <input type="file" accept="image/*" onChange={procesarSubidaImagen} className={styles.input} style={{ marginTop: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                                <button type="submit" className={`${styles.btn} ${editandoProductoId ? styles.btnWarning : styles.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }}>
                                    {editandoProductoId ? 'Actualizar Ficha' : 'Insertar'}
                                </button>
                                <button type="button" onClick={() => { limpiarFormularioProducto(); setMostrarFormularioProducto(false); }} className={`${styles.btn} ${styles.btnSecondary}`}><FaTimes /></button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* SELECTORES DE FILTROS */}
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

            {/* TABLA PRINCIPAL */}
            <div className={styles.tableWrapper}>
                <input type="text" placeholder="🔍 Filtrar por coincidencia..." value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className={styles.input} style={{ marginBottom: '12px' }} />
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
                        {prodsFiltrados.map((p) => (
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
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            {p.esSuscripcion && (
                                                <button onClick={() => abrirGestionPerfiles(p)} className={styles.btn} style={{ background: productoIdPerfilAbierto === p.id ? '#475569' : '#047688', color: '#fff', padding: '6px 10px', borderRadius: '4px' }}>
                                                    <FaTv /> Perfiles
                                                </button>
                                            )}
                                            <button onClick={() => editarProducto(p)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '6px 10px', borderRadius: '4px' }}>Editar</button>
                                            <button onClick={() => eliminarProducto(p.id)} className={`${styles.btn} ${styles.btnDanger}`} style={{ padding: '6px 10px', borderRadius: '4px' }}>Eliminar</button>
                                        </div>
                                    </td>
                                </tr>

                                {productoIdPerfilAbierto === p.id && (
                                    <tr style={{ background: '#0f172a' }}>
                                        <td colSpan={10} style={{ padding: '16px' }}>
                                            <div style={{ borderLeft: '4px solid #047688', paddingLeft: '14px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <h5 style={{ margin: 0, color: '#38bdf8', fontSize: '0.95rem', fontWeight: 'bold' }}>Administración de Pantallas Libres / Ocupadas: {p.nombre}</h5>
                                                    <button onClick={() => setProductoIdPerfilAbierto(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}><FaTimes /> Cerrar Panel</button>
                                                </div>

                                                <div className={styles.panel} style={{ background: '#1e293b', border: '1px solid #233249', marginBottom: '14px', padding: '14px' }}>
                                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                                        <button type="button" onClick={() => setModoIngreso('individual')} className={styles.btn} style={{ background: modoIngreso === 'individual' ? '#047688' : '#334155', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}>👤 Perfil Individual</button>
                                                        <button type="button" onClick={() => setModoIngreso('completa')} className={styles.btn} style={{ background: modoIngreso === 'completa' ? '#047688' : '#334155', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}>📺 Cuenta Completa</button>
                                                    </div>

                                                    {modoIngreso === 'individual' ? (
                                                        <form onSubmit={agregarPerfilManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                                                            <input type="text" value={perfNombre} onChange={e => setPerfNombre(e.target.value)} className={styles.input} placeholder="Nombre Perfil" required />
                                                            <input type="text" value={perfPin} onChange={e => setPerfPin(e.target.value)} className={styles.input} placeholder="PIN" maxLength={6} />
                                                            <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} placeholder="Correo Cuenta" required />
                                                            <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} placeholder="Password" required />
                                                            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} style={{ justifyContent: 'center' }}><FaPlus /> Cargar</button>
                                                        </form>
                                                    ) : (
                                                        <form onSubmit={agregarCuentaCompletaManual} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                                                            <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} placeholder="Correo Electrónico" required />
                                                            <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} placeholder="Clave Global" required />
                                                            <input type="number" value={cantidadPerfiles} onChange={e => setCantidadPerfiles(Number(e.target.value))} className={styles.input} min={1} max={10} />
                                                            <button type="submit" className={styles.btn} style={{ background: '#6366f1', color: '#fff', justifyContent: 'center' }}><FaTv /> Auto-generar</button>
                                                        </form>
                                                    )}
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                                    {perfilesActuales.map((perfil) => {
                                                        const esEditando = perfilEditandoId === perfil.id;
                                                        return (
                                                            <div key={perfil.id} style={{ background: perfil.ocupado ? '#2d1e24' : '#142820', border: '1px solid', borderColor: perfil.ocupado ? '#ef4444' : '#10b981', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    {esEditando ? (
                                                                        <input type="text" value={perfilEditandoDatos.ExtNombrePerfil} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} className={styles.input} style={{ padding: '2px 6px', fontSize: '0.8rem', width: '90px' }} />
                                                                    ) : (
                                                                        <strong style={{ fontSize: '0.85rem' }}>{perfil.nombrePerfil}</strong>
                                                                    )}
                                                                    {!perfil.ocupado && !esEditando && (
                                                                        <button onClick={() => removerPerfilManual(perfil.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash size={12} /></button>
                                                                    )}
                                                                </div>

                                                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {perfil.correoCuenta}</div>
                                                                    <div>
                                                                        🔑 PIN: {esEditando ? (
                                                                            <input type="text" value={perfilEditandoDatos.pin} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} className={styles.input} style={{ padding: '2px 6px', fontSize: '0.8rem', width: '60px' }} maxLength={6} />
                                                                        ) : (
                                                                            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{perfil.pin || 'Sin PIN'}</span>
                                                                        )}
                                                                    </div>
                                                                    {perfil.ocupado && (
                                                                        <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '6px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span>👤 {perfil.nombreCliente || `ID: ${perfil.idClienteAsignado}`}</span>
                                                                            <button onClick={() => liberarPerfilCliente(perfil.id)} className={styles.btn} style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', fontSize: '0.75rem' }}>Liberar</button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                    {esEditando ? (
                                                                        <>
                                                                            <button onClick={guardarCambiosPerfil} className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Guardar</button>
                                                                            <button onClick={() => setPerfilEditandoId(null)} className={`${styles.btn} ${styles.btnSecondary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Cerrar</button>
                                                                        </>
                                                                    ) : (
                                                                        <button onClick={() => comenzarEdicionPerfil(perfil)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Editar Info</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
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

            {/* MODAL INTEGRADO DE ERRORES/EXCEPCIONES */}
            {errorModal.visible && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ borderColor: '#ef4444', maxWidth: '550px' }}>
                        <div className={styles.modalHeader}>
                            <h4 style={{ color: '#ef4444', margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}><FaTimes /> {errorModal.mensaje}</h4>
                            <button onClick={() => setErrorModal(prev => ({ ...prev, visible: false }))} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><FaTimes /></button>
                        </div>
                        <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>{errorModal.detalles}</p>
                        {errorModal.elementosVinculados.length > 0 && (
                            <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {errorModal.elementosVinculados.map((item, idx) => (
                                    <div key={idx} style={{ color: '#f8fafc', fontSize: '0.8rem', padding: '6px 8px', background: '#1e293b', borderRadius: '4px', borderLeft: '3px solid #ef4444' }}>{item}</div>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setErrorModal(prev => ({ ...prev, visible: false }))} className={`${styles.btn} ${styles.btnSecondary}`}> Entendido </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};