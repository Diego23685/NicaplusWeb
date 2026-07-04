import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';

export const VistaContacto: React.FC = () => {
    return (
        <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(51, 65, 85, 0.6)', padding: '45px', borderRadius: '16px' }}>
            <h2 style={{ color: '#047688', marginTop: 0, fontSize: '2rem', fontWeight: '800', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '25px', letterSpacing: '-0.5px' }}>Ubicación y Cobertura</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '35px' }}>
                <div style={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <strong style={{ color: '#fff', display: 'block', fontSize: '1.15rem', fontWeight: 'bold' }}>Sede Central:</strong>
                        <p style={{ color: '#94a3b8', marginTop: '6px' }}>León, Nicaragua.</p>
                    </div>
                    <div>
                        <strong style={{ color: '#fff', display: 'block', fontSize: '1.15rem', fontWeight: 'bold' }}>Canales Digitales:</strong>
                        <p style={{ color: '#94a3b8', marginTop: '6px', lineHeight: '1.5' }}>Atención y procesamiento de pedidos de manera remota a través de nuestro catálogo en línea con facturación electrónica automatizada.</p>
                    </div>
                    <div>
                        <strong style={{ color: '#fff', display: 'block', fontSize: '1.15rem', fontWeight: 'bold' }}>Horario de Atención Operativa:</strong>
                        <p style={{ color: '#94a3b8', marginTop: '6px' }}>Lunes a Sábado: 8:00 AM - 6:00 PM</p>
                    </div>
                </div>
                <div style={{ flex: '1 1 50%', minHeight: '220px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '14px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', textAlign: 'center', boxSizing: 'border-box' }}>
                    <FaMapMarkerAlt size={44} style={{ color: '#e11d48', marginBottom: '12px' }} />
                    <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1.1rem', color: '#fff' }}>Despachos y Entregas</strong>
                    <small style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>Coordinamos envíos a nivel nacional. Los productos digitales se procesan de manera global e inmediata mediante validación de credenciales.</small>
                </div>
            </div>
        </div>
    );
};