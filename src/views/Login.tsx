import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { login } = useAuth();

    // Captura las coordenadas del cursor en pantalla
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data);
            alert(`Bienvenido, ${res.data.nombre}`);
        } catch (err: any) {
            alert(err.response?.data || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Animación interactiva de seguimiento del cursor */}
            <div 
                className="cursor-glow" 
                style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }} 
            />

            <div className="login-card">
                {/* Panel Izquierdo: Gráficos orgánicos e Identidad */}
                <div className="login-aside">
                    <div className="blob blob-1" />
                    <div className="blob blob-2" />
                    <h1 className="aside-title">
                        NicaPlus<br /><span>Gaming</span>
                    </h1>
                    <p className="aside-subtitle">Control de Ventas e Inventario</p>
                </div>

                {/* Panel Derecho: Formulario de Login */}
                <div className="login-main">
                    <h2 className="form-title">Iniciar Sesión</h2>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="form-input"
                                placeholder="Introduce tu usuario"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="form-input"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-submit">
                            {isLoading ? 'Autenticando...' : 'Entrar al Sistema'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};