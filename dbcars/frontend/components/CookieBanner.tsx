'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  getCookieConsent,
  setCookieConsent,
  acceptAllCookies,
  rejectAllCookies,
  type CookieConsent,
} from '@/lib/cookieConsent';

export default function CookieBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consent, setConsent] = useState<CookieConsent | null>(null);

  useEffect(() => {
    const currentConsent = getCookieConsent();
    if (!currentConsent) {
      setIsVisible(true);
    } else {
      setConsent(currentConsent);
    }
  }, []);

  // Hide cookie banner on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAllCookies();
    setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    rejectAllCookies();
    setConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    if (consent) {
      setCookieConsent(consent);
      setIsVisible(false);
    }
  };

  const handleToggleCategory = (category: 'analytics' | 'marketing') => {
    if (consent) {
      setConsent({
        ...consent,
        [category]: !consent[category],
      });
    } else {
      setConsent({
        necessary: true,
        analytics: category === 'analytics',
        marketing: category === 'marketing',
        timestamp: Date.now(),
      });
    }
  };

  const handleOpenPreferences = () => {
    const currentConsent = getCookieConsent();
    if (currentConsent) {
      setConsent(currentConsent);
    } else {
      setConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      });
    }
    setShowPreferences(true);
    setIsVisible(true);
  };

  if (!isVisible && !showPreferences) {
    return (
      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={handleOpenPreferences}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-300 flex items-center gap-2 text-sm border border-gray-700"
        aria-label="Cookie preferences"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        Cookie Preferences
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t border-gray-800 max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: '#000000' }}
        >
          <div className="container mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
            {!showPreferences ? (
              // Initial banner view
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2 text-white">
                    We use cookies
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    We use cookies to enhance your browsing experience, analyze
                    site traffic, and personalize content. By clicking "Accept
                    All", you consent to our use of cookies. You can also
                    customize your preferences or learn more in our{' '}
                    <Link
                      href="/privacy"
                      className="text-orange-500 hover:text-orange-400 underline transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="px-6 py-2.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-all duration-300 font-medium text-sm whitespace-nowrap"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-6 py-2.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-all duration-300 font-medium text-sm whitespace-nowrap"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold text-sm whitespace-nowrap"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              // Preferences view
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    Cookie Preferences
                  </h3>
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setShowPreferences(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1"
                    aria-label="Close"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <p className="text-gray-300 text-xs md:text-sm">
                  Manage your cookie preferences. You can enable or disable
                  different types of cookies below. Learn more in our{' '}
                  <Link
                    href="/privacy"
                    className="text-orange-500 hover:text-orange-400 underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>

                <div className="space-y-3 md:space-y-4">
                  {/* Necessary Cookies */}
                  <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm md:text-base">
                          Necessary Cookies
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Essential for the website to function properly
                        </p>
                      </div>
                      <div className="bg-gray-700 px-2 md:px-3 py-1 rounded text-xs text-gray-300 whitespace-nowrap self-start sm:self-auto">
                        Always Active
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm mt-2">
                      These cookies are necessary for the website to function
                      and cannot be switched off. They are usually set in
                      response to actions made by you such as setting your
                      privacy preferences, logging in, or filling in forms.
                    </p>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm md:text-base">
                          Analytics Cookies
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Help us understand how visitors interact with our
                          website
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-auto">
                        <input
                          type="checkbox"
                          checked={consent?.analytics ?? false}
                          onChange={() => handleToggleCategory('analytics')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm mt-2">
                      These cookies allow us to count visits and traffic sources
                      so we can measure and improve the performance of our site.
                      They help us know which pages are most and least popular.
                    </p>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm md:text-base">
                          Marketing Cookies
                        </h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Used to deliver personalized advertisements
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-auto">
                        <input
                          type="checkbox"
                          checked={consent?.marketing ?? false}
                          onChange={() => handleToggleCategory('marketing')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm mt-2">
                      These cookies may be set through our site by our
                      advertising partners. They may be used to build a profile
                      of your interests and show you relevant content on other
                      sites.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3 md:pt-4 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setShowPreferences(false);
                    }}
                    className="px-6 py-2.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-all duration-300 font-medium text-sm w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 font-semibold text-sm w-full sm:w-auto"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

