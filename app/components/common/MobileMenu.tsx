"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/useAuth";
import { hasAnyVideo } from "@/lib/video-cache-utils";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCachedVideo, setHasCachedVideo] = useState(false);
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const checkVideo = () => {
      hasAnyVideo().then(setHasCachedVideo).catch(() => { });
    };

    checkVideo();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkVideo();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setIsOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  };

  const closeMenu = () => setIsOpen(false);

  if (!isMounted) {
    return (
      <button
        className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        aria-label="Cargando menú"
      >
        <Icon icon="solar:hamburger-menu-linear" className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="md:hidden p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Icon icon="solar:hamburger-menu-linear" className="w-6 h-6" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-0 right-0 bottom-0 w-70 bg-[#0a0a0a] border-l border-white/10 z-50 animate-in slide-in-from-right duration-300 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex flex-col">
              <Dialog.Title className="sr-only">Menú</Dialog.Title>
              <Dialog.Description className="sr-only">Navegación principal</Dialog.Description>

              <Link href="/" onClick={closeMenu} className="flex items-center gap-2">
                <Image src="/svg/logo-openvid.svg" alt="Logo" width={32} height={32} />
                <Image src="/svg/openvid.svg" alt="OpenVid" width={80} height={20} />
              </Link>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Cerrar menú"
              >
                <Icon icon="solar:close-square-linear" className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <Link
                href="/#docs"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Icon icon="solar:document-text-linear" className="w-5 h-5" />
                <span>Documentación</span>
              </Link>

              <a
                href="https://github.com/CristianOlivera1/openvid"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Icon icon="mdi:github" className="w-5 h-5" />
                <span>GitHub</span>
                <Icon icon="solar:external-link-linear" className="w-4 h-4 ml-auto opacity-50" />
              </a>

              {hasCachedVideo && (
                <Link
                  href="/editor"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Icon icon="solar:video-frame-cut-2-linear" className="w-5 h-5" />
                  <span>Ir al editor</span>
                </Link>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-white/5">
            {user ? (
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 text-sm"
                >
                  {isLoggingOut ? (
                    <>
                      <Icon icon="svg-spinners:ring-resize" className="w-5 h-5 animate-spin" />
                      <span className="font-medium">Cerrando sesión...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:logout-2-linear" className="w-5 h-5" />
                      <span className="font-medium">Cerrar sesión</span>
                    </>
                  )}
                </button>
            ) : (
              <Button variant="primary" asChild className="w-full">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Icon icon="solar:login-2-linear" className="w-5 h-5" />
                  <span>Iniciar sesión</span>
                </Link>
              </Button>

            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}