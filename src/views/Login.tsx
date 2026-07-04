import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            login(res.data);
            alert(`Bienvenido, ${res.data.nombre}`);
        } catch (err: any) {
            alert(err.response?.data || 'Error al iniciar sesión');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '300px', margin: 'auto' }}>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} style={{ display: 'block', margin: '10px 0', width: '100%' }} />
                <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', margin: '10px 0', width: '100%' }} />
                <button type="submit" style={{ width: '100%' }}>Entrar</button>
            </form>
        </div>
    );
};