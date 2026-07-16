// src/components/Cargando.tsx
import React from 'react';
import '../assets/styles/Cargando/Cargando.css';

interface CargandoProps {
    username: string;
}

export const Cargando: React.FC<CargandoProps> = ({ username }) => {
    return (
        <div className="loading-viewport">
            <div className="loading-wrapper">
                {/* Estructura del cargador futurista */}
                <div className="loader-portal">
                    <div className="portal-ring ring-outer"></div>
                    <div className="portal-ring ring-middle"></div>
                    <div className="portal-ring ring-inner"></div>
                    <div className="portal-core"></div>
                </div>
                
                <div className="loading-text-container">
                    <h2 className="access-granted">ACCESO CONCEDIDO</h2>
                    <p className="welcome-user">Bienvenido, <span className="highlight-user">{username}</span></p>
                    <div className="status-bar">
                        <div className="status-progress"></div>
                    </div>
                    <span className="loading-subtext">Sincronizando base de datos...</span>
                </div>
            </div>
        </div>
    );
};