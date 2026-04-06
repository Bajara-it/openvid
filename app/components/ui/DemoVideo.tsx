"use client";

import React, { useEffect, useRef, useState } from "react";
// Importamos AnimatePresence y motion de Framer Motion para la animación profesional
import { AnimatePresence, motion, Variants } from "framer-motion";

// Lista de características extraídas de tu contexto
const features = [
    "Grabación de pantalla",
    "Zooms suaves",
    "Movimiento de Cámara 3D",
    "Mockups de dispositivo",
    "Fondos personalizados",
    "Multipista de Audio",
    "Procesamiento con FFmpeg.wasm",
    "Exportación 4K"
];

export default function DemoVideo() {
    const videoRef = useRef<HTMLVideoElement>(null);
    // Estado para controlar qué característica se muestra
    const [featureIndex, setFeatureIndex] = useState(0);

    useEffect(() => {
        // Intersection Observer para play/pause del video (tu lógica existente)
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(() => { });
                    } else {
                        videoRef.current?.pause();
                    }
                });
            },
            { threshold: 0.1 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        // Lógica para cambiar la característica cada 3 segundos
        const featureInterval = setInterval(() => {
            setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
        }, 3000);

        return () => {
            observer.disconnect();
            clearInterval(featureInterval); // Limpieza del intervalo
        };
    }, []);

    // Definición de la animación (el "hack" profesional)
    // Agrega ": Variants" justo aquí
    const tickerVariants: Variants = {
        enter: {
            y: 20,
            opacity: 0,
            filter: "blur(4px)",
            scale: 0.95
        },
        center: {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            transition: {
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                filter: { duration: 0.3 }
            }
        },
        exit: {
            y: -20,
            opacity: 0,
            filter: "blur(4px)",
            scale: 0.95,
            transition: {
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                filter: { duration: 0.3 }
            }
        }
    };

    return (
        <div className="w-full flex flex-col items-center mb-30">
            <h2 className="text-4xl md:text-6xl text-center font-bold tracking-tighter text-white mb-10 leading-tight drop-shadow-[1.2px_1.2px_100.2px_rgba(183,203,248,1)]">
                Mira lo que puedes <br />
                <span className="bg-linear-to-r from-[#003780] to-white bg-clip-text text-transparent">
                    crear con openvid
                </span>
            </h2>

            <div className="relative group w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0E0E12] transform-gpu transition-all duration-700 
                    shadow-[-15px_-25px_60px_-30px_rgba(0,163,255,0.35)] 
                    hover:shadow-[-15px_-30px_80px_-15px_rgba(0,163,255,0.35)] 
                    hover:border-white/20">
                <div className="absolute -inset-px bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />

                <div className="absolute inset-0 bg-linear-to-t from-[#0E0E12] via-transparent to-transparent z-10 pointer-events-none" />

                <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 pointer-events-none select-none">

                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-end min-w-[260px] md:min-w-[320px]">
                        <div className="h-6 w-full flex items-center justify-end overflow-hidden px-2 py-1">
                            <AnimatePresence mode="wait">
                                <motion.h2
                                    key={featureIndex}
                                    initial={{ y: 50, opacity: 0, skewY: 10 }}
                                    animate={{ y: 0, opacity: 1, skewY: 0 }}
                                    exit={{ y: -50, opacity: 0, skewY: -10 }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="text-xl md:text-2xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] uppercase whitespace-nowrap"
                                >
                                    {features[featureIndex]}
                                </motion.h2>
                            </AnimatePresence>
                        </div>

                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="h-1 bg-linear-to-r from-transparent via-blue-500 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        />
                    </div>
                </div>
                <video
                    ref={videoRef}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/images/pages/demo-poster.avif"
                    className="relative z-0 w-full h-auto object-cover transform-gpu transition-transform duration-700 group-hover:scale-[1.02]"
                >
                    <source src="images/pages/demo.mp4" type="video/mp4" />
                    Tu navegador no soporta la reproducción de videos.
                </video>
            </div>
        </div>
    );
}