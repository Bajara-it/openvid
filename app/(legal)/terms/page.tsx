"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";

export default function TermsPage() {
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
                        Términos de Servicio
                    </h1>
                    <p className="text-white/50 text-sm">
                        Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-10 text-white/70 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar openvid, aceptas estar legalmente vinculado por estos términos de servicio.
                            Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">2. Descripción del Servicio</h2>
                        <p className="mb-3">
                            openvid es una aplicación web de edición de video que permite a los usuarios:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Subir y editar videos en el navegador.</li>
                            <li>Aplicar efectos visuales, fondos y elementos personalizados.</li>
                            <li>Exportar videos con o sin fondo transparente.</li>
                            <li>Utilizar herramientas de zoom, recorte y ajustes de audio.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">3. Cuenta de Usuario</h2>
                        <p className="mb-3">
                            Para acceder a ciertas funciones, es posible que necesites crear una cuenta mediante:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
                            <li>Autenticación con Google OAuth.</li>
                            <li>Otros métodos de autenticación disponibles.</li>
                        </ul>
                        <p>
                            Eres responsable de mantener la confidencialidad de tu cuenta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">4. Uso Aceptable</h2>
                        <p className="mb-3">
                            Al utilizar openvid, te comprometes a:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>No subir contenido ilegal, ofensivo o que viole derechos de terceros.</li>
                            <li>No utilizar el servicio para propósitos maliciosos o fraudulentos.</li>
                            <li>No intentar acceder a sistemas o datos sin autorización.</li>
                            <li>Respetar los límites de uso y recursos del servicio.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">5. Propiedad Intelectual</h2>
                        <p>
                            Tú mantienes todos los derechos sobre el contenido que subes a openvid.
                            Nosotros solo procesamos tus videos temporalmente para proporcionar el servicio de edición.
                            No almacenamos ni compartimos tu contenido sin tu consentimiento explícito.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">6. Limitación de Responsabilidad</h2>
                        <p className="text-white/60">
                            openvid se proporciona &quot;tal cual&quot; sin garantías de ningún tipo. No nos hacemos responsables de:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Pérdida de datos o contenido.</li>
                            <li>Interrupciones del servicio.</li>
                            <li>Errores en la exportación de videos.</li>
                            <li>Incompatibilidades con navegadores o dispositivos.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">7. Modificaciones del Servicio</h2>
                        <p>
                            Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento
                            sin previo aviso. También podemos actualizar estos términos periódicamente.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">8. Ley Aplicable</h2>
                        <p>
                            Estos términos se rigen por las leyes aplicables en tu jurisdicción.
                            Cualquier disputa se resolverá mediante arbitraje vinculante.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-medium text-white mb-4">9. Contacto</h2>
                        <p>
                            Si tienes preguntas sobre estos términos, puedes contactarnos a través de los canales disponibles en la aplicación.
                        </p>
                    </section>
                </div>

                {/* Footer Info */}
                <div className="mt-16 pt-8 border-t border-white/10">
                    <p className="text-sm text-white/50">
                        Al usar openvid, también aceptas nuestra{" "}
                        <Link href="/privacy" className="text-white hover:underline transition-colors">
                            Política de Privacidad
                        </Link>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}