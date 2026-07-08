import React, { useEffect, useRef } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import styles from './VistaContacto.module.css';

export const VistaContacto: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Array<{ x: number; y: number; vx: number; vy: number; originX: number; originY: number; size: number; color: string }> = [];
        const mouse = { x: -1000, y: -1000 };

        const resizeCanvas = () => {
            if (canvas && containerRef.current) {
                canvas.width = containerRef.current.offsetWidth;
                canvas.height = containerRef.current.offsetHeight;
                initParticles();
            }
        };

        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(Math.floor(canvas.width / 15), 60);
            const colors = ['rgba(0, 255, 209, 0.4)', 'rgba(14, 165, 233, 0.3)', 'rgba(109, 40, 217, 0.3)'];
            
            for (let i = 0; i < particleCount; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    originX: x,
                    originY: y,
                    size: Math.random() * 2.5 + 1,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    p.x += (dx / distance) * force * 2;
                    p.y += (dy / distance) * force * 2;
                } else {
                    p.x += (p.originX - p.x) * 0.02 + p.vx;
                    p.y += (p.originY - p.y) * 0.02 + p.vy;
                }

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
            }
        };

        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        containerRef.current?.addEventListener('mousemove', handleMouseMove);
        containerRef.current?.addEventListener('mouseleave', handleMouseLeave);
        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            containerRef.current?.removeEventListener('mousemove', handleMouseMove);
            containerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} className={styles.container}>
            <canvas ref={canvasRef} className={styles.canvasBackground} />

            <div className={styles.contentWrapper}>
                <span className={styles.subtitle}>// Conectividad global centralizada</span>
                <h2 className={styles.title}>Ubicación y <span className={styles.titleGradient}>Cobertura</span></h2>
                
                <div className={styles.flexLayout}>
                    {/* COLUMNA IZQUIERDA: DATOS */}
                    <div className={styles.infoColumn}>
                        <div className={styles.infoBlock}>
                            <strong className={styles.blockLabel}>Sede Central:</strong>
                            <p className={styles.blockText}>De la estatua de la madre, 1c y media al norte. León, Nicaragua.</p>
                        </div>
                        <div className={styles.infoBlock}>
                            <strong className={styles.blockLabel}>Canales Digitales:</strong>
                            <p className={styles.blockText}>
                                Atención y procesamiento de pedidos de manera remota a través de nuestro catálogo en línea con facturación electrónica automatizada.
                            </p>
                        </div>
                        <div className={styles.infoBlock}>
                            <strong className={styles.blockLabel}>Horario de Atención Operativa:</strong>
                            <p className={styles.blockText}>Lunes a Sábado: 9:00 AM - 6:00 PM</p>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: TARJETA + MAPA CYBERPUNK */}
                    <div className={styles.rightColumn}>
                        <div className={styles.dispatchCard}>
                            <FaMapMarkerAlt size={48} className={styles.mapIcon} />
                            <strong className={styles.cardTitle}>Despachos y Entregas</strong>
                            <p className={styles.cardText}>
                                Coordinamos envíos a nivel nacional. Los productos digitales se procesan de manera global y semiautomatica mediante mensajes de whatsapp.
                            </p>
                        </div>

                        {/* MAPA INCRUSTADO INTEGRADO */}
                        <div className={styles.mapContainer}>
                            <iframe 
                                title="Mapa Nicaplus Sede Central León"
                                src="https://maps.google.com/maps?q=12.441448,-86.875904&z=17&output=embed"
                                className={styles.mapIframe}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};