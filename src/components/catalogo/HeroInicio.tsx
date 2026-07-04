import React from 'react';

interface HeroInicioProps {
    setSeccionActiva: (seccion: 'inicio' | 'nosotros' | 'productos' | 'contacto') => void;
}

export const HeroInicio: React.FC<HeroInicioProps> = ({ setSeccionActiva }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '50px' }}>
            
            {/* TÍTULO HERO CON DISEÑO LLAMATIVO */}
            <h2 style={{ 
                fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
                fontSize: '3.6rem', 
                fontWeight: '900', 
                color: '#FFFFFF', 
                margin: '0 0 20px 0', 
                letterSpacing: '-1.5px',
                lineHeight: '1.1',
                maxWidth: '850px'
            }}>
                Crea tu espacio gaming con <span style={{ 
                    background: 'linear-gradient(135deg, #047688 0%, #b002c2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Nicaplus</span>
            </h2>
            
            {/* SUBTÍTULO */}
            <p style={{ 
                fontSize: '1.25rem', 
                color: '#94a3b8', 
                margin: '0 0 40px 0', 
                maxWidth: '650px',
                lineHeight: '1.6',
                fontWeight: 400
            }}>
                Adquiere artículos tecnológicos y productos digitales de alta demanda con el respaldo técnico especializado de nuestro ecosistema ERP.
            </p>

            {/* BOTÓN ESTILO PILL REDISEÑADO */}
            <button 
                onClick={() => setSeccionActiva('productos')} 
                style={{ 
                    background: 'linear-gradient(135deg, #581c7e 0%, #b002c2 100%)', 
                    color: '#FFFFFF', 
                    border: 'none', 
                    padding: '16px 44px', 
                    borderRadius: '50px', 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem', 
                    cursor: 'pointer', 
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 8px 20px rgba(176, 2, 194, 0.3)',
                    marginBottom: '15px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(176, 2, 194, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(176, 2, 194, 0.3)';
                }}
            >
                Explorar catálogo comercial
            </button>

            <small style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '60px', display: 'block', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ⚡ Procesamiento seguro automatizado vía WhatsApp
            </small>

            {/* BANNER DE FONDO ADAPTADO (Inspirado en la sección inferior de image_492fec.png) */}
            <div style={{ 
                width: '100%', 
                maxWidth: '1050px', 
                background: 'linear-gradient(135deg, rgba(4, 118, 136, 0.8) 0%, rgba(88, 28, 126, 0.3) 100%)', 
                borderRadius: '32px', 
                padding: '50px 30px', 
                boxSizing: 'border-box',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                marginBottom: '50px'
            }}>
                <div style={{ 
                    width: '100%', 
                    maxWidth: '850px', 
                    background: 'rgba(15, 23, 42, 0.6)', 
                    borderRadius: '20px', 
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    padding: '30px',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    margin: '0 auto'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: '1 1 60%' }}>
                            <span style={{ background: '#b002c2', color: '#fff', fontSize: '0.75rem', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>LANZAMIENTO EXCLUSIVO</span>
                            <h4 style={{ fontSize: '1.6rem', margin: '12px 0 8px 0', color: '#fff', fontWeight: '800' }}>Suscripciones y Licencias Digitales</h4>
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>Activación inmediata y directa en tus plataformas competitivas preferidas sin tiempos de espera físicos.</p>
                        </div>
                        <button 
                            onClick={() => setSeccionActiva('productos')}
                            style={{ background: '#047688', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#0590a5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#047688'}
                        >
                            Ver productos digitales
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};