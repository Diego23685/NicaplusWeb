import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    FaThLarge, 
    FaShoppingCart, 
    FaTools, 
    FaChartBar, 
    FaChartLine, 
    FaBoxOpen, 
    FaSignOutAlt, 
    FaUser, 
    FaHandHoldingUsd, 
    FaUserFriends, 
    FaTruck, 
    FaCalendarAlt, 
    FaExclamationTriangle, 
    FaShieldAlt,
    FaClipboardList,
    FaBell,
    FaTimes
} from 'react-icons/fa';
import _styles from '../components/Sidebar.module.css';
const styles = _styles as Record<string, string>;

interface SidebarProps {
    vistaActiva: string;
    setVistaActiva: (vista: 'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones') => void;
    alCerrarMovil?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ vistaActiva, setVistaActiva, alCerrarMovil }) => {
    const { usuario, logout } = useAuth();
    const rolUsuario = usuario?.rol || '';

    const navegarA = (id: any) => {
        setVistaActiva(id);
        if (alCerrarMovil) alCerrarMovil();
    };

    const renderNavButton = (
        id: any,
        icon: React.ReactNode,
        label: string
    ) => {
        const isActive = vistaActiva === id;
        return (
            <button 
                onClick={() => navegarA(id)} 
                className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    border: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                }}
            >
                <span style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
            </button>
        );
    };

    return (
        <div style={{ 
            width: '100vw', 
            maxWidth: '320px', 
            height: '100%', 
            background: '#0b0f19', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            padding: '20px 16px',
            borderRight: '1px solid #1e293b',
            boxShadow: '10px 0 30px rgba(0,0,0,0.5)'
        }}>
            {/* CABECERA MÓVIL / LOGO Y CIERRE */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                            src="/Logo.png" 
                            alt="Nicaplus Gaming" 
                            style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
                        />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
                                NICA<span style={{ color: '#38bdf8' }}>PLUS</span>
                            </h2>
                            <small style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                                Mobile ERP Suite
                            </small>
                        </div>
                    </div>

                    {alCerrarMovil && (
                        <button 
                            onClick={alCerrarMovil}
                            style={{
                                background: '#1e293b',
                                border: 'none',
                                color: '#f8fafc',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <FaTimes size={14} />
                        </button>
                    )}
                </div>

                {/* LISTA DE NAVEGACIÓN TÁCTIL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '4px' }}>
                    {renderNavButton('inicio', <FaThLarge />, 'Dashboard')}
                    
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('caja', <FaShoppingCart />, 'Ventas (POS)')}

                    {['Administrador'].includes(rolUsuario) && 
                        renderNavButton('auditoria', <FaClipboardList />, 'Auditoría')}
                    
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('taller', <FaTools />, 'Taller Técnico')}

                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('cuentas', <FaHandHoldingUsd />, 'Créditos y Deudas')}
                    
                    {['Administrador', 'Socio', 'Ventas', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('crm', <FaUserFriends />, 'Clientes (CRM)')}

                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('renovaciones', <FaCalendarAlt />, 'Renovaciones')}

                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('tickets', <FaExclamationTriangle />, 'Reclamos y Soporte')}

                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('garantias', <FaShieldAlt />, 'Bitácora Garantías')}

                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('notificaciones', <FaBell />, 'Notificaciones')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('proveedores', <FaTruck />, 'Proveedores')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('catalogos', <FaBoxOpen />, 'Inventario')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('contabilidad_caja', <FaChartBar />, 'Arqueo y Caja')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('analitica', <FaChartLine />, 'Analítica')}
                    
                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('reportes', <FaChartBar />, 'Contabilidad')}
                </div>
            </div>

            {/* SECCIÓN INFERIOR: PERFIL Y CIERRE DE SESIÓN */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    onClick={() => navegarA('perfil')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px 12px',
                        background: vistaActiva === 'perfil' ? '#1e293b' : 'transparent',
                        border: '1px solid #1e293b',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <FaUser size={14} />
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {usuario?.nombre || 'Usuario'}
                        </div>
                        <small style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                            {usuario?.rol || 'Sin Rol'}
                        </small>
                    </div>
                </button>

                <button 
                    onClick={logout} 
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    <FaSignOutAlt /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};