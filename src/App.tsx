import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './views/Login';
import { Catalogo } from './views/Catalogo';
import { Sidebar } from './components/Sidebar';
import { InicioDashboard } from './views/InicioDashboard';
import { Caja } from './views/Caja';
import { Taller } from './views/Taller';
import { Reportes } from './views/Reportes';
import { CatalogosAdmin } from './views/CatalogosAdmin';
import { PerfilUsuario } from './views/PerfilUsuario';
import { Cuentas } from './views/Cuentas';
import { FaBars, FaTimes } from 'react-icons/fa';
import { ClientesCRM } from './views/ClientesCRM';
import { Proveedores } from './views/Proveedores';
import { Renovaciones } from './views/Renovaciones';
import { TicketsSoporteCRM } from './views/TicketsSoporteCRM';
import { GarantiasCRM } from './views/GarantiasCRM';
import { ContabilidadCaja } from './views/ContabilidadCaja';
import { Analitica } from './views/Analitica';
import { Auditoria } from './views/Auditoria';
import { Notificaciones } from './views/Notificaciones';
import { ClientesLoginRegister } from './views/ClientesLoginRegister';
import { ConfirmarEmail } from './views/ConfirmarEmail';
import { MiCuenta } from './views/MiCuenta'; // ◄ Importación de la nueva vista
import api from './services/api';

const PanelLayout: React.FC = () => {
    const { usuario } = useAuth();
    const [vistaActiva, setVistaActiva] = useState<'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones'>('inicio');
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    if (!usuario) {
        return <Login />;
    }

    return (
        <div style={{ display: 'flex', background: '#0f172a', height: '100vh', width: '100vw', overflow: 'hidden', boxSizing: 'border-box' }}>
            <style>{`
                @media (max-width: 913px) { .sidebar-desktop { display: none !important; } .header-mobile { display: flex !important; } main { padding: 16px !important; } }
                @media (min-width: 1024px) { .sidebar-mobile-overlay { display: none !important; } .header-mobile { display: none !important; } }
            `}</style>
            <div className="sidebar-desktop" style={{ height: '100%', display: 'block' }}>
                <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
            </div>
            {sidebarAbierto && (
                <div className="sidebar-mobile-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, backdropFilter: 'blur(4px)', display: 'flex' }} onClick={() => setSidebarAbierto(false)}>
                    <div style={{ width: '260px', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSidebarAbierto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000 }}><FaTimes /></button>
                        <Sidebar vistaActiva={vistaActiva} setVistaActiva={(vista) => { setVistaActiva(vista); setSidebarAbierto(false); }} />
                    </div>
                </div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="header-mobile" style={{ height: '56px', background: '#1e293b', borderBottom: '1px solid #334155', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', display: 'none', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <FaBars style={{ fontSize: '1.25rem', cursor: 'pointer', color: '#38bdf8' }} onClick={() => setSidebarAbierto(true)} />
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>NICAPLUS &gt; {vistaActiva.toUpperCase()}</h4>
                    </div>
                </div>
                <main style={{ flex: 1, padding: '35px', overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box' }}>
                    {vistaActiva === 'inicio' && <InicioDashboard setVistaActiva={setVistaActiva} />}
                    {vistaActiva === 'caja' && <Caja />}
                    {vistaActiva === 'taller' && <Taller />}
                    {vistaActiva === 'reportes' && <Reportes />}
                    {vistaActiva === 'catalogos' && <CatalogosAdmin />}
                    {vistaActiva === 'perfil' && <PerfilUsuario />}
                    {vistaActiva === 'cuentas' && <Cuentas />}
                    {vistaActiva === 'crm' && <ClientesCRM />}
                    {vistaActiva === 'proveedores' && <Proveedores />}
                    {vistaActiva === 'renovaciones' && <Renovaciones />}
                    {vistaActiva === 'tickets' && <TicketsSoporteCRM />}
                    {vistaActiva === 'garantias' && <GarantiasCRM />}
                    {vistaActiva === 'contabilidad_caja' && <ContabilidadCaja />}
                    {vistaActiva === 'analitica' && <Analitica />}
                    {vistaActiva === 'auditoria' && <Auditoria />}
                    {vistaActiva === 'notificaciones' && <Notificaciones />}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Transiciones expandidas para la tienda: catálogo, login, o mi cuenta
    const [vistaCliente, setVistaCliente] = useState<'catalogo' | 'login' | 'micuenta'>('catalogo');
    const [clienteLogueado, setClienteLogueado] = useState<any>(null);

    // Recuperar perfil en tiempo de ejecución conectando al Endpoint real de tu backend
    const cargarPerfilDesdeBackend = async (token: string) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const respuesta = await api.get('/micuenta/perfil'); // ◄ Endpoint de perfil provisto
            setClienteLogueado(respuesta.data);
        } catch (error) {
            console.error("Error cargando perfil del backend, limpiando sesión:", error);
            manejarCerrarSesionCliente();
        }
    };

    useEffect(() => {
        const tokenGuardado = localStorage.getItem('token_cliente');
        if (tokenGuardado) {
            cargarPerfilDesdeBackend(tokenGuardado);
        }
    }, []);

    const manejarCerrarSesionCliente = () => {
        localStorage.removeItem('token_cliente');
        delete api.defaults.headers.common['Authorization'];
        setClienteLogueado(null);
        setVistaCliente('catalogo');
    };

    if (hostname.startsWith('administration.')) {
        return (
            <AuthProvider>
                <PanelLayout />
            </AuthProvider>
        );
    }

    if (pathname === '/confirmar-email') {
        return (
            <AuthProvider>
                <ConfirmarEmail />
            </AuthProvider>
        );
    }

    if (vistaCliente === 'login') {
        return (
            <AuthProvider>
                <ClientesLoginRegister 
                    alVolver={() => setVistaCliente('catalogo')} 
                    alIniciarSesion={(datos) => {
                        // Si el login no trae todo el objeto, leemos directo del backend mediante el token guardado
                        const token = localStorage.getItem('token_cliente');
                        if (token) cargarPerfilDesdeBackend(token);
                        else setClienteLogueado(datos);
                    }} 
                />
            </AuthProvider>
        );
    }

    // ◄ NUEVO ENRUTAMIENTO PÚBLICO: Renderiza la vista de mi cuenta
    if (vistaCliente === 'micuenta') {
        return (
            <MiCuenta 
                alVolver={() => setVistaCliente('catalogo')}
                alCerrarSesion={manejarCerrarSesionCliente}
            />
        );
    }

    return (
        <Catalogo 
            alIrAlLogin={() => setVistaCliente('login')} 
            cliente={clienteLogueado}
            alCerrarSesion={manejarCerrarSesionCliente}
            alIrAMiCuenta={() => setVistaCliente('micuenta')} // ◄ Nueva acción enviada al catálogo
        />
    );
};

export default App;