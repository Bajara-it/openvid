import { CarouselDemos } from "@/app/components/ui/CarouselDemos";
import DonationCard from "@/app/components/ui/DonationCard";
import EditorPreview from "@/app/components/ui/EditorPreview";
import Hero from "@/app/components/ui/Hero";
import { HeroScrollMask } from "@/app/components/ui/HeroScrollMask";
import InteractiveRecordingSteps from "@/app/components/ui/RecordingSteps";
import { StructuredData, generateWebAppSchema, generateOrganizationSchema } from "@/app/components/seo/StructuredData";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://openvid.dev';

  const metadata = {
    es: {
      title: 'Crea demos profesionales y edita videos en segundos',
      description: 'Editor de video online gratuito con IA. Graba pantalla, añade zooms cinemáticos, mockups profesionales y exporta en HD. Sin marca de agua.',
      keywords: ['editor de video', 'grabar pantalla', 'demos profesionales', 'zoom video', 'mockups', 'screen recorder', 'video editor online'],
    },
    en: {
      title: 'Create Professional Demos and Edit Videos in Seconds',
      description: 'Free AI-powered online video editor. Screen recorder, cinematic zooms, professional mockups, and HD export. No watermark.',
      keywords: ['video editor', 'screen recorder', 'professional demos', 'video zoom', 'mockups', 'online video editor', 'free video editor'],
    },
  };

  const { title, description, keywords } = metadata[locale as 'es' | 'en'] || metadata.es;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        es: `${baseUrl}/es`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      images: [
        {
          url: `${baseUrl}/images/metadata/preview-openvid.jpg`,
          width: 1200,
          height: 630,
          alt: 'openvid - Professional Video Editor',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/metadata/preview-openvid.jpg`],
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <StructuredData data={generateWebAppSchema(locale as 'es' | 'en')} />
      <StructuredData data={generateOrganizationSchema()} />
      
      <div className="flex flex-col">
      <div className="relative overflow-hidden bg-gradient-radial-primary w-full">

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-75 h-75 rounded-full bg-cyan-500/15 blur-[80px] pointer-events-none z-0" />

        <section className="pt-32 pb-6 sm:pb-14 bg-gradient-radial-primary">
          <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
            <Hero />
          </div>
        </section>

        <section className="w-full">
          <HeroScrollMask />
        </section>
      </div>
      <section className="w-full py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <InteractiveRecordingSteps />
        </div>
      </section>

      <div className="relative overflow-hidden bg-gradient-radial-primary w-full pt-0 pb-30 sm:py-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-[150%] rounded-[100%] blur-xl pointer-events-none "></div>
        <section className="w-full">
          <div className="w-full mx-auto bg-[url('/images/pages/dots.svg')] bg-no-repeat bg-contain bg-center">
            <EditorPreview />
          </div>
          <CarouselDemos />
          <section className="pt-4 pb-10 sm:py-2 w-full mb-0 sm:mb-42">
            <div
              className="absolute left-1/2 -translate-x-1/2 w-150 h-500 pointer-events-none z-0 pro-glow"
              style={{
                mixBlendMode: 'plus-lighter',
                willChange: 'filter, background',
                background: 'radial-gradient(circle at var(--glow-x) 20%, rgba(6, 182, 212, 0.25) 0%, transparent 70%)'
              }}
            />
            <div className="max-w-xl mx-auto px-6">
              <DonationCard />
            </div>
          </section>
        </section>
      </div>
    </div>
    </>
  );
}