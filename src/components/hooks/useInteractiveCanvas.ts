import { useEffect } from 'react';
import type { RefObject } from 'react';

export const useInteractiveCanvas = (canvasRef: RefObject<HTMLCanvasElement | null>) => {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let ancho = (canvas.width = window.innerWidth);
        let alto = (canvas.height = window.innerHeight);

        const mouse = { x: ancho / 2, y: alto / 2, targetX: ancho / 2, targetY: alto / 2 };
        let particulas: Array<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }> = [];
        const colores = ['#b002c2', '#047688', '#a855f7', '#0e7490'];

        const manejarRedimension = () => {
            ancho = canvas.width = window.innerWidth;
            alto = canvas.height = window.innerHeight;
        };

        const manejarMovimiento = (e: MouseEvent) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
        };

        window.addEventListener('resize', manejarRedimension);
        window.addEventListener('mousemove', manejarMovimiento);

        let idAnimacion: number;

        const animar = () => {
            ctx.clearRect(0, 0, ancho, alto);
            mouse.x += (mouse.targetX - mouse.x) * 0.1;
            mouse.y += (mouse.targetY - mouse.y) * 0.1;

            if (Math.random() < 0.35 && particulas.length < 100) {
                particulas.push({
                    x: mouse.x,
                    y: mouse.y,
                    vx: (Math.random() - 0.5) * 1.8,
                    vy: (Math.random() - 0.5) * 1.8,
                    alpha: 1,
                    size: Math.random() * 2.5 + 1,
                    color: colores[Math.floor(Math.random() * colores.length)]
                });
            }

            for (let i = particulas.length - 1; i >= 0; i--) {
                const p = particulas[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.016;

                if (p.alpha <= 0) {
                    particulas.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.restore();
            }

            idAnimacion = requestAnimationFrame(animar);
        };

        animar();

        return () => {
            window.removeEventListener('resize', manejarRedimension);
            window.removeEventListener('mousemove', manejarMovimiento);
            cancelAnimationFrame(idAnimacion);
        };
    }, [canvasRef]);
};