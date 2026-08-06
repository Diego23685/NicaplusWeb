import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './views/Login';
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
import { ConfirmarEmail } from './views/ConfirmarEmail';


const PanelLayout: React.FC = () => {
    const { usuario } = useAuth();
    const [vistaActiva, setVistaActiva] = useState<'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones'>('inicio');
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    if (!usuario) {
        return <Login />;
    }

    return (
        <div style={{ display: 'flex', background: '#0f172a', height: '100vh', width: '100vw', boxSizing: 'border-box', overflow: 'hidden' }}>
            <style>{`
                /* Vista Escritorio */
                .sidebar-desktop { display: block; height: 100%; }
                .header-mobile { display: none !important; }

                /* Vista Móvil / Tablet */
                @media (max-width: 1024px) { 
                    .sidebar-desktop { display: none !important; } 
                    .header-mobile { display: flex !important; } 
                    main { padding: 16px !important; } 
                }
            `}</style>
            
            <div className="sidebar-desktop">
                <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
            </div>

            {sidebarAbierto && (
                <div className="sidebar-mobile-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, backdropFilter: 'blur(4px)', display: 'flex' }} onClick={() => setSidebarAbierto(false)}>
                    <div style={{ width: '260px', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: '#1e293b' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSidebarAbierto(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000 }}><FaTimes /></button>
                        <Sidebar vistaActiva={vistaActiva} setVistaActiva={(vista) => { setVistaActiva(vista); setSidebarAbierto(false); }} />
                    </div>
                </div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div className="header-mobile" style={{ height: '56px', background: '#1e293b', borderBottom: '1px solid #334155', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <FaBars style={{ fontSize: '1.25rem', cursor: 'pointer', color: '#38bdf8' }} onClick={() => setSidebarAbierto(true)} />
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>NICAPLUS &gt; {vistaActiva.toUpperCase()}</h4>
                    </div>
                </div>
                
                {/* Contenedor principal con scroll independiente */}
                <main style={{ flex: 1, padding: '35px', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
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
    const pathname = window.location.pathname;

    if (pathname === '/confirmar-email') {
        return (
            <AuthProvider>
                <ConfirmarEmail />
            </AuthProvider>
        );
    }

    // Carga directa del panel de administración
    return (
        <AuthProvider>
            <PanelLayout />
        </AuthProvider>
    );
};

export default App;