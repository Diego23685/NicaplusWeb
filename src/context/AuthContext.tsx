import React, { createContext, useState, useContext, useEffect } from 'react';

interface UsuarioSesion {
    id: number;
    nombre: string;
    username: string;
    rol: string;
}

interface AuthContextType {
    usuario: UsuarioSesion | null;
    login: (token: string) => void; // Cambiado de UsuarioSesion a string
    logout: () => void;
    cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('nicaplus_token');
        if (token) {
            try {
                // Decodificar token para restaurar sesión al recargar
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUsuario({
                    id: parseInt(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]),
                    nombre: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
                    username: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"], // Ajusta si el nombre de usuario es distinto
                    rol: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
                });
            } catch (e) {
                localStorage.removeItem('nicaplus_token');
            }
        }
        setCargando(false);
    }, []);

    const login = (token: string) => {
        localStorage.setItem('nicaplus_token', token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        setUsuario({
            id: parseInt(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]),
            nombre: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            username: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            rol: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        });
    };

    const logout = () => {
        setUsuario(null);
        localStorage.removeItem('nicaplus_token');
    };

    return (
        <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
};