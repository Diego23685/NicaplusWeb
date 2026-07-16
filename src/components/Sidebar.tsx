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
    FaBell
} from 'react-icons/fa';
import _styles from '../components/Sidebar.module.css';
const styles = _styles as Record<string, string>;

interface SidebarProps {
    vistaActiva: string;
    setVistaActiva: (vista: 'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ vistaActiva, setVistaActiva }) => {
    const { usuario, logout } = useAuth();
    const rolUsuario = usuario?.rol || '';

    // Función auxiliar para renderizar los botones de forma limpia
    const renderNavButton = (
        id: 'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones',
        icon: React.ReactNode,
        label: string
    ) => {
        const isActive = vistaActiva === id;
        return (
            <button 
                onClick={() => setVistaActiva(id)} 
                className={`${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
            >
                <span className={styles.iconTeal}>{icon}</span>
                {label}
            </button>
        );
    };

    return (
        <div className={styles.sidebar}>
            <div>
                {/* LOGO / BRANDING */}
                <div className={styles.branding}>
                    <div className={styles.brandLogoContainer}>
                        <div className={styles.brandLogo}>N+</div>
                        <div>
                            <h2 className={styles.brandTitle}>
                                NICA<span className={styles.brandTeal}>PLUS</span>
                            </h2>
                            <small className={styles.brandSubtitle}>
                                Gaming & Tech ERP
                            </small>
                        </div>
                    </div>
                </div>

                {/* BOTONES DE NAVEGACIÓN */}
                <nav className={styles.nav}>
                    {/* ACCESO UNIVERSAL (Todos los roles) */}
                    {renderNavButton('inicio', <FaThLarge />, 'Dashboard')}
                    
                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('caja', <FaShoppingCart />, 'Ventas (POS)')}

                    {/* ACCESO: Solo Administrador (Auditoría) */}
                    {['Administrador'].includes(rolUsuario) && 
                        renderNavButton('auditoria', <FaClipboardList />, 'Auditoría')}
                    
                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('taller', <FaTools />, 'Taller Técnico')}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('cuentas', <FaHandHoldingUsd />, 'Créditos y Deudas')}
                    
                    {/* ACCESO: Administrador, Socio, Ventas, Soporte */}
                    {['Administrador', 'Socio', 'Ventas', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('crm', <FaUserFriends />, 'Clientes (CRM)')}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('renovaciones', <FaCalendarAlt />, 'Renovaciones')}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('tickets', <FaExclamationTriangle />, 'Reclamos y Soporte')}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('garantias', <FaShieldAlt />, 'Bitácora Garantías')}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && 
                        renderNavButton('notificaciones', <FaBell />, 'Notificaciones')}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && 
                        renderNavButton('proveedores', <FaTruck />, 'Proveedores')}

                    {/* MÓDULOS EXCLUSIVOS: Administrador y Socio */}
                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('catalogos', <FaBoxOpen />, 'Catálogos Admin')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('contabilidad_caja', <FaChartBar />, 'Arqueo y Caja')}

                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('analitica', <FaChartLine />, 'Analítica')}
                    
                    {['Administrador', 'Socio'].includes(rolUsuario) && 
                        renderNavButton('reportes', <FaChartBar />, 'Contabilidad')}
                </nav>
            </div>

            {/* SECCIÓN INFERIOR: PERFIL Y LOGOUT */}
            <div className={styles.footer}>
                <button 
                    onClick={() => setVistaActiva('perfil')}
                    className={`${styles.profileButton} ${vistaActiva === 'perfil' ? styles.profileButtonActive : ''}`}
                >
                    <div className={styles.profileAvatar}>
                        <FaUser size={15} />
                    </div>
                    <div className={styles.profileInfo}>
                        <div className={styles.profileName}>
                            {usuario?.nombre || 'Usuario'}
                        </div>
                        <small className={styles.profileRol}>
                            {usuario?.rol || 'Sin Rol'}
                        </small>
                    </div>
                </button>

                <button onClick={logout} className={styles.logoutButton}>
                    <FaSignOutAlt style={{ fontSize: '1rem' }} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};