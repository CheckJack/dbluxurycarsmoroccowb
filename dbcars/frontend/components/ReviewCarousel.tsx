'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Review {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

interface ReviewCarouselProps {
  reviews?: Review[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  visibleCards?: number; // Number of cards visible at once (1-3)
  className?: string;
}

const defaultReviews: Review[] = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Business Traveler",
    company: "London, UK",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Airport pickup in Marrakech was perfectly on time and the car was immaculate. Smooth handover, clear communication, and a truly premium experience from start to finish.",
    date: "2 weeks ago"
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    role: "Couple Getaway",
    company: "Madrid, Spain",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "We booked for a weekend in Marrakech and the service felt five-star. The vehicle was spotless, the delivery was quick, and the team was responsive the whole time.",
    date: "1 month ago"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Family Trip",
    company: "Paris, France",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The booking was easy and the team suggested the right car for our luggage and kids. Great condition, comfortable drive, and a very professional handover.",
    date: "3 weeks ago"
  },
  {
    id: 4,
    name: "James Kim",
    role: "Executive Transfer",
    company: "Dubai, UAE",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Chauffeur service was discreet and punctual. The ride quality was excellent and the driver knew the best routes in the city — very smooth and secure.",
    date: "1 week ago"
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Event Guest",
    company: "Marrakech, Morocco",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "We needed a luxury car for a special event and everything was flawless. The car looked incredible and arrived exactly when promised. Highly recommended.",
    date: "2 months ago"
  },
  {
    id: 6,
    name: "David Martinez",
    role: "Business Owner",
    company: "Casablanca, Morocco",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "I’ve rented several times and the consistency is what stands out: clean cars, transparent terms, and fast support on WhatsApp. Real premium service.",
    date: "3 weeks ago"
  },
  {
    id: 7,
    name: "Rachel Green",
    role: "Content Creator",
    company: "Berlin, Germany",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The fleet is stunning and the delivery service made it effortless. Perfect for shoots and city driving — the car was in pristine condition.",
    date: "1 month ago"
  },
  {
    id: 8,
    name: "Thomas Anderson",
    role: "Road Trip",
    company: "Amsterdam, Netherlands",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "We drove from Marrakech to the coast and the car was perfect — powerful, comfortable, and spotless. Easy pickup and return with no stress.",
    date: "2 weeks ago"
  },
  {
    id: 9,
    name: "Sophie Laurent",
    role: "Corporate Guest",
    company: "Geneva, Switzerland",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Our guests were impressed by the professionalism and presentation. The team handled scheduling changes smoothly and the vehicles were flawless.",
    date: "4 weeks ago"
  },
  {
    id: 10,
    name: "Robert Chen",
    role: "Airport Delivery",
    company: "Toronto, Canada",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "They delivered the car directly to the airport and the paperwork took minutes. Great communication, no surprises, and an excellent vehicle.",
    date: "1 week ago"
  },
  {
    id: 11,
    name: "Amanda Foster",
    role: "Hotel Delivery",
    company: "Marrakech, Morocco",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Delivered to our hotel exactly on time and the car was sparkling clean. Very polite staff and an overall smooth, luxury experience.",
    date: "3 weeks ago"
  },
  {
    id: 12,
    name: "Christopher Lee",
    role: "VIP Service",
    company: "New York, USA",
    avatar: "https://images.unsplash.com/photo-1507591064344-4c6cefdb1f77?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Discreet, premium, and reliable. From booking to return, everything was handled professionally and the vehicle was exactly as advertised.",
    date: "2 months ago"
  }
];

export function ReviewCarousel({
  reviews = defaultReviews,
  autoPlay = true,
  autoPlayInterval = 3000,
  visibleCards = 3,
  className
}: ReviewCarouselProps) {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [cardStyles, setCardStyles] = React.useState<Record<number, { opacity: number; scale: number }>>({});
  
  // Create duplicated reviews for infinite loop (2 sets for seamless scrolling)
  const duplicatedReviews = [...reviews, ...reviews];
  
  // Update card styles based on position in viewport
  React.useEffect(() => {
    const updateCardStyles = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      
      const styles: Record<number, { opacity: number; scale: number }> = {};
      
      container.querySelectorAll('[data-card-index]').forEach((card) => {
        const cardElement = card as HTMLElement;
        const index = parseInt(cardElement.dataset.cardIndex || '0');
        const rect = cardElement.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distanceFromCenter = Math.abs(cardCenter - containerCenter);
        const maxDistance = containerRect.width / 2;
        
        // Calculate opacity: 1 at center, fading to 0.4 at edges
        const opacity = Math.max(0.4, 1 - (distanceFromCenter / maxDistance) * 0.6);
        // Calculate scale: 1 at center, 0.92 at edges
        const scale = Math.max(0.92, 1 - (distanceFromCenter / maxDistance) * 0.08);
        
        styles[index] = { opacity, scale };
      });
      
      setCardStyles(styles);
    };
    
    // Wait for next frame to ensure DOM is ready
    let interval: NodeJS.Timeout | null = null;
    const timeoutId = setTimeout(() => {
      updateCardStyles();
      interval = setInterval(updateCardStyles, 100);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
  
  // Responsive visible cards: 1 on mobile, 3 on desktop
  const [responsiveVisibleCards, setResponsiveVisibleCards] = React.useState(3);
  
  React.useEffect(() => {
    const updateVisibleCards = () => {
      if (window.innerWidth < 768) {
        setResponsiveVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setResponsiveVisibleCards(2);
      } else {
        setResponsiveVisibleCards(3);
      }
    };
    
    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const actualVisibleCards = responsiveVisibleCards;
  
  // Calculate animation duration based on number of reviews
  // More reviews = longer duration for smooth continuous scroll
  const animationDuration = reviews.length * 8; // 8 seconds per review for slower, smoother scroll

  return (
    <section 
      className={cn("w-full py-24 md:py-32 lg:py-40 relative overflow-hidden", className)}
      role="region"
      aria-label="Customer reviews carousel"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-about.jpg"
          alt="Luxury car background"
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="container mx-auto px-4 md:px-6 lg:px-12 relative z-20">
        <div className="text-center mb-16 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 tracking-[-0.03em] leading-[1.1]"
          >
            What Our Clients Say
          </motion.h2>
          
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6"></div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed"
          >
            Premium car rental & chauffeur service across Morocco
          </motion.p>
        </div>

          <div 
            ref={carouselRef}
            className="relative w-full max-w-7xl mx-auto"
            tabIndex={0}
          >
            <div 
              ref={scrollContainerRef}
              className="relative overflow-hidden w-full"
              style={{ 
                minHeight: actualVisibleCards === 1 ? '320px' : '400px'
              }}
            >
              <div
                className={cn(
                  "flex",
                  autoPlay ? "animate-scroll-reviews" : ""
                )}
                style={{
                  gap: actualVisibleCards === 1 ? '1rem' : '1.5rem',
                  width: 'max-content',
                  animationDuration: `${animationDuration}s`,
                  animationPlayState: 'running',
                  willChange: 'transform'
                }}
              >
                {duplicatedReviews.map((review, index) => {
                  const cardStyle = cardStyles[index] || { opacity: 1, scale: 1 };
                  
                  // Fixed width for cards to ensure proper display
                  // Mobile: 85vw to show most of card with slight peek
                  // Tablet: 500px for 2 cards
                  // Desktop: 380px for 3 cards
                  const cardWidth = actualVisibleCards === 1 
                    ? 'calc(85vw)' 
                    : actualVisibleCards === 2 
                    ? '500px' 
                    : '380px';
                  
                  return (
                    <motion.div
                      key={`${review.id}-${index}`}
                      data-card-index={index}
                      className="flex-shrink-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-500"
                      style={{
                        width: cardWidth,
                        aspectRatio: actualVisibleCards === 1 ? '1 / 0.95' : '1 / 1',
                        minHeight: '0',
                        padding: actualVisibleCards === 1 ? '1.25rem' : '1.25rem'
                      }}
                      initial={false}
                      animate={{
                        opacity: cardStyle.opacity,
                        scale: cardStyle.scale
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className={cn(
                          "flex items-start mb-3",
                          actualVisibleCards === 1 ? "gap-3" : "gap-3"
                        )}>
                          <img
                            src={review.avatar}
                            alt={review.name}
                            className={cn(
                              "rounded-full object-cover border-2 border-orange-500/40 shadow-lg flex-shrink-0",
                              actualVisibleCards === 1 ? "w-14 h-14" : "w-12 h-12"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className={cn(
                              "font-semibold text-white mb-0.5 truncate",
                              actualVisibleCards === 1 ? "text-base" : "text-sm"
                            )}>
                              {review.name}
                            </h3>
                            <p className={cn(
                              "text-white/80 mb-0.5 truncate",
                              actualVisibleCards === 1 ? "text-sm" : "text-xs"
                            )}>
                              {review.role}
                            </p>
                            <p className={cn(
                              "text-white/60 truncate",
                              actualVisibleCards === 1 ? "text-xs" : "text-[10px]"
                            )}>
                              {review.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star 
                                key={i}
                                className={cn(
                                  "fill-yellow-400 text-yellow-400 drop-shadow-sm",
                                  actualVisibleCards === 1 ? "w-4 h-4" : "w-3 h-3"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <blockquote 
                          className={cn(
                            "text-white/90 leading-relaxed",
                            actualVisibleCards === 1 ? "text-sm" : "text-xs"
                          )}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: actualVisibleCards === 1 ? 4 : 5,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          "{review.text}"
                        </blockquote>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/20">
                        <span className={cn(
                          "text-white/60",
                          actualVisibleCards === 1 ? "text-xs" : "text-[10px]"
                        )}>
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReviewCarousel;
