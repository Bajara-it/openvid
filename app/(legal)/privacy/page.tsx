"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#09090B] py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-white/50 hover:text-white mb-8 transition-colors"
                    >
                        <Icon icon="lucide:arrow-left" width="16" className="mr-2" />
                        Volver al inicio
                    </Link>

                    <h1 className="text-3xl md:text-4xl font-semibold text-white mb-3">
                        Política de Privacidad
                    </h1>
                    <p className="text-white/50 text-sm">
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-10 text-white/70 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">1. Introducción</h2>
                        <p>
                            En openvid, respetamos tu privacidad y nos comprometemos a proteger tu información personal. 
                            Esta política describe cómo recopilamos, usamos y protegemos tus datos cuando utilizas nuestra plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">2. Información que Recopilamos</h2>
                        <p className="mb-3">
                            Recopilamos la siguiente información cuando usas openvid:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li><strong className="text-white/80">Información de cuenta:</strong> Nombre, correo electrónico y foto de perfil (cuando usas OAuth)</li>
                            <li><strong className="text-white/80">Datos de uso:</strong> Información sobre cómo usas la aplicación y sus funciones</li>
                            <li><strong className="text-white/80">Información técnica:</strong> Tipo de navegador, dispositivo, dirección IP y cookies</li>
                            <li><strong className="text-white/80">Contenido temporal:</strong> Videos que subes para editar (procesados localmente en tu navegador)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">3. Cómo Usamos tu Información</h2>
                        <p className="mb-3">
                            Utilizamos tu información para:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Proporcionar y mejorar los servicios de openvid</li>
                            <li>Personalizar tu experiencia de usuario</li>
                            <li>Comunicarnos contigo sobre actualizaciones y nuevas funciones</li>
                            <li>Analizar el uso de la plataforma para optimizar el rendimiento</li>
                            <li>Prevenir fraudes y proteger la seguridad de la plataforma</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">4. Procesamiento de Videos</h2>
                        <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl mt-4">
                            <Icon icon="lucide:shield-check" className="text-green-400 shrink-0 mt-0.5" width="18" />
                            <div>
                                <p className="text-white/80 font-semibold mb-1">Privacidad Garantizada</p>
                                <p className="text-green-400/80 text-sm leading-relaxed">
                                    Tus videos se procesan <span className="font-semibold text-green-300">completamente en tu navegador</span>. 
                                    No subimos tus videos a nuestros servidores. Todo el procesamiento ocurre localmente en tu dispositivo, 
                                    garantizando que tu contenido permanezca privado y seguro.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">5. Cookies y Tecnologías Similares</h2>
                        <p className="mb-3">
                            Utilizamos cookies y tecnologías similares para:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
                            <li>Mantener tu sesión activa</li>
                            <li>Recordar tus preferencias de edición</li>
                            <li>Analizar el rendimiento de la aplicación</li>
                            <li>Proporcionar funciones de autenticación</li>
                        </ul>
                        <p>
                            Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad de la aplicación.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">6. Compartir Información</h2>
                        <p className="mb-3">
                            No vendemos ni compartimos tu información personal con terceros, excepto en los siguientes casos:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li><strong className="text-white/80">Proveedores de servicios:</strong> Como servicios de autenticación (Google OAuth)</li>
                            <li><strong className="text-white/80">Cumplimiento legal:</strong> Cuando sea requerido por ley o autoridades competentes</li>
                            <li><strong className="text-white/80">Protección de derechos:</strong> Para proteger nuestros derechos legales o los de otros usuarios</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">7. Seguridad de Datos</h2>
                        <p className="mb-3">
                            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información contra:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
                            <li>Acceso no autorizado</li>
                            <li>Divulgación accidental</li>
                            <li>Alteración o destrucción de datos</li>
                        </ul>
                        <p>
                            Sin embargo, ningún método de transmisión por Internet es 100% seguro, y no podemos garantizar la seguridad absoluta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">8. Tus Derechos</h2>
                        <p className="mb-3">
                            Tienes derecho a:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li><strong className="text-white/80">Acceso:</strong> Solicitar una copia de tu información personal</li>
                            <li><strong className="text-white/80">Rectificación:</strong> Corregir información inexacta o incompleta</li>
                            <li><strong className="text-white/80">Eliminación:</strong> Solicitar la eliminación de tu cuenta y datos</li>
                            <li><strong className="text-white/80">Portabilidad:</strong> Recibir tus datos en un formato estructurado</li>
                            <li><strong className="text-white/80">Oposición:</strong> Oponerte a ciertos procesamientos de tus datos</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">9. Retención de Datos</h2>
                        <p>
                            Conservamos tu información personal solo durante el tiempo necesario para los propósitos descritos en esta política. 
                            Los videos procesados en tu navegador no se almacenan en nuestros servidores y se eliminan automáticamente al cerrar la sesión.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">10. Menores de Edad</h2>
                        <p>
                            openvid no está dirigido a menores de 13 años. No recopilamos intencionalmente información de menores. 
                            Si descubrimos que hemos recopilado datos de un menor sin consentimiento parental, los eliminaremos de inmediato.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">11. Cambios a esta Política</h2>
                        <p>
                            Podemos actualizar esta política de privacidad periódicamente. Te notificaremos sobre cambios significativos 
                            mediante un aviso en la aplicación o por correo electrónico. Te recomendamos revisar esta página regularmente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">12. Contacto</h2>
                        <p>
                            Si tienes preguntas o inquietudes sobre esta política de privacidad, o deseas ejercer tus derechos, 
                            puedes contactarnos a través de los canales disponibles en la aplicación.
                        </p>
                    </section>
                </div>

                {/* Footer Info */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Al usar openvid, también aceptas nuestros{" "}
                        <Link href="/terms" className="text-white hover:underline transition-colors">
                            Términos de Servicio
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}