import React, { createContext, useState, useContext, useEffect } from 'react';

// Estructura adaptada para ambos tipos de usuario
interface UsuarioSesion {
    id: number;
    nombre: string;
    email?: string;
    username?: string;
    rol?: string;
    tipoUsuario: 'Staff' | 'Cliente'; // Para saber qué paneles mostrar en el Front
}

interface AuthContextType {
    usuario: UsuarioSesion | null;
    login: (token: string) => void;
    logout: () => void;
    cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
    const [cargando, setCargando] = useState(true);

    // Función auxiliar para parsear el JWT de forma segura
    const mapearUsuarioDesdeToken = (token: string): UsuarioSesion | null => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Leemos tu claim personalizado del backend
            const tipoUsuario = payload["TipoUsuario"] || 'Staff'; 
            const id = parseInt(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
            const nombre = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

            if (tipoUsuario === 'Cliente') {
                return {
                    id,
                    nombre,
                    email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
                    tipoUsuario: 'Cliente'
                };
            } else {
                return {
                    id,
                    nombre,
                    username: nombre,
                    rol: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
                    tipoUsuario: 'Staff'
                };
            }
        } catch (e) {
            return null;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('nicaplus_token');
        if (token) {
            const usuarioMapeado = mapearUsuarioDesdeToken(token);
            if (usuarioMapeado) {
                setUsuario(usuarioMapeado);
            } else {
                localStorage.removeItem('nicaplus_token');
            }
        }
        setCargando(false);
    }, []);

    const login = (token: string) => {
        localStorage.setItem('nicaplus_token', token);
        const usuarioMapeado = mapearUsuarioDesdeToken(token);
        setUsuario(usuarioMapeado);
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