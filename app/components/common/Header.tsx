"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { hasAnyVideo } from "@/lib/video-cache-utils";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasCachedVideo, setHasCachedVideo] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkVideo = () => {
      hasAnyVideo().then(setHasCachedVideo).catch(() => {});
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

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        isScrolled
          ? "border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl py-0"
          : "bg-transparent border-transparent py-2"
      )}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/svg/logo-openvid.svg" alt="Logo" width={50} height={50} style={{ height: "auto" }} />
          <Image src="/svg/openvid.svg" alt="Logo" width={100} height={50} className="hidden sm:flex" style={{ height: "auto" }} />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#docs" className="hover:text-white transition-colors">Documentación</a>
          <a href="https://github.com/CristianOlivera1/openvid" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          {hasCachedVideo && (
            <Link href="/editor" className="hover:text-white transition-colors">
              Ir al editor
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="block">
            {!isMounted ? (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/5"></div>
                <div className="w-24 h-4 rounded-md bg-white/10 animate-pulse"></div>
              </div>
            ) : (
              <UserMenu />
            )}
          </div>
          {!isMounted ? (
            <div className="w-9 h-9 rounded-md bg-white/10 animate-pulse border border-white/5"></div>
          ) : (
            <MobileMenu />
          )}
        </div>
      </div>
    </header>
  );
}