import React, { useState, useEffect, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { 
    FaBoxOpen, FaGamepad, FaTags, FaTrash, 
    FaTimes, FaPlus, FaChevronDown, FaChevronUp, 
    FaSearch, FaTv, FaUser, FaImage, FaPlusCircle, FaMinusCircle,
    FaEdit, FaBoxes
} from 'react-icons/fa';

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
    controlaStock: boolean;
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
    accountGroupKey?: string;
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
    controlaStock: true,
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
    const [, setJuegos] = useState<Juego[]>([]);
    const [listaProveedores, setListaProveedores] = useState<Proveedor[]>([]);
    const [cargando, setCargando] = useState(true);

    // FORMULARIO UNIFICADO DE PRODUCTOS
    const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);
    const [formProducto, setFormProducto] = useState(productoFormInicial);

    // GESTIÓN DE PERFILES Y CUENTAS BATCH
    const [productoIdPerfilAbierto, setProductoIdPerfilAbierto] = useState<number | null>(null);
    const [perfilesActuales, setPerfilesActuales] = useState<PerfilCuenta[]>([]);
    const [perfilEditandoId, setPerfilEditandoId] = useState<number | null>(null);
    const [perfilEditandoDatos, setPerfilEditandoDatos] = useState({ id: 0, idProducto: 0, ExtNombrePerfil: '', pin: '', correoCuenta: '', passwordCuenta: '', accountGroupKey: '' });
    
    // BÚSQUEDA Y FILTRADO DE PERFILES
    const [busquedaPerfil, setBusquedaPerfil] = useState('');
    const [ordenPerfil, setOrdenPerfil] = useState<string>('a-z');

    const [modoIngreso, setModoIngreso] = useState('individual'); 
    const [cantidadPerfiles, setCantidadPerfiles] = useState(5);
    const [perfNombre, setPerfNombre] = useState('');
    const [perfPin, setPerfPin] = useState('');
    const [perfCorreo, setPerfCorreo] = useState('');
    const [perfPassword, setPerfPassword] = useState('');

    // ESTRUCTURAS AUXILIARES
    const [editandoJuego, setEditandoJuego] = useState<number | null>(null);
    const [nuevoJuego, setNuevoJuego] = useState('');
    const [juegoImagen, setJuegoImagen] = useState('');
    const [editandoCategoria, setEditandoCategoria] = useState<number | null>(null);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [categoriaImagen, setCategoriaImagen] = useState('');
    
    // FILTROS Y RUBROS
    const [filtroProd, setFiltroProd] = useState('');
    const [juegoFiltroActivo] = useState<number | null>(null);
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);
    const [rubroAdmin, setRubroAdmin] = useState<'todos' | 'fisicos' | 'digitales' | 'streaming'>('todos');

    // MODAL ERRORES
    const [errorModal, setErrorModal] = useState({ visible: false, mensaje: '', detalles: '' });

    const dispararErrorVisual = useCallback((mensaje: string, detalles: string) => {
        setErrorModal({ visible: true, mensaje, detalles });
    }, []);

    const cargarSincronizacionMaster = useCallback(async () => {
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
        } catch (err: any) { 
            console.error("Error al sincronizar catálogos:", err); 
            dispararErrorVisual("Error de Red", err.response?.data?.message || "No se pudo sincronizar con el servidor.");
        } finally {
            setCargando(false);
        }
    }, [dispararErrorVisual]);

    useEffect(() => { cargarSincronizacionMaster(); }, [cargarSincronizacionMaster]);

    const prodsFiltrados = useMemo(() => {
        return productos.filter(p => {
            const coincideTexto = p.nombre.toLowerCase().includes(filtroProd.toLowerCase());
            const coincideJuego = juegoFiltroActivo ? p.juegoId === juegoFiltroActivo : true;
            const coincideCategoria = categoriaFiltroActiva ? p.categoriaId === categoriaFiltroActiva : true;
            
            let coincideRubro = true;
            if (rubroAdmin === 'fisicos') coincideRubro = !p.esDigital;
            if (rubroAdmin === 'digitales') coincideRubro = p.esDigital && !p.esSuscripcion;
            if (rubroAdmin === 'streaming') coincideRubro = p.esDigital && p.esSuscripcion;

            return coincideTexto && coincideJuego && coincideCategoria && coincideRubro;
        });
    }, [productos, filtroProd, juegoFiltroActivo, categoriaFiltroActiva, rubroAdmin]);

    // FILTRADO Y ORDENAMIENTO DE PERFILES DE STREAMING
    const perfilesFiltradosYOrdenados = useMemo(() => {
        return perfilesActuales
            .filter((perfil) => {
                if (!busquedaPerfil.trim()) return true;
                const q = busquedaPerfil.toLowerCase();
                return (
                    perfil.nombrePerfil.toLowerCase().includes(q) ||
                    perfil.correoCuenta.toLowerCase().includes(q) ||
                    (perfil.nombreCliente && perfil.nombreCliente.toLowerCase().includes(q)) ||
                    (perfil.pin && perfil.pin.includes(q))
                );
            })
            .sort((a, b) => {
                switch (ordenPerfil) {
                    case 'a-z': return a.nombrePerfil.localeCompare(b.nombrePerfil, undefined, { numeric: true, sensitivity: 'base' });
                    case 'z-a': return b.nombrePerfil.localeCompare(a.nombrePerfil, undefined, { numeric: true, sensitivity: 'base' });
                    case 'correo': return a.correoCuenta.localeCompare(b.correoCuenta);
                    case 'disponibles': return (a.ocupado === b.ocupado) ? 0 : a.ocupado ? 1 : -1;
                    case 'ocupados': return (a.ocupado === b.ocupado) ? 0 : a.ocupado ? -1 : 1;
                    default: return 0;
                }
            });
    }, [perfilesActuales, busquedaPerfil, ordenPerfil]);

    const handleProductoInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const valorFinal = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormProducto(prev => {
            const nuevoEstado = { ...prev, [name]: valorFinal };
            if (name === 'esDigital' && valorFinal) {
                nuevoEstado.controlaStock = false;
            } else if (name === 'esDigital' && !valorFinal) {
                nuevoEstado.esSuscripcion = false;
                nuevoEstado.juegoId = '';
                nuevoEstado.controlaStock = true;
            }
            return nuevoEstado;
        });
    };

    const ajustarStockRapido = async (producto: Producto, delta: number) => {
        const nuevoStock = Math.max(0, producto.stockActual + delta);
        try {
            await api.put(`/products/${producto.id}`, {
                ...producto,
                stockActual: nuevoStock
            });
            setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stockActual: nuevoStock } : p));
        } catch (err: any) {
            dispararErrorVisual("Error de Stock", "No se pudo actualizar el stock en el servidor.");
        }
    };

    const abrirGestionPerfiles = async (producto: Producto) => {
        if (productoIdPerfilAbierto === producto.id) {
            setProductoIdPerfilAbierto(null);
            setPerfilesActuales([]);
            return;
        }
        setProductoIdPerfilAbierto(producto.id);
        setPerfNombre(`Perfil ${(producto.perfilesCount ?? 0) + 1}`);
        setPerfPin('');
        setBusquedaPerfil('');
        setOrdenPerfil('a-z');
        
        try {
            const res = await api.get(`/perfilescuentas/producto/${producto.id}`);
            setPerfilesActuales(res.data);
            if (res.data.length > 0) {
                setPerfCorreo(res.data[0].correoCuenta);
                setPerfPassword(res.data[0].passwordCuenta);
            }
        } catch {
            setPerfilesActuales([]);
        }
    };

    const comenzarEdicionPerfil = (perfil: PerfilCuenta) => {
        setPerfilEditandoId(perfil.id);
        setPerfilEditandoDatos({ ...perfil, ExtNombrePerfil: perfil.nombrePerfil, accountGroupKey: perfil.accountGroupKey || '' });
    };

    const removerCuentaCompletaManual = async (accountGroupKey: string) => {
        if (!window.confirm('⚠️ ¿Desea eliminar la CUENTA COMPLETA (todas sus pantallas)?')) return;
        try {
            await api.delete(`/perfilescuentas/grupo/${accountGroupKey}`);
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (err: any) {
            dispararErrorVisual("Integridad Bloqueada", err.response?.data?.message || "Una o más pantallas tienen suscripciones vigentes.");
        }
    };

    const guardarCambiosPerfil = async () => {
        try {
            let actualizarTodoElGrupo = false;
            if (perfilEditandoDatos.accountGroupKey) {
                actualizarTodoElGrupo = window.confirm("¿Aplicar Correo/Clave a TODAS las pantallas del lote?");
            }

            await api.put(`/perfilescuentas/${perfilEditandoId}`, {
                ...perfilEditandoDatos,
                nombrePerfil: perfilEditandoDatos.ExtNombrePerfil,
                propagarGrupo: actualizarTodoElGrupo
            });

            setPerfilEditandoId(null);
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (err: any) {
            dispararErrorVisual("Error de Envío", err.response?.data?.message || "No se guardaron los cambios del perfil.");
        }
    };

    const liberarPerfilCliente = async (idPerfil: number) => {
        if (!window.confirm("¿Liberar pantalla?")) return;
        try {
            await api.put(`/perfilescuentas/${idPerfil}/liberar`);
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (err: any) {
            dispararErrorVisual("Error Operacional", "No se pudo liberar la pantalla.");
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
        } catch (err: any) {
            dispararErrorVisual("Fallo de Registro", "Error al agregar el perfil.");
        }
    };

    const removerPerfilManual = async (idPerfil: number) => {
        if (!window.confirm('¿Eliminar esta pantalla?')) return;
        try {
            await api.delete(`/perfilescuentas/${idPerfil}`);
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch (err: any) {
            dispararErrorVisual("Integridad Bloqueada", "Perfil activo en una suscripción.");
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
        } catch (err: any) {
            dispararErrorVisual("Fallo Multipantalla", "Error al generar lote de perfiles.");
        }
    };

    const guardarProducto = async (e: FormEvent) => {
        e.preventDefault();
        const payload = {
            ...(editandoProductoId ? { id: editandoProductoId } : {}), 
            ...formProducto,
            descripcion: formProducto.descripcion || 'Sin descripción detallada',
            stockMinimo: formProducto.controlaStock ? 2 : 0,
            categoriaId: formProducto.categoriaId ? Number(formProducto.categoriaId) : null,
            juegoId: formProducto.esDigital && formProducto.juegoId ? Number(formProducto.juegoId) : null,
            visibleEnCatalogo: true,
            diasDuracion: formProducto.esDigital ? Number(formProducto.diasDuracion) : (Number(formProducto.diasDuracion) || 1),
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
        } catch (err: any) { 
            dispararErrorVisual("Fallo de Procesamiento", err.response?.data?.message || "Error al guardar el producto."); 
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
            controlaStock: producto.controlaStock ?? true,
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
        if (!window.confirm('¿Remover artículo del inventario?')) return;
        try {
            await api.delete(`/products/${id}`);
            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Acción Denegada", "Tiene registros o perfiles asociados."); 
        }
    };

    const guardarJuego = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nombre: nuevoJuego, imagenUrl: juegoImagen || '' };
            if (editandoJuego) await api.put(`/juegos/${editandoJuego}`, { id: editandoJuego, ...payload });
            else await api.post('/juegos', payload);
            setNuevoJuego(''); setJuegoImagen(''); setEditandoJuego(null);
            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Error", "Error guardando juego."); 
        }
    };

    const guardarCategoria = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nombre: nuevaCategoria, imagenUrl: categoriaImagen || '' };
            if (editandoCategoria) await api.put(`/categorias/${editandoCategoria}`, { id: editandoCategoria, ...payload });
            else await api.post('/categorias', payload);
            setNuevaCategoria(''); setCategoriaImagen(''); setEditandoCategoria(null);
            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Error", "Error guardando categoría."); 
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

    if (cargando) return <div style={{ padding: '30px', textAlign: 'center', color: '#38bdf8' }}>Cargando catálogos...</div>;

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box', paddingBottom: '30px' }}>
            
            {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
            <div style={{ background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ color: '#38bdf8', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Catálogos de Inventario</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => {
                            if (mostrarFormularioProducto) limpiarFormularioProducto();
                            setMostrarFormularioProducto(!mostrarFormularioProducto);
                        }} 
                        style={{ flex: 1, padding: '10px', background: mostrarFormularioProducto ? '#475569' : '#38bdf8', color: mostrarFormularioProducto ? '#fff' : '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        {mostrarFormularioProducto ? <><FaTimes /> Cancelar</> : <><FaPlus /> Nuevo Producto</>}
                    </button>

                    <button 
                        onClick={() => setMostrarEstructurasSecundarias(!mostrarEstructurasSecundarias)} 
                        style={{ padding: '10px', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <FaTags /> Categorías {mostrarEstructurasSecundarias ? <FaChevronUp size={10}/> : <FaChevronDown size={10}/>}
                    </button>
                </div>
            </div>

            {/* SECCIONES SECUNDARIAS (CATEGORÍAS Y JUEGOS) */}
            {mostrarEstructurasSecundarias && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#1e293b', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div>
                        <h4 style={{ color: '#a855f7', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}><FaTags /> Categorías</h4>
                        <form onSubmit={guardarCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="text" placeholder="Nombre Categoría" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} required />
                            <button type="submit" style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                {editandoCategoria ? 'Actualizar' : 'Guardar'}
                            </button>
                        </form>
                    </div>

                    <div>
                        <h4 style={{ color: '#f59e0b', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700 }}><FaGamepad /> Juegos</h4>
                        <form onSubmit={guardarJuego} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input type="text" placeholder="Nombre Juego" value={nuevoJuego} onChange={e => setNuevoJuego(e.target.value)} style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }} required />
                            <button type="submit" style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                {editandoJuego ? 'Actualizar' : 'Guardar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* FORMULARIO DE EDICIÓN Y REGISTRO COMPLETO */}
            {mostrarFormularioProducto && (
                <form onSubmit={guardarProducto} style={{ background: '#1e293b', border: '1px solid #38bdf8', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ color: '#38bdf8', margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        <FaBoxOpen /> {editandoProductoId ? 'Modificando Ficha Técnica' : 'Nuevo Producto'}
                    </h4>

                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Nombre Comercial</label>
                        <input type="text" name="nombre" value={formProducto.nombre} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Descripción / Notas</label>
                        <textarea name="descripcion" value={formProducto.descripcion} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'vertical' }} rows={2} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>P. Compra (C$)</label>
                            <input type="number" name="precioCosto" value={formProducto.precioCosto || ''} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>P. Venta (C$)</label>
                            <input type="number" name="precioVenta" value={formProducto.precioVenta || ''} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Categoría</label>
                            <select name="categoriaId" value={formProducto.categoriaId} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                                <option value="">-- Seleccionar --</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Proveedor</label>
                            <select name="proveedor" value={formProducto.proveedor} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} required>
                                <option value="">-- Seleccionar --</option>
                                {listaProveedores.map(p => <option key={p.id} value={p.razonSocial}>{p.razonSocial}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Garantía (Días)</label>
                            <input type="number" name="garantiaDias" value={formProducto.garantiaDias} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Estado</label>
                            <select name="estado" value={formProducto.estado} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }}>
                                <option value="Activo">Activo</option>
                                <option value="Pausado">Pausado</option>
                                <option value="Agotado">Agotado</option>
                            </select>
                        </div>
                    </div>

                    {/* Imagen URL o Subida */}
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block' }}>Imagen del Producto</label>
                        <input type="text" name="imagenUrl" placeholder="URL de la imagen (https://...)" value={formProducto.imagenUrl} onChange={handleProductoInputChange} style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box', marginBottom: '6px' }} />
                        <input type="file" accept="image/*" onChange={procesarSubidaImagen} style={{ width: '100%', fontSize: '0.75rem', color: '#94a3b8' }} />
                    </div>

                    {/* Controles de tipo y stock */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155' }}>
                        <label style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input type="checkbox" name="esDigital" checked={formProducto.esDigital} onChange={handleProductoInputChange} /> ¿Es Producto Digital / Recarga?
                        </label>
                        
                        <label style={{ fontSize: '0.75rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input type="checkbox" name="controlaStock" checked={formProducto.controlaStock} onChange={handleProductoInputChange} /> ¿Controla Stock Físico?
                        </label>

                        {formProducto.controlaStock && (
                            <div style={{ marginTop: '4px' }}>
                                <label style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>Stock Inicial / Actual</label>
                                <input type="number" name="stockActual" value={formProducto.stockActual} onChange={handleProductoInputChange} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.8rem', boxSizing: 'border-box' }} />
                            </div>
                        )}

                        {formProducto.esDigital && (
                            <label style={{ fontSize: '0.75rem', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input type="checkbox" name="esSuscripcion" checked={formProducto.esSuscripcion} onChange={handleProductoInputChange} /> 🔄 ¿Suscripción Streaming?
                            </label>
                        )}
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginTop: '4px' }}>
                        {editandoProductoId ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </form>
            )}

            {/* BARRA MÓVIL DE CHIPS DE RUBROS */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button onClick={() => setRubroAdmin('todos')} style={{ background: rubroAdmin === 'todos' ? '#38bdf8' : '#1e293b', color: rubroAdmin === 'todos' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Todos</button>
                <button onClick={() => setRubroAdmin('fisicos')} style={{ background: rubroAdmin === 'fisicos' ? '#38bdf8' : '#1e293b', color: rubroAdmin === 'fisicos' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Físicos</button>
                <button onClick={() => setRubroAdmin('digitales')} style={{ background: rubroAdmin === 'digitales' ? '#38bdf8' : '#1e293b', color: rubroAdmin === 'digitales' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Digitales</button>
                <button onClick={() => setRubroAdmin('streaming')} style={{ background: rubroAdmin === 'streaming' ? '#38bdf8' : '#1e293b', color: rubroAdmin === 'streaming' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>Streaming</button>
            </div>

            {/* CHIPS DE FILTRO POR CATEGORÍAS */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button 
                    onClick={() => setCategoriaFiltroActiva(null)} 
                    style={{ background: categoriaFiltroActiva === null ? '#a855f7' : '#0f172a', color: categoriaFiltroActiva === null ? '#fff' : '#94a3b8', border: '1px solid #334155', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
                >
                    Todas las Categorías
                </button>
                {categorias.map(c => (
                    <button 
                        key={c.id} 
                        onClick={() => setCategoriaFiltroActiva(c.id)} 
                        style={{ background: categoriaFiltroActiva === c.id ? '#a855f7' : '#0f172a', color: categoriaFiltroActiva === c.id ? '#fff' : '#94a3b8', border: '1px solid #334155', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                        {c.nombre}
                    </button>
                ))}
            </div>

            {/* BÚSQUEDA INPUT */}
            <div style={{ position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <input 
                    type="text" 
                    placeholder="Filtrar por coincidencia..." 
                    value={filtroProd} 
                    onChange={e => setFiltroProd(e.target.value)} 
                    style={{ width: '100%', padding: '10px 12px 10px 38px', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
            </div>

            {/* FEED MÓVIL DE TARJETAS DE PRODUCTOS CON IMAGEN Y AJUSTE DE STOCK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {prodsFiltrados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', background: '#1e293b', borderRadius: '12px' }}>
                        No hay productos en esta selección.
                    </div>
                ) : (
                    prodsFiltrados.map((p) => (
                        <div key={p.id} style={{ background: '#1e293b', padding: '12px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            
                            {/* Cabecera con Imagen y Nombre */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {p.imagenUrl ? (
                                        <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FaImage style={{ color: '#475569', fontSize: '1.2rem' }} />
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block', lineHeight: '1.2' }}>{p.nombre}</strong>
                                    <small style={{ color: '#38bdf8', fontSize: '0.72rem', display: 'block', marginTop: '2px' }}>
                                        {p.esSuscripcion ? '📺 Streaming' : p.esDigital ? '🎮 Digital' : `Proveedor: ${p.proveedor || 'N/A'}`}
                                    </small>
                                    <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                        Garantía: {p.garantiaDias} días
                                    </small>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <strong style={{ color: '#10b981', fontSize: '0.95rem', display: 'block' }}>C$ {p.precioVenta}</strong>
                                    <small style={{ color: '#64748b', fontSize: '0.68rem' }}>Costo: C$ {p.precioCosto}</small>
                                </div>
                            </div>

                            {/* Fila de Ajuste de Stock en Tiempo Real */}
                            {p.controlaStock && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>Stock Disponible:</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button 
                                            onClick={() => ajustarStockRapido(p, -1)} 
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <FaMinusCircle />
                                        </button>
                                        <strong style={{ color: p.stockActual <= 2 ? '#ef4444' : '#38bdf8', fontSize: '0.95rem' }}>{p.stockActual} u.</strong>
                                        <button 
                                            onClick={() => ajustarStockRapido(p, 1)} 
                                            style={{ background: 'transparent', border: 'none', color: '#10b981', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <FaPlusCircle />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                <span style={{ background: p.estado === 'Pausado' ? 'rgba(245, 158, 11, 0.2)' : p.estado === 'Agotado' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: p.estado === 'Pausado' ? '#f59e0b' : p.estado === 'Agotado' ? '#ef4444' : '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                                    {p.estado || 'Activo'}
                                </span>
                                
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {p.esSuscripcion && (
                                        <button onClick={() => abrirGestionPerfiles(p)} style={{ background: '#047688', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                            <FaTv /> Perfiles
                                        </button>
                                    )}
                                    <button onClick={() => editarProducto(p)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Editar</button>
                                    <button onClick={() => eliminarProducto(p.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}><FaTrash /></button>
                                </div>
                            </div>

                            {/* PANEL DESPLEGABLE COMPLETO DE PERFILES Y CUENTAS DE STREAMING */}
                            {productoIdPerfilAbierto === p.id && (
                                <div style={{ background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #047688', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: '#38bdf8', fontSize: '0.82rem' }}>Pantallas de {p.nombre}</strong>
                                        <button onClick={() => setProductoIdPerfilAbierto(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTimes /></button>
                                    </div>

                                    {/* Selector de Modo: Carga Perfil Individual vs Cuenta Completa (Lote) */}
                                    <div style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '4px', borderRadius: '6px' }}>
                                        <button type="button" onClick={() => setModoIngreso('individual')} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: modoIngreso === 'individual' ? '#047688' : 'transparent', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>👤 Perfil Individual</button>
                                        <button type="button" onClick={() => setModoIngreso('completa')} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: modoIngreso === 'completa' ? '#047688' : 'transparent', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>📺 Cuenta Completa</button>
                                    </div>

                                    {/* Sub-formulario Carga Perfil Individual */}
                                    {modoIngreso === 'individual' ? (
                                        <form onSubmit={agregarPerfilManual} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <input type="text" value={perfNombre} onChange={e => setPerfNombre(e.target.value)} placeholder="Nombre Perfil (Ej: Perfil 1)" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} required />
                                            <input type="text" value={perfPin} onChange={e => setPerfPin(e.target.value)} placeholder="PIN (Ej: 1234)" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} maxLength={6} />
                                            <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} placeholder="Correo Electrónico Cuenta" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} required />
                                            <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} placeholder="Contraseña Cuenta" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} required />
                                            <button type="submit" style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>+ Cargar Perfil</button>
                                        </form>
                                    ) : (
                                        /* Sub-formulario Carga Cuenta Completa (Generación Multipantalla) */
                                        <form onSubmit={agregarCuentaCompletaManual} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} placeholder="Correo Electrónico Cuenta" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} required />
                                            <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} placeholder="Clave Global" style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} required />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <small style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Cant. Pantallas:</small>
                                                <input type="number" value={cantidadPerfiles} onChange={e => setCantidadPerfiles(Number(e.target.value))} style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem' }} min={1} max={10} />
                                            </div>
                                            <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>📺 Auto-generar Lote</button>
                                        </form>
                                    )}

                                    {/* Barra de Filtro y Ordenamiento de Perfiles */}
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#1e293b', padding: '6px', borderRadius: '6px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="🔍 Buscar perfil, correo o PIN..." 
                                            value={busquedaPerfil} 
                                            onChange={e => setBusquedaPerfil(e.target.value)} 
                                            style={{ flex: 1, background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.72rem' }}
                                        />
                                        <select 
                                            value={ordenPerfil} 
                                            onChange={e => setOrdenPerfil(e.target.value)} 
                                            style={{ background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px', borderRadius: '4px', fontSize: '0.7rem' }}
                                        >
                                            <option value="a-z">A - Z</option>
                                            <option value="disponibles">Libres</option>
                                            <option value="ocupados">Ocupados</option>
                                        </select>
                                    </div>

                                    {/* Lista Dinámica de Pantallas con Edición de Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {perfilesFiltradosYOrdenados.length === 0 ? (
                                            <div style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', padding: '10px' }}>Sin perfiles registrados o coincidentes.</div>
                                        ) : (
                                            perfilesFiltradosYOrdenados.map(perfil => {
                                                const esEditando = perfilEditandoId === perfil.id;
                                                return (
                                                    <div key={perfil.id} style={{ background: perfil.ocupado ? '#2d1e24' : '#142820', border: `1px solid ${perfil.ocupado ? '#ef4444' : '#10b981'}`, padding: '8px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            {esEditando ? (
                                                                <input 
                                                                    type="text" 
                                                                    value={perfilEditandoDatos.ExtNombrePerfil} 
                                                                    onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} 
                                                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }} 
                                                                />
                                                            ) : (
                                                                <strong style={{ color: '#fff', fontSize: '0.78rem' }}>{perfil.nombrePerfil}</strong>
                                                            )}
                                                            
                                                            <span style={{ color: perfil.ocupado ? '#ef4444' : '#10b981', fontSize: '0.68rem', fontWeight: 700 }}>
                                                                {perfil.ocupado ? 'OCUPADO' : 'LIBRE'}
                                                            </span>
                                                        </div>

                                                        {/* Campos editables o vista de lectura */}
                                                        {esEditando ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                                                <input 
                                                                    type="email" 
                                                                    value={perfilEditandoDatos.correoCuenta} 
                                                                    onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, correoCuenta: e.target.value})} 
                                                                    placeholder="Correo"
                                                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.72rem' }} 
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    value={perfilEditandoDatos.passwordCuenta} 
                                                                    onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, passwordCuenta: e.target.value})} 
                                                                    placeholder="Contraseña"
                                                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.72rem' }} 
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    value={perfilEditandoDatos.pin} 
                                                                    onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} 
                                                                    placeholder="PIN"
                                                                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '4px', borderRadius: '4px', fontSize: '0.72rem' }} 
                                                                    maxLength={6}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                                                <div>✉️ {perfil.correoCuenta}</div>
                                                                <div>🔑 PIN: <strong style={{ color: '#fb923c' }}>{perfil.pin || 'Sin PIN'}</strong></div>
                                                            </div>
                                                        )}

                                                        {perfil.ocupado && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px' }}>
                                                                <span style={{ color: '#f87171', fontSize: '0.7rem' }}><FaUser size={10} /> {perfil.nombreCliente || 'Cliente'}</span>
                                                                <button onClick={() => liberarPerfilCliente(perfil.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}>Liberar</button>
                                                            </div>
                                                        )}

                                                        {/* Botones de Edición / Guardar / Eliminar Lote */}
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                                                            {esEditando ? (
                                                                <>
                                                                    <button onClick={guardarCambiosPerfil} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
                                                                    <button onClick={() => setPerfilEditandoId(null)} style={{ background: '#475569', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Cerrar</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => comenzarEdicionPerfil(perfil)} style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}><FaEdit /> Editar</button>
                                                                    
                                                                    {perfil.accountGroupKey && !perfil.ocupado && (
                                                                        <button onClick={() => removerCuentaCompletaManual(perfil.accountGroupKey!)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }} title="Eliminar todo el lote de pantallas de esta cuenta">
                                                                            <FaBoxes /> Lote
                                                                        </button>
                                                                    )}

                                                                    {!perfil.ocupado && (
                                                                        <button onClick={() => removerPerfilManual(perfil.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>
                                                                            <FaTrash />
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* MODAL ERROR */}
            {errorModal.visible && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', padding: '16px', width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                        <h4 style={{ color: '#f87171', margin: 0 }}>{errorModal.mensaje}</h4>
                        <p style={{ color: '#e2e8f0', fontSize: '0.82rem', margin: 0 }}>{errorModal.detalles}</p>
                        <button onClick={() => setErrorModal(prev => ({ ...prev, visible: false }))} style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginTop: '6px', fontSize: '0.85rem' }}>
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};