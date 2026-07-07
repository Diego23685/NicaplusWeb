import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaThLarge, FaShoppingCart, FaTools, FaChartBar, FaChartLine, FaBoxOpen, FaSignOutAlt, FaUser, FaHandHoldingUsd, FaUserFriends, FaTruck, FaCalendarAlt, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';

interface SidebarProps {
    vistaActiva: string;
    setVistaActiva: (vista: 'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil' | 'cuentas' | 'crm' | 'proveedores' | 'renovaciones' | 'tickets' | 'garantias' | 'contabilidad_caja' | 'analitica' | 'auditoria' | 'notificaciones') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ vistaActiva, setVistaActiva }) => {
    const { usuario, logout } = useAuth();

    // Extraemos el rol de forma segura para TypeScript
    const rolUsuario = usuario?.rol || '';

    const botonEstilo = (id: string) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 15px',
        background: vistaActiva === id ? '#581c7e' : 'transparent',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        textAlign: 'left' as const,
        cursor: 'pointer',
        fontWeight: 'bold' as const,
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        marginBottom: '8px',
        boxSizing: 'border-box' as const
    });

    return (
        <div style={{ 
            width: '260px', 
            minWidth: '260px', 
            background: '#1e293b', 
            height: '100%',            
            maxHeight: '100vh',        
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            borderRight: '1px solid #334155',
            boxSizing: 'border-box',
            overflowY: 'auto' // Cambiado a 'auto' para evitar que se corten los botones en pantallas pequeñas
        }}>
            <div>
                {/* LOGO / BRANDING */}
                <div style={{ marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                    <h2 style={{ color: '#047688', margin: 0, fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.5px' }}>NICAPLUS</h2>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>Gaming & Tech ERP</small>
                </div>

                {/* BOTONES DE NAVEGACIÓN */}
                <nav style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* ACCESO UNIVERSAL (Todos los roles) */}
                    <button 
                        onClick={() => setVistaActiva('inicio')} 
                        style={botonEstilo('inicio')}
                        onMouseEnter={(e) => { if(vistaActiva !== 'inicio') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                        onMouseLeave={(e) => { if(vistaActiva !== 'inicio') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <FaThLarge style={{ color: vistaActiva === 'inicio' ? '#FFFFFF' : '#047688' }} /> Dashboard
                    </button>
                    
                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('caja')} 
                            style={botonEstilo('caja')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaShoppingCart style={{ color: vistaActiva === 'caja' ? '#FFFFFF' : '#047688' }} /> Ventas (POS)
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('auditoria')} 
                            style={botonEstilo('auditoria')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaShoppingCart style={{ color: vistaActiva === 'caja' ? '#FFFFFF' : '#047688' }} /> Auditoria
                        </button>
                    )}
                    
                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('taller')} 
                            style={botonEstilo('taller')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'taller') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'taller') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaTools style={{ color: vistaActiva === 'taller' ? '#FFFFFF' : '#047688' }} /> Taller Técnico
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('cuentas')} 
                            style={botonEstilo('cuentas')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'cuentas') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'cuentas') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaHandHoldingUsd style={{ color: vistaActiva === 'cuentas' ? '#FFFFFF' : '#047688' }} /> Créditos y Deudas
                        </button>
                    )}
                    
                    {/* ACCESO: Administrador, Socio, Ventas, Soporte */}
                    {['Administrador', 'Socio', 'Ventas', 'Soporte'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('crm')} 
                            style={botonEstilo('crm')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'crm') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'crm') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaUserFriends style={{ color: vistaActiva === 'crm' ? '#FFFFFF' : '#047688' }} /> Clientes (CRM)
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('renovaciones')} 
                            style={botonEstilo('renovaciones')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'renovaciones') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'renovaciones') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaCalendarAlt style={{ color: vistaActiva === 'renovaciones' ? '#FFFFFF' : '#047688' }} /> Renovaciones
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('tickets')} 
                            style={botonEstilo('tickets')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'tickets') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'tickets') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaExclamationTriangle style={{ color: vistaActiva === 'tickets' ? '#FFFFFF' : '#047688' }} /> Reclamos y Soporte
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('garantias')} 
                            style={botonEstilo('garantias')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'garantias') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'garantias') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaShieldAlt style={{ color: vistaActiva === 'garantias' ? '#FFFFFF' : '#047688' }} /> Bitácora de Garantías
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Soporte */}
                    {['Administrador', 'Socio', 'Soporte'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('notificaciones')} 
                            style={botonEstilo('notificaciones')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'notificaciones') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'notificaciones') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaExclamationTriangle style={{ color: vistaActiva === 'notificaciones' ? '#FFFFFF' : '#047688' }} /> Notificaciones
                        </button>
                    )}

                    {/* ACCESO: Administrador, Socio, Ventas */}
                    {['Administrador', 'Socio', 'Ventas'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('proveedores')} 
                            style={botonEstilo('proveedores')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'proveedores') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'proveedores') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaTruck style={{ color: vistaActiva === 'proveedores' ? '#FFFFFF' : '#047688' }} /> Proveedores
                        </button>
                    )}

                    {/* MÓDULOS EXCLUSIVOS: Administrador y Socio */}
                    {['Administrador', 'Socio'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('catalogos')} 
                            style={botonEstilo('catalogos')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'catalogos') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'catalogos') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaBoxOpen style={{ color: vistaActiva === 'catalogos' ? '#FFFFFF' : '#047688' }} /> Catálogos Admin
                        </button>
                    )}

                    {['Administrador', 'Socio'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('contabilidad_caja')} 
                            style={botonEstilo('contabilidad_caja')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'contabilidad_caja') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'contabilidad_caja') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaChartBar style={{ color: vistaActiva === 'contabilidad_caja' ? '#FFFFFF' : '#047688' }} /> Arqueo y Caja
                        </button>
                    )}

                    {['Administrador', 'Socio'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('analitica')} 
                            style={botonEstilo('analitica')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'analitica') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'analitica') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaChartLine style={{ color: vistaActiva === 'analitica' ? '#FFFFFF' : '#047688' }} /> Analítica
                        </button>
                    )}
                    
                    {['Administrador', 'Socio'].includes(rolUsuario) && (
                        <button 
                            onClick={() => setVistaActiva('reportes')} 
                            style={botonEstilo('reportes')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'reportes') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'reportes') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaChartBar style={{ color: vistaActiva === 'reportes' ? '#FFFFFF' : '#047688' }} /> Contabilidad
                        </button>
                    )}
                </nav>
            </div>

            {/* SECCIÓN INFERIOR: PERFIL Y LOGOUT */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px', marginTop: '20px' }}>
                <button 
                    onClick={() => setVistaActiva('perfil')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '10px',
                        background: vistaActiva === 'perfil' ? 'rgba(4, 118, 136, 0.15)' : 'transparent',
                        border: vistaActiva === 'perfil' ? '1px solid #047688' : '1px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '15px',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => { if(vistaActiva !== 'perfil') e.currentTarget.style.background = '#0f172a'; }}
                    onMouseLeave={(e) => { if(vistaActiva !== 'perfil') e.currentTarget.style.background = 'transparent'; }}
                >
                    <div style={{ 
                        backgroundColor: vistaActiva === 'perfil' ? '#b002c2' : '#047688', 
                        color: '#FFFFFF', 
                        padding: '8px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                    }}>
                        <FaUser size={16} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', color: '#FFFFFF', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {usuario?.nombre || 'Usuario'}
                        </div>
                        <small style={{ color: '#94a3b8', display: 'block', fontWeight: '500' }}>
                            Rol: {usuario?.rol || 'Ninguno'}
                        </small>
                    </div>
                </button>

                <button 
                    onClick={logout} 
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '10px', 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#e11d48', 
                        color: '#FFFFFF', 
                        border: 'none', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s',
                        boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
                >
                    <FaSignOutAlt /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};