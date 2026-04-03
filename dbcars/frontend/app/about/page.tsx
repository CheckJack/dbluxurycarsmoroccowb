'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import ReviewCarousel from '@/components/ReviewCarousel';

export default function AboutPage() {
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const maxSizeReached = useRef(false);
  const [videoWidth, setVideoWidth] = useState('70rem');

  useEffect(() => {
    if (!videoSectionRef.current || !containerRef.current) {
      // Wait for next frame if refs aren't ready
      const timer = requestAnimationFrame(() => {
        if (!videoSectionRef.current || !containerRef.current) return;
      });
      return () => cancelAnimationFrame(timer);
    }

    // Check if mobile (viewport width < 768px)
    const isMobile = window.innerWidth < 768;
    
    // On mobile, set fixed width and don't add scroll listener
    if (isMobile) {
      setVideoWidth('100%');
      return;
    }

    const handleScroll = () => {
      if (!videoSectionRef.current || !containerRef.current) return;

      // Determine scroll direction
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      lastScrollY.current = currentScrollY;

      // Get video position
      const rect = videoSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const viewportCenter = windowHeight / 2;
      const videoCenter = rect.top + rect.height / 2;
      const distanceFromCenter = Math.abs(videoCenter - viewportCenter);

      // Check visibility
      const isVisible = rect.bottom > 0 && rect.top < windowHeight;
      const isPassed = rect.bottom < 0;
      const isBefore = rect.top > windowHeight;

      // Get container dimensions
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerPadding = 48;
      const maxWidth = containerRect.width - (containerPadding * 2);
      const startWidth = 70 * 16; // 70rem
      const endWidth = maxWidth;

      let currentWidth: number;

      if (!isVisible) {
        // Not visible - reset if before, maintain if passed
        if (isBefore) {
          currentWidth = startWidth;
          maxSizeReached.current = false;
        } else if (isPassed && maxSizeReached.current) {
          currentWidth = endWidth;
        } else {
          currentWidth = startWidth;
        }
      } else {
        // Visible - animate based on distance from center
        const animationRange = 500;
        let progress = 1 - (distanceFromCenter / animationRange);
        progress = Math.max(0, Math.min(1, progress));

        if (scrollingDown) {
          // Scrolling down - grow
          if (distanceFromCenter < 20) {
            // Very close to center - full size
            currentWidth = endWidth;
            maxSizeReached.current = true;
          } else {
            // Growing - apply easing
            const easedProgress = progress * progress;
            currentWidth = startWidth + (endWidth - startWidth) * easedProgress;
            if (maxSizeReached.current && progress < 0.95) {
              maxSizeReached.current = false;
            }
          }
        } else {
          // Scrolling up - shrink
          if (maxSizeReached.current) {
            // Was at full size - shrink based on distance
            const shrinkProgress = 1 - progress;
            const shrinkEasing = shrinkProgress * shrinkProgress * shrinkProgress * shrinkProgress;
            const reverseProgress = 1 - shrinkEasing;
            currentWidth = startWidth + (endWidth - startWidth) * reverseProgress;
            
            // Reset flag when far enough from center
            if (distanceFromCenter > 100) {
              maxSizeReached.current = false;
            }
          } else {
            // Wasn't at full size - shrink normally
            const shrinkProgress = 1 - progress;
            const shrinkEasing = shrinkProgress * shrinkProgress * shrinkProgress * shrinkProgress;
            const maxProgress = Math.min(progress, 0.95);
            const reverseProgress = maxProgress * (1 - shrinkEasing);
            currentWidth = startWidth + (endWidth - startWidth) * reverseProgress;
          }
        }
      }

      setVideoWidth(`${currentWidth}px`);
    };

    // Use requestAnimationFrame to ensure initial render is smooth
    const initTimer = requestAnimationFrame(() => {
      handleScroll();
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cancelAnimationFrame(initTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);


  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-about.jpg"
            alt="Luxury cars on scenic road"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-end pb-16 md:pb-24">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              About Us
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              The signature standard in luxury car rentals across Morocco
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white" style={{ overflowX: 'hidden' }}>
        {/* Mission & Values Section */}
        <section className="pt-20 md:pt-28 lg:pt-32 pb-10 md:pb-14 lg:pb-18 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-5 tracking-[-0.03em] leading-[1.1]">
                Our <span className="text-black">Mission</span>
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Founded with a vision to redefine luxury mobility in Morocco, DB Luxury Cars emerged from a simple belief: every journey deserves to be extraordinary. Our mission is to provide ultra-luxury mobility solutions that seamlessly blend world-class vehicles with effortless, personalized service.
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                We don&apos;t just rent cars—we craft experiences that elevate your time in Morocco. From the moment you land until your departure, every detail is executed with precision, discretion, and an unwavering commitment to excellence.
              </p>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-10 md:py-14 lg:py-18">
          <div ref={containerRef} className="container mx-auto px-4 md:px-6 lg:px-12 flex justify-center">
            <div 
              ref={videoSectionRef}
              className="aspect-video rounded-3xl overflow-hidden"
              style={{
                width: videoWidth,
                maxWidth: '100%',
                transition: 'none',
                willChange: 'width'
              }}
            >
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              >
                <source src="/Design-sem-nome-7-1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="pt-10 md:pt-14 lg:pt-18 pb-14 md:pb-18 lg:pb-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-5 tracking-[-0.03em] leading-[1.1]">
                Our <span className="text-black">Values</span>
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                At DB Luxury Cars, our values are the foundation of everything we do. We believe that true luxury is not just about the vehicles we offer, but about the experience we create and the relationships we build with our clients.
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                Excellence, discretion, and personalized service are at the heart of our operations. We are committed to exceeding expectations, maintaining the highest standards of quality, and ensuring that every interaction reflects our dedication to your satisfaction and comfort.
              </p>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <div>
          <ReviewCarousel visibleCards={3} className="pt-10 md:pt-14 lg:pt-18 pb-14 md:pb-18 lg:pb-20" />
        </div>

      </main>
    </>
  );
}

