import React, { createContext, useState, useContext, useEffect } from 'react';

interface UsuarioSesion {
    id: number;
    nombre: string;
    username: string;
    rol: string;
}

interface AuthContextType {
    usuario: UsuarioSesion | null;
    login: (datos: UsuarioSesion) => void;
    logout: () => void;
    cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const sesionGuardada = localStorage.getItem('nicaplus_session');
        if (sesionGuardada) {
            setUsuario(JSON.parse(sesionGuardada));
        }
        setCargando(false);
    }, []);

    const login = (datos: UsuarioSesion) => {
        setUsuario(datos);
        localStorage.setItem('nicaplus_session', JSON.stringify(datos));
    };

    const logout = () => {
        setUsuario(null);
        localStorage.removeItem('nicaplus_session');
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