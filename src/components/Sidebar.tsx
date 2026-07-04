import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaThLarge, FaShoppingCart, FaTools, FaChartBar, FaBoxOpen, FaSignOutAlt, FaUser } from 'react-icons/fa';

interface SidebarProps {
    vistaActiva: string;
    setVistaActiva: (vista: 'inicio' | 'caja' | 'taller' | 'reportes' | 'catalogos' | 'perfil') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ vistaActiva, setVistaActiva }) => {
    const { usuario, logout } = useAuth();

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
            height: '100%',            /* Se adapta al 100% del contenedor padre seguro */
            maxHeight: '100vh',        /* Restringe estrictamente el límite superior */
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', /* CORREGIDO: Sintaxis válida de React/TS */
            borderRight: '1px solid #334155',
            boxSizing: 'border-box',
            overflowY: 'hidden'        /* Bloquea de raíz cualquier scroll interno en la barra */
        }}>
            <div>
                {/* LOGO / BRANDING */}
                <div style={{ marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
                    <h2 style={{ color: '#047688', margin: 0, fontSize: '1.4rem', fontWeight: '900', letterSpacing: '0.5px' }}>NICAPLUS</h2>
                    <small style={{ color: '#94a3b8', fontWeight: 'bold' }}>Gaming & Tech ERP</small>
                </div>

                {/* BOTONES DE NAVEGACIÓN */}
                <nav style={{ display: 'flex', flexDirection: 'column' }}>
                    <button 
                        onClick={() => setVistaActiva('inicio')} 
                        style={botonEstilo('inicio')}
                        onMouseEnter={(e) => { if(vistaActiva !== 'inicio') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                        onMouseLeave={(e) => { if(vistaActiva !== 'inicio') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <FaThLarge style={{ color: vistaActiva === 'inicio' ? '#FFFFFF' : '#047688' }} /> Dashboard
                    </button>
                    
                    <button 
                        onClick={() => setVistaActiva('caja')} 
                        style={botonEstilo('caja')}
                        onMouseEnter={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                        onMouseLeave={(e) => { if(vistaActiva !== 'caja') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <FaShoppingCart style={{ color: vistaActiva === 'caja' ? '#FFFFFF' : '#047688' }} /> Ventas (POS)
                    </button>
                    
                    <button 
                        onClick={() => setVistaActiva('taller')} 
                        style={botonEstilo('taller')}
                        onMouseEnter={(e) => { if(vistaActiva !== 'taller') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                        onMouseLeave={(e) => { if(vistaActiva !== 'taller') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <FaTools style={{ color: vistaActiva === 'taller' ? '#FFFFFF' : '#047688' }} /> Taller Técnico
                    </button>
                    
                    {usuario?.rol === 'Admin' && (
                        <button 
                            onClick={() => setVistaActiva('catalogos')} 
                            style={botonEstilo('catalogos')}
                            onMouseEnter={(e) => { if(vistaActiva !== 'catalogos') e.currentTarget.style.background = 'rgba(88, 28, 126, 0.2)'; }}
                            onMouseLeave={(e) => { if(vistaActiva !== 'catalogos') e.currentTarget.style.background = 'transparent'; }}
                        >
                            <FaBoxOpen style={{ color: vistaActiva === 'catalogos' ? '#FFFFFF' : '#047688' }} /> Catálogos Admin
                        </button>
                    )}
                    
                    {usuario?.rol === 'Admin' && (
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
            <div style={{ borderTop: '1px solid #334155', paddingTop: '15px' }}>
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
                            {usuario?.nombre}
                        </div>
                        <small style={{ color: '#94a3b8', display: 'block', fontWeight: '500' }}>
                            Rol: {usuario?.rol}
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