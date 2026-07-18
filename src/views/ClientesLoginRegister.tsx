import React, { useState, useEffect } from 'react';
import api from '../services/api';
import styles from '../assets/styles/ClientesLogin/ClientesLoginRegister.module.css';
import { Cargando } from '../views/Cargando'; 

interface ClientesLoginRegisterProps {
    alVolver: () => void;
    alIniciarSesion: (datosCliente: any) => void;
}

const FONDOS_HERO = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1400&q=80'
];

export const ClientesLoginRegister: React.FC<ClientesLoginRegisterProps> = ({ alVolver, alIniciarSesion }) => {
    const [esRegistro, setEsRegistro] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); 
    const [isRegisterSuccess, setIsRegisterSuccess] = useState(false); 
    const [bgIndex, setBgIndex] = useState(0);

    // Estados para control de vistas legales / soporte
    const [vistaLegal, setVistaLegal] = useState<'terminos' | 'privacidad' | 'soporte' | null>(null);

    // Estados para el formulario de Login
    const [loginCorreo, setLoginCorreo] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Estados para el formulario de Registro
    const [regNombre, setRegNombre] = useState('');
    const [regCorreo, setRegCorreo] = useState('');
    const [regUsuario, setRegUsuario] = useState('');
    const [regTelefono, setRegTelefono] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Estados para el formulario de soporte técnico rápido
    const [soporteNombre, setSoporteNombre] = useState('');
    const [soporteMensaje, setSoporteMensaje] = useState('');

    // Rotación automática de fondos
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % FONDOS_HERO.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const manejarLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const respuesta = await api.post('/Auth/login-cliente', {
                Email: loginCorreo,
                Password: loginPassword
            });
            
            const token = respuesta.data?.token;
            if (token) {
                localStorage.setItem('token_cliente', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            setIsSuccess(true);
            const datosUsuario = respuesta.data?.cliente || respuesta.data?.usuario || { nombre: loginCorreo };

            setTimeout(() => {
                alIniciarSesion(datosUsuario);
                alVolver();
            }, 2500);

        } catch (error: any) {
            console.error('Error en login:', error);
            alert(error.response?.data && typeof error.response.data === 'string' ? error.response.data : 'Credenciales incorrectas o error en el servidor');
        }
    };

    const manejarRegistroSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (regPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            const datosRegistro = {
                Nombre: regNombre,
                Email: regCorreo,
                Username: regUsuario,
                Usuario: regUsuario,
                Telefono: regTelefono,
                Password: regPassword
            };

            await api.post('/Auth/registro-cliente', datosRegistro);
            setIsRegisterSuccess(true);
            
            setTimeout(() => {
                setIsRegisterSuccess(false);
                setEsRegistro(false); 
                setRegNombre('');
                setRegCorreo('');
                setRegUsuario('');
                setRegTelefono('');
                setRegPassword('');
            }, 2000);

        } catch (error: any) {
            console.error('Error en el registro:', error);
            if (error.response?.data?.errors) {
                const listaErrores = Object.values(error.response.data.errors).flat().join('\n');
                alert(`Errores de validación:\n${listaErrores}`);
            } else {
                alert('Hubo un problema al crear tu usuario. Inténtalo de nuevo.');
            }
        }
    };

    const manejarSoporteWhatsApp = (e: React.FormEvent) => {
        e.preventDefault();
        const textoBase = `¡Hola Nicaplus! Mi nombre es *${soporteNombre}*.\n\nNecesito soporte técnico con lo siguiente:\n"${soporteMensaje}"`;
        const textoCodificado = encodeURIComponent(textoBase);
        
        // Reemplaza el número por el oficial de tu pasarela de atención
        const urlWhatsapp = `https://api.whatsapp.com/send?phone=50587870821&text=${textoCodificado}`;
        window.open(urlWhatsapp, '_blank', 'noopener,noreferrer');
    };

    if (isSuccess) {
        return <Cargando username={loginCorreo.split('@')[0]} />; 
    }

    // RENDERIZADO CONDICIONAL 1: Vistas Legales y Soporte Técnico
    if (vistaLegal) {
        return (
            <div className={styles.authBody}>
                <div className={styles.showcaseBgWrapper}>
                    {FONDOS_HERO.map((url, idx) => (
                        <img
                            key={idx}
                            src={url}
                            alt="Background Asset"
                            className={`${styles.showcaseBgImg} ${bgIndex === idx ? styles.slideBgActive : ''}`}
                            style={{ filter: 'blur(8px)' }}
                        />
                    ))}
                    <div className={styles.showcaseOverlay} />
                    <div className={styles.decorativeGrid} />
                </div>
                
                <main className={styles.authMain}>
                    <button onClick={() => setVistaLegal(null)} className={styles.btnVolver}>
                        ← Volver al Acceso
                    </button>

                    <div className={styles.legalCard}>
                        {vistaLegal === 'terminos' && (
                            <div className={styles.legalContent}>
                                <h2 className={styles.formTitle}>Términos de Servicio</h2>
                                <p className={styles.formSubtitle}>Reglas claras para tu seguridad y la nuestra</p>
                                <div className={styles.legalTextScroll}>
                                    <h4>1. Compras y Entregas Inmediatas</h4>
                                    <p>
                                        Al comprar en Nicaplus, garantizamos que las recargas de tus juegos, monedas virtuales, pases y cuentas completas se procesan y entregan de forma inmediata una vez validado tu pago. En el caso de consolas o accesorios físicos, la entrega se coordinará según la disponibilidad de stock indicada en la plataforma.
                                    </p>

                                    <h4>2. Garantías Transparentes</h4>
                                    <p>
                                        Todos nuestros productos premium cuentan con garantía segura. Si tienes algún inconveniente con una licencia digital, cuenta o artículo físico, puedes abrir un ticket de garantía desde tu perfil. Nos comprometemos a revisar y darte una solución rápida o reemplazo según el caso correspondiente, no ofrecemos garantias en el caso de articulos fisicos genéricos o no originales.
                                    </p>

                                    <h4>3. Soporte y Órdenes de Servicio</h4>
                                    <p>
                                        Si dejas un equipo para revisión, mantenimiento o reparación en nuestro taller, se generará una Orden de Servicio oficial. Te notificaremos el estado de la reparación de tu equipo y el presupuesto final. Los equipos reparados se entregarán únicamente presentando los datos de la orden correspondiente.
                                    </p>

                                    <h4>4. Cuentas y Compromiso de Pago</h4>
                                    <p>
                                        Si utilizas alguna de nuestras facilidades de adquisición o compras a crédito autorizadas, te comprometes a cumplir con las fechas de abono acordadas en tu estado de cuenta para mantener el acceso activo a tus servicios y evitar suspensiones temporales.
                                    </p>
                                </div>
                            </div>
                        )}

                        {vistaLegal === 'privacidad' && (
                            <div className={styles.legalContent}>
                                <h2 className={styles.formTitle}>Políticas de Privacidad</h2>
                                <p className={styles.formSubtitle}>Cómo protegemos tus datos en Nicaplus Gaming</p>
                                <div className={styles.legalTextScroll}>
                                    <h4>1. ¿Qué datos guardamos de ti?</h4>
                                    <p>
                                        Para que puedas usar tu cuenta y comprar sin problemas, solo guardamos los datos básicos que nos proporcionas: tu nombre, nombre de usuario, correo electrónico y número de teléfono. También mantenemos un registro de tus compras, el estado de tus pedidos, tus suscripciones activas y tus consultas de soporte técnico.
                                    </p>

                                    <h4>2. Seguridad de tus Contraseñas y Accesos</h4>
                                    <p>
                                        Tu seguridad es nuestra prioridad. Tus contraseñas están completamente encriptadas; esto significa que nadie, absolutamente nadie en Nicaplus, puede ver cuál es tu clave. Además, implementamos sistemas seguros para verificar tu identidad cada vez que inicias sesión, confirmas tu correo o solicitas restablecer una contraseña olvidada.
                                    </p>

                                    <h4>3. ¿Para qué usamos tu información?</h4>
                                    <p>
                                        Usamos tus datos única y exclusivamente para darte el servicio que te mereces: procesar y entregarte tus juegos o códigos digitales de inmediato, gestionar la entrega de consolas o accesorios físicos, avisarte sobre novedades de tus pedidos, atender tus reclamos de garantía y responder a tus mensajes de soporte técnico.
                                    </p>

                                    <h4>4. Cero Spam y Cero Reventa</h4>
                                    <p>
                                        Tus datos son tuyos. En Nicaplus no vendemos, compartimos ni filtramos tu información personal con ninguna otra empresa o persona externa. Todo se maneja de forma privada dentro de nuestra tienda para garantizarte una experiencia de compra limpia y segura.
                                    </p>
                                </div>
                            </div>
                        )}

                        {vistaLegal === 'soporte' && (
                            <div className={styles.legalContent}>
                                <h2 className={styles.formTitle}>Soporte Técnico Especializado</h2>
                                <p className={styles.formSubtitle}>Comunícate directamente con un asesor de Nicaplus</p>
                                
                                <form onSubmit={manejarSoporteWhatsApp} className={styles.soporteForm}>
                                    <div className={styles.inputGroup}>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="Tu Nombre o Usuario" 
                                            className={styles.inputField}
                                            value={soporteNombre}
                                            onChange={(e) => setSoporteNombre(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <textarea 
                                            required
                                            rows={4}
                                            placeholder="Describe el inconveniente con tu pedido, cuenta o recarga..." 
                                            className={styles.inputField}
                                            style={{ resize: 'none', fontFamily: 'inherit' }}
                                            value={soporteMensaje}
                                            onChange={(e) => setSoporteMensaje(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className={styles.btnSubmit}>
                                        Abrir Chat en WhatsApp 🚀
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // RENDERIZADO CONDICIONAL 2: Vista Principal (Login / Registro)
    return (
        <div className={styles.authBody}>
            <div className={styles.showcaseBgWrapper}>
                {FONDOS_HERO.map((url, idx) => (
                    <img
                        key={idx}
                        src={url}
                        alt="Background Asset"
                        className={`${styles.showcaseBgImg} ${bgIndex === idx ? styles.slideBgActive : ''}`}
                    />
                ))}
                <div className={styles.showcaseOverlay} />
                <div className={styles.decorativeGrid} />
            </div>

            <div className={styles.neonOrbViolet} />
            <div className={styles.neonOrbCyan} />

            <div className={styles.mainContainerLayout}>
                <main className={styles.authMain}>
                    <button onClick={alVolver} className={styles.btnVolver}>
                        ← Volver a la Tienda
                    </button>

                    <div className={styles.authGridCard}>
                        <div className={styles.infoColumn}>
                            <div className={styles.badgeSubli}>Plataforma Gaming Oficial</div>
                            
                            {!esRegistro ? (
                                <>
                                    <h2 className={styles.tituloInfo}>
                                        ¿Aún no tienes <span className={styles.textGradient}>cuenta?</span>
                                    </h2>
                                    <p className={styles.subtituloInfo}>
                                        Regístrate hoy mismo para realizar tus pedidos de forma inmediata, guardar tu carrito y gestionar tus suscripciones premium.
                                    </p>
                                    <div className={styles.toggleContainer}>
                                        <button onClick={() => setEsRegistro(true)} className={styles.btnToggle}>
                                            Crear una Cuenta
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className={styles.tituloInfo}>
                                        ¿Ya eres <span className={styles.textGradient}>miembro?</span>
                                    </h2>
                                    <p className={styles.subtituloInfo}>
                                        Inicia sesión para acceder a tu catálogo personalizado, ver tus licencias digitales y consultar tu historial de compras.
                                    </p>
                                    <div className={styles.toggleContainer}>
                                        <button onClick={() => setEsRegistro(false)} className={styles.btnToggle}>
                                            Iniciar Sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.formColumn}>
                            {isRegisterSuccess ? (
                                <div className={styles.formBox} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                                    <div className={styles.successPulseContainer}>
                                        <div className={styles.successCheckmark}>✓</div>
                                    </div>
                                    <h3 className={styles.formTitle} style={{ marginTop: '1.5rem', color: '#10b981' }}>
                                        ¡Cuenta Creada!
                                    </h3>
                                    <p className={styles.formSubtitle}>
                                        Preparando la cabina de acceso... Redirigiéndote al portal de inicio de sesión.
                                    </p>
                                </div>
                            ) : !esRegistro ? (
                                <div key="login" className={styles.formBox}>
                                    <h3 className={styles.formTitle}>Acceso de Clientes</h3>
                                    <p className={styles.formSubtitle}>Ingresa tus credenciales para continuar</p>
                                    
                                    <form onSubmit={manejarLoginSubmit}>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="Correo electrónico" 
                                                className={styles.inputField}
                                                value={loginCorreo}
                                                onChange={(e) => setLoginCorreo(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="password" 
                                                required
                                                placeholder="Contraseña" 
                                                className={styles.inputField}
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                            />
                                        </div>
                                        <button type="submit" className={styles.btnSubmit}>Ingresar Seguro</button>
                                    </form>
                                </div>
                            ) : (
                                <div key="register" className={styles.formBox}>
                                    <h3 className={styles.formTitle}>Registro de Usuario</h3>
                                    <p className={styles.formSubtitle}>Únete a la experiencia NICAPLUS GAMING</p>
                                    
                                    <form onSubmit={manejarRegistroSubmit}>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Nombre completo" 
                                                className={styles.inputField}
                                                value={regNombre}
                                                onChange={(e) => setRegNombre(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="email" 
                                                required
                                                placeholder="Correo electrónico" 
                                                className={styles.inputField}
                                                value={regCorreo}
                                                onChange={(e) => setRegCorreo(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="Usuario de la plataforma" 
                                                className={styles.inputField}
                                                value={regUsuario}
                                                onChange={(e) => setRegUsuario(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="tel" 
                                                required
                                                placeholder="Número de Teléfono" 
                                                className={styles.inputField}
                                                value={regTelefono}
                                                onChange={(e) => setRegTelefono(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <input 
                                                type="password" 
                                                required
                                                placeholder="Contraseña (mín. 6 caracteres)" 
                                                className={styles.inputField}
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                            />
                                        </div>
                                        <button type="submit" className={styles.btnSubmit}>Completar Registro</button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <footer className={styles.authFooter}>
                    <p>© {new Date().getFullYear()} Nicaplus Gaming. Todos los derechos reservados.</p>
                    <div className={styles.footerLinks}>
                        <span onClick={() => setVistaLegal('terminos')}>Términos de Servicio</span>
                        <span className={styles.dotDivider}>•</span>
                        <span onClick={() => setVistaLegal('privacidad')}>Políticas de Privacidad</span>
                        <span className={styles.dotDivider}>•</span>
                        <span onClick={() => setVistaLegal('soporte')}>Soporte Técnico</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};