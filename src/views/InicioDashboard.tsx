import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FaShoppingCart, FaTools, FaUserPlus, FaBoxOpen, FaMoneyBillWave, FaLightbulb, FaChartLine, FaPercentage, FaTicketAlt } from 'react-icons/fa';

// Importaciones mandatorias de Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface InicioDashboardProps {
    setVistaActiva: (vista: any) => void;
}

export const InicioDashboard: React.FC<InicioDashboardProps> = ({ setVistaActiva }) => {
    const [alertasStock, setAlertasStock] = useState(0);
    const [ordenesTaller, setOrdenesTaller] = useState(0);
    const [resumen, setResumen] = useState<any>({
        totalVendidoMes: 0,
        totalCostoMes: 0,
        cantidadVentasMes: 0,
        ultimosProductos: [],
        ultimosClientes: []
    });
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarDatosDashboard = async () => {
            try {
                const [resStock, resTaller, resResumen] = await Promise.all([
                    api.get('/products/alertas-stock'),
                    api.get('/ordenesservicio'),
                    api.get('/reportes/resumen-dashboard')
                ]);

                setAlertasStock(resStock.data.length);
                setOrdenesTaller(resTaller.data.filter((o: any) => o.estado !== 'Entregado').length);
                setResumen(resResumen.data);
            } catch (err) {
                console.error("Error al sincronizar métricas del dashboard:", err);
            } finally {
                setCargando(false);
            }
        };

        cargarDatosDashboard();
    }, []);

    // DERIVACIÓN DE MÉTRICAS FINANCIERAS
    const margenGananciaBruta = resumen.totalVendidoMes - (resumen.totalCostoMes || resumen.totalVendidoMes * 0.65);
    const porcentajeMargen = resumen.totalVendidoMes > 0 ? ((margenGananciaBruta / resumen.totalVendidoMes) * 100).toFixed(1) : "0";
    const ticketPromedio = resumen.cantidadVentasMes > 0 ? (resumen.totalVendidoMes / resumen.cantidadVentasMes).toFixed(2) : "0";

    // CONFIGURACIÓN DE GRÁFICAS
    const datosGraficaLinea = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                label: 'Ingresos (C$)',
                data: resumen.semanaFlujo || [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.05)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#38bdf8'
            }
        ]
    };

    const datosGraficaBarra = {
        labels: ['Productos', 'Digitales', 'Soporte'],
        datasets: [
            {
                label: 'Ventas (C$)',
                data: resumen.rubros || [0, 0, 0], 
                backgroundColor: ['#a855f7', '#10b981', '#38bdf8'],
                borderRadius: 6
            }
        ]
    };

    const opcionesComunes = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
    };

    const obtenerConsejoComercial = () => {
        if (alertasStock > 3) {
            return "Alerta de inventario: Múltiples artículos con existencias críticas. Realiza un pedido de reabastecimiento.";
        }
        if (ordenesTaller > 5) {
            return "Alta demanda en soporte: El taller tiene carga de trabajo elevada. Prioriza las órdenes listas.";
        }
        if (Number(porcentajeMargen) < 30 && resumen.totalVendidoMes > 0) {
            return "Atención al margen: Utilidad global por debajo del 30%. Revisa costos con proveedores.";
        }
        return "Consejo del día: Revisa los precios de los diamantes de Free Fire y recargas en el catálogo público.";
    };

    if (cargando) {
        return (
            <div style={{ color: '#38bdf8', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
                Sincronizando cuadro de mando...
            </div>
        );
    }

    return (
        <div style={{ flex: 1, padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', background: '#0f172a', fontFamily: 'sans-serif', color: '#fff' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
                <div>
                    <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.3rem', fontWeight: 700 }}>Cuadro de Mando Integral</h3>
                    <p style={{ color: '#94a3b8', margin: '2px 0 0 0', fontSize: '0.8rem' }}>Auditoría contable centralizada de Nicaplus Gaming.</p>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 'bold', background: '#1e293b', padding: '5px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                    MES ACTUAL: {new Date().toLocaleString('es-NI', { month: 'short' }).toUpperCase()} 2026
                </span>
            </div>

            {/* SECCIÓN 1: METRICAS KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', flexShrink: 0 }}>
                <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #10b981' }}>
                    <div>
                        <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>INGRESOS</small>
                        <h4 style={{ margin: '2px 0 0 0', color: '#10b981', fontSize: '1.25rem', fontWeight: 700 }}>C$ {resumen.totalVendidoMes.toLocaleString('es-NI')}</h4>
                    </div>
                    <FaMoneyBillWave style={{ fontSize: '1.4rem', color: '#334155' }} />
                </div>
                <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #38bdf8' }}>
                    <div>
                        <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>UTILIDAD</small>
                        <h4 style={{ margin: '2px 0 0 0', color: '#38bdf8', fontSize: '1.25rem', fontWeight: 700 }}>C$ {margenGananciaBruta.toLocaleString('es-NI')}</h4>
                    </div>
                    <FaChartLine style={{ fontSize: '1.4rem', color: '#334155' }} />
                </div>
                <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #a855f7' }}>
                    <div>
                        <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>MARGEN</small>
                        <h4 style={{ margin: '2px 0 0 0', color: '#a855f7', fontSize: '1.25rem', fontWeight: 700 }}>{porcentajeMargen}%</h4>
                    </div>
                    <FaPercentage style={{ fontSize: '1.4rem', color: '#334155' }} />
                </div>
                <div style={{ background: '#1e293b', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #f59e0b' }}>
                    <div>
                        <small style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>TICKET PROMEDIO</small>
                        <h4 style={{ margin: '2px 0 0 0', color: '#f59e0b', fontSize: '1.25rem', fontWeight: 700 }}>C$ {Number(ticketPromedio).toLocaleString('es-NI')}</h4>
                    </div>
                    <FaTicketAlt style={{ fontSize: '1.4rem', color: '#334155' }} />
                </div>
            </div>

            {/* SECCIÓN 2: GRÁFICAS - SE CORRIGIÓ EL DESBORDAMIENTO (CON CONTAINERS LIMITADOS Y OVERFLOW HIDDEN) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', flexShrink: 0 }}>
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '200px', overflow: 'hidden' }}>
                    <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Flujo Semanal</span>
                    <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 20px)', overflow: 'hidden' }}>
                        <Line data={datosGraficaLinea} options={opcionesComunes} />
                    </div>
                </div>
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '200px', overflow: 'hidden' }}>
                    <span style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, marginBottom: '8px' }}>Ventas por Rubro</span>
                    <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 20px)', overflow: 'hidden' }}>
                        <Bar data={datosGraficaBarra} options={opcionesComunes} />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: COMPONENTES OPERATIVOS Y TABLAS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', flexShrink: 0, width: '100%' }}>
                
                {/* Módulos de Navegación Rápida */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div onClick={() => setVistaActiva('caja')} style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ background: '#581c7e', padding: '8px', borderRadius: '6px' }}><FaShoppingCart style={{ fontSize: '0.9rem' }} /></div>
                        <div><h6 style={{ margin: 0, fontSize: '0.9rem' }}>Caja POS</h6><small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Ventas</small></div>
                    </div>
                    <div onClick={() => setVistaActiva('taller')} style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ background: '#047688', padding: '8px', borderRadius: '6px' }}><FaTools style={{ fontSize: '0.9rem' }} /></div>
                        <div><h6 style={{ margin: 0, fontSize: '0.9rem' }}>Taller Técnico</h6><small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Órdenes: {ordenesTaller}</small></div>
                    </div>
                    <div onClick={() => setVistaActiva('catalogos')} style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ background: '#10b981', padding: '8px', borderRadius: '6px' }}><FaBoxOpen style={{ fontSize: '0.9rem' }} /></div>
                        <div><h6 style={{ margin: 0, fontSize: '0.9rem' }}>Inventario</h6><small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Catálogos</small></div>
                    </div>
                </div>

                {/* Tabla Monitoreo Stock */}
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '142px', boxSizing: 'border-box' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}><FaBoxOpen /> STOCK RECIENTE</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {resumen.ultimosProductos?.slice(0, 3).map((p: any) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #334155', fontSize: '0.85rem' }}>
                                <span style={{ color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>{p.nombre}</span>
                                <strong style={{ color: '#38bdf8' }}>C$ {p.precioVenta}</strong>
                            </div>
                        ))}
                        {(!resumen.ultimosProductos || resumen.ultimosProductos.length === 0) && <small style={{ color: '#64748b' }}>Sin datos recientes</small>}
                    </div>
                </div>

                {/* Tabla Clientes */}
                <div style={{ background: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', height: '142px', boxSizing: 'border-box' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}><FaUserPlus /> AUDITORÍA CLIENTES</span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {resumen.ultimosClientes?.slice(0, 3).map((c: any) => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #334155', fontSize: '0.85rem' }}>
                                <span style={{ color: '#cbd5e1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '60%' }}>{c.nombre}</span>
                                <small style={{ color: '#64748b' }}>{c.telefono || 'Sin número'}</small>
                            </div>
                        ))}
                        {(!resumen.ultimosClientes || resumen.ultimosClientes.length === 0) && <small style={{ color: '#64748b' }}>Sin datos recientes</small>}
                    </div>
                </div>

            </div>

            {/* SECCIÓN 4: RECOMENDACIÓN DE AUDITORÍA */}
            <div style={{ background: 'linear-gradient(90deg, #1e1b4b 0%, #1e293b 100%)', border: '1px solid #4338ca', padding: '12px 18px', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                <FaLightbulb style={{ fontSize: '1.3rem', color: '#eab308', flexShrink: 0 }} />
                <div>
                    <h5 style={{ margin: 0, color: '#facc15', fontSize: '0.85rem', fontWeight: 600 }}>Auditoría Interna</h5>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.4' }}>{obtenerConsejoComercial()}</p>
                </div>
            </div>

        </div>
    );
};