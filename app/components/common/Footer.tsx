import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#050505] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-12 mb-16">
        <div className="w-full md:w-1/3">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Image src="/svg/logo-openvid.svg" alt="Logo" width={50} height={50} />
              <Image src="/svg/openvid.svg" alt="Logo" width={100} height={50} />
            </Link>
          </div>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Aplicación moderna para la <span className="text-neutral-400 font-bold">grabación de pantalla</span> y la <span className="text-neutral-400 font-bold">edición de vídeo</span>. Diseñada para la web. Sin instalaciones, sin esperas y directamente en tu navegador.
          </p>
        </div>

        <div className="flex gap-12 md:gap-24">
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Producto</h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li><a href="#docs" className="hover:text-white transition-colors">Documentación</a></li>
              <li><Link href="/editor" className="hover:text-white transition-colors">Ir al editor</Link></li>
              {/* <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li> */}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li><a href="https://github.com/CristianOlivera1/openvid" target="_blank" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium text-sm mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-neutral-500">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xs text-neutral-600">© {currentYear} openvid All rights reserved.</span>
        <div className="flex gap-4 text-neutral-600">
          <a href="#" className="hover:text-white transition-colors"><Icon icon="solar:brand-twitter-linear" width="18"></Icon></a>
          <a href="#" className="hover:text-white transition-colors"><Icon icon="solar:brand-github-linear" width="18"></Icon></a>
          <a href="#" className="hover:text-white transition-colors"><Icon icon="solar:brand-discord-linear" width="18"></Icon></a>
        </div>
      </div>
    </footer>
  );
}