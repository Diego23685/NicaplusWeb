import React from 'react';
import { 
    FaArrowLeft, FaShoppingCart, FaMinus, FaPlus, FaTrashAlt, 
    FaUser, FaPhone, FaTruck, FaMapMarkerAlt, FaMoneyBillWave, FaWhatsapp 
} from 'react-icons/fa';
import styles from './Catalogo.module.css';

interface VistaCarritoProps {
    carrito: any[];
    totalPagar: number;
    nombreCliente: string;
    setNombreCliente: (v: string) => void;
    telefonoCliente: string;
    setTelefonoCliente: (v: string) => void;
    tipoEntrega: string;
    setTipoEntrega: (v: string) => void;
    direccionCliente: string;
    setDireccionCliente: (v: string) => void;
    metodoPago: string;
    setMetodoPago: (v: string) => void;
    aceptoTerminos: boolean;
    setAceptoTerminos: (v: boolean) => void;
    setVerModalTerminos: (v: boolean) => void;
    cambiarCantidad: (id: number, delta: number) => void;
    removerDelCarrito: (id: number) => void;
    cambiarSeccion: (seccion: any) => void;
    enviarAWhatsApp: (e: React.FormEvent) => void;
}

export const VistaCarrito: React.FC<VistaCarritoProps> = ({
    carrito, totalPagar, nombreCliente, setNombreCliente, telefonoCliente, setTelefonoCliente,
    tipoEntrega, setTipoEntrega, direccionCliente, setDireccionCliente, metodoPago, setMetodoPago,
    aceptoTerminos, setAceptoTerminos, setVerModalTerminos, cambiarCantidad, removerDelCarrito,
    cambiarSeccion, enviarAWhatsApp
}) => {
    return (
        <div className={`${styles.cartViewContainer} ${styles.fadeEntrance}`}>
            <div className={styles.cartViewHeader}>
                <button className={styles.backToStoreBtn} onClick={() => cambiarSeccion('productos')}>
                    <FaArrowLeft /> Volver a la tienda
                </button>
                <h2 className={styles.cartViewTitle}>Tu Carrito de Compras</h2>
            </div>

            {carrito.length === 0 ? (
                <div className={styles.emptyCartView}>
                    <div className={styles.emptyIconCircle}><FaShoppingCart size={32} /></div>
                    <h3>Tu carrito está vacío</h3>
                    <button className={styles.exploreBtn} onClick={() => cambiarSeccion('productos')}>Explorar Productos</button>
                </div>
            ) : (
                <div className={styles.cartMainGrid}>
                    <div className={styles.cartItemsContainer}>
                        {carrito.map(item => (
                            <div key={item.producto.id} className={styles.cartItemCard}>
                                <div className={styles.cartItemImgThum}>
                                    {item.producto.imagenUrl ? <img src={item.producto.imagenUrl} alt="" /> : <div className={styles.cartNoImg}>🎮</div>}
                                </div>
                                <div className={styles.cartItemDetails}>
                                    <div className={styles.cartItemMeta}>
                                        <h4>{item.producto.nombre}</h4>
                                        <span className={item.producto.esDigital ? styles.tagDig : styles.tagFis}>{item.producto.esDigital ? "Digital" : "Físico"}</span>
                                    </div>
                                    <p className={styles.cartItemPriceUnit}>U: C$ {item.producto.precioVenta}</p>
                                </div>
                                <div className={styles.cartQtyControls}>
                                    <button onClick={() => cambiarCantidad(item.producto.id, -1)} className={styles.qtyBtn}><FaMinus size={10} /></button>
                                    <span className={styles.qtyValue}>{item.cantidad}</span>
                                    <button onClick={() => cambiarCantidad(item.producto.id, 1)} className={styles.qtyBtn}><FaPlus size={10} /></button>
                                </div>
                                <div className={styles.cartItemSubtotalBlock}><span className={styles.itemSubtotalText}>C$ {item.cantidad * item.producto.precioVenta}</span></div>
                                <button onClick={() => removerDelCarrito(item.producto.id)} className={styles.deleteItemBtn} aria-label="Eliminar ítem"><FaTrashAlt size={14} /></button>
                            </div>
                        ))}
                    </div>

                    <div className={styles.cartSummaryCard}>
                        <h3>Resumen de Pedido</h3>
                        <div className={styles.summaryRow}><span>Subtotal</span><span>C$ {totalPagar}</span></div>
                        <div className={styles.dividerSummary} />
                        
                        <form onSubmit={enviarAWhatsApp} className={styles.billingForm}>
                            <h4 className={styles.formTitle}>Datos de Entrega</h4>
                            
                            <div className={styles.inputGroup}>
                                <label><FaUser /> Nombre Completo *</label>
                                <input type="text" required placeholder="Ej: Juan Pérez" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
                            </div>

                            <div className={styles.inputGroup}>
                                <label><FaPhone /> Teléfono *</label>
                                <input type="tel" required placeholder="Ej: 88888888" value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} />
                            </div>

                            <div className={styles.inputGroup}>
                                <label><FaTruck /> Tipo de Entrega</label>
                                <select value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                                    <option value="Envío a domicilio">Envío a domicilio</option>
                                    <option value="Retiro en sucursal (León)">Retiro en tienda (León)</option>
                                    <option value="Envío digital (Email/WhatsApp)">Entrega Inmediata (Digital)</option>
                                </select>
                            </div>

                            {tipoEntrega === "Envío a domicilio" && (
                                <div className={styles.inputGroup}>
                                    <label><FaMapMarkerAlt /> Dirección Exacta *</label>
                                    <textarea required placeholder="Barrio, dirección exacta..." value={direccionCliente} onChange={(e) => setDireccionCliente(e.target.value)} />
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label><FaMoneyBillWave /> Método de Pago</label>
                                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                    <option value="Transferencia Bancaria">Transferencia (LAFISE / BANPRO)</option>
                                    <option value="Efectivo">Efectivo (Contra Entrega)</option>
                                    <option value="Billetera Digital">Puntos BAC / KASH / Tigo Money</option>
                                </select>
                            </div>

                            <div className={styles.dividerSummary} />
                            <div className={`${styles.summaryRow} ${styles.totalRowView}`}>
                                <span>Total:</span>
                                <span className={styles.totalColor}>C$ {totalPagar}</span>
                            </div>

                            <div className={styles.termsCheckboxGroup}>
                                <input 
                                    type="checkbox" 
                                    id="term_check"
                                    checked={aceptoTerminos}
                                    onChange={(e) => setAceptoTerminos(e.target.checked)}
                                />
                                <label htmlFor="term_check">
                                    Acepto los {' '}
                                    <button type="button" onClick={() => setVerModalTerminos(true)}>
                                        términos y condiciones
                                                    </button>
                                </label>
                            </div>

                            <button type="submit" className={styles.finalCheckoutBtn}>
                                <FaWhatsapp size={18} /> Procesar vía WhatsApp
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};