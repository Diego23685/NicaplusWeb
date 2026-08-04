import React, { useState, useEffect } from 'react';
import '../assets/styles/Cargando/Cargando.css';

interface CargandoProps {
    username?: string;
    mensajeInicial?: string;
    progreso?: number; // Opcional: de 0 a 100 si deseas progreso real
}

const MENSAJES_SISTEMA = [
    'Sincronizando base de datos...',
    'Verificando privilegios de acceso...',
    'Cargando módulos del sistema...',
    'Inicializando panel de control...'
];

export const Cargando: React.FC<CargandoProps> = ({ 
    username = 'Usuario', 
    mensajeInicial,
    progreso 
}) => {
    const [mensajeIndex, setMensajeIndex] = useState(0);

    // Rotación de mensajes de estado si no se especifica uno fijo
    useEffect(() => {
        if (mensajeInicial) return;

        const interval = setInterval(() => {
            setMensajeIndex((prev) => (prev + 1) % MENSAJES_SISTEMA.length);
        }, 1200);

        return () => clearInterval(interval);
    }, [mensajeInicial]);

    const textoEstado = mensajeInicial || MENSAJES_SISTEMA[mensajeIndex];

    return (
        <div className="loading-viewport" role="status" aria-live="polite">
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
                    <p className="welcome-user">
                        Bienvenido, <span className="highlight-user">{username}</span>
                    </p>
                    
                    <div className="status-bar">
                        <div 
                            className="status-progress"
                            style={progreso !== undefined ? { width: `${progreso}%` } : undefined}
                        ></div>
                    </div>

                    <div className="loading-subtext-wrapper">
                        <span className="loading-subtext">{textoEstado}</span>
                        {progreso !== undefined && (
                            <span className="loading-percentage">{progreso}%</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};