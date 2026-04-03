import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="relative text-white overflow-hidden" style={{ backgroundColor: '#000000', border: 'none', outline: 'none' }}>
      <style jsx>{`
        footer {
          background-color: #000000 !important;
        }
        footer a {
          text-decoration: none !important;
          color: #d1d5db !important;
          border: none !important;
          outline: none !important;
        }
        footer a:visited {
          color: #d1d5db !important;
          border: none !important;
        }
        footer a:focus,
        footer a:focus-visible,
        footer a:active {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
          color: #f97316 !important;
        }
        footer a:hover {
          color: #f97316 !important;
          border: none !important;
        }
        footer * {
          border-color: rgba(31, 41, 55, 0.5) !important;
        }
      `}</style>
      
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 relative z-10" style={{ color: 'white' }}>
        {/* Logo Section */}
        <div className="mb-12 md:mb-16 pb-8 border-b border-gray-800/50" style={{ borderColor: 'rgba(31, 41, 55, 0.5)' }}>
          <Link
            href="/cars"
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/logodb.png"
              alt="DB Luxury Cars"
              width={200}
              height={80}
              className="h-14 md:h-16 lg:h-20 w-auto object-contain"
              priority
              unoptimized
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-6 text-white tracking-tight">About Us</h3>
            <p className="text-gray-300 mb-6 leading-relaxed text-[15px]">
              Morocco&apos;s Ultimate Driving Experience. Premium luxury vehicles for your journey.
            </p>
            <div className="space-y-2 text-gray-400">
              <p className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Guéliz Marrakesh<br />Morocco 40000</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white tracking-wide uppercase text-sm">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/home" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  About us
                </Link>
              </li>
              <li>
                <Link 
                  href="/cars" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Our Cars
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white tracking-wide uppercase text-sm">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Privacy & Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  href="/cancellation" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="text-gray-300 hover:text-orange-500 transition-all duration-300 flex items-center gap-2 group text-[15px] no-underline"
                  style={{ color: '#d1d5db' }}
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-orange-500 transition-all duration-300"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white tracking-wide uppercase text-sm">Newsletter</h4>
            <p className="text-gray-300 mb-6 leading-relaxed text-[15px]">
              Be the first to know about our latest luxury vehicles, exclusive offers, and travel insights.
            </p>
            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-3.5 rounded-lg bg-gray-900/50 backdrop-blur-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 border border-gray-800/50 focus:border-orange-500/50 transition-all duration-300 text-[15px]"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3.5 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold text-[15px]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 pt-8 mt-8" style={{ borderColor: 'rgba(31, 41, 55, 0.5)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
            <p className="text-center md:text-left">
              Copyright © {new Date().getFullYear()}. All rights reserved to{' '}
              <span className="text-white font-semibold">DB Luxury Cars Morocco</span>
            </p>
            <p className="text-center md:text-right">
              Created and powered by{' '}
              <span className="text-gray-300 font-medium">Uptnable</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

