import React, { useState, useEffect, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react';
import api from '../services/api';
import { 
    FaBoxOpen, FaGamepad, FaTags, FaImage, FaThList, FaEdit, FaTrash, 
    FaTimes, FaPlus, FaChevronDown, FaChevronUp, FaTruck, FaShieldAlt, 
    FaBoxes, FaSearch, FaTv, FaLayerGroup, FaCopy, FaPalette, FaSave, FaHistory,
    FaChevronLeft, FaChevronRight, FaInfoCircle, FaKey
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
    esCodigoDigital?: boolean;
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

interface CodigoDigital {
    id: number;
    idProducto: number;
    idVariacion: number | null;
    clave: string;
    vendido: boolean;
    estado: string;
    fechaVenta: string | null;
    idVenta: number | null;
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
    esCodigoDigital: false,
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

const PAGE_SIZE = 20;

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

    // ESTADO PARA LA TASA DE CAMBIO
    const [tasaCambio, setTasaCambio] = useState<number>(37);

    // PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1);

    // FORMULARIO UNIFICADO
    const [editandoProductoId, setEditandoProductoId] = useState<number | null>(null);
    const [formProducto, setFormProducto] = useState(productoFormInicial);

    // MODAL DETALLES & HISTORIAL DE VENTAS UNIFICADO
    const [productoDetalleModal, setProductoDetalleModal] = useState<Producto | null>(null);
    const [tabModal, setTabModal] = useState<'ficha' | 'historial'>('ficha');
    const [historialVentas, setHistorialVentas] = useState<HistorialVentaItem[]>([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [busquedaHistorial, setBusquedaHistorial] = useState('');

    // MODAL CRUD DE VARIACIONES
    const [productoVariacionAbierto, setProductoVariacionAbierto] = useState<Producto | null>(null);
    const [variacionesModal, setVariacionesModal] = useState<VariacionProducto[]>([]);
    const [variacionEditandoIdx, setVariacionEditandoIdx] = useState<number | null>(null);

    // FORMULARIO RÁPIDO AGREGAR VARIANTE
    const [nuevaVarNombre, setNuevaVarNombre] = useState('');
    const [nuevaVarPrecioCosto, setNuevaVarPrecioCosto] = useState<number | ''>('');
    const [nuevaVarPrecioVenta, setNuevaVarPrecioVenta] = useState<number | ''>('');
    const [nuevaVarStock, setNuevaVarStock] = useState<number | ''>('');

    // GESTIÓN DE CÓDIGOS DIGITALES
    const [productoCodigosAbierto, setProductoCodigosAbierto] = useState<Producto | null>(null);
    const [codigosActuales, setCodigosActuales] = useState<CodigoDigital[]>([]);
    const [textoBatchCodigos, setTextoBatchCodigos] = useState('');
    const [filtroEstadoCodigos, setFiltroEstadoCodigos] = useState<'disponibles' | 'todos' | 'vendidos'>('disponibles');
    const [busquedaCodigo, setBusquedaCodigo] = useState('');
    const [cargandoCodigos, setCargandoCodigos] = useState(false);

    // GESTIÓN DE PERFILES STREAMING
    const [productoPerfilAbierto, setProductoPerfilAbierto] = useState<Producto | null>(null);
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

    // MODAL DE ERRORES
    const [errorModal, setErrorModal] = useState({
        visible: false, mensaje: '', detalles: '', elementosVinculados: [] as string[]
    });

    const dispararErrorVisual = useCallback((mensaje: string, detalles: string, vinculados: string[] = []) => {
        setErrorModal({ visible: true, mensaje, detalles, elementosVinculados: vinculados });
    }, []);

    const cargarSincronizacionMaster = useCallback(async () => {
        try {
            const [resProd, resCat, resJue, resProv, resTasa] = await Promise.all([
                api.get('/products'),
                api.get('/categorias'),
                api.get('/juegos'),
                api.get('/proveedores'),
                api.get('/tasa-cambio').catch(() => ({ data: { valor: 37 } }))
            ]);
            setProductos(resProd.data || []);
            setCategorias(resCat.data || []);
            setJuegos(resJue.data || []);
            setListaProveedores(resProv.data || []);
            if (resTasa.data) {
                const val = resTasa.data.valor ?? resTasa.data.Valor ?? 37;
                setTasaCambio(Number(val));
            }
        } catch (err: any) { 
            console.error("Error al sincronizar catálogos:", err); 
            dispararErrorVisual("Error de Red", err.response?.data?.message || "No se pudo sincronizar la información del servidor central.");
        } finally {
            setCargando(false);
        }
    }, [dispararErrorVisual]);

    useEffect(() => { cargarSincronizacionMaster(); }, [cargarSincronizacionMaster]);

    const calcularDolares = (montoCordobas: number) => {
        return tasaCambio > 0 ? montoCordobas / tasaCambio : 0;
    };

    const prodsFiltrados = useMemo(() => {
        const query = filtroProd.toLowerCase().trim();
        return productos.filter(p => {
            const coincideTexto = !query || p.nombre.toLowerCase().includes(query);
            const coincideJuego = juegoFiltroActivo ? p.juegoId === juegoFiltroActivo : true;
            const coincideCategoria = categoriaFiltroActiva ? p.categoriaId === categoriaFiltroActiva : true;
            
            let coincideRubro = true;
            if (rubroAdmin === 'fisicos') coincideRubro = !p.esDigital;
            if (rubroAdmin === 'digitales') coincideRubro = p.esDigital && !p.esSuscripcion;
            if (rubroAdmin === 'streaming') coincideRubro = p.esDigital && p.esSuscripcion;

            return coincideTexto && coincideJuego && coincideCategoria && coincideRubro;
        });
    }, [productos, filtroProd, juegoFiltroActivo, categoriaFiltroActiva, rubroAdmin]);

    useEffect(() => {
        setPaginaActual(1);
    }, [filtroProd, juegoFiltroActivo, categoriaFiltroActiva, rubroAdmin]);

    const totalPaginas = Math.ceil(prodsFiltrados.length / PAGE_SIZE) || 1;
    const prodsPaginados = useMemo(() => {
        const inicio = (paginaActual - 1) * PAGE_SIZE;
        return prodsFiltrados.slice(inicio, inicio + PAGE_SIZE);
    }, [prodsFiltrados, paginaActual]);

    const codigosFiltrados = useMemo(() => {
        return codigosActuales.filter(c => {
            const coincideTexto = c.clave.toLowerCase().includes(busquedaCodigo.toLowerCase().trim());
            let coincideEstado = true;
            if (filtroEstadoCodigos === 'disponibles') coincideEstado = !c.vendido && c.estado === 'Disponible';
            if (filtroEstadoCodigos === 'vendidos') coincideEstado = c.vendido || c.estado === 'Vendido';
            return coincideTexto && coincideEstado;
        });
    }, [codigosActuales, busquedaCodigo, filtroEstadoCodigos]);

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
                nuevoEstado.esCodigoDigital = false;
                nuevoEstado.esSuscripcion = false;
                nuevoEstado.juegoId = '';
                nuevoEstado.controlaStock = true;
            }
            
            return nuevoEstado;
        });
    };

    const abrirDetalleCompleto = async (producto: Producto) => {
        setProductoDetalleModal(producto);
        setTabModal('ficha');
        setBusquedaHistorial('');
        setCargandoHistorial(true);
        try {
            const res = await api.get(`/products/${producto.id}/historial-ventas`);
            setHistorialVentas(res.data || []);
        } catch {
            setHistorialVentas([]);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const abrirModalCodigos = async (producto: Producto) => {
        setProductoCodigosAbierto(producto);
        setTextoBatchCodigos('');
        setBusquedaCodigo('');
        setFiltroEstadoCodigos('disponibles');
        setCargandoCodigos(true);

        try {
            const res = await api.get(`/CodigosDigitales/producto/${producto.id}?soloDisponibles=false`);
            setCodigosActuales(res.data || []);
        } catch (err: any) {
            dispararErrorVisual("Error al Cargar Códigos", err.response?.data?.mensaje || "No se pudo recuperar la lista de códigos.");
            setCodigosActuales([]);
        } finally {
            setCargandoCodigos(false);
        }
    };

    const guardarCodigosMasivos = async () => {
        if (!productoCodigosAbierto) return;

        const lineas = textoBatchCodigos
            .split(/[\n,]+/)
            .map(l => l.trim())
            .filter(Boolean);

        if (lineas.length === 0) {
            alert("Pegue al menos un código válido.");
            return;
        }

        try {
            const res = await api.post('/CodigosDigitales/masivo', {
                idProducto: productoCodigosAbierto.id,
                codigos: lineas
            });

            alert(res.data?.mensaje || `Se agregaron ${lineas.length} códigos con éxito.`);
            setTextoBatchCodigos('');

            const resCodigos = await api.get(`/CodigosDigitales/producto/${productoCodigosAbierto.id}?soloDisponibles=false`);
            setCodigosActuales(resCodigos.data || []);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Error al Guardar Códigos", err.response?.data?.mensaje || "No se pudieron guardar los códigos.");
        }
    };

    const abrirGestionPerfiles = async (producto: Producto) => {
        setProductoPerfilAbierto(producto);
        setPerfNombre(`Perfil ${(producto.perfilesCount ?? 0) + 1}`);
        setPerfPin('');
        setBusquedaPerfil('');
        setOrdenPerfil('a-z');
        
        try {
            const res = await api.get(`/perfilescuentas/producto/${producto.id}`);
            setPerfilesActuales(res.data || []);
            if (res.data && res.data.length > 0) {
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
        if (!window.confirm('⚠️ ¿Desea eliminar la CUENTA COMPLETA de forma irreversible?')) return;
        try {
            await api.delete(`/perfilescuentas/grupo/${accountGroupKey}`);
            if (productoPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
                setPerfilesActuales(res.data || []);
            }
        } catch (err: any) {
            dispararErrorVisual(
                "Integridad Bloqueada", 
                err.response?.data?.message || "Una o más pantallas están activas en suscripciones vigentes."
            );
        }
    };

    const guardarCambiosPerfil = async () => {
        try {
            let actualizarTodoElGrupo = false;

            if (perfilEditandoDatos.accountGroupKey) {
                actualizarTodoElGrupo = window.confirm(
                    "¿Desea aplicar este Correo y Contraseña a TODAS las pantallas que comparten esta cuenta?"
                );
            }

            await api.put(`/perfilescuentas/${perfilEditandoId}`, {
                ...perfilEditandoDatos,
                nombrePerfil: perfilEditandoDatos.ExtNombrePerfil,
                propagarGrupo: actualizarTodoElGrupo
            });

            setPerfilEditandoId(null);
            if (productoPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
                setPerfilesActuales(res.data || []);
            }
        } catch (err: any) {
            dispararErrorVisual("Error de Envío", err.response?.data?.message || "Hubo problemas al guardar el perfil.");
        }
    };

    const liberarPerfilCliente = async (idPerfil: number) => {
        if (!window.confirm("¿Quitar cliente asignado? La pantalla quedará disponible en caja inmediata.")) return;
        try {
            await api.put(`/perfilescuentas/${idPerfil}/liberar`);
            if (productoPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
                setPerfilesActuales(res.data || []);
            }
        } catch (err: any) {
            dispararErrorVisual("Error Operacional", err.response?.data?.message || "No se logró desvincular al cliente.");
        }
    };

    const agregarPerfilManual = async (e: FormEvent) => {
        e.preventDefault();
        if (!productoPerfilAbierto) return;

        try {
            await api.post('/perfilescuentas', {
                idProducto: productoPerfilAbierto.id,
                nombrePerfil: perfNombre,
                pin: perfPin || '0000',
                correoCuenta: perfCorreo,
                passwordCuenta: perfPassword,
                ocupado: false,
                idClienteAsignado: null
            });
            setPerfPin('');
            const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
            setPerfilesActuales(res.data || []);
            setPerfNombre(`Perfil ${(res.data?.length || 0) + 1}`);
        } catch (err: any) {
            dispararErrorVisual("Fallo de Registro", err.response?.data?.message || "Imposible registrar perfil.");
        }
    };

    const removerPerfilManual = async (idPerfil: number) => {
        if (!window.confirm('¿Desea eliminar la pantalla de forma irreversible?')) return;
        try {
            await api.delete(`/perfilescuentas/${idPerfil}`);
            if (productoPerfilAbierto) {
                const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
                setPerfilesActuales(res.data || []);
                setPerfNombre(`Perfil ${(res.data?.length || 0) + 1}`);
            }
        } catch (err: any) {
            dispararErrorVisual("Integridad Bloqueada", err.response?.data?.message || "El perfil se encuentra activo en una suscripción.");
        }
    };

    const agregarCuentaCompletaManual = async (e: FormEvent) => {
        e.preventDefault();
        if (!productoPerfilAbierto) return;

        try {
            await api.post('/perfilescuentas/cuenta-completa', {
                idProducto: productoPerfilAbierto.id, 
                correoCuenta: perfCorreo,
                passwordCuenta: perfPassword,
                cantidadPerfiles
            });
            setPerfCorreo('');
            setPerfPassword('');
            setCantidadPerfiles(5);
            
            const res = await api.get(`/perfilescuentas/producto/${productoPerfilAbierto.id}`);
            setPerfilesActuales(res.data || []);
        } catch (err: any) {
            dispararErrorVisual("Fallo Multipantalla", err.response?.data?.message || "No se generó el lote.");
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
            esCodigoDigital: producto.esCodigoDigital || false,
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
            esCodigoDigital: producto.esCodigoDigital || false,
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
            dispararErrorVisual("Acción Denegada", err.response?.data?.message || "Este producto tiene facturas o perfiles anclados."); 
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
            dispararErrorVisual("Error", err.response?.data?.message || "No se procesó el juego."); 
        }
    };

    const eliminarJuego = async (id: number) => {
        if (!window.confirm('¿Eliminar juego del catálogo?')) return;
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
        if (!window.confirm('¿Remover categoría?')) return;
        try {
            await api.delete(`/categorias/${id}`);
            if (categoriaFiltroActiva === id) setCategoriaFiltroActiva(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Restricción de Integridad", "Esta categoría cuenta con inventario asignado:", err.response?.data?.productos || []);
        }
    };

    const procesarSubidaImagen = async (e: ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        try {
            setSubiendoImagen(true);
            const formData = new FormData();
            formData.append('archivo', archivo);

            const res = await api.post('/uploads/producto', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data && res.data.url) {
                setFormProducto(prev => ({ ...prev, imagenUrl: res.data.url }));
            }
        } catch (err: any) {
            dispararErrorVisual(
                "Error al Subir Imagen", 
                err.response?.data?.mensaje || "No se pudo subir la imagen al servidor."
            );
        } finally {
            setSubiendoImagen(false);
            e.target.value = '';
        }
    };

    const abrirModalVariaciones = (producto: Producto) => {
        setProductoVariacionAbierto(producto);
        setVariacionesModal(producto.variaciones || []);
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
            esCodigoDigital: productoVariacionAbierto.esCodigoDigital || false,
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
            alert("Variaciones guardadas exitosamente.");
            setProductoVariacionAbierto(null);
            cargarSincronizacionMaster();
        } catch (err: any) {
            dispararErrorVisual("Error al Guardar Variaciones", err.response?.data?.mensaje || "No se pudieron actualizar las variaciones.");
        }
    };

    if (cargando) return <div className={styles.loading}>Sincronizando registros estructurales...</div>;

    return (
        <div className={styles.container}>
            {/* 1. HEADER & ACCIONES */}
            <header className={styles.header}>
                <div>
                    <h3 className={styles.title}>Catálogos Maestros</h3>
                    <p className={styles.subtitle}>Gestión de inventario físico, suscripciones y códigos digitales.</p>
                </div>
            </header>

            <div className={styles.actionRow}>
                <button 
                    onClick={() => {
                        if (mostrarFormularioProducto) limpiarFormularioProducto();
                        setMostrarFormularioProducto(!mostrarFormularioProducto);
                    }} 
                    className={`${styles.btn} ${mostrarFormularioProducto ? styles.btnSecondary : styles.btnPrimary}`}
                >
                    {mostrarFormularioProducto ? <><FaTimes /> Cerrar Formulario</> : <><FaPlus /> Nuevo Producto</>}
                </button>

                <button 
                    onClick={() => setMostrarEstructurasSecundarias(!mostrarEstructurasSecundarias)} 
                    className={`${styles.btn} ${styles.btnSecondary}`}
                >
                    <FaTags /> Categorías y Juegos {mostrarEstructurasSecundarias ? <FaChevronUp size={11}/> : <FaChevronDown size={11}/>}
                </button>
            </div>

            {/* 2. ESTRUCTURAS SECUNDARIAS */}
            {mostrarEstructurasSecundarias && (
                <div className={styles.panelSubSections}>
                    <div className={styles.panelSub}>
                        <h4 className={styles.titlePurple}><FaTags /> {editandoCategoria ? 'Modificar' : 'Crear'} Categoría</h4>
                        <form onSubmit={guardarCategoria} className={styles.formMini}>
                            <input type="text" placeholder="Nombre (Ej: Consolas)" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} className={styles.input} required />
                            <input type="text" placeholder="URL Imagen" value={categoriaImagen} onChange={e => setCategoriaImagen(e.target.value)} className={styles.input} />
                            <button type="submit" className={`${styles.btn} ${styles.btnPurple}`}>
                                {editandoCategoria ? 'Actualizar' : 'Guardar'}
                            </button>
                        </form>
                        <div className={styles.miniList}>
                            {categorias.map(({ id, nombre, imagenUrl }) => (
                                <div key={id} className={styles.miniListItem}>
                                    <span>{nombre}</span>
                                    <div className={styles.miniItemActions}>
                                        <button onClick={() => { setEditandoCategoria(id); setNuevaCategoria(nombre); setCategoriaImagen(imagenUrl); }} className={styles.btnIconEdit}><FaEdit /></button>
                                        <button onClick={() => eliminarCategoria(id)} className={styles.btnIconDelete}><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.panelSub}>
                        <h4 className={styles.titleAmber}><FaGamepad /> {editandoJuego ? 'Modificar' : 'Registrar'} Juego</h4>
                        <form onSubmit={guardarJuego} className={styles.formMini}>
                            <input type="text" placeholder="Nombre (Ej: Free Fire)" value={nuevoJuego} onChange={e => setNuevoJuego(e.target.value)} className={styles.input} required />
                            <input type="text" placeholder="URL Banner" value={juegoImagen} onChange={e => setJuegoImagen(e.target.value)} className={styles.input} />
                            <button type="submit" className={`${styles.btn} ${styles.btnAmber}`}>
                                {editandoJuego ? 'Actualizar' : 'Guardar'}
                            </button>
                        </form>
                        <div className={styles.miniList}>
                            {juegos.map(({ id, nombre, imagenUrl }) => (
                                <div key={id} className={styles.miniListItem}>
                                    <span>{nombre}</span>
                                    <div className={styles.miniItemActions}>
                                        <button onClick={() => { setEditandoJuego(id); setNuevoJuego(nombre); setJuegoImagen(imagenUrl); }} className={styles.btnIconEdit}><FaEdit /></button>
                                        <button onClick={() => eliminarJuego(id)} className={styles.btnIconDelete}><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 3. FORMULARIO PRODUCTO */}
            {mostrarFormularioProducto && (
                <div className={styles.formCard}>
                    <h4 className={styles.formCardTitle}>
                        <FaBoxOpen /> {editandoProductoId ? 'Modificar Ficha Técnica' : 'Ficha de Asignación de Producto'}
                    </h4>

                    <form onSubmit={(e) => guardarProducto(e, false)} className={styles.formGridUnified}>
                        <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nombre Comercial *</label>
                                <input type="text" name="nombre" value={formProducto.nombre} onChange={handleProductoInputChange} className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Descripción</label>
                                <textarea name="descripcion" value={formProducto.descripcion} onChange={handleProductoInputChange} placeholder="Detalles o especificaciones..." className={styles.textarea} rows={2} />
                            </div>

                            {!formProducto.tieneVariaciones && (
                                <div className={styles.formRowDual}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>P. Compra (C$)</label>
                                        <input type="number" step="any" name="precioCosto" value={formProducto.precioCosto} onChange={handleProductoInputChange} className={styles.input} required={!formProducto.tieneVariaciones} />
                                        <small style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                                            ${calcularDolares(Number(formProducto.precioCosto) || 0).toFixed(2)} USD
                                        </small>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>P. Venta (C$)</label>
                                        <input type="number" step="any" name="precioVenta" value={formProducto.precioVenta} onChange={handleProductoInputChange} className={styles.input} required={!formProducto.tieneVariaciones} />
                                        <small style={{ fontSize: '0.75rem', color: '#38bdf8', display: 'block', marginTop: '2px' }}>
                                            ${calcularDolares(Number(formProducto.precioVenta) || 0).toFixed(2)} USD
                                        </small>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Categoría *</label>
                                <select name="categoriaId" value={formProducto.categoriaId} onChange={handleProductoInputChange} className={styles.select} required>
                                    <option value="">-- Seleccionar --</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}><FaTruck /> Proveedor *</label>
                                <select name="proveedor" value={formProducto.proveedor} onChange={handleProductoInputChange} className={styles.select} required>
                                    <option value="">-- Seleccionar Proveedor --</option>
                                    {listaProveedores.map(p => <option key={p.id} value={p.razonSocial}>{p.razonSocial}</option>)}
                                </select>
                            </div>

                            <div className={styles.formRowDual}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}><FaShieldAlt /> Garantía (días)</label>
                                    <input type="number" name="garantiaDias" min={0} value={formProducto.garantiaDias} onChange={handleProductoInputChange} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Estado</label>
                                    <select name="estado" value={formProducto.estado} onChange={handleProductoInputChange} className={styles.select}>
                                        <option value="Activo">Activo</option>
                                        <option value="Pausado">Pausado</option>
                                        <option value="Agotado">Agotado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.formColumn}>
                            <div className={styles.togglesBlock}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" name="esDigital" checked={formProducto.esDigital} onChange={handleProductoInputChange} /> 🌐 ¿Es Producto Digital / Servicio?
                                </label>
                                
                                {formProducto.esDigital && (
                                    <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0' }}>
                                        <label className={styles.checkboxLabel} style={{ color: '#10b981' }}>
                                            <input 
                                                type="checkbox" 
                                                name="esCodigoDigital" 
                                                checked={formProducto.esCodigoDigital} 
                                                disabled={formProducto.esSuscripcion}
                                                onChange={e => setFormProducto(prev => ({ 
                                                    ...prev, 
                                                    esCodigoDigital: e.target.checked,
                                                    ...(e.target.checked ? { esSuscripcion: false } : {})
                                                }))} 
                                            /> 
                                            🔑 Maneja Pool de Códigos (Xbox, Steam, etc.)
                                        </label>

                                        <label className={styles.checkboxLabel} style={{ color: '#f43f5e' }}>
                                            <input 
                                                type="checkbox" 
                                                name="esSuscripcion" 
                                                checked={formProducto.esSuscripcion} 
                                                disabled={formProducto.esCodigoDigital}
                                                onChange={e => setFormProducto(prev => ({ 
                                                    ...prev, 
                                                    esSuscripcion: e.target.checked,
                                                    ...(e.target.checked ? { esCodigoDigital: false } : {})
                                                }))} 
                                            /> 
                                            🔄 Suscripción Streaming (Pantallas)
                                        </label>

                                        {formProducto.esSuscripcion && (
                                            <div className={styles.formGroup} style={{ marginTop: '4px' }}>
                                                <label className={styles.labelRed}>Días de Vigencia</label>
                                                <input type="number" name="diasDuracion" min={1} value={formProducto.diasDuracion} onChange={handleProductoInputChange} className={styles.input} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <label className={styles.checkboxLabel} style={{ color: formProducto.controlaStock ? '#4ade80' : '#94a3b8' }}>
                                    <input 
                                        type="checkbox" 
                                        name="controlaStock" 
                                        checked={formProducto.controlaStock} 
                                        disabled={formProducto.esCodigoDigital || formProducto.esSuscripcion}
                                        onChange={handleProductoInputChange} 
                                    /> 
                                    <FaBoxes size={11} /> ¿Controla Stock Numérico Físico?
                                </label>
                            </div>

                            {formProducto.esDigital && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Juego Asociado (Opcional)</label>
                                    <select name="juegoId" value={formProducto.juegoId} onChange={handleProductoInputChange} className={styles.select}>
                                        <option value="">-- Ninguno --</option>
                                        {juegos.map(j => <option key={j.id} value={j.id}>{j.nombre}</option>)}
                                    </select>
                                </div>
                            )}

                            {!formProducto.tieneVariaciones && formProducto.controlaStock && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Stock Inicial</label>
                                    <input type="number" name="stockActual" value={formProducto.stockActual} onChange={handleProductoInputChange} className={styles.input} required />
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Imagen del Producto</label>
                                <input type="file" accept="image/*" onChange={procesarSubidaImagen} className={styles.fileInput} disabled={subiendoImagen} />
                                {subiendoImagen && <small className={styles.textCyan}>Subiendo imagen...</small>}
                            </div>
                        </div>

                        {/* TOGGLE VARIACIONES */}
                        <div className={styles.variacionesSection}>
                            <label className={styles.checkboxLabelCyan}>
                                <input 
                                    type="checkbox" 
                                    name="tieneVariaciones" 
                                    checked={formProducto.tieneVariaciones} 
                                    onChange={e => setFormProducto(prev => ({ ...prev, tieneVariaciones: e.target.checked }))} 
                                /> 
                                🎨 ¿Este producto maneja múltiples variaciones?
                            </label>

                            {formProducto.tieneVariaciones && (
                                <div className={styles.variacionesPanel}>
                                    <h5 className={styles.variacionesPanelTitle}>Añadir Opciones al Producto</h5>
                                    
                                    <div className={styles.variacionesInputGrid}>
                                        <input type="text" id="vNombre" placeholder="Presentación (Ej: Azul 128GB)" className={styles.input} />
                                        <input type="number" id="vPrecioCosto" placeholder="Costo C$" className={styles.input} />
                                        <input type="number" id="vPrecioVenta" placeholder="Venta C$" className={styles.input} />
                                        <input type="number" id="vStock" placeholder="Stock" className={styles.input} />
                                        
                                        <button 
                                            type="button" 
                                            className={styles.btnAddVar}
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
                                            <FaPlus /> Añadir
                                        </button>
                                    </div>

                                    {formProducto.variaciones.length > 0 && (
                                        <div className={styles.tableResponsive}>
                                            <table className={styles.table}>
                                                <thead>
                                                    <tr>
                                                        <th>Opción</th>
                                                        <th>Compra</th>
                                                        <th>Venta</th>
                                                        <th>Stock</th>
                                                        <th style={{ textAlign: 'center' }}>Quitar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {formProducto.variaciones.map((v, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{v.nombreVariacion}</strong></td>
                                                            <td>C$ {v.precioCosto}</td>
                                                            <td className={styles.textCyan}>C$ {v.precioVenta}</td>
                                                            <td>{v.stockActual} u.</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button 
                                                                    type="button" 
                                                                    className={styles.btnIconDelete}
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
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ACCIONES FORMULARIO */}
                        <div className={styles.formFooterActions}>
                            <button type="submit" className={`${styles.btn} ${editandoProductoId ? styles.btnWarning : styles.btnPrimary}`} disabled={subiendoImagen}>
                                {editandoProductoId ? 'Actualizar Producto' : 'Guardar Producto'}
                            </button>
                            
                            {!editandoProductoId && (
                                <button 
                                    type="button" 
                                    onClick={(e) => guardarProducto(e, true)} 
                                    className={`${styles.btn} ${styles.btnIndigo}`} 
                                    disabled={subiendoImagen}
                                >
                                    <FaCopy /> Guardar y Crear Otro
                                </button>
                            )}

                            <button type="button" onClick={() => { limpiarFormularioProducto(); setMostrarFormularioProducto(false); }} className={`${styles.btn} ${styles.btnSecondary}`}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 4. FILTROS POR RUBRO Y BÚSQUEDA */}
            <div className={styles.filterSection}>
                <div className={styles.rubrosScroll}>
                    <button onClick={() => setRubroAdmin('todos')} className={`${styles.pillRubro} ${rubroAdmin === 'todos' ? styles.rubroActiveBlue : ''}`}><FaLayerGroup /> Todos</button>
                    <button onClick={() => setRubroAdmin('fisicos')} className={`${styles.pillRubro} ${rubroAdmin === 'fisicos' ? styles.rubroActiveTeal : ''}`}><FaBoxes /> Físicos</button>
                    <button onClick={() => setRubroAdmin('digitales')} className={`${styles.pillRubro} ${rubroAdmin === 'digitales' ? styles.rubroActiveCyan : ''}`}><FaGamepad /> Digitales / Códigos</button>
                    <button onClick={() => setRubroAdmin('streaming')} className={`${styles.pillRubro} ${rubroAdmin === 'streaming' ? styles.rubroActiveRose : ''}`}><FaTv /> Streaming</button>
                </div>

                <div className={styles.pillsScroll}>
                    <button onClick={() => setCategoriaFiltroActiva(null)} className={`${styles.pillMini} ${categoriaFiltroActiva === null ? styles.pillActivePurple : ''}`}><FaThList /> Categorías</button>
                    {categorias.map(c => <button key={c.id} onClick={() => setCategoriaFiltroActiva(c.id)} className={`${styles.pillMini} ${categoriaFiltroActiva === c.id ? styles.pillActivePurple : ''}`}>{c.nombre}</button>)}
                </div>

                <div className={styles.pillsScroll}>
                    <button onClick={() => setJuegoFiltroActivo(null)} className={`${styles.pillMini} ${juegoFiltroActivo === null ? styles.pillActiveAmber : ''}`}>⭐ Títulos</button>
                    {juegos.map(j => <button key={j.id} onClick={() => setJuegoFiltroActivo(j.id)} className={`${styles.pillMini} ${juegoFiltroActivo === j.id ? styles.pillActiveAmber : ''}`}>{j.nombre}</button>)}
                </div>

                <div className={styles.searchBox}>
                    <FaSearch className={styles.searchIcon} />
                    <input type="text" placeholder="Buscar producto..." value={filtroProd} onChange={e => setFiltroProd(e.target.value)} className={styles.searchInput} />
                    {filtroProd && <button onClick={() => setFiltroProd('')} className={styles.clearSearchBtn}><FaTimes /></button>}
                </div>
            </div>

            {/* 5. VISTA MÓVIL / TABLET: FEED DE CARDS CON ACCIONES ERGONÓMICAS */}
            <div className={styles.mobileCardsFeed}>
                {prodsPaginados.length === 0 ? (
                    <div className={styles.emptyText}>No hay productos coincidentes.</div>
                ) : (
                    prodsPaginados.map(p => {
                        const precioDolarMob = calcularDolares(p.precioVenta);
                        return (
                            <div key={p.id} className={styles.productCardTouch}>
                                <div className={styles.productCardTop} onClick={() => abrirDetalleCompleto(p)} title="Clic para ver ficha técnica completa e historial">
                                    <div className={styles.productImgWrap}>
                                        {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} className={styles.productImg} loading="lazy" /> : <FaImage className={styles.noImgIcon} />}
                                    </div>
                                    <div className={styles.productDetailsWrap}>
                                        <strong className={styles.productTitle}>{p.nombre}</strong>
                                        <div className={styles.productBadgesRow}>
                                            <span className={styles.badgeType}>
                                                {p.esDigital ? (p.esSuscripcion ? '📺 Streaming' : (p.esCodigoDigital ? '🔑 Códigos' : '🎮 Digital')) : '📦 Físico'}
                                            </span>
                                            {p.tieneVariaciones && <span className={styles.badgeVar}>🎨 Variantes</span>}
                                            <span className={styles.badgeHint}><FaInfoCircle size={10} /> Ficha</span>
                                        </div>
                                        <div className={styles.productPricesRow}>
                                            <span className={styles.priceSale}>
                                                {p.tieneVariaciones ? 'Varía' : `C$ ${p.precioVenta.toLocaleString()} / $${precioDolarMob.toFixed(2)}`}
                                            </span>
                                            <small className={styles.productStockText}>
                                                Stock: <strong style={{ color: p.stockActual > 0 ? '#4ade80' : '#ef4444' }}>
                                                    {p.tieneVariaciones 
                                                        ? `${(p.variaciones || []).reduce((acc, v) => acc + (v.stockActual || 0), 0)} u.` 
                                                        : (p.controlaStock || p.esCodigoDigital ? `${p.stockActual} u.` : 'Infinito')}
                                                </strong>
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN REDISEÑADOS PARA MÓVIL */}
                                <div className={styles.productCardActions} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(65px, 1fr))', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                                    {p.esDigital && p.esCodigoDigital && !p.esSuscripcion && (
                                        <button 
                                            onClick={() => abrirModalCodigos(p)} 
                                            className={styles.btn} 
                                            style={{ background: '#10b981', color: '#fff', fontSize: '0.8rem', padding: '8px 6px', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold' }}
                                            title="Pool de Códigos"
                                        >
                                            <FaKey /> ({p.stockActual})
                                        </button>
                                    )}

                                    {p.tieneVariaciones && (
                                        <button 
                                            onClick={() => abrirModalVariaciones(p)} 
                                            className={styles.btn} 
                                            style={{ background: '#f59e0b', color: '#000', fontSize: '0.8rem', padding: '8px 6px', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold' }}
                                            title="Variaciones"
                                        >
                                            <FaPalette /> ({p.variaciones?.length || 0})
                                        </button>
                                    )}

                                    {p.esSuscripcion && (
                                        <button 
                                            onClick={() => abrirGestionPerfiles(p)} 
                                            className={styles.btn} 
                                            style={{ background: '#047688', color: '#fff', fontSize: '0.8rem', padding: '8px 6px', justifyContent: 'center', borderRadius: '8px', fontWeight: 'bold' }}
                                            title="Pantallas Streaming"
                                        >
                                            <FaTv /> Pantallas
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => editarProducto(p)} 
                                        className={styles.btn} 
                                        style={{ background: '#3b82f6', color: '#fff', fontSize: '0.85rem', padding: '8px', justifyContent: 'center', borderRadius: '8px' }} 
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </button>

                                    <button 
                                        onClick={() => clonarProducto(p)} 
                                        className={styles.btn} 
                                        style={{ background: '#6366f1', color: '#fff', fontSize: '0.85rem', padding: '8px', justifyContent: 'center', borderRadius: '8px' }} 
                                        title="Clonar"
                                    >
                                        <FaCopy />
                                    </button>

                                    <button 
                                        onClick={() => eliminarProducto(p.id)} 
                                        className={styles.btn} 
                                        style={{ background: '#ef4444', color: '#fff', fontSize: '0.85rem', padding: '8px', justifyContent: 'center', borderRadius: '8px' }} 
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 6. VISTA ESCRITORIO CON ACCIONES EN FILA */}
            <div className={styles.desktopTableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>Foto</th>
                            <th>Producto (Clic para detalles)</th>
                            <th style={{ width: '150px' }}>P. Venta</th>
                            <th style={{ width: '110px' }}>Stock</th>
                            <th style={{ width: '220px', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {prodsPaginados.map((p) => {
                            const ventaDolarDesk = calcularDolares(p.precioVenta);
                            return (
                                <tr key={p.id}>
                                    <td onClick={() => abrirDetalleCompleto(p)} style={{ cursor: 'pointer' }}>
                                        {p.imagenUrl ? <img src={p.imagenUrl} alt="P" className={styles.tableImg} loading="lazy" /> : <FaImage className={styles.noImgIcon} />}
                                    </td>
                                    <td onClick={() => abrirDetalleCompleto(p)} className={styles.tdLink}>
                                        <strong className={styles.textHoverCyan}>{p.nombre}</strong>
                                        <small className={styles.textMuted} style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                                            <span>{p.esDigital ? (p.esSuscripcion ? '📺 Streaming' : (p.esCodigoDigital ? '🔑 Pool Códigos' : '🎮 Digital')) : '📦 Físico'}</span>
                                            {p.tieneVariaciones && <span className={styles.badgeVar}>🎨 Variantes</span>}
                                            <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}><FaInfoCircle size={11}/> Ver Ficha Completa</span>
                                        </small>
                                    </td>
                                    <td className={styles.textCyan}>
                                        <strong style={{ fontSize: '1.05rem' }}>
                                            {p.tieneVariaciones ? 'Varía' : `C$ ${p.precioVenta.toLocaleString()}`}
                                        </strong>
                                        {!p.tieneVariaciones && (
                                            <small style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8' }}>
                                                ${ventaDolarDesk.toFixed(2)} USD
                                            </small>
                                        )}
                                    </td>
                                    <td>
                                        <strong style={{ color: p.stockActual > 0 ? '#4ade80' : '#ef4444' }}>
                                            {p.tieneVariaciones 
                                                ? `${(p.variaciones || []).reduce((acc, v) => acc + (v.stockActual || 0), 0)} u.` 
                                                : (p.controlaStock || p.esCodigoDigital ? `${p.stockActual} u.` : 'Infinito')}
                                        </strong>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={styles.tableActionsRow} style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                            {p.esDigital && p.esCodigoDigital && !p.esSuscripcion && (
                                                <button 
                                                    onClick={() => abrirModalCodigos(p)} 
                                                    className={styles.btnIconAction} 
                                                    style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)' }} 
                                                    title="Gestionar Códigos"
                                                >
                                                    <FaKey size={13} />
                                                </button>
                                            )}
                                            {p.tieneVariaciones && (
                                                <button onClick={() => abrirModalVariaciones(p)} className={styles.btnIconAmber} title="Variaciones">
                                                    <FaPalette size={13} />
                                                </button>
                                            )}
                                            {p.esSuscripcion && (
                                                <button onClick={() => abrirGestionPerfiles(p)} className={styles.btnIconTeal} title="Perfiles">
                                                    <FaTv size={13} />
                                                </button>
                                            )}
                                            <button onClick={() => editarProducto(p)} className={styles.btnIconAction} title="Editar">
                                                <FaEdit size={13} />
                                            </button>
                                            <button onClick={() => clonarProducto(p)} className={styles.btnIconAction} title="Clonar">
                                                <FaCopy size={13} />
                                            </button>
                                            <button onClick={() => eliminarProducto(p.id)} className={styles.btnIconDelete} title="Eliminar">
                                                <FaTrash size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 7. CONTROLES DE PAGINACIÓN */}
            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '12px 16px', borderRadius: '12px', border: '1px solid #334155', marginTop: '10px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> ({prodsFiltrados.length} artículos)
                    </small>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                            onClick={() => { setPaginaActual(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={paginaActual === 1}
                            className={styles.btn}
                            style={{ background: '#0f172a', border: '1px solid #334155', padding: '6px 14px', opacity: paginaActual === 1 ? 0.4 : 1, minHeight: '38px', minWidth: '44px', flex: 'none' }}
                        >
                            <FaChevronLeft />
                        </button>
                        <button 
                            onClick={() => { setPaginaActual(prev => Math.min(prev + 1, totalPaginas)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            disabled={paginaActual === totalPaginas}
                            className={styles.btn}
                            style={{ background: '#0f172a', border: '1px solid #334155', padding: '6px 14px', opacity: paginaActual === totalPaginas ? 0.4 : 1, minHeight: '38px', minWidth: '44px', flex: 'none' }}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}

            {/* =========================================================
            MODAL CÓDIGOS DIGITALES (COMPACTO Y PROPORCIONADO)
            ========================================================= */}
            {productoCodigosAbierto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentWide} style={{ maxWidth: '650px', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
                        <div className={styles.modalHeader} style={{ paddingBottom: '8px' }}>
                            <h3 className={styles.modalTitle} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                <FaKey /> Códigos: {productoCodigosAbierto.nombre}
                            </h3>
                            <button onClick={() => setProductoCodigosAbierto(null)} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>

                        {/* SECCIÓN DE CARGA COMPACTA */}
                        <div className={styles.panelMiniLoad} style={{ margin: '6px 0', padding: '10px 12px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                📥 Pegar Códigos / Licencias (Uno por línea o separados por coma):
                            </label>
                            <textarea 
                                rows={2}
                                placeholder="XXXXX-XXXXX-XXXXX-XXXXX&#10;YYYYY-YYYYY-YYYYY-YYYYY"
                                value={textoBatchCodigos}
                                onChange={e => setTextoBatchCodigos(e.target.value)}
                                className={styles.textarea}
                                style={{ fontFamily: 'monospace', fontSize: '0.8rem', padding: '6px 8px', marginBottom: '8px', minHeight: '60px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Detectados: <strong style={{ color: '#10b981' }}>{textoBatchCodigos.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length}</strong>
                                </span>
                                <button 
                                    type="button" 
                                    onClick={guardarCodigosMasivos} 
                                    style={{
                                        background: '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        flex: 'none'
                                    }}
                                >
                                    <FaPlus size={10} /> Agregar al Stock
                                </button>
                            </div>
                        </div>

                        {/* FILTROS Y BÚSQUEDA */}
                        <div className={styles.perfilesSearchRow} style={{ margin: '4px 0', gap: '6px' }}>
                            <div className={styles.searchBox} style={{ minHeight: '38px', flex: 1 }}>
                                <FaSearch className={styles.searchIcon} size={12} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar serial..." 
                                    value={busquedaCodigo} 
                                    onChange={e => setBusquedaCodigo(e.target.value)} 
                                    className={styles.searchInput} 
                                    style={{ fontSize: '0.8rem' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flex: 'none' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setFiltroEstadoCodigos('disponibles')} 
                                    className={`${styles.pillMini} ${filtroEstadoCodigos === 'disponibles' ? styles.pillActivePurple : ''}`}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                    Disponibles ({codigosActuales.filter(c => !c.vendido && c.estado === 'Disponible').length})
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setFiltroEstadoCodigos('vendidos')} 
                                    className={`${styles.pillMini} ${filtroEstadoCodigos === 'vendidos' ? styles.pillActiveAmber : ''}`}
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                    Vendidos ({codigosActuales.filter(c => c.vendido || c.estado === 'Vendido').length})
                                </button>
                            </div>
                        </div>

                        {/* TABLA DE SERIALES */}
                        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', marginTop: '6px' }}>
                            {cargandoCodigos ? (
                                <div className={styles.loading}>Cargando códigos...</div>
                            ) : codigosFiltrados.length === 0 ? (
                                <div className={styles.emptyText} style={{ padding: '16px' }}>No hay códigos registrados con este criterio.</div>
                            ) : (
                                <table className={styles.table} style={{ fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>#</th>
                                            <th>Clave / Serial</th>
                                            <th style={{ width: '100px' }}>Estado</th>
                                            <th style={{ width: '90px' }}>Factura</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {codigosFiltrados.map((cod, i) => (
                                            <tr key={cod.id} style={{ background: cod.vendido ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
                                                <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                                                <td><strong style={{ fontFamily: 'monospace', color: cod.vendido ? '#94a3b8' : '#4ade80', fontSize: '0.85rem' }}>{cod.clave}</strong></td>
                                                <td>
                                                    <span className={styles.badge} style={{ background: cod.vendido ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)', color: cod.vendido ? '#ef4444' : '#4ade80', padding: '2px 6px', fontSize: '0.7rem' }}>
                                                        {cod.vendido ? 'Vendido' : 'Disponible'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#38bdf8' }}>{cod.idVenta ? `#${cod.idVenta}` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* FOOTER COMPACTO */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '8px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Stock disponible: <strong style={{ color: '#10b981' }}>{codigosActuales.filter(c => !c.vendido && c.estado === 'Disponible').length} códigos</strong>
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setProductoCodigosAbierto(null)}
                                style={{
                                    background: '#334155',
                                    color: '#f8fafc',
                                    border: 'none',
                                    padding: '6px 18px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    flex: 'none'
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
               MODAL ADAPTABLE: FICHA TÉCNICA / HISTORIAL DE VENTAS
               ========================================================= */}
            {productoDetalleModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentWide} style={{ maxWidth: '750px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        
                        <div className={styles.modalHeader}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {productoDetalleModal.imagenUrl ? (
                                        <img src={productoDetalleModal.imagenUrl} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <FaImage style={{ color: '#475569', fontSize: '1.4rem' }} />
                                    )}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h3 className={styles.modalTitle} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {productoDetalleModal.nombre}
                                    </h3>
                                    <small style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                        {productoDetalleModal.esDigital ? (productoDetalleModal.esSuscripcion ? 'Streaming' : (productoDetalleModal.esCodigoDigital ? 'Pool Códigos' : 'Digital')) : 'Artículo Físico'} • Estado: <strong style={{ color: productoDetalleModal.estado === 'Activo' ? '#4ade80' : '#f59e0b' }}>{productoDetalleModal.estado}</strong>
                                    </small>
                                </div>
                            </div>
                            <button onClick={() => setProductoDetalleModal(null)} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>

                        <div style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '6px', borderRadius: '10px', border: '1px solid #334155', margin: '4px 0 10px 0' }}>
                            <button
                                type="button"
                                onClick={() => setTabModal('ficha')}
                                style={{
                                    flex: 1,
                                    minHeight: '44px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: tabModal === 'ficha' ? '#0284c7' : 'transparent',
                                    color: tabModal === 'ficha' ? '#fff' : '#94a3b8',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                📋 Ficha Técnica
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabModal('historial')}
                                style={{
                                    flex: 1,
                                    minHeight: '44px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: tabModal === 'historial' ? '#0284c7' : 'transparent',
                                    color: tabModal === 'historial' ? '#fff' : '#94a3b8',
                                    fontWeight: 800,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <FaHistory /> Historial ({historialVentas.length})
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                            {tabModal === 'ficha' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', background: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                                        <div>
                                            <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>PRECIO COSTO</small>
                                            <h4 style={{ margin: '2px 0 0 0', color: '#cbd5e1', fontSize: '1.2rem', fontWeight: 800 }}>
                                                {productoDetalleModal.tieneVariaciones ? 'Varía' : `C$ ${productoDetalleModal.precioCosto.toLocaleString()}`}
                                            </h4>
                                            {!productoDetalleModal.tieneVariaciones && (
                                                <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>${calcularDolares(productoDetalleModal.precioCosto).toFixed(2)} USD</small>
                                            )}
                                        </div>

                                        <div>
                                            <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>PRECIO VENTA</small>
                                            <h4 style={{ margin: '2px 0 0 0', color: '#38bdf8', fontSize: '1.2rem', fontWeight: 900 }}>
                                                {productoDetalleModal.tieneVariaciones ? 'Varía' : `C$ ${productoDetalleModal.precioVenta.toLocaleString()}`}
                                            </h4>
                                            {!productoDetalleModal.tieneVariaciones && (
                                                <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>${calcularDolares(productoDetalleModal.precioVenta).toFixed(2)} USD</small>
                                            )}
                                        </div>

                                        {!productoDetalleModal.tieneVariaciones && (
                                            <div>
                                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>MARGEN ESTIMADO</small>
                                                <h4 style={{ margin: '2px 0 0 0', color: '#4ade80', fontSize: '1.2rem', fontWeight: 800 }}>
                                                    C$ {(productoDetalleModal.precioVenta - productoDetalleModal.precioCosto).toLocaleString()}
                                                </h4>
                                                <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>${calcularDolares(productoDetalleModal.precioVenta - productoDetalleModal.precioCosto).toFixed(2)} USD</small>
                                            </div>
                                        )}

                                        <div>
                                            <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>STOCK ACTUAL</small>
                                            <h4 style={{ margin: '2px 0 0 0', color: '#f8fafc', fontSize: '1.2rem', fontWeight: 800 }}>
                                                {productoDetalleModal.tieneVariaciones 
                                                    ? `${(productoDetalleModal.variaciones || []).reduce((acc, v) => acc + (v.stockActual || 0), 0)} u.` 
                                                    : (productoDetalleModal.controlaStock || productoDetalleModal.esCodigoDigital ? `${productoDetalleModal.stockActual} u.` : 'Infinito')}
                                            </h4>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#1e293b', padding: '12px', borderRadius: '10px', border: '1px solid #334155' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                                            <div>
                                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FaTruck /> PROVEEDOR</small>
                                                <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{productoDetalleModal.proveedor || 'No especificado'}</strong>
                                            </div>

                                            <div>
                                                <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FaShieldAlt /> GARANTÍA</small>
                                                <strong style={{ color: '#fb923c', fontSize: '0.95rem' }}>{productoDetalleModal.garantiaDias > 0 ? `${productoDetalleModal.garantiaDias} días` : 'Sin garantía'}</strong>
                                            </div>

                                            {productoDetalleModal.esDigital && productoDetalleModal.esSuscripcion && (
                                                <div>
                                                    <small style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FaTv /> VIGENCIA STREAMING</small>
                                                    <strong style={{ color: '#f43f5e', fontSize: '0.95rem' }}>{productoDetalleModal.diasDuracion} días</strong>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ borderTop: '1px solid #334155', paddingTop: '8px' }}>
                                            <small style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>DESCRIPCIÓN TÉCNICA / NOTAS</small>
                                            <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.45' }}>
                                                {productoDetalleModal.descripcion || 'Sin descripción detallada.'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {tabModal === 'historial' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div className={styles.searchBox} style={{ minHeight: '48px' }}>
                                        <FaSearch className={styles.searchIcon} />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar cliente, cajero o factura #..." 
                                            value={busquedaHistorial} 
                                            onChange={e => setBusquedaHistorial(e.target.value)} 
                                            className={styles.searchInput} 
                                        />
                                        {busquedaHistorial && <button onClick={() => setBusquedaHistorial('')} className={styles.clearSearchBtn}><FaTimes /></button>}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {cargandoHistorial ? (
                                            <div className={styles.loading}>Cargando ventas...</div>
                                        ) : ventasFiltradas.length === 0 ? (
                                            <div className={styles.emptyText}>No hay registros de ventas para este artículo.</div>
                                        ) : (
                                            ventasFiltradas.map((h, i) => {
                                                const unitDolarHist = calcularDolares(h.precioUnitario);
                                                const subDolarHist = calcularDolares(h.subTotal);
                                                return (
                                                    <div key={i} className={styles.saleItemCard}>
                                                        <div className={styles.saleItemHeader}>
                                                            <strong>Factura #{h.ventaId}</strong>
                                                            <span className={styles.saleDate}>{h.fecha}</span>
                                                        </div>
                                                        <div className={styles.saleItemDetails}>
                                                            <span style={{ fontWeight: 700 }}>👤 {h.clienteNombre} ({h.clienteTelefono || 'Sin teléfono'})</span>
                                                            <div className={styles.salePriceRow}>
                                                                <span>{h.cantidad}x C$ {h.precioUnitario.toLocaleString()} (${unitDolarHist.toFixed(2)})</span>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <strong className={styles.textCyan} style={{ fontSize: '1.05rem' }}>Total: C$ {h.subTotal.toLocaleString()}</strong>
                                                                    <small style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>${subDolarHist.toFixed(2)} USD</small>
                                                                </div>
                                                            </div>
                                                            <small className={styles.textMuted}>Pago: {h.metodoPago} • Atendió: {h.operador}</small>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #334155', paddingTop: '10px', marginTop: '6px' }}>
                            <button 
                                type="button" 
                                className={`${styles.btn} ${styles.btnSecondary}`} 
                                style={{ minHeight: '48px', flex: 'none', padding: '0 24px', fontSize: '0.95rem' }}
                                onClick={() => setProductoDetalleModal(null)}
                            >
                                Cerrar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PANTALLAS STREAMING */}
            {productoPerfilAbierto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentWide}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}><FaTv /> Pantallas: {productoPerfilAbierto.nombre}</h3>
                            <button onClick={() => setProductoPerfilAbierto(null)} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>

                        <div className={styles.panelMiniLoad}>
                            <div className={styles.tabsModoIngreso}>
                                <button type="button" onClick={() => setModoIngreso('individual')} className={`${styles.btnTabModo} ${modoIngreso === 'individual' ? styles.btnTabModoActive : ''}`}>👤 Individual</button>
                                <button type="button" onClick={() => setModoIngreso('completa')} className={`${styles.btnTabModo} ${modoIngreso === 'completa' ? styles.btnTabModoActive : ''}`}>📺 Lote Completo</button>
                            </div>

                            {modoIngreso === 'individual' ? (
                                <form onSubmit={agregarPerfilManual} className={styles.formPerfilesGrid}>
                                    <input type="text" value={perfNombre} onChange={e => setPerfNombre(e.target.value)} className={styles.input} placeholder="Nombre Perfil" required />
                                    <input type="text" value={perfPin} onChange={e => setPerfPin(e.target.value)} className={styles.input} placeholder="PIN" maxLength={6} />
                                    <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} placeholder="Correo Cuenta" required />
                                    <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} placeholder="Contraseña" required />
                                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}><FaPlus /> Añadir</button>
                                </form>
                            ) : (
                                <form onSubmit={agregarCuentaCompletaManual} className={styles.formPerfilesGrid}>
                                    <input type="email" value={perfCorreo} onChange={e => setPerfCorreo(e.target.value)} className={styles.input} placeholder="Correo Electrónico" required />
                                    <input type="text" value={perfPassword} onChange={e => setPerfPassword(e.target.value)} className={styles.input} placeholder="Clave Global" required />
                                    <input type="number" value={cantidadPerfiles} onChange={e => setCantidadPerfiles(Number(e.target.value))} className={styles.input} min={1} max={10} placeholder="Cant. Pantallas" />
                                    <button type="submit" className={`${styles.btn} ${styles.btnIndigo}`}><FaTv /> Auto-generar</button>
                                </form>
                            )}
                        </div>

                        <div className={styles.perfilesSearchRow}>
                            <div className={styles.searchBox}>
                                <FaSearch className={styles.searchIcon} />
                                <input type="text" placeholder="Buscar perfil, correo, cliente o PIN..." value={busquedaPerfil} onChange={e => setBusquedaPerfil(e.target.value)} className={styles.searchInput} />
                            </div>
                            <select value={ordenPerfil} onChange={e => setOrdenPerfil(e.target.value)} className={styles.selectAuto}>
                                <option value="a-z">A - Z</option>
                                <option value="z-a">Z - A</option>
                                <option value="disponibles">Libres primero</option>
                                <option value="ocupados">Ocupados primero</option>
                            </select>
                        </div>

                        <div className={styles.perfilesGrid}>
                            {perfilesFiltradosYOrdenados.map((perfil) => {
                                const esEditando = perfilEditandoId === perfil.id;
                                return (
                                    <div key={perfil.id} className={`${styles.perfilCard} ${perfil.ocupado ? styles.perfilOcupado : styles.perfilLibre}`}>
                                        <div className={styles.perfilCardHeader}>
                                            {esEditando ? (
                                                <input type="text" value={perfilEditandoDatos.ExtNombrePerfil} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, ExtNombrePerfil: e.target.value})} className={styles.inputMini} />
                                            ) : (
                                                <strong>{perfil.nombrePerfil}</strong>
                                            )}
                                            
                                            <div className={styles.perfilActionsTop}>
                                                {perfil.accountGroupKey && !perfil.ocupado && !esEditando && (
                                                    <button type="button" onClick={() => removerCuentaCompletaManual(perfil.accountGroupKey!)} className={styles.btnIconDelete} title="Eliminar Lote"><FaBoxes size={11} /></button>
                                                )}
                                                {!perfil.ocupado && !esEditando && (
                                                    <button type="button" onClick={() => removerPerfilManual(perfil.id)} className={styles.btnIconDelete} title="Eliminar"><FaTrash size={11} /></button>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.perfilDetails}>
                                            {esEditando ? (
                                                <div className={styles.perfilEditInputs}>
                                                    <input type="email" value={perfilEditandoDatos.correoCuenta} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, correoCuenta: e.target.value})} className={styles.inputMini} />
                                                    <input type="text" value={perfilEditandoDatos.passwordCuenta} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, passwordCuenta: e.target.value})} className={styles.inputMini} />
                                                    <input type="text" value={perfilEditandoDatos.pin} onChange={e => setPerfilEditandoDatos({...perfilEditandoDatos, pin: e.target.value})} className={styles.inputMini} maxLength={6} placeholder="PIN" />
                                                </div>
                                            ) : (
                                                <>
                                                    <small className={styles.textEllipsis}>✉️ {perfil.correoCuenta}</small>
                                                    <small>🔑 PIN: <strong className={styles.textOrange}>{perfil.pin || '0000'}</strong></small>
                                                </>
                                            )}

                                            {perfil.ocupado && (
                                                <div className={styles.ocupadoBox}>
                                                    <span>👤 {perfil.nombreCliente || `Cliente #${perfil.idClienteAsignado}`}</span>
                                                    <button type="button" onClick={() => liberarPerfilCliente(perfil.id)} className={styles.btnLiberar}>Liberar</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.perfilCardFooter}>
                                            {esEditando ? (
                                                <>
                                                    <button type="button" onClick={guardarCambiosPerfil} className={styles.btnSaveMini}>Guardar</button>
                                                    <button type="button" onClick={() => setPerfilEditandoId(null)} className={styles.btnCancelMini}>Cerrar</button>
                                                </>
                                            ) : (
                                                <button type="button" onClick={() => comenzarEdicionPerfil(perfil)} className={styles.btnEditMini}>Editar</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VARIACIONES */}
            {productoVariacionAbierto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentWide}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}><FaPalette /> Variantes: {productoVariacionAbierto.nombre}</h3>
                            <button onClick={() => setProductoVariacionAbierto(null)} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>

                        <div className={styles.addVarBox}>
                            <input type="text" placeholder="Opción (Ej: 128GB Negro)" value={nuevaVarNombre} onChange={e => setNuevaVarNombre(e.target.value)} className={styles.input} />
                            <div className={styles.addVarInputsRow}>
                                <input type="number" placeholder="Costo" value={nuevaVarPrecioCosto} onChange={e => setNuevaVarPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                                <input type="number" placeholder="Venta" value={nuevaVarPrecioVenta} onChange={e => setNuevaVarPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                                <input type="number" placeholder="Stock" value={nuevaVarStock} onChange={e => setNuevaVarStock(e.target.value === '' ? '' : Number(e.target.value))} className={styles.input} />
                                <button type="button" onClick={agregarNuevaVariacionModal} className={`${styles.btn} ${styles.btnPrimary}`}><FaPlus /> Añadir</button>
                            </div>
                        </div>

                        <div className={styles.variationsListScroll}>
                            {variacionesModal.map((varItem, idxReal) => {
                                const esEditando = variacionEditandoIdx === idxReal;
                                const costoVarModalDolar = calcularDolares(varItem.precioCosto);
                                const ventaVarModalDolar = calcularDolares(varItem.precioVenta);

                                return (
                                    <div key={idxReal} className={styles.varCardTouch}>
                                        <div className={styles.varCardTop}>
                                            {esEditando ? (
                                                <input type="text" value={varItem.nombreVariacion} onChange={e => guardarVariacionModal(idxReal, 'nombreVariacion', e.target.value)} className={styles.inputMini} />
                                            ) : (
                                                <strong>{varItem.nombreVariacion}</strong>
                                            )}
                                            
                                            <div className={styles.miniItemActions}>
                                                <button type="button" onClick={() => setVariacionEditandoIdx(esEditando ? null : idxReal)} className={styles.btnIconEdit}>{esEditando ? <FaSave /> : <FaEdit />}</button>
                                                <button type="button" onClick={() => eliminarVariacionModal(idxReal)} className={styles.btnIconDelete}><FaTrash /></button>
                                            </div>
                                        </div>

                                        <div className={styles.varCardDetailsRow}>
                                            <div>
                                                <small>Costo: </small>
                                                {esEditando ? <input type="number" value={varItem.precioCosto} onChange={e => guardarVariacionModal(idxReal, 'precioCosto', Number(e.target.value) || 0)} className={styles.inputMini} /> : (
                                                    <span>C$ {varItem.precioCosto} <small style={{ color: '#94a3b8' }}>(${costoVarModalDolar.toFixed(2)})</small></span>
                                                )}
                                            </div>
                                            <div>
                                                <small>Venta: </small>
                                                {esEditando ? <input type="number" value={varItem.precioVenta} onChange={e => guardarVariacionModal(idxReal, 'precioVenta', Number(e.target.value) || 0)} className={styles.inputMini} /> : (
                                                    <strong className={styles.textCyan}>C$ {varItem.precioVenta} <small style={{ color: '#94a3b8', fontWeight: 'normal' }}>(${ventaVarModalDolar.toFixed(2)})</small></strong>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.varStockCounterRow}>
                                            <small>Existencias:</small>
                                            <div className={styles.counterWrap}>
                                                <button type="button" onClick={() => varItem.stockActual > 0 && guardarVariacionModal(idxReal, 'stockActual', varItem.stockActual - 1)} className={styles.btnCounterMinus}>-</button>
                                                <span className={styles.counterValue}>{varItem.stockActual}</span>
                                                <button type="button" onClick={() => guardarVariacionModal(idxReal, 'stockActual', varItem.stockActual + 1)} className={styles.btnCounterPlus}>+</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.modalFooterActions}>
                            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setProductoVariacionAbierto(null)}>Cerrar</button>
                            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={guardarTodasVariacionesServidor}><FaSave /> Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE ERRORES */}
            {errorModal.visible && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentError}>
                        <div className={styles.modalHeader}>
                            <h4 className={styles.titleRed}><FaTimes /> {errorModal.mensaje}</h4>
                            <button onClick={() => setErrorModal(prev => ({ ...prev, visible: false }))} className={styles.modalCloseBtn}><FaTimes /></button>
                        </div>
                        <p className={styles.errorDesc}>{errorModal.detalles}</p>
                        {errorModal.elementosVinculados.length > 0 && (
                            <div className={styles.linkedItemsBox}>
                                {errorModal.elementosVinculados.map((item, idx) => (
                                    <div key={idx} className={styles.linkedItem}>{item}</div>
                                ))}
                            </div>
                        )}
                        <div className={styles.modalActionsEnd}>
                            <button onClick={() => setErrorModal(prev => ({ ...prev, visible: false }))} className={`${styles.btn} ${styles.btnSecondary}`}>Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};