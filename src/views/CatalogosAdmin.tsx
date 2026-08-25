import React, { useState, useEffect, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { 
    FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, 
    FaTimes, FaPlus, FaChevronDown, FaChevronUp, FaTruck, FaShieldAlt, 
    FaCheckCircle, FaBoxes, FaSearch, FaFilter, FaTv, FaLayerGroup, FaCopy, FaPalette, FaSave, FaHistory
} from 'react-icons/fa';
import styles from '../assets/styles/CatalogosAdmin.module.css';

export interface VariacionProducto {
    id?: number;
    productoPadreId?: number;
    sku?: string;
    color?: string;
    almacenamiento?: string;
    ram?: string;
    talla?: string;
    nombreVariacion: string;
    precioVenta: number;
    precioCosto: number;
    stockActual: number;
    stockMinimo?: number;
    imagenUrl?: string;
    estado?: string;
}

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
    requiereServicio?: boolean;
    diasDuracion: number;
    categoriaId: number | null;
    juegoId: number | null;
    garantiaDias: number;
    proveedor: string;
    estado: string;
    perfilesCount?: number;
    tieneVariaciones?: boolean;
    variaciones?: VariacionProducto[];
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

interface HistorialVentaItem {
    ventaId: number;
    fecha: string;
    clienteId: number | null;
    clienteNombre: string;
    clienteTelefono: string;
    cantidad: number;
    precioUnitario: number;
    subTotal: number;
    metodoPago: string;
    operador: string;
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
    estado: 'Activo',
    tieneVariaciones: false,
    variaciones: [] as VariacionProducto[]
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
    const [subiendoImagen, setSubiendoImagen] = useState(false);

    // FORMULARIO UNIFICADO DE PRODUCTOS
    const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);
    const [formProducto, setFormProducto] = useState(productoFormInicial);

    // MODAL CRUD DE VARIACIONES
    const [productoVariacionAbierto, setProductoVariacionAbierto] = useState<Producto | null>(null);
    const [variacionesModal, setVariacionesModal] = useState<VariacionProducto[]>([]);
    const [filtroColorVariacion, setFiltroColorVariacion] = useState<string>('Todos');
    const [variacionEditandoIdx, setVariacionEditandoIdx] = useState<number | null>(null);

    // MODAL DE HISTORIAL DE VENTAS
    const [productoHistorial, setProductoHistorial] = useState<Producto | null>(null);
    const [historialVentas, setHistorialVentas] = useState<HistorialVentaItem[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [busquedaHistorial, setBusquedaHistorial] = useState('');

    // FORMULARIO RÁPIDO AGREGAR VARIANTE
    const [nuevaVarNombre, setNuevaVarNombre] = useState('');
    const [nuevaVarPrecioCosto, setNuevaVarPrecioCosto] = useState<number | ''>('');
    const [nuevaVarPrecioVenta, setNuevaVarPrecioVenta] = useState<number | ''>('');
    const [nuevaVarStock, setNuevaVarStock] = useState<number | ''>('');

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
    const [juegoFiltroActivo, setJuegoFiltroActivo] = useState<number | null>(null);
    const [categoriaFiltroActiva, setCategoriaFiltroActiva] = useState<number | null>(null);
    const [rubroAdmin, setRubroAdmin] = useState<'todos' | 'fisicos' | 'digitales' | 'streaming'>('todos');

    // MODAL CONTROLADO DE EXCEPCIONES Y ADVERTENCIAS
    const [errorModal, setErrorModal] = useState({
        visible: false, mensaje: '', detalles: '', elementosVinculados: [] as string[]
    });

    const dispararErrorVisual = useCallback((mensaje: string, detalles: string, vinculados: string[] = []) => {
        setErrorModal({ visible: true, mensaje, detalles, elementosVinculados: vinculados });
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
            dispararErrorVisual("Error de Red", err.response?.data?.message || "No se pudo sincronizar la información del servidor central.");
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
                    case 'a-z':
                        return a.nombrePerfil.localeCompare(b.nombrePerfil, undefined, { numeric: true, sensitivity: 'base' });
                    case 'z-a':
                        return b.nombrePerfil.localeCompare(a.nombrePerfil, undefined, { numeric: true, sensitivity: 'base' });
                    case 'correo':
                        return a.correoCuenta.localeCompare(b.correoCuenta);
                    case 'disponibles':
                        return (a.ocupado === b.ocupado) ? 0 : a.ocupado ? 1 : -1;
                    case 'ocupados':
                        return (a.ocupado === b.ocupado) ? 0 : a.ocupado ? -1 : 1;
                    default:
                        return 0;
                }
            });
    }, [perfilesActuales, busquedaPerfil, ordenPerfil]);

    const ventasFiltradas = useMemo(() => {
        if (!busquedaHistorial.trim()) return historialVentas;
        const q = busquedaHistorial.toLowerCase().trim();
        return historialVentas.filter(h => 
            h.fecha.toLowerCase().includes(q) ||
            h.ventaId.toString().includes(q) ||
            h.clienteNombre.toLowerCase().includes(q) ||
            (h.clienteTelefono && h.clienteTelefono.includes(q)) ||
            h.cantidad.toString().includes(q) ||
            h.precioUnitario.toString().includes(q) ||
            h.subTotal.toString().includes(q) ||
            h.metodoPago.toLowerCase().includes(q) ||
            h.operador.toLowerCase().includes(q)
        );
    }, [historialVentas, busquedaHistorial]);

    const handleProductoInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let valorFinal: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        if (type === 'number') {
            valorFinal = value === '' ? '' : Number(value);
        }

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

    const abrirHistorialProducto = async (producto: Producto) => {
        setProductoHistorial(producto);
        setBusquedaHistorial('');
        setCargandoHistorial(true);
        try {
            const res = await api.get(`/products/${producto.id}/historial-ventas`);
            setHistorialVentas(res.data);
        } catch (err: any) {
            dispararErrorVisual("Error al Cargar Historial", err.response?.data?.mensaje || "No se pudieron obtener las ventas de este artículo.");
            setHistorialVentas([]);
        } finally {
            setCargandoHistorial(false);
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
        setPerfilEditandoDatos({ 
            ...perfil, 
            ExtNombrePerfil: perfil.nombrePerfil,
            accountGroupKey: perfil.accountGroupKey || ''
        });
    };

    const removerCuentaCompletaManual = async (accountGroupKey: string) => {
        if (!window.confirm('⚠️ ¿Desea eliminar la CUENTA COMPLETA (todas sus pantallas) de forma irreversible?')) return;
        try {
            await api.delete(`/perfilescuentas/grupo/${accountGroupKey}`);
            if (productoIdPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
                setPerfilesActuales(res.data);
            }
        } catch (err: any) {
            dispararErrorVisual(
                "Integridad Bloqueada", 
                err.response?.data?.message || "Una o más pantallas de esta cuenta están activas en suscripciones vigentes."
            );
        }
    };

    const guardarCambiosPerfil = async () => {
        try {
            let actualizarTodoElGrupo = false;

            if (perfilEditandoDatos.accountGroupKey) {
                actualizarTodoElGrupo = window.confirm(
                    "¿Desea aplicar este Correo y Contraseña a TODAS las pantallas que comparten esta misma cuenta?"
                );
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
            dispararErrorVisual("Error de Envío", err.response?.data?.message || "Hubo problemas al guardar los datos del perfil o del grupo.");
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
        } catch (err: any) {
            dispararErrorVisual("Error Operacional", err.response?.data?.message || "No se logró desvincular al cliente de la pantalla.");
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
            dispararErrorVisual("Fallo de Registro", err.response?.data?.message || "Imposible inyectar perfil.");
        }
    };

    const removerPerfilManual = async (idPerfil: number) => {
        if (!window.confirm('¿Desea eliminar la pantalla de forma irreversible?')) return;
        try {
            await api.delete(`/perfilescuentas/${idPerfil}`);
            const res = await api.get(`/perfilescuentas/producto/${productoIdPerfilAbierto}`);
            setPerfilesActuales(res.data);
            setPerfNombre(`Perfil ${res.data.length + 1}`);
        } catch (err: any) {
            dispararErrorVisual("Integridad Bloqueada", err.response?.data?.message || "El perfil se encuentra activo dentro de una suscripción vigente.");
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
            dispararErrorVisual("Fallo Multipantalla", err.response?.data?.message || "No se generó el lote completo.");
        }
    };

    const guardarProducto = async (e: FormEvent, mantenerParaDuplicar: boolean = false) => {
        e.preventDefault();
        
        const payload = {
            ...(editandoProductoId ? { id: editandoProductoId } : {}), 
            ...formProducto,
            precioCosto: Number(formProducto.precioCosto) || 0,
            precioVenta: Number(formProducto.precioVenta) || 0,
            stockActual: formProducto.controlaStock ? (Number(formProducto.stockActual) || 0) : 0,
            descripcion: formProducto.descripcion || 'Sin descripción detallada',
            stockMinimo: formProducto.controlaStock ? 2 : 0,
            categoriaId: formProducto.categoriaId ? Number(formProducto.categoriaId) : null,
            juegoId: formProducto.esDigital && formProducto.juegoId ? Number(formProducto.juegoId) : null,
            visibleEnCatalogo: true,
            diasDuracion: formProducto.esDigital ? (Number(formProducto.diasDuracion) || 30) : (Number(formProducto.diasDuracion) || 1),
            garantiaDias: Number(formProducto.garantiaDias) || 0
        };

        try {
            if (editandoProductoId) {
                await api.put(`/products/${editandoProductoId}`, payload);
            } else {
                await api.post('/products', payload);
            }

            if (mantenerParaDuplicar) {
                setEditandoProductoId(null);
                setFormProducto(prev => ({
                    ...prev,
                    nombre: `${prev.nombre} (Siguiente)`,
                    stockActual: prev.controlaStock ? (Number(prev.stockActual) || 0) : 0
                }));
            } else {
                limpiarFormularioProducto();
                setMostrarFormularioProducto(false);
            }

            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Fallo de Procesamiento", err.response?.data?.message || "Error crítico al guardar la ficha técnica."); 
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
            garantiaDias: producto.garantiaDias ?? 30,
            proveedor: producto.proveedor || '',
            estado: producto.estado || 'Activo',
            tieneVariaciones: producto.tieneVariaciones || false,
            variaciones: producto.variaciones || []
        });
        setMostrarFormularioProducto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clonarProducto = (producto: Producto) => {
        setEditandoProductoId(null);
        setFormProducto({
            nombre: `${producto.nombre} (Copia)`,
            descripcion: producto.descripcion || '',
            precioVenta: producto.precioVenta,
            precioCosto: producto.precioCosto,
            stockActual: producto.controlaStock ? producto.stockActual : 0,
            imagenUrl: producto.imagenUrl || '',
            esDigital: producto.esDigital,
            esSuscripcion: producto.esSuscripcion || false,
            controlaStock: producto.controlaStock ?? true,
            categoriaId: producto.categoriaId?.toString() || '',
            juegoId: producto.juegoId?.toString() || '',
            diasDuracion: producto.diasDuracion || 30,
            garantiaDias: producto.garantiaDias ?? 30,
            proveedor: producto.proveedor || '',
            estado: producto.estado || 'Activo',
            tieneVariaciones: producto.tieneVariaciones || false,
            variaciones: producto.variaciones || []
        });
        setMostrarFormularioProducto(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const eliminarProducto = async (id: number) => {
        if (!window.confirm('¿Remover artículo del inventario permanente?')) return;
        try {
            await api.delete(`/products/${id}`);
            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Acción Denegada", err.response?.data?.message || "Integridad referencial activa: Este producto tiene facturas o perfiles anclados."); 
        }
    };

    const guardarJuego = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nombre: nuevoJuego, imagenUrl: juegoImagen || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=256' };
            if (editandoJuego) await api.put(`/juegos/${editandoJuego}`, { id: editandoJuego, ...payload });
            else await api.post('/juegos', payload);
            setNuevoJuego(''); setJuegoImagen(''); setEditandoJuego(null);
            cargarSincronizacionMaster();
        } catch (err: any) { 
            dispararErrorVisual("Error", err.response?.data?.message || "No se procesó el título."); 
        }
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
        } catch (err: any) { 
            dispararErrorVisual("Error", err.response?.data?.message || "No se guardó la categoría."); 
        }
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

    // SUBIDA FÍSICA DIRECTA AL ENDPOINT /api/uploads/producto
    const procesarSubidaImagen = async (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        try {
            setSubiendoImagen(true);
            const formData = new FormData();
            formData.append('archivo', archivo);

            const res = await api.post('/uploads/producto', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data && res.data.url) {
                setFormProducto(prev => ({ ...prev, imagenUrl: res.data.url }));
            }
        } catch (err: any) {
            dispararErrorVisual(
                "Error al Subir Imagen", 
                err.response?.data?.mensaje || "No se pudo subir la imagen al servidor. Verifique el formato y peso."
            );
        } finally {
            setSubiendoImagen(false);
            e.target.value = '';
        }
    };

    // FUNCIONES CRUD DENTRO DEL MODAL DE VARIACIONES
    const abrirModalVariaciones = (producto: Producto) => {
        setProductoVariacionAbierto(producto);
        setVariacionesModal(producto.variaciones || []);
        setFiltroColorVariacion('Todos');
        setVariacionEditandoIdx(null);
        setNuevaVarNombre('');
        setNuevaVarPrecioCosto(producto.precioCosto);
        setNuevaVarPrecioVenta(producto.precioVenta);
        setNuevaVarStock(0);
    };

    const agregarNuevaVariacionModal = () => {
        if (!nuevaVarNombre.trim()) {
            alert("Escriba el nombre o descripción de la variación.");
            return;
        }

        const nueva: VariacionProducto = {
            productoPadreId: productoVariacionAbierto?.id,
            nombreVariacion: nuevaVarNombre.trim(),
            color: nuevaVarNombre.trim(),
            precioCosto: Number(nuevaVarPrecioCosto) || (productoVariacionAbierto?.precioCosto ?? 0),
            precioVenta: Number(nuevaVarPrecioVenta) || (productoVariacionAbierto?.precioVenta ?? 0),
            stockActual: Number(nuevaVarStock) || 0,
            stockMinimo: 2,
            estado: 'Activo'
        };

        setVariacionesModal(prev => [...prev, nueva]);
        setNuevaVarNombre('');
        setNuevaVarStock(0);
    };

    const guardarVariacionModal = (idx: number, campo: keyof VariacionProducto, valor: any) => {
        setVariacionesModal(prev => {
            const copia = [...prev];
            copia[idx] = { ...copia[idx], [campo]: valor };
            return copia;
        });
    };

    const eliminarVariacionModal = (idx: number) => {
        if (!window.confirm("¿Eliminar esta variación?")) return;
        setVariacionesModal(prev => prev.filter((_, i) => i !== idx));
        if (variacionEditandoIdx === idx) setVariacionEditandoIdx(null);
    };

    const guardarTodasVariacionesServidor = async () => {
        if (!productoVariacionAbierto) return;

        const payload = {
            id: productoVariacionAbierto.id,
            nombre: productoVariacionAbierto.nombre,
            descripcion: productoVariacionAbierto.descripcion,
            precioVenta: Number(productoVariacionAbierto.precioVenta) || 0,
            precioCosto: Number(productoVariacionAbierto.precioCosto) || 0,
            stockActual: 0,
            stockMinimo: 0,
            imagenUrl: productoVariacionAbierto.imagenUrl,
            esDigital: productoVariacionAbierto.esDigital,
            controlaStock: productoVariacionAbierto.controlaStock,
            requiereServicio: productoVariacionAbierto.requiereServicio ?? false,
            visibleEnCatalogo: true,
            esSuscripcion: productoVariacionAbierto.esSuscripcion,
            diasDuracion: Number(productoVariacionAbierto.diasDuracion) || 30,
            garantiaDias: Number(productoVariacionAbierto.garantiaDias) || 0,
            proveedor: productoVariacionAbierto.proveedor,
            estado: productoVariacionAbierto.estado,
            categoriaId: productoVariacionAbierto.categoriaId ? Number(productoVariacionAbierto.categoriaId) : null,
            juegoId: productoVariacionAbierto.juegoId ? Number(productoVariacionAbierto.juegoId) : null,
            tieneVariaciones: true,
            variaciones: variacionesModal.map(v => ({
                ...v,
                precioCosto: Number(v.precioCosto) || 0,
                precioVenta: Number(v.precioVenta) || 0,
                stockActual: Number(v.stockActual) || 0,
                stockMinimo: Number(v.stockMinimo) || 2
            }))
        };

        try {
            await api.put(`/products/${productoVariacionAbierto.id}`, payload);
            alert("Variaciones guardadas y sincronizadas exitosamente.");
            setProductoVariacionAbierto(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Error al Guardar Variaciones", err.response?.data?.mensaje || "No se pudieron actualizar las variaciones.");
        }
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
                    <h4 style={{ color: '#38bdf8', margin: '0 0 14px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                        <FaBoxOpen /> {editandoProductoId ? 'Modificando Ficha Técnica' : 'Ficha de Asignación de Inventario'}
                    </h4>
                    <form onSubmit={(e) => guardarProducto(e, false)} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre Comercial</label>
                            <input type="text" name="nombre" value={formProducto.nombre} onChange={handleProductoInputChange} className={styles.input} required />
                            
                            <div style={{ marginTop: '10px' }}>
                                <label className={styles.label}>Descripción / Notas</label>
                                <textarea name="descripcion" value={formProducto.descripcion} onChange={handleProductoInputChange} placeholder="Especificaciones físicas..." className={styles.textarea} />
                            </div>

                            {!formProducto.tieneVariaciones && (
                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className={styles.label}>Precio Compra (C$)</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            name="precioCosto" 
                                            value={formProducto.precioCosto} 
                                            onChange={handleProductoInputChange} 
                                            className={styles.input} 
                                            required={!formProducto.tieneVariaciones} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className={styles.label}>Precio Venta (C$)</label>
                                        <input 
                                            type="number" 
                                            step="any"
                                            name="precioVenta" 
                                            value={formProducto.precioVenta} 
                                            onChange={handleProductoInputChange} 
                                            className={styles.input} 
                                            required={!formProducto.tieneVariaciones} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categoría Estructural</label>
                            <select name="categoriaId" value={formProducto.categoriaId} onChange={handleProductoInputChange} className={styles.select} required>
                                <option value="">-- Seleccionar --</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>

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
                                    <input 
                                        type="number" 
                                        name="garantiaDias" 
                                        min={0} 
                                        value={formProducto.garantiaDias} 
                                        onChange={handleProductoInputChange} 
                                        className={styles.input} 
                                    />
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '12px 0 0 0' }}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" name="esDigital" checked={formProducto.esDigital} onChange={handleProductoInputChange} /> ¿Es Recarga / Producto Digital?
                                </label>
                                
                                <label className={styles.checkboxLabel} style={{ color: formProducto.controlaStock ? '#4ade80' : '#94a3b8' }}>
                                    <input type="checkbox" name="controlaStock" checked={formProducto.controlaStock} onChange={handleProductoInputChange} /> <FaBoxes size={12} /> ¿Controla Stock / Inventario Físico?
                                </label>

                                {formProducto.esDigital && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                                        <label className={styles.checkboxLabel} style={{ color: '#f43f5e' }}>
                                            <input type="checkbox" name="esSuscripcion" checked={formProducto.esSuscripcion} onChange={handleProductoInputChange} /> 🔄 ¿Es Suscripción Recurrente (Streaming)?
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
                                {!formProducto.tieneVariaciones && (
                                    <div style={{ marginTop: '10px' }}>
                                        <label className={styles.label}>
                                            {formProducto.controlaStock ? 'Existencias Físicas o Lote' : 'Stock (Inhabilitado)'}
                                        </label>
                                        <input 
                                            type="number" 
                                            name="stockActual" 
                                            value={formProducto.controlaStock ? formProducto.stockActual : 0} 
                                            onChange={handleProductoInputChange} 
                                            className={styles.input} 
                                            disabled={!formProducto.controlaStock} 
                                            required={formProducto.controlaStock && !formProducto.tieneVariaciones} 
                                        />
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: '6px' }}>
                                <label className={styles.label}>URL Imagen o Archivo</label>
                                <input type="text" name="imagenUrl" placeholder="https://..." value={formProducto.imagenUrl} onChange={handleProductoInputChange} className={styles.input} />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={procesarSubidaImagen} 
                                    className={styles.input} 
                                    style={{ marginTop: '6px' }} 
                                    disabled={subiendoImagen}
                                />
                                {subiendoImagen && <small style={{ color: '#38bdf8', display: 'block', marginTop: '4px' }}>Subiendo imagen al servidor...</small>}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                                <button type="submit" className={`${styles.btn} ${editandoProductoId ? styles.btnWarning : styles.btnPrimary}`} style={{ flex: 1, justifyContent: 'center' }} disabled={subiendoImagen}>
                                    {editandoProductoId ? 'Actualizar Ficha' : 'Insertar'}
                                </button>
                                
                                {!editandoProductoId && (
                                    <button 
                                        type="button" 
                                        onClick={(e) => guardarProducto(e, true)} 
                                        className={styles.btn} 
                                        style={{ background: '#6366f1', color: '#fff', justifyContent: 'center' }} 
                                        title="Guarda e inicia otro producto conservando la categoría y proveedor"
                                        disabled={subiendoImagen}
                                    >
                                        <FaCopy /> Guardar y Crear Otro
                                    </button>
                                )}

                                <button type="button" onClick={() => { limpiarFormularioProducto(); setMostrarFormularioProducto(false); }} className={`${styles.btn} ${styles.btnSecondary}`}><FaTimes /></button>
                            </div>
                        </div>

                        {/* SECCIÓN DE VARIACIONES DINÁMICAS */}
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <label className={styles.checkboxLabel} style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                                <input 
                                    type="checkbox" 
                                    name="tieneVariaciones" 
                                    checked={formProducto.tieneVariaciones} 
                                    onChange={e => setFormProducto(prev => ({ ...prev, tieneVariaciones: e.target.checked }))} 
                                /> 
                                🎨 ¿Este producto tiene variaciones (colores, tamaños, modelos, etc.)?
                            </label>

                            {formProducto.tieneVariaciones && (
                                <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', marginTop: '10px', border: '1px solid #334155' }}>
                                    <h5 style={{ color: '#38bdf8', margin: '0 0 10px 0', fontSize: '0.95rem' }}>Añadir Opciones de Variación</h5>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                                        <input type="text" id="vNombre" placeholder="Nombre (Ej: Negro, 256GB, Rosa Azul)" className={styles.input} style={{ gridColumn: 'span 2' }} />
                                        <input type="number" id="vPrecioCosto" placeholder="P. Costo (C$)" className={styles.input} />
                                        <input type="number" id="vPrecioVenta" placeholder="P. Venta (C$)" className={styles.input} />
                                        <input type="number" id="vStock" placeholder="Stock Inicial" className={styles.input} />
                                        
                                        <button 
                                            type="button" 
                                            className={styles.btn} 
                                            style={{ background: '#10b981', color: '#fff', justifyContent: 'center' }}
                                            onClick={() => {
                                                const nom = (document.getElementById('vNombre') as HTMLInputElement).value;
                                                const pc = Number((document.getElementById('vPrecioCosto') as HTMLInputElement).value) || formProducto.precioCosto;
                                                const pv = Number((document.getElementById('vPrecioVenta') as HTMLInputElement).value) || formProducto.precioVenta;
                                                const stk = Number((document.getElementById('vStock') as HTMLInputElement).value) || 0;

                                                if (!nom) { alert('Escriba un nombre para la opción'); return; }

                                                setFormProducto(prev => ({
                                                    ...prev,
                                                    variaciones: [...prev.variaciones, {
                                                        nombreVariacion: nom,
                                                        color: nom,
                                                        precioCosto: pc,
                                                        precioVenta: pv,
                                                        stockActual: stk,
                                                        stockMinimo: 2,
                                                        estado: 'Activo'
                                                    }]
                                                }));

                                                (document.getElementById('vNombre') as HTMLInputElement).value = '';
                                            }}
                                        >
                                            <FaPlus /> Añadir Opción
                                        </button>
                                    </div>

                                    {formProducto.variaciones.length > 0 && (
                                        <table className={styles.table} style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                                            <thead>
                                                <tr>
                                                    <th>Opción / Presentación</th>
                                                    <th>P. Compra</th>
                                                    <th>P. Venta</th>
                                                    <th>Stock Inicial</th>
                                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formProducto.variaciones.map((v, idx) => (
                                                    <tr key={idx}>
                                                        <td><strong>{v.nombreVariacion}</strong></td>
                                                        <td>C$ {v.precioCosto}</td>
                                                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>C$ {v.precioVenta}</td>
                                                        <td>{v.stockActual} u.</td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button 
                                                                type="button" 
                                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                                onClick={() => setFormProducto(prev => ({
                                                                    ...prev,
                                                                    variaciones: prev.variaciones.filter((_, i) => i !== idx)
                                                                }))}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* SELECCIÓN DE RUBRO PRINCIPAL Y FILTROS SECUNDARIOS */}
            <div className={styles.filterCard} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    <button 
                        onClick={() => setRubroAdmin('todos')} 
                        className={styles.btn} 
                        style={{ background: rubroAdmin === 'todos' ? '#3b82f6' : '#1e293b', color: '#fff', fontSize: '0.85rem' }}
                    >
                        <FaLayerGroup /> Todos los Rubros
                    </button>
                    <button 
                        onClick={() => setRubroAdmin('fisicos')} 
                        className={styles.btn} 
                        style={{ background: rubroAdmin === 'fisicos' ? '#047688' : '#1e293b', color: '#fff', fontSize: '0.85rem' }}
                    >
                        <FaBoxes /> 📦 Productos Físicos
                    </button>
                    <button 
                        onClick={() => setRubroAdmin('digitales')} 
                        className={styles.btn} 
                        style={{ background: rubroAdmin === 'digitales' ? '#38bdf8' : '#1e293b', color: '#fff', fontSize: '0.85rem' }}
                    >
                        <FaGamepad /> 🎮 Digitales / Recargas
                    </button>
                    <button 
                        onClick={() => setRubroAdmin('streaming')} 
                        className={styles.btn} 
                        style={{ background: rubroAdmin === 'streaming' ? '#f43f5e' : '#1e293b', color: '#fff', fontSize: '0.85rem' }}
                    >
                        <FaTv /> 📺 Streaming (Suscripciones)
                    </button>
                </div>

                <div className={styles.scrollRow}>
                    <div onClick={() => setCategoriaFiltroActiva(null)} className={`${styles.pill} ${categoriaFiltroActiva === null ? styles.pillActivePurple : ''}`}><FaThList /> Todas las Categorías</div>
                    {categorias.map(c => <div key={c.id} onClick={() => setCategoriaFiltroActiva(c.id)} className={`${styles.pill} ${categoriaFiltroActiva === c.id ? styles.pillActivePurple : ''}`}>{c.nombre}</div>)}
                </div>
                <div className={styles.scrollRow}>
                    <div onClick={() => setJuegoFiltroActivo(null)} className={`${styles.pill} ${juegoFiltroActivo === null ? styles.pillActiveAmber : ''}`}>⭐ Todos los Títulos</div>
                    {juegos.map(j => <div key={j.id} onClick={() => setJuegoFiltroActivo(j.id)} className={`${styles.pill} ${juegoFiltroActivo === j.id ? styles.pillActiveAmber : ''}`}>{j.nombre}</div>)}
                </div>
            </div>

            {/* TABLA PRINCIPAL DE PRODUCTOS */}
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
                        {prodsFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                    No hay productos coincidentes dentro del rubro seleccionado.
                                </td>
                            </tr>
                        ) : (
                            prodsFiltrados.map((p) => (
                                <React.Fragment key={p.id}>
                                    <tr style={{ borderBottom: productoIdPerfilAbierto === p.id ? 'none' : '' }}>
                                        <td>{p.imagenUrl ? <img src={p.imagenUrl} alt="P" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }} /> : <FaImage style={{ color: '#475569', fontSize: '1.2rem' }} />}</td>
                                        <td 
                                            style={{ cursor: 'pointer' }} 
                                            onClick={() => abrirHistorialProducto(p)}
                                            title="Clic para ver historial de ventas de este artículo"
                                        >
                                            <strong style={{ color: '#38bdf8', textDecoration: 'underline' }}>{p.nombre}</strong><br/>
                                            <small style={{ color: '#94a3b8' }}>
                                                {p.descripcion ? (p.descripcion.length > 50 ? `${p.descripcion.substring(0, 50)}...` : p.descripcion) : 'Sin descripción'}<br/>
                                                <span style={{ color: '#0ea5e9' }}>{p.esDigital ? 'Módulo Digital' : 'Físico'}</span>
                                                {p.esSuscripcion && <span style={{ color: '#f43f5e', marginLeft: '6px', fontWeight: 'bold' }}>[📺 Streaming / Recurrente]</span>}
                                                {p.tieneVariaciones && <span style={{ color: '#f59e0b', marginLeft: '6px', fontWeight: 'bold' }}>[🎨 Variantes]</span>}
                                                <span style={{ color: p.controlaStock ? '#4ade80' : '#a855f7', marginLeft: '6px' }}>
                                                    {p.controlaStock ? '[📦 Con Inventario]' : '[♾️ Sin Stock]'}
                                                </span>
                                            </small>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>{p.tieneVariaciones ? 'Varía' : `C$ ${p.precioCosto}`}</td>
                                        <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.tieneVariaciones ? 'Varía' : `C$ ${p.precioVenta}`}</td>
                                        <td>{p.esDigital && p.esSuscripcion ? `${p.diasDuracion} días` : 'N/A'}</td>
                                        <td style={{ color: '#fb923c', fontWeight: '600' }}>
                                            <FaShieldAlt style={{ marginRight: '4px' }} />
                                            {p.garantiaDias > 0 ? `${p.garantiaDias} días` : 'Sin garantía'}
                                        </td>
                                        <td style={{ color: '#cbd5e1' }}>{p.proveedor || 'N/A'}</td>
                                        <td>
                                            <span className={styles.badge} style={{
                                                background: p.estado === 'Pausado' ? 'rgba(245, 158, 11, 0.15)' : p.estado === 'Agotado' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                                                color: p.estado === 'Pausado' ? '#f59e0b' : p.estado === 'Agotado' ? '#ef4444' : '#4ade80'
                                            }}>{p.estado || 'Activo'}</span>
                                        </td>
                                        <td style={{ color: !p.controlaStock ? '#a855f7' : p.esDigital ? '#4ade80' : '#fff', fontWeight: '600' }}>
                                            {p.tieneVariaciones 
                                                ? `${(p.variaciones || []).reduce((acc, v) => acc + (v.stockActual || 0), 0)} u. (Total)`
                                                : (p.controlaStock ? `${p.stockActual} u.` : 'N/A')}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => abrirHistorialProducto(p)} 
                                                    className={styles.btn} 
                                                    style={{ background: '#0284c7', color: '#fff', padding: '6px 10px', borderRadius: '4px' }}
                                                    title="Ver historial de ventas"
                                                >
                                                    <FaHistory />
                                                </button>

                                                {p.tieneVariaciones && (
                                                    <button 
                                                        onClick={() => abrirModalVariaciones(p)} 
                                                        className={styles.btn} 
                                                        style={{ background: '#f59e0b', color: '#000', padding: '6px 10px', borderRadius: '4px' }}
                                                        title="CRUD y Stock de Variantes"
                                                    >
                                                        <FaPalette /> Variantes ({p.variaciones?.length || 0})
                                                    </button>
                                                )}

                                                {p.esSuscripcion && (
                                                    <button onClick={() => abrirGestionPerfiles(p)} className={styles.btn} style={{ background: productoIdPerfilAbierto === p.id ? '#475569' : '#047688', color: '#fff', padding: '6px 10px', borderRadius: '4px' }}>
                                                        <FaTv /> Perfiles
                                                    </button>
                                                )}
                                                <button onClick={() => editarProducto(p)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '6px 10px', borderRadius: '4px' }} title="Editar este registro">
                                                    <FaEdit />
                                                </button>
                                                
                                                <button onClick={() => clonarProducto(p)} className={styles.btn} style={{ background: '#6366f1', color: '#fff', padding: '6px 10px', borderRadius: '4px' }} title="Duplicar ficha técnica">
                                                    <FaCopy /> Clonar
                                                </button>

                                                <button onClick={() => eliminarProducto(p.id)} className={`${styles.btn} ${styles.btnDanger}`} style={{ padding: '6px 10px', borderRadius: '4px' }} title="Eliminar del catálogo">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* PANEL DE PERFILES DE STREAMING */}
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

                                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px', background: '#1e293b', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
                                                        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <FaSearch style={{ color: '#38bdf8' }} />
                                                            <input 
                                                                type="text" 
                                                                placeholder="🔍 Buscar perfil por nombre, correo, PIN o cliente..." 
                                                                value={busquedaPerfil} 
                                                                onChange={e => setBusquedaPerfil(e.target.value)} 
                                                                className={styles.input} 
                                                                style={{ margin: 0, padding: '6px 10px', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <FaFilter style={{ color: '#f59e0b' }} />
                                                            <select 
                                                                value={ordenPerfil} 
                                                                onChange={e => setOrdenPerfil(e.target.value)} 
                                                                className={styles.select}
                                                                style={{ margin: 0, padding: '6px 10px', fontSize: '0.85rem', width: 'auto' }}
                                                            >
                                                                <option value="a-z">Ordenar: Nombre (A - Z)</option>
                                                                <option value="z-a">Ordenar: Nombre (Z - A)</option>
                                                                <option value="correo">Ordenar: Correo Electrónico</option>
                                                                <option value="disponibles">Primero Disponibles (Libres)</option>
                                                                <option value="ocupados">Primero Ocupados (Asignados)</option>
                                                            </select>
                                                        </div>

                                                        {busquedaPerfil && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => setBusquedaPerfil('')} 
                                                                className={styles.btn} 
                                                                style={{ background: '#475569', color: '#fff', padding: '4px 8px', fontSize: '0.75rem' }}
                                                            >
                                                                Limpiar Búsqueda
                                                            </button>
                                                        )}

                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto' }}>
                                                            Mostrando: <strong style={{ color: '#38bdf8' }}>{perfilesFiltradosYOrdenados.length}</strong> de {perfilesActuales.length} perfiles
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                                        {perfilesFiltradosYOrdenados.length === 0 ? (
                                                            <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '8px' }}>
                                                                No se encontraron perfiles que coincidan con el filtro.
                                                            </div>
                                                        ) : (
                                                            perfilesFiltradosYOrdenados.map((perfil) => {
                                                                const esEditando = perfilEditandoId === perfil.id;
                                                                return (
                                                                    <div key={perfil.id} style={{ background: perfil.ocupado ? '#2d1e24' : '#142820', border: '1px solid', borderColor: perfil.ocupado ? '#ef4444' : '#10b981', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                        
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                            {esEditando ? (
                                                                                <input 
                                                                                    type="text" 
                                                                                    value={perfilEditandoDatos.ExtNombrePerfil} 
                                                                                    onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} 
                                                                                    className={styles.input} 
                                                                                    style={{ padding: '2px 6px', fontSize: '0.8rem', width: '110px' }} 
                                                                                />
                                                                            ) : (
                                                                                <strong style={{ fontSize: '0.85rem' }}>{perfil.nombrePerfil}</strong>
                                                                            )}
                                                                            
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                {perfil.accountGroupKey && (
                                                                                    <div style={{ display: 'flex', alignItems: 'center', background: '#475569', borderRadius: '4px', overflow: 'hidden' }}>
                                                                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', color: '#cbd5e1' }} title={perfil.accountGroupKey}>
                                                                                            🔑 {perfil.accountGroupKey.substring(0, 8)}
                                                                                        </span>
                                                                                        {!perfil.ocupado && !esEditando && (
                                                                                            <>
                                                                                                <button 
                                                                                                    type="button" 
                                                                                                    onClick={() => removerPerfilManual(perfil.id)} 
                                                                                                    style={{ background: '#f59e0b', border: 'none', color: '#000', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRight: '1px solid #334155' }}
                                                                                                    title="Eliminar solo este perfil"
                                                                                                >
                                                                                                    <FaTrash size={10} />
                                                                                                </button>
                                                                                                <button 
                                                                                                    type="button" 
                                                                                                    onClick={() => removerCuentaCompletaManual(perfil.accountGroupKey!)} 
                                                                                                    style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                                                                    title="Eliminar Cuenta Completa (Lote)"
                                                                                                >
                                                                                                    <FaBoxes size={10} />
                                                                                                </button>
                                                             </>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                                
                                                                                {!perfil.accountGroupKey && !perfil.ocupado && !esEditando && (
                                                                                    <button type="button" onClick={() => removerPerfilManual(perfil.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash size={12} /></button>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                                                            {esEditando ? (
                                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
                                                                                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>✉️ Correo:</label>
                                                                                    <input 
                                                                                        type="email" 
                                                                                        value={perfilEditandoDatos.correoCuenta} 
                                                                                        onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, correoCuenta: e.target.value})} 
                                                                                        className={styles.input} 
                                                                                        style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
                                                                                    />
                                                                                    <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>🔒 Clave:</label>
                                                                                    <input 
                                                                                        type="text" 
                                                                                        value={perfilEditandoDatos.passwordCuenta} 
                                                                                        onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, passwordCuenta: e.target.value})} 
                                                                                        className={styles.input} 
                                                                                        style={{ padding: '2px 6px', fontSize: '0.8rem' }} 
                                                                                    />
                                                                                </div>
                                                                            ) : (
                                                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {perfil.correoCuenta}</div>
                                                                            )}
                                                                            
                                                                            <div style={{ marginTop: '4px' }}>
                                                                                🔑 PIN: {esEditando ? (
                                                                                    <input type="text" value={perfilEditandoDatos.pin} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} className={styles.input} style={{ padding: '2px 6px', fontSize: '0.8rem', width: '60px' }} maxLength={6} />
                                                                                ) : (
                                                                                    <span style={{ color: '#fb923c', fontWeight: 'bold' }}>{perfil.pin || 'Sin PIN'}</span>
                                                                                )}
                                                                            </div>

                                                                            {perfil.ocupado && (
                                                                                <div style={{ color: '#fca5a5', fontSize: '0.75rem', marginTop: '6px', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                    <span>👤 {perfil.nombreCliente || `ID: ${perfil.idClienteAsignado}`}</span>
                                                                                    <button type="button" onClick={() => liberarPerfilCliente(perfil.id)} className={styles.btn} style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', fontSize: '0.75rem' }}>Liberar</button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                                                            {esEditando ? (
                                                                                <>
                                                                                    <button type="button" onClick={guardarCambiosPerfil} className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Guardar</button>
                                                                                    <button type="button" onClick={() => setPerfilEditandoId(null)} className={`${styles.btn} ${styles.btnSecondary}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Cerrar</button>
                                                                                </>
                                                                            ) : (
                                                                                <button type="button" onClick={() => comenzarEdicionPerfil(perfil)} className={`${styles.btn} ${styles.btnWarning}`} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Editar Info</button>
                                                                            )}
                                                                        </div>

                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE HISTORIAL DE VENTAS DEL PRODUCTO */}
            {productoHistorial && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '850px', borderColor: '#38bdf8', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                                    📋 Historial de Ventas: {productoHistorial.nombre}
                                </h3>
                                <small style={{ color: '#94a3b8' }}>Registro cronológico detallado de despachos, clientes y montos facturados.</small>
                            </div>
                            <button 
                                onClick={() => setProductoHistorial(null)} 
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#0f172a', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', marginTop: '12px' }}>
                            <FaSearch style={{ color: '#38bdf8' }} />
                            <input 
                                type="text" 
                                placeholder="🔍 Buscar por fecha, factura #, cliente, cantidad, precio, subtotal, método de pago o cajero..." 
                                value={busquedaHistorial} 
                                onChange={e => setBusquedaHistorial(e.target.value)} 
                                className={styles.input} 
                                style={{ margin: 0, padding: '6px 10px', fontSize: '0.85rem', flex: 1 }}
                            />
                            {busquedaHistorial && (
                                <button 
                                    type="button" 
                                    onClick={() => setBusquedaHistorial('')} 
                                    className={styles.btn} 
                                    style={{ background: '#475569', color: '#fff', padding: '4px 8px', fontSize: '0.75rem' }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px', border: '1px solid #334155', borderRadius: '8px' }}>
                            {cargandoHistorial ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Consultando transacciones en servidor...</div>
                            ) : ventasFiltradas.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                    {busquedaHistorial ? 'No hay transacciones que coincidan con la búsqueda.' : 'No se registran ventas para este producto en la base de datos.'}
                                </div>
                            ) : (
                                <table className={styles.table} style={{ fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Factura</th>
                                            <th>Cliente</th>
                                            <th style={{ textAlign: 'center' }}>Cant.</th>
                                            <th>P. Unitario</th>
                                            <th>SubTotal</th>
                                            <th>Método Pago</th>
                                            <th>Atendió</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventasFiltradas.map((h, i) => (
                                            <tr key={i}>
                                                <td>{h.fecha}</td>
                                                <td><strong>#{h.ventaId}</strong></td>
                                                <td>
                                                    <strong>{h.clienteNombre}</strong>
                                                    {h.clienteTelefono && h.clienteTelefono !== 'N/A' && (
                                                        <small style={{ display: 'block', color: '#94a3b8' }}>Tel: {h.clienteTelefono}</small>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#4ade80' }}>{h.cantidad} u.</td>
                                                <td>C$ {h.precioUnitario}</td>
                                                <td style={{ color: '#38bdf8', fontWeight: 'bold' }}>C$ {h.subTotal}</td>
                                                <td>{h.metodoPago}</td>
                                                <td style={{ color: '#cbd5e1' }}>{h.operador}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                Mostrando: <strong style={{ color: '#38bdf8' }}>{ventasFiltradas.length}</strong> de {historialVentas.length} ventas | Total Unidades: <strong style={{ color: '#4ade80' }}>{ventasFiltradas.reduce((acc, curr) => acc + curr.cantidad, 0)} u.</strong>
                            </span>
                            <button 
                                type="button" 
                                className={`${styles.btn} ${styles.btnSecondary}`} 
                                onClick={() => setProductoHistorial(null)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CRUD INTEGRAL DE VARIACIONES */}
            {productoVariacionAbierto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: '680px', borderColor: '#38bdf8', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                                    🎨 Gestión de Variaciones: {productoVariacionAbierto.nombre}
                                </h3>
                                <small style={{ color: '#94a3b8' }}>Agrega, edita precios o existencias y elimina variaciones sin recargar el catálogo.</small>
                            </div>
                            <button 
                                onClick={() => setProductoVariacionAbierto(null)} 
                                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div style={{ background: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', margin: '14px 0' }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#4ade80', fontSize: '0.85rem' }}>➕ Crear Nueva Variación</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                                <input 
                                    type="text" 
                                    placeholder="Nombre / Opción (Ej: Azul 128GB)" 
                                    value={nuevaVarNombre} 
                                    onChange={e => setNuevaVarNombre(e.target.value)} 
                                    className={styles.input} 
                                    style={{ margin: 0, fontSize: '0.8rem', padding: '6px 8px' }} 
                                />
                                <input 
                                    type="number" 
                                    placeholder="P. Costo" 
                                    value={nuevaVarPrecioCosto} 
                                    onChange={e => setNuevaVarPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))} 
                                    className={styles.input} 
                                    style={{ margin: 0, fontSize: '0.8rem', padding: '6px 8px' }} 
                                />
                                <input 
                                    type="number" 
                                    placeholder="P. Venta" 
                                    value={nuevaVarPrecioVenta} 
                                    onChange={e => setNuevaVarPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))} 
                                    className={styles.input} 
                                    style={{ margin: 0, fontSize: '0.8rem', padding: '6px 8px' }} 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Stock" 
                                    value={nuevaVarStock} 
                                    onChange={e => setNuevaVarStock(e.target.value === '' ? '' : Number(e.target.value))} 
                                    className={styles.input} 
                                    style={{ margin: 0, fontSize: '0.8rem', padding: '6px 8px' }} 
                                />
                                <button 
                                    type="button" 
                                    onClick={agregarNuevaVariacionModal} 
                                    className={styles.btn} 
                                    style={{ background: '#10b981', color: '#fff', padding: '6px 12px', fontSize: '0.8rem' }}
                                >
                                    <FaPlus /> Añadir
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <button 
                                onClick={() => setFiltroColorVariacion('Todos')} 
                                className={styles.btn}
                                style={{
                                    padding: '4px 10px',
                                    fontSize: '0.75rem',
                                    background: filtroColorVariacion === 'Todos' ? '#3b82f6' : '#1e293b',
                                    color: '#fff'
                                }}
                            >
                                Todas ({variacionesModal.length})
                            </button>
                            
                            {Array.from(new Set(variacionesModal.map(v => v.nombreVariacion).filter(Boolean))).map((opt, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setFiltroColorVariacion(opt)}
                                    className={styles.btn}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        background: filtroColorVariacion === opt ? '#f59e0b' : '#1e293b',
                                        color: filtroColorVariacion === opt ? '#000' : '#fff'
                                    }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
                            <table className={styles.table} style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th>Variación</th>
                                        <th style={{ width: '100px' }}>P. Costo</th>
                                        <th style={{ width: '100px' }}>P. Venta</th>
                                        <th style={{ width: '110px', textAlign: 'center' }}>Stock</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {variacionesModal.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                                No hay variaciones registradas para este artículo.
                                            </td>
                                        </tr>
                                    ) : (
                                        variacionesModal
                                            .filter(v => filtroColorVariacion === 'Todos' || v.nombreVariacion === filtroColorVariacion)
                                            .map((varItem) => {
                                                const idxReal = variacionesModal.findIndex(x => x === varItem);
                                                const esEditando = variacionEditandoIdx === idxReal;

                                                return (
                                                    <tr key={idxReal} style={{ background: varItem.stockActual === 0 ? 'rgba(239, 68, 68, 0.08)' : '' }}>
                                                        <td>
                                                            {esEditando ? (
                                                                <input 
                                                                    type="text" 
                                                                    value={varItem.nombreVariacion} 
                                                                    onChange={e => guardarVariacionModal(idxReal, 'nombreVariacion', e.target.value)} 
                                                                    className={styles.input} 
                                                                    style={{ margin: 0, padding: '4px', fontSize: '0.8rem' }} 
                                                                />
                                                            ) : (
                                                                <strong>{varItem.stockActual === 0 && '⚠️ '}{varItem.nombreVariacion}</strong>
                                                            )}
                                                        </td>

                                                        <td>
                                                            {esEditando ? (
                                                                <input 
                                                                    type="number" 
                                                                    value={varItem.precioCosto} 
                                                                    onChange={e => guardarVariacionModal(idxReal, 'precioCosto', Number(e.target.value) || 0)} 
                                                                    className={styles.input} 
                                                                    style={{ margin: 0, padding: '4px', fontSize: '0.8rem' }} 
                                                                />
                                                            ) : (
                                                                <span>C$ {varItem.precioCosto}</span>
                                                            )}
                                                        </td>

                                                        <td>
                                                            {esEditando ? (
                                                                <input 
                                                                    type="number" 
                                                                    value={varItem.precioVenta} 
                                                                    onChange={e => guardarVariacionModal(idxReal, 'precioVenta', Number(e.target.value) || 0)} 
                                                                    className={styles.input} 
                                                                    style={{ margin: 0, padding: '4px', fontSize: '0.8rem' }} 
                                                                />
                                                            ) : (
                                                                <strong style={{ color: '#38bdf8' }}>C$ {varItem.precioVenta}</strong>
                                                            )}
                                                        </td>

                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#1e293b', padding: '2px 8px', borderRadius: '16px', border: '1px solid #334155' }}>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => {
                                                                        if (varItem.stockActual > 0) {
                                                                            guardarVariacionModal(idxReal, 'stockActual', varItem.stockActual - 1);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}
                                                                >
                                                                    -
                                                                </button>
                                                                
                                                                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center', color: '#fff' }}>
                                                                    {varItem.stockActual}
                                                                </span>

                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => guardarVariacionModal(idxReal, 'stockActual', varItem.stockActual + 1)}
                                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e', fontWeight: 'bold' }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>

                                                        <td style={{ textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setVariacionEditandoIdx(esEditando ? null : idxReal)} 
                                                                    style={{ background: esEditando ? '#10b981' : '#f59e0b', border: 'none', color: '#000', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                                                    title={esEditando ? "Finalizar edición" : "Editar variación"}
                                                                >
                                                                    {esEditando ? <FaSave size={11} /> : <FaEdit size={11} />}
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => eliminarVariacionModal(idxReal)} 
                                                                    style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                                                    title="Eliminar variación"
                                                                >
                                                                    <FaTrash size={11} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                className={`${styles.btn} ${styles.btnSecondary}`} 
                                onClick={() => setProductoVariacionAbierto(null)}
                            >
                                Cerrar
                            </button>

                            <button 
                                type="button" 
                                className={`${styles.btn} ${styles.btnPrimary}`} 
                                style={{ padding: '10px 18px' }}
                                onClick={guardarTodasVariacionesServidor}
                            >
                                <FaSave /> Guardar Cambios en Servidor
                            </button>
                        </div>
                    </div>
                </div>
            )}

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