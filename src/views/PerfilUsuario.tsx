import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle } from 'react-icons/fa';

export const PerfilUsuario: React.FC = () => {
    const { usuario } = useAuth();

    if (!usuario) {
        return <p style={{ color: '#94a3b8' }}>No hay datos de sesión activos.</p>;
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: '#1e293b', padding: '30px', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '25px' }}>
                <FaUserCircle size={60} style={{ color: '#38bdf8' }} />
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#f8fafc' }}>Mi Perfil</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Gestiona los datos de tu cuenta en Nicaplus</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>ID de Usuario</label>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155', fontSize: '1rem', color: '#cbd5e1' }}>
                        {usuario.id}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nombre Completo</label>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155', fontSize: '1rem', color: '#cbd5e1' }}>
                        {usuario.nombre}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Nombre de Usuario (Username)</label>
                    <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155', fontSize: '1rem', color: '#cbd5e1' }}>
                        {usuario.username}
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '5px', fontWeight: 'bold', textTransform: 'uppercase' }}>Rol Asignado</label>
                    <div style={{ display: 'inline-block', background: '#581c7e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#f472b6' }}>
                        {usuario.rol}
                    </div>
                </div>
            </div>
        </div>
    );
};