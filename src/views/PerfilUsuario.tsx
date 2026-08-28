import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaSave, FaUserPlus } from 'react-icons/fa';
import api from '../services/api';

export const PerfilUsuario: React.FC = () => {
    const { usuario } = useAuth();
    const [tasaValor, setTasaValor] = useState<number | ''>(37);
    const [cargandoTasa, setCargandoTasa] = useState<boolean>(true);
    const [guardandoTasa, setGuardandoTasa] = useState<boolean>(false);
    const [mensajeExito, setMensajeExito] = useState<string | null>(null);

    // Estados para el formulario de registro de nuevos usuarios
    const [nombreNuevo, setNombreNuevo] = useState<string>('');
    const [usernameNuevo, setUsernameNuevo] = useState<string>('');
    const [passwordNuevo, setPasswordNuevo] = useState<string>('');
    const [idRolNuevo, setIdRolNuevo] = useState<number>(3); // Por defecto Ventas (ID 3)
    const [registrandoUsuario, setRegistrandoUsuario] = useState<boolean>(false);
    const [mensajeRegistro, setMensajeRegistro] = useState<{ texto: string; error: boolean } | null>(null);

    useEffect(() => {
        api.get('/tasa-cambio')
            .then(res => {
                if (res.data) {
                    const val = res.data.valor ?? res.data.Valor ?? 37;
                    setTasaValor(Number(val));
                }
            })
            .catch(err => console.error("Error al obtener la tasa de cambio:", err))
            .finally(() => setCargandoTasa(false));
    }, []);

    const actualizarTasaCambio = async (e: React.FormEvent) => {
        e.preventDefault();
        if (tasaValor === '' || Number(tasaValor) <= 0) {
            alert("Ingrese un valor de tasa de cambio válido mayor a cero.");
            return;
        }

        setGuardandoTasa(true);
        setMensajeExito(null);

        try {
            await api.put('/tasa-cambio', { valor: Number(tasaValor) });
            setMensajeExito("¡Tasa de cambio actualizada con éxito!");
            setTimeout(() => setMensajeExito(null), 4000);
        } catch (err: any) {
            console.error("Error al actualizar la tasa de cambio:", err);
            alert(err.response?.data?.mensaje || "No se pudo actualizar la tasa de cambio.");
        } finally {
            setGuardandoTasa(false);
        }
    };

    const registrarUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombreNuevo || !usernameNuevo || !passwordNuevo) {
            setMensajeRegistro({ texto: "Todos los campos son obligatorios.", error: true });
            return;
        }

        setRegistrandoUsuario(true);
        setMensajeRegistro(null);

        try {
            await api.post('/api/Auth/register', {
                nombre: nombreNuevo,
                username: usernameNuevo,
                password: passwordNuevo,
                idRol: Number(idRolNuevo)
            });

            setMensajeRegistro({ texto: "¡Usuario registrado con éxito!", error: false });
            setNombreNuevo('');
            setUsernameNuevo('');
            setPasswordNuevo('');
            setIdRolNuevo(3);
            setTimeout(() => setMensajeRegistro(null), 4000);
        } catch (err: any) {
            console.error("Error al registrar usuario:", err);
            const errorMsg = err.response?.data?.mensaje || err.response?.data || "No se pudo registrar el usuario.";
            setMensajeRegistro({ texto: typeof errorMsg === 'string' ? errorMsg : "Error al registrar usuario.", error: true });
        } finally {
            setRegistrandoUsuario(false);
        }
    };

    if (!usuario) {
        return <p style={{ color: '#94a3b8' }}>No hay datos de sesión activos.</p>;
    }

    const esAdministrador = usuario.rol === 'Administrador';

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

                {/* SECCIÓN CONFIGURACIÓN TASA DE CAMBIO */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', marginBottom: '10px' }}>💱 Tasa de Cambio Oficial (Córdobas a Dólares)</h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>
                        Actualiza el valor de conversión que se aplicará en todo el sistema para mostrar precios duales.
                    </p>

                    {cargandoTasa ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Cargando tasa actual...</p>
                    ) : (
                        <form onSubmit={actualizarTasaCambio} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <input 
                                    type="number" 
                                    step="any"
                                    min="0.01"
                                    value={tasaValor} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => setTasaValor(e.target.value === '' ? '' : Number(e.target.value))} 
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '12px', color: '#fff', fontSize: '1rem' }}
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={guardandoTasa}
                                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: guardandoTasa ? 0.6 : 1 }}
                            >
                                <FaSave /> {guardandoTasa ? 'Guardando...' : 'Actualizar Tasa'}
                            </button>
                        </form>
                    )}

                    {mensajeExito && (
                        <div style={{ marginTop: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#4ade80', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            {mensajeExito}
                        </div>
                    )}
                </div>

                {/* SECCIÓN REGISTRO DE NUEVOS USUARIOS (EXCLUSIVO ADMINISTRADOR) */}
                {esAdministrador && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: '#38bdf8', marginBottom: '10px' }}>👥 Registrar Nuevo Usuario</h3>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>
                            Crea credenciales de acceso para nuevos colaboradores asignando su respectivo rol en el sistema.
                        </p>

                        <form onSubmit={registrarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 'bold' }}>Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={nombreNuevo} 
                                    onChange={e => setNombreNuevo(e.target.value)} 
                                    placeholder="Ej. Juan Pérez"
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '0.95rem' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 'bold' }}>Nombre de Usuario (Username)</label>
                                <input 
                                    type="text" 
                                    value={usernameNuevo} 
                                    onChange={e => setUsernameNuevo(e.target.value)} 
                                    placeholder="Ej. jperez"
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '0.95rem' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 'bold' }}>Contraseña</label>
                                <input 
                                    type="password" 
                                    value={passwordNuevo} 
                                    onChange={e => setPasswordNuevo(e.target.value)} 
                                    placeholder="••••••••"
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '0.95rem' }}
                                    required 
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px', fontWeight: 'bold' }}>Rol del Sistema</label>
                                <select 
                                    value={idRolNuevo} 
                                    onChange={e => setIdRolNuevo(Number(e.target.value))}
                                    style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '0.95rem' }}
                                >
                                    <option value={1}>1 - Administrador</option>
                                    <option value={2}>2 - Socio</option>
                                    <option value={3}>3 - Ventas</option>
                                    <option value={4}>4 - Soporte</option>
                                </select>
                            </div>

                            <button 
                                type="submit" 
                                disabled={registrandoUsuario}
                                style={{ marginTop: '5px', background: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: registrandoUsuario ? 0.6 : 1 }}
                            >
                                <FaUserPlus /> {registrandoUsuario ? 'Registrando...' : 'Registrar Usuario'}
                            </button>
                        </form>

                        {mensajeRegistro && (
                            <div style={{ marginTop: '10px', background: mensajeRegistro.error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: mensajeRegistro.error ? '#f87171' : '#4ade80', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {mensajeRegistro.texto}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};