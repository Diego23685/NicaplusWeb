import React, { useState } from 'react';
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
import { Cuentas } from './views/Cuentas'; // ◄ 1. IMPORTACIÓN DE LA NUEVA VISTA
import { FaBars, FaTimes } from 'react-icons/fa';
import { ClientesCRM } from './views/ClientesCRM';
import { Proveedores } from './views/Proveedores';
import { Renovaciones } from './views/Renovaciones';
import { TicketsSoporteCRM } from './views/TicketsSoporteCRM';
import { GarantiasCRM } from './views/GarantiasCRM';
import { ContabilidadCaja } from './views/ContabilidadCaja';
import { Analitica } from './views/Analitica';
import { Auditoria } from './views/Auditoria';
import { Notificaciones } from './views/Notificaciones'; // Importación de la vista de notificaciones

const PanelLayout: React.FC = () => {
    const { usuario } = useAuth();
    
    // ◄ 2. ACTUALIZACIÓN DEL TIPO DE ESTADO (Añadido 'cuentas' y 'garantias')
    const [vistaActiva, setVistaActiva] = useState<'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones'>('inicio');
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    if (!usuario) {
        return <Login />;
    }

    return (
        <div style={{ 
            display: 'flex', 
            background: '#0f172a', 
            height: '100vh', 
            width: '100vw', 
            maxHeight: '100vh',
            maxWidth: '100vw',
            overflow: 'hidden', 
            boxSizing: 'border-box'
        }}>
            
            {/* CORRECCIÓN DE MEDIA QUERIES SINCRONIZADAS */}
            <style>{`
                @media (max-width: 913px) {
                    .sidebar-desktop { display: none !important; }
                    .header-mobile { display: flex !important; }
                    main { padding: 16px !important; }
                }
                @media (min-width: 1024px) {
                    .sidebar-mobile-overlay { display: none !important; }
                    .header-mobile { display: none !important; }
                }
            `}</style>

            {/* 1. SIDEBAR VERSIÓN ESCRITORIO (Clase corregida para ocultarse en móviles) */}
            <div className="sidebar-desktop" style={{ height: '100%', display: 'block' }}>
                <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
            </div>

            {/* 2. SIDEBAR VERSIÓN MÓVIL (CAJÓN FLOTANTE) */}
            {sidebarAbierto && (
                <div 
                    className="sidebar-mobile-overlay" 
                    style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, backdropFilter: 'blur(4px)', display: 'flex' }}
                    onClick={() => setSidebarAbierto(false)}
                >
                    <div 
                        style={{ width: '260px', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setSidebarAbierto(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10000 }}
                        >
                            <FaTimes />
                        </button>
                        <Sidebar 
                            vistaActiva={vistaActiva} 
                            setVistaActiva={(vista) => {
                                setVistaActiva(vista);
                                setSidebarAbierto(false);
                            }} 
                        />
                    </div>
                </div>
            )}

            {/* CONTENEDOR DE TRABAJO */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                
                {/* NAVBAR SUPERIOR MÓVIL */}
                <div className="header-mobile" style={{ height: '56px', background: '#1e293b', borderBottom: '1px solid #334155', alignItems: 'center', padding: '0 16px', boxSizing: 'border-box', display: 'none', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <FaBars style={{ fontSize: '1.25rem', cursor: 'pointer', color: '#38bdf8' }} onClick={() => setSidebarAbierto(true)} />
                        <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                            NICAPLUS <span style={{ color: '#38bdf8', marginLeft: '4px' }}>&gt; {vistaActiva.toUpperCase()}</span>
                        </h4>
                    </div>
                </div>

                {/* ÁREA DE CONTENIDO DINÁMICO */}
                <main style={{ flex: 1, padding: '35px', overflowY: 'auto', overflowX: 'hidden', height: '100%', boxSizing: 'border-box' }}>
                    {vistaActiva === 'inicio' && <InicioDashboard setVistaActiva={setVistaActiva} />}
                    {vistaActiva === 'caja' && <Caja />}
                    {vistaActiva === 'taller' && <Taller />}
                    {vistaActiva === 'reportes' && <Reportes />}
                    {vistaActiva === 'catalogos' && <CatalogosAdmin />}
                    {vistaActiva === 'perfil' && <PerfilUsuario />}
                    {vistaActiva === 'cuentas' && <Cuentas />} {/* ◄ 3. ENRUTAMIENTO DE LA VISTA CUENTAS */}
                    {vistaActiva === 'crm' && <ClientesCRM />}
                    {vistaActiva === 'proveedores' && <Proveedores />}
                    {vistaActiva === 'renovaciones' && <Renovaciones />}
                    {vistaActiva === 'tickets' && <TicketsSoporteCRM />}
                    {vistaActiva === 'garantias' && <GarantiasCRM />} {/* ◄ 4. ENRUTAMIENTO DE LA VISTA GARANTÍAS */}
                    {vistaActiva === 'contabilidad_caja' && <ContabilidadCaja />}
                    {vistaActiva === 'analitica' && <Analitica />}
                    {vistaActiva === 'auditoria' && <Auditoria />}
                    {vistaActiva === 'notificaciones' && <Notificaciones />} {/* ◄ 5. ENRUTAMIENTO DE LA VISTA NOTIFICACIONES */}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const params = new URLSearchParams(window.location.search);
    const esCatalogo = params.get('view') === 'catalogo';

    if (esCatalogo) {
        return <Catalogo />;
    }

    return (
        <AuthProvider>
            <PanelLayout />
        </AuthProvider>
    );
};

export default App;