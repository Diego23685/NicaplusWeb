import React, { useState } from 'react';
import { FaArrowLeft, FaShoppingCart, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import styles from '../assets/styles/CatalogoDetalle.module.css'; // Usará los mismos estilos base

interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precioVenta: number;
    stockActual: number;
    imagenUrl: string;
    esDigital: boolean;
}

interface ProductoDetalleProps {
    producto: Producto;
    alVolver: () => void;
    alAgregarAlCarrito: (p: Producto) => void;
    cantidadEnCarrito: number;
}

export const ProductoDetalle: React.FC<ProductoDetalleProps> = ({ 
    producto, 
    alVolver, 
    alAgregarAlCarrito,
    cantidadEnCarrito 
}) => {
    const hayStock = producto.esDigital || producto.stockActual > 0;

    return (
        <div className={`${styles.detailViewContainer} ${styles.fadeEntrance}`}>
            {/* Botón superior para regresar */}
            <button className={styles.backToStoreBtn} onClick={alVolver}>
                <FaArrowLeft /> Volver al catálogo
            </button>

            <div className={styles.productDetailMainGrid}>
                {/* Panel de la Imagen */}
                <div className={styles.detailImageSection}>
                    <span className={styles.detailBadge} style={{ background: producto.esDigital ? '#581c7e' : '#047688' }}>
                        {producto.esDigital ? "ENTREGA DIGITAL" : "PRODUCTO FÍSICO"}
                    </span>
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className={styles.detailMainImage} />
                    ) : (
                        <div className={styles.detailNoImage}>SIN IMAGEN DE DISPOSITIVO</div>
                    )}
                </div>

                {/* Panel de Información del Producto (Estilo Amazon/AliExpress) */}
                <div className={styles.detailInfoSection}>
                    <h1 className={styles.detailProductTitle}>{producto.nombre}</h1>
                    
                    <div className={styles.detailPriceRow}>
                        <span className={styles.detailPriceLabel}>Precio:</span>
                        <span className={styles.detailPriceValue}>C$ {producto.precioVenta}</span>
                    </div>

                    <div className={styles.detailDivider} />

                    {/* Estado de Disponibilidad */}
                    <div className={styles.detailStockStatus}>
                        {hayStock ? (
                            <span className={styles.stockAvailable}>
                                <FaCheckCircle /> Disponible {!producto.esDigital && `(${producto.stockActual} unidades en tienda)`}
                            </span>
                        ) : (
                            <span className={styles.stockOut}>
                                <FaExclamationTriangle /> Agotado temporalmente
                            </span>
                        )}
                    </div>

                    <div className={styles.detailDescriptionBox}>
                        <h4>Descripción del Producto</h4>
                        <p>{producto.descripcion}</p>
                    </div>

                    {/* Beneficios de Compra Oficial */}
                    <div className={styles.detailGarantiaBox}>
                        <div className={styles.garantiaItem}>
                            <FaShieldAlt className={styles.contactIcon} />
                            <div>
                                <h5>Garantía de Soporte Inmediato</h5>
                                <p>Procesamiento prioritario directo a tu WhatsApp.</p>
                            </div>
                        </div>
                    </div>

                    {/* Controles de Acción */}
                    <div className={styles.detailActionsRow}>
                        <button 
                            className={styles.detailAddCartBtn}
                            disabled={!hayStock}
                            onClick={() => alAgregarAlCarrito(producto)}
                        >
                            <FaShoppingCart /> Añadir al carrito 
                            {cantidadEnCarrito > 0 && ` (${cantidadEnCarrito})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};