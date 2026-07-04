import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

export const VistaNosotros: React.FC = () => {
    return (
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(51, 65, 85, 0.6)', padding: '45px', borderRadius: '16px', lineHeight: '1.7' }}>
            <h2 style={{ color: '#047688', marginTop: 0, fontSize: '2rem', fontWeight: '800', borderBottom: '1px solid #334155', paddingBottom: '15px', letterSpacing: '-0.5px' }}>Estructura Corporativa</h2>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1' }}>
                En <strong>Nicaplus Gaming</strong> somos líderes locales en la distribución de soluciones tecnológicas integrales. Nacimos en León, Nicaragua, con la convicción de unificar dos grandes pilares del sector tecnológico en un ecosistema optimizado: la provisión inmediata de bienes digitales y el soporte logístico de un taller especializado.
            </p>
            <p style={{ fontSize: '1.1rem', color: '#cbd5e1', marginTop: '15px' }}>
                No somos simplemente intermediarios de venta; estructuramos operaciones comerciales seguras y auditadas que respaldan cada transacción. Nos enfocamos en ofrecer un catálogo dinámico y transparente que satisfaga las necesidades operativas de los entusiastas de la tecnología.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginTop: '35px', borderTop: '1px solid #334155', paddingTop: '30px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(176, 2, 194, 0.2)' }}>
                    <h4 style={{ color: '#b002c2', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}><FaCheckCircle /> Garantía Real</h4>
                    <small style={{ color: '#94a3b8', display: 'block', lineHeight: '1.4' }}>Cada producto físico o digital cuenta con respaldo técnico directo en tienda.</small>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(4, 118, 136, 0.2)' }}>
                    <h4 style={{ color: '#047688', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 'bold' }}><FaCheckCircle /> Soporte Inmediato</h4>
                    <small style={{ color: '#94a3b8', display: 'block', lineHeight: '1.4' }}>Canales directos automatizados para la resolución de dudas técnicas posventa.</small>
                </div>
            </div>
        </div>
    );
};