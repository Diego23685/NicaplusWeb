import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import styles from './VistaNosotros.module.css';

export const VistaNosotros: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* ENCABEZADO */}
            <span className={styles.subtitle}>// Respaldo de Ecosistema ERP</span>
            <h2 className={styles.title}>Estructura Corporativa</h2>
            <hr className={styles.divider} />
            
            {/* TEXTOS INTRODUCTORIOS */}
            <p className={styles.introText}>
                En <strong>Nicaplus Gaming</strong> somos líderes locales en la distribución de soluciones tecnológicas integrales. Nacimos en León, Nicaragua, con la convicción de unificar dos grandes pilares del sector tecnológico en un ecosistema optimizado: la provisión inmediata de bienes digitales y el soporte logístico de un taller especializado.
            </p>
            <p className={styles.introText}>
                No somos simplemente intermediarios de venta; estructuramos operaciones comerciales seguras y auditadas que respaldan cada transacción. Nos enfocamos en ofrecer un catálogo dinámico y transparente que satisfaga las necesidades operativas de los entusiastas de la tecnología.
            </p>

            {/* SECCIÓN NUEVA: MISIÓN Y VISIÓN CORPORATIVA */}
            <div className={styles.mvGrid}>
                <div className={styles.mvCard}>
                    <h3>Nuestra Misión</h3>
                    <p>
                        Empoderar a la comunidad tecnológica y gaming nicaragüense facilitando el acceso a hardware premium y licencias digitales mediante un canal seguro, automatizado y respaldado técnicamente.
                    </p>
                </div>
                <div className={styles.mvCard}>
                    <h3>Nuestra Visión</h3>
                    <p>
                        Ser la plataforma de referencia nacional en e-commerce tecnológico y automatización comercial, integrando el control de inventarios ERP con la inmediatez en atención y distribución.
                    </p>
                </div>
            </div>

            {/* GRID DE VALORES / BENEFICIOS REALES */}
            <div className={styles.benefitsGrid}>
                
                <div className={styles.benefitCard}>
                    <h4 className={`${styles.cardHeader} ${styles.purple}`}>
                        <FaCheckCircle /> Garantía Real
                    </h4>
                    <small>Cada producto físico o digital cuenta con el respaldo técnico directo en nuestra tienda física.</small>
                </div>

                <div className={styles.benefitCard}>
                    <h4 className={`${styles.cardHeader} ${styles.blue}`}>
                        <FaCheckCircle /> Soporte Inmediato
                    </h4>
                    <small>Canales directos automatizados para la resolución eficaz de dudas técnicas posventa.</small>
                </div>

                <div className={styles.benefitCard}>
                    <h4 className={`${styles.cardHeader} ${styles.cyan}`}>
                        <FaCheckCircle /> Transacciones Claras
                    </h4>
                    <small>Control exacto del stock y de precios de venta finales directamente enlazados a nuestro núcleo central.</small>
                </div>

            </div>
        </div>
    );
};