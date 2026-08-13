import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { MiCuenta } from './views/MiCuenta';
import api from './services/api';

const PanelLayout: React.FC = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    if (!usuario) {
        return <Login />;
    }

    // Mapear la URL actual al identificador que entiende tu Sidebar
    const obtenerVistaDesdePath = (): any => {
        const path = location.pathname.replace('/', '');
        return path || 'inicio';
    };

    // Función adaptadora para que la Sidebar navegue por URL
    const cambiarVista = (nuevaVista: string) => {
        navigate(`/${nuevaVista}`);
        setSidebarAbierto(false);
    };

    return (
        <div style={{ display: 'flex', background: '#0f172a', height: '100vh', width: '100vw', boxSizing: 'border-box', overflow: 'hidden' }}>
            <style>{`
                .sidebar-desktop { display: block; height: 100%; }
                .header-mobile { display: none !important; }
                @media (max-width: 1024px) { 
                    .sidebar-desktop { display: none !important; } 
                    .header-mobile { display: flex !important; } 
                    main { padding: 16px !important; } 
                }
            `}</style>
            
            <div className="sidebar-desktop">
                <Sidebar vistaActiva={obtenerVistaDesdePath()} setVistaActiva={cambiarVista} />
            </div>

            {sidebarAbierto && (
                <div className="sidebar-mobile-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, backdropFilter: 'blur(4px)', display: 'flex' }} onClick={() => setSidebarAbierto(false)}>
                    <div style={{ width: '260px', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: '#1e293b' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSidebarAbierto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000 }}><FaTimes /></button>
                        <Sidebar vistaActiva={obtenerVistaDesdePath()} setVistaActiva={cambiarVista} />
                    </div>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="header-mobile" style={{ height: '56px', background: '#1e293b', borderBottom: '1px solid #334155', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <FaBars style={{ fontSize: '1.25rem', cursor: 'pointer', color: '#38bdf8' }} onClick={() => setSidebarAbierto(true)} />
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                            NICAPLUS &gt; {obtenerVistaDesdePath().toUpperCase()}
                        </h4>
                    </div>
                </div>
                
                {/* Definición de Rutas Internas del Panel */}
                <main style={{ flex: 1, padding: '35px', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/inicio" replace />} />
                        <Route path="/inicio" element={<InicioDashboard setVistaActiva={cambiarVista} />} />
                        <Route path="/caja" element={<Caja />} />
                        <Route path="/taller" element={<Taller />} />
                        <Route path="/reportes" element={<Reportes />} />
                        <Route path="/catalogos" element={<CatalogosAdmin />} />
                        <Route path="/perfil" element={<PerfilUsuario />} />
                        <Route path="/cuentas" element={<Cuentas />} />
                        <Route path="/crm" element={<ClientesCRM />} />
                        <Route path="/proveedores" element={<Proveedores />} />
                        <Route path="/renovaciones" element={<Renovaciones />} />
                        <Route path="/tickets" element={<TicketsSoporteCRM />} />
                        <Route path="/garantias" element={<GarantiasCRM />} />
                        <Route path="/contabilidad_caja" element={<ContabilidadCaja />} />
                        <Route path="/analitica" element={<Analitica />} />
                        <Route path="/auditoria" element={<Auditoria />} />
                        <Route path="/notificaciones" element={<Notificaciones />} />
                        {/* Redirección por defecto si la ruta no existe */}
                        <Route path="*" element={<Navigate to="/inicio" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const hostname = window.location.hostname;
    const navigate = useNavigate();
    const [clienteLogueado, setClienteLogueado] = useState<any>(null);

    const cargarPerfilDesdeBackend = async (token: string) => {
        try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const respuesta = await api.get('/micuenta/perfil');
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
        navigate('/');
    };

    // Subdominio Administrativo
    if (hostname.startsWith('administration.')) {
        return (
            <AuthProvider>
                <PanelLayout />
            </AuthProvider>
        );
    }

    // Rutas Públicas / Tienda
    return (
        <AuthProvider>
            <Routes>
                <Route path="/confirmar-email" element={<ConfirmarEmail />} />
                <Route 
                    path="/login" 
                    element={
                        <ClientesLoginRegister 
                            alVolver={() => navigate('/')} 
                            alIniciarSesion={() => {
                                const token = localStorage.getItem('token_cliente');
                                if (token) cargarPerfilDesdeBackend(token);
                                navigate('/mi-cuenta');
                            }} 
                        />
                    } 
                />
                <Route 
                    path="/mi-cuenta" 
                    element={
                        <MiCuenta 
                            alVolver={() => navigate('/')}
                            alCerrarSesion={manejarCerrarSesionCliente}
                        />
                    } 
                />
                <Route 
                    path="/*" 
                    element={
                        <Catalogo 
                            alIrAlLogin={() => navigate('/login')} 
                            cliente={clienteLogueado}
                            alCerrarSesion={manejarCerrarSesionCliente}
                            alIrAMiCuenta={() => navigate('/mi-cuenta')}
                        />
                    } 
                />
            </Routes>
        </AuthProvider>
    );
};

export default App;