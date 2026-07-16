import React, { useState } from 'react';
import api from '../services/api';
import styles from '../assets/styles/ClientesLogin/ClientesLoginRegister.module.css';
import { Cargando } from '../views/Cargando'; // Importamos tu cargador animado

interface ClientesLoginRegisterProps {
    alVolver: () => void;
    alIniciarSesion: (datosCliente: any) => void;
}

export const ClientesLoginRegister: React.FC<ClientesLoginRegisterProps> = ({ alVolver, alIniciarSesion }) => {
    const [esRegistro, setEsRegistro] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // Estado para animación de login exitoso
    const [isRegisterSuccess, setIsRegisterSuccess] = useState(false); // Estado para registro exitoso

    // Estados para el formulario de Login
    const [loginCorreo, setLoginCorreo] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Estados para el formulario de Registro
    const [regNombre, setRegNombre] = useState('');
    const [regCorreo, setRegCorreo] = useState('');
    const [regUsuario, setRegUsuario] = useState('');
    const [regTelefono, setRegTelefono] = useState('');
    const [regPassword, setRegPassword] = useState('');

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

            // Activamos la vista de carga gaming espectacular
            setIsSuccess(true);
            const datosUsuario = respuesta.data?.cliente || respuesta.data?.usuario || { nombre: loginCorreo };

            // Esperamos 2.5 segundos de animación antes de ingresar al sistema
            setTimeout(() => {
                alIniciarSesion(datosUsuario);
                alVolver();
            }, 2500);

        } catch (error: any) {
            console.error('Error en login:', error);
            if (error.response?.data && typeof error.response.data === 'string') {
                alert(error.response.data); // Puedes cambiar esto por un Toast de tu preferencia más adelante
            } else {
                alert('Credenciales incorrectas o error en el servidor');
            }
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
            
            // Efecto visual rápido de éxito de registro
            setIsRegisterSuccess(true);
            
            // Esperamos 2 segundos para cambiar la pestaña a Login automáticamente
            setTimeout(() => {
                setIsRegisterSuccess(false);
                setEsRegistro(false); // Enviamos al usuario a la vista de login
                // Limpiamos los campos del registro
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

    // 1. Si el inicio de sesión es exitoso, mostramos el portal de carga
    if (isSuccess) {
        return <Cargando username={loginCorreo.split('@')[0]} />; 
    }

    return (
        <div className={styles.authBody}>
            {/* Capas traseras decorativas del diseño Gaming */}
            <div className={styles.heroSection}>
                <div className={styles.decorativeGrid} />
            </div>

            <main className={styles.authMain}>
                <button onClick={alVolver} className={styles.btnVolver}>
                    ← Volver a la Tienda
                </button>

                <div className={styles.authGridCard}>
                    
                    {/* COLUMNA INFORMATIVA (IZQUIERDA) */}
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

                    {/* COLUMNA DE FORMULARIOS (DERECHA) */}
                    <div className={styles.formColumn}>
                        {isRegisterSuccess ? (
                            /* 2. Pantalla intermedia rápida al registrarse con éxito */
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
        </div>
    );
};