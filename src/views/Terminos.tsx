import React from 'react';

interface TerminosProps {
  alCerrar: () => void;
}

export const Terminos: React.FC<TerminosProps> = ({ alCerrar }) => {
  return (
    <div style={styles.modalOverlay} onClick={alCerrar}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Términos y Condiciones de Uso</h2>
          <button style={styles.closeBtn} onClick={alCerrar}>&times;</button>
        </div>
        
        <div style={styles.modalBody}>
          <p style={styles.textMuted}>Última actualización: Julio 2026</p>
          
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>1. Objeto de la Plataforma</h3>
            <p>
              Nicaplus Gaming ofrece un ecosistema comercial e informativo integral que abarca la venta de hardware (computadoras, celulares, periféricos, cargadores), consumibles de videojuegos (juegos físicos/digitales, monedas virtuales), licencias de servicios de streaming y entretenimiento, así como la gestión de servicios técnicos especializados.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>2. Modalidades de Entrega y Envío</h3>
            <ul style={styles.list}>
              <li><strong>Retiros y Entregas Locales:</strong> Los retiros en nuestra sucursal de León o las entregas a domicilio locales se coordinan inmediatamente tras la verificación del pago en caja.</li>
              <li><strong>Envíos Departamentales:</strong> Los despachos al resto de Nicaragua se realizan a través de <strong>CargoTrans</strong> o mediante encomiendas en <strong>buses interlocales</strong>. Los costos, riesgos de transporte y tiempos de tránsito corren por cuenta del cliente una vez entregado el paquete a la empresa transportista.</li>
              <li><strong>Bienes Digitales y Streaming:</strong> Las claves de activación, saldos o perfiles de cuentas asignadas se liberan de manera electrónica (vía WhatsApp/correo) de forma inmediata tras validar la transacción en nuestro sistema.</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>3. Políticas de Productos Digitales, Streaming y Suscripciones</h3>
            <p>
              Debido a la naturaleza intangible y de un solo uso de los códigos, monedas de juegos y perfiles de streaming, <strong>no se admiten cambios, reembolsos ni devoluciones</strong> una vez despachados los datos de acceso, salvo fallos de origen debidamente comprobados por nuestro equipo de soporte. 
            </p>
            <p style={styles.textWarning}>
              * Para suscripciones y perfiles de cuentas compartidas o completas, el cliente se compromete a respetar las reglas de uso (no alterar credenciales ni compartir perfiles asignados). Las alertas de vencimiento y procesos de renovación se rigen estrictamente por las fechas de corte del sistema.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>4. Servicio Técnico y Mantenimiento</h3>
            <p>
              Toda recepción de consolas o computadoras generará una <strong>Órden de Servicio</strong> única en nuestro sistema. Nicaplus Gaming no se hace responsable por software no original ni por fallos de hardware preexistentes ajenos al diagnóstico solicitado. El retiro del equipo modificado o reparado se realizará únicamente presentando la documentación o validación de cuenta correspondiente.
            </p>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>5. Garantías, Tickets de Soporte y Cuentas por Cobrar</h3>
            <p>
              Los productos de hardware cuentan con la garantía especificada al momento de la compra. En caso de desperfecto, el cliente deberá aperturar formalmente un <strong>Ticket de Soporte o Reclamación de Garantía</strong>. Asimismo, para las compras bajo planes de financiamiento o créditos aprobados, el cliente acepta cumplir los plazos de abono estipulados en su cuenta, evitando la suspensión de sus servicios activos en la plataforma.
            </p>
          </section>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.actionBtn} onClick={alCerrar}>Entendido y Acepto</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(11, 7, 19, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modalContent: {
    background: 'linear-gradient(145deg, #161026, #110b1e)',
    border: '1px solid rgba(176, 2, 194, 0.3)',
    borderRadius: '1.25rem',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.75rem',
    cursor: 'pointer',
    lineHeight: 1,
  },
  modalBody: {
    padding: '1.5rem',
    overflowY: 'auto' as const,
    color: '#cbd5e1',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  section: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    color: '#b002c2',
    margin: '0 0 0.5rem 0',
    fontWeight: 700,
  },
  list: {
    paddingLeft: '1.25rem',
    margin: '0.5rem 0',
  },
  textMuted: {
    color: '#64748b',
    fontSize: '0.8rem',
    marginTop: 0,
    marginBottom: '1rem',
  },
  textWarning: {
    color: '#047688',
    fontSize: '0.85rem',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  },
  modalFooter: {
    padding: '1rem 1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    backgroundColor: '#047688',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.5rem',
    borderRadius: '0.5rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }
};