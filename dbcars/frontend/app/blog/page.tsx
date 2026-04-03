'use client';

import { useEffect, useState } from 'react';
import { getBlogPosts } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Helper function to construct image URLs
  const getImageUrl = (url: string | null | undefined) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    
    // If already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Construct full URL from relative path
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const fullUrl = `${baseUrl}${cleanUrl}`;
    
    // Log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Image URL constructed:', { original: url, full: fullUrl });
    }
    
    return fullUrl;
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setError(null);
      const data = await getBlogPosts(true); // Only get published posts
      console.log('Blog posts loaded:', data);
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((post, index) => {
          console.log(`Post ${index + 1}:`, {
            title: post.title,
            cover_image: post.cover_image,
            featured_image: post.featured_image,
            fullUrl: post.cover_image || post.featured_image ? getImageUrl(post.cover_image || post.featured_image) : 'none'
          });
        });
      }
      setPosts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading blog posts:', error);
      setError(error.message || 'Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        {/* Hero Section */}
        <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/heroblog.jpg"
              alt="Luxury car blog background"
              fill
              className="object-cover"
              priority
              quality={90}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/50 z-10"></div>
          </div>
          <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-end pb-16 md:pb-24">
            <div className="text-white">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
                Blog
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
                Discover the world in style - Luxury travel insights & tips
              </p>
            </div>
          </div>
        </section>

        {/* Loading State */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/heroblog.jpg"
            alt="Luxury car blog background"
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/50 z-10"></div>
        </div>
        <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-12 h-full flex items-end pb-16 md:pb-24">
          <div className="text-white">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-4">
              Blog
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Discover the world in style - Luxury travel insights & tips
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div>
          {error ? (
            <div className="max-w-3xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-center font-medium">
                  {error}
                </p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="max-w-3xl mx-auto">
              <p className="text-gray-600 text-center">
                No blog posts available yet. Check back soon for travel tips, vehicle spotlights, and
                destination guides.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {posts.map((post, index) => {
            // Prioritize cover_image, fallback to featured_image
            const coverImg = post.cover_image && typeof post.cover_image === 'string' && post.cover_image.trim() !== '';
            const featuredImg = post.featured_image && typeof post.featured_image === 'string' && post.featured_image.trim() !== '';
            const imageUrl = coverImg ? post.cover_image : (featuredImg ? post.featured_image : null);
            const fullImageUrl = imageUrl ? getImageUrl(imageUrl) : null;
            // Only mark as failed if we have a URL and it's in the failed set
            const imageFailed = fullImageUrl ? failedImages.has(fullImageUrl) : false;
            const shouldShowImage = fullImageUrl && !imageFailed;
            
            return (
              <div
                key={post.id}
              >
                <Link
                  href={`/blog/${post.id}`}
                  className="relative rounded-xl overflow-hidden shadow-lg aspect-[5/6] min-h-[380px] block bg-gradient-to-br from-gray-800 via-gray-900 to-black"
                >
                {/* Background Image */}
                {shouldShowImage ? (
                  <div className="absolute inset-0">
                    <Image
                      src={fullImageUrl}
                      alt={post.title || 'Blog post image'}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      onError={(e) => {
                        // Track failed image
                        if (fullImageUrl) {
                          console.error('Image failed to load:', fullImageUrl);
                          setFailedImages(prev => new Set(prev).add(fullImageUrl));
                        }
                        // Hide the image element
                        const target = e.currentTarget as HTMLImageElement;
                        if (target) {
                          target.style.display = 'none';
                        }
                      }}
                      onLoad={() => {
                        if (process.env.NODE_ENV === 'development') {
                          console.log('Image loaded successfully:', fullImageUrl);
                        }
                      }}
                    />
                  </div>
                ) : null}
                
                {/* Placeholder - show if no image URL or image failed */}
                {!shouldShowImage && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8 z-10">
                  {/* Date Badge */}
                  <div className="mb-4">
                    <span className="inline-block bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs lg:text-sm text-white/90 font-medium border border-white/20">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-white line-clamp-2 leading-tight">
                    {post.title}
                  </h2>
                  
                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-white/90 mb-6 line-clamp-3 text-sm lg:text-base leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  
                  {/* Read More Link */}
                  <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm lg:text-base">
                    <span>Read more</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  </div>
                </Link>
              </div>
            );
          })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
