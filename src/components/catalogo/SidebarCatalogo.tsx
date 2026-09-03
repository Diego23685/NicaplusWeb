import React from 'react';
import type { ReactNode } from 'react';
import { FaGamepad, FaTags, FaTimes } from 'react-icons/fa';
import styles from './SidebarCatalogo.module.css';

interface Categoria {
    id: number;
    nombre: string;
    imagenUrl?: string;
}

interface Juego {
    id: number;
    nombre: string;
    imagenUrl: string;
}

interface SidebarCatalogoProps {
    busqueda: string;
    setBusqueda: (val: string) => void;
    categorias: Categoria[];
    idCatSeleccionada: number | null;
    setIdCatSeleccionada: (id: number | null) => void;
    juegos: Juego[];
    idJuegoSeleccionado: number | null;
    setIdJuegoSeleccionado: (id: number | null) => void;
    obtenerIconoCategoria: (nombre: string) => ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

export const SidebarCatalogo: React.FC<SidebarCatalogoProps> = ({
    categorias,
    idCatSeleccionada,
    setIdCatSeleccionada,
    juegos,
    idJuegoSeleccionado,
    setIdJuegoSeleccionado,
    obtenerIconoCategoria,
    isOpen = false,
    onClose
}) => {
    return (
        <>
            {/* Overlay oscuro para la versión móvil */}
            <div 
                className={`${styles.sidebarOverlay} ${isOpen ? styles.sidebarOverlayVisible : ''}`}
                onClick={onClose}
            />

            <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarMobileOpen : ''}`}>
                
                {/* Botón de cierre en móviles */}
                {onClose && (
                    <button className={styles.closeSidebarBtn} onClick={onClose} aria-label="Cerrar filtros">
                        <FaTimes size={16} /> <span>Cerrar Filtros</span>
                    </button>
                )}

                

                <hr className={styles.separator} />

                {/* Sección Categorías */}
                <div>
                    <h4 className={styles.sectionTitle}>
                        <FaTags size={11} /> Categorías
                    </h4>
                    <div className={styles.scrollList}>
                        <button
                            onClick={() => { setIdCatSeleccionada(null); onClose?.(); }}
                            className={`${styles.itemButton} ${idCatSeleccionada === null ? styles.itemButtonActive : ''}`}
                        >
                            <div className={styles.iconWrapper}><FaTags size={12} /></div>
                            <span className={styles.itemText}>Todas las categorías</span>
                        </button>

                        {categorias.map(c => {
                            const activo = idCatSeleccionada === c.id;
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => { setIdCatSeleccionada(c.id); onClose?.(); }}
                                    className={`${styles.itemButton} ${activo ? styles.itemButtonActive : ''}`}
                                >
                                    <div className={styles.iconWrapper}>
                                        {c.imagenUrl ? (
                                            <img src={c.imagenUrl} alt="" />
                                        ) : (
                                            obtenerIconoCategoria(c.nombre)
                                        )}
                                    </div>
                                    <span className={styles.itemText}>{c.nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <hr className={styles.separator} />

                {/* Sección Juegos */}
                <div>
                    <h4 className={styles.sectionTitle}>
                        <FaGamepad size={11} /> Filtrar por Juego
                    </h4>
                    <div className={styles.scrollList}>
                        <button
                            onClick={() => { setIdJuegoSeleccionado(null); onClose?.(); }}
                            className={`${styles.itemButton} ${idJuegoSeleccionado === null ? styles.itemButtonActive : ''}`}
                        >
                            <div className={`${styles.iconWrapper} bg-[#180f24] rounded border border-purple-900/30 text-xs`}>🎮</div>
                            <span className={styles.itemText}>Todos los juegos</span>
                        </button>

                        {juegos.map(j => {
                            const activo = idJuegoSeleccionado === j.id;
                            return (
                                <button
                                    key={j.id}
                                    onClick={() => { setIdJuegoSeleccionado(j.id); onClose?.(); }}
                                    className={`${styles.itemButton} ${activo ? styles.itemButtonActive : ''}`}
                                >
                                    <div className={`${styles.iconWrapper} bg-[#180f24] rounded border border-purple-900/30 overflow-hidden`}>
                                        {j.imagenUrl ? (
                                            <img src={j.imagenUrl} alt="" />
                                        ) : (
                                            "👾"
                                        )}
                                    </div>
                                    <span className={styles.itemText}>{j.nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
};