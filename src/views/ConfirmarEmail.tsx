import { useEffect, useState, useRef } from 'react';
import api from '../services/api';

export const ConfirmarEmail = () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    const [estado, setEstado] = useState<'cargando' | 'exito' | 'error'>('cargando');
    const [mensaje, setMensaje] = useState('Verificando tu cuenta de correo...');
    
    // ◄ CANDADO DE CONTEXTO REAL: Se mantiene persistente entre los reinicios de React
    const peticionEnCurso = useRef(false);

    useEffect(() => {
        const verificarToken = async () => {
            if (!token) {
                setEstado('error');
                setMensaje('Falta el token de confirmación en la URL.');
                return;
            }

            // Si ya se está procesando o ya tuvo éxito, bloqueamos ejecuciones fantasma
            if (peticionEnCurso.current) return;
            peticionEnCurso.current = true;

            try {
                const respuesta = await api.get(`/Auth/confirmar-email?token=${token}`);
                
                setEstado('exito');
                setMensaje(respuesta.data?.mensaje || '¡Cuenta activada con éxito!');
                
                setTimeout(() => {
                    window.location.href = '/'; 
                }, 3500);

            } catch (error: any) {
                // ◄ AQUÍ ESTÁ EL TRUCO: Si por alguna razón la primera petición ya tuvo éxito, 
                // ignoramos por completo el error de la segunda petición simultánea del StrictMode.
                setEstado((estadoActual) => {
                    if (estadoActual === 'exito') return 'exito'; // Conserva el éxito

                    // Si de verdad falló a la primera, entonces sí muestra el error
                    if (error.response?.data) {
                        setMensaje(typeof error.response.data === 'string' ? error.response.data : 'El enlace no es válido o ya ha expirado.');
                    } else {
                        setMensaje('El enlace no es válido o ya ha expirado.');
                    }
                    return 'error';
                });
            }
        };

        verificarToken();
    }, [token]);

    return (
        <div style={estilos.contenedor}>
            <div style={estilos.tarjeta}>
                {estado === 'cargando' && <div style={estilos.iconoCarga}>⏳</div>}
                {estado === 'exito' && <div style={estilos.iconoExito}>✅</div>}
                {estado === 'error' && <div style={estilos.iconoError}>❌</div>}
                
                <h2 style={estilos.titulo}>
                    {estado === 'cargando' && 'Procesando...'}
                    {estado === 'exito' && '¡Excelente!'}
                    {estado === 'error' && 'Hubo un problema'}
                </h2>
                <p style={estilos.texto}>{mensaje}</p>

                {estado === 'exito' && (
                    <p style={estilos.subtexto}>Redirigiéndote a la tienda...</p>
                )}
            </div>
        </div>
    );
};

const estilos: { [key: string]: React.CSSProperties } = {
    contenedor: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', width: '100vw', background: '#0f172a', fontFamily: 'sans-serif'
    },
    tarjeta: {
        background: '#1e293b', padding: '40px', borderRadius: '12px',
        textAlign: 'center', maxWidth: '400px', width: '90%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)'
    },
    titulo: { color: '#fff', marginBottom: '10px' },
    texto: { color: '#94a3b8', fontSize: '16px', lineHeight: '1.5' },
    subtexto: { color: '#b002c2', fontSize: '14px', marginTop: '15px', fontWeight: 'bold' },
    iconoCarga: { fontSize: '45px', marginBottom: '15px' },
    iconoExito: { fontSize: '45px', marginBottom: '15px', color: '#4ade80' },
    iconoError: { fontSize: '45px', marginBottom: '15px', color: '#f87171' }
};