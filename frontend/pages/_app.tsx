import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import ErrorBoundary from '../components/ErrorBoundary';
import OnboardingTour from '../components/OnboardingTour';
import FloatingXPNumbers from '../components/FloatingXPNumber';
import { SoundProvider } from '../context/SoundContext';
import { VoiceProvider } from '../context/VoiceContext';
import '../styles/globals.css';

const ForgeBackground = dynamic(() => import('../components/ForgeBackground'), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <ErrorBoundary>
        <SoundProvider>
          <VoiceProvider>
            <ForgeBackground />
            <OnboardingTour />
            <FloatingXPNumbers />
            <Component {...pageProps} />
          </VoiceProvider>
        </SoundProvider>
      </ErrorBoundary>
    </>
  );
}
