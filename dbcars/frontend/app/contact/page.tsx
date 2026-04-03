'use client';

import { useState } from 'react';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { submitContactForm } from '@/lib/api';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'error' | 'success' | 'info' } | null>(null);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({
        message: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactForm({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });

      // Reset form
      setFormData({ name: '', email: '', message: '' });
      setErrors({});

      setToast({
        message: 'Thank you for your message! We will get back to you soon.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Contact form submission error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message. Please try again later.';
      setToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Hero Section */}
      <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/herocontact.png"
            alt="Luxury sports cars lineup along scenic waterfront"
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
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Get in touch with DB Luxury Cars for premium car rental services in Morocco
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
              {/* Left Column - Contact Information */}
              <div className="space-y-8">
                <div>
                  <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-gray-500 mb-4">
                    Get in Touch
                  </p>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-6">
                    We&apos;re here to help
                  </h2>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-8">
                    Whether you have questions about our luxury vehicles, need assistance with a booking,
                    or want to discuss a custom rental package, our team is ready to assist you.
                  </p>
                </div>

                {/* Contact Information Cards */}
                <div className="space-y-4">
                  {/* Phone Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                        <a
                          href="tel:+212524123456"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          +212 524 123456
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Email Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                        <a
                          href="mailto:info@dbluxurycars.com"
                          className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          info@dbluxurycars.com
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Social Media Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Stay connected with us on social media for the latest updates, special offers, and luxury car showcases.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {/* Instagram */}
                          <a
                            href="https://instagram.com/dbluxurycars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                            aria-label="Follow us on Instagram"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>

                          {/* Facebook */}
                          <a
                            href="https://facebook.com/dbluxurycars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 bg-blue-600 rounded-lg hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                            aria-label="Follow us on Facebook"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </a>

                          {/* Twitter/X */}
                          <a
                            href="https://twitter.com/dbluxurycars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 bg-black rounded-lg hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                            aria-label="Follow us on Twitter"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>

                          {/* LinkedIn */}
                          <a
                            href="https://linkedin.com/company/dbluxurycars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 bg-blue-700 rounded-lg hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                            aria-label="Follow us on LinkedIn"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>

                          {/* YouTube */}
                          <a
                            href="https://youtube.com/@dbluxurycars"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-center w-9 h-9 bg-red-600 rounded-lg hover:scale-110 transition-transform shadow-md hover:shadow-lg"
                            aria-label="Follow us on YouTube"
                          >
                            <svg
                              className="w-5 h-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Contact Form */}
              <div className="space-y-8">
                <div className="glass-form-container contact-form-dark">
                  <form onSubmit={handleSubmit} className="glass-form-box p-6 md:p-8 space-y-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                        Send us a Message
                      </h2>
                      <p className="text-gray-300 text-sm md:text-base">
                        Fill out the form below and we&apos;ll get back to you as soon as possible.
                      </p>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl outline-none focus:outline-none ${
                          errors.name
                            ? 'bg-red-900/20'
                            : 'bg-black/80'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl outline-none focus:outline-none ${
                          errors.email
                            ? 'bg-red-900/20'
                            : 'bg-black/80'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>

                    {/* Message Field */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className={`w-full px-4 py-3.5 text-base border-none rounded-xl outline-none focus:outline-none resize-none ${
                          errors.message
                            ? 'bg-red-900/20'
                            : 'bg-black/80'
                        } text-white placeholder-gray-400 transition-all`}
                        placeholder="Tell us how we can help you..."
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300"
                      style={{
                        boxShadow: 'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.boxShadow =
                            'inset 0px 3px 6px rgba(255, 255, 255, 0.6), inset 0px -3px 6px rgba(0, 0, 0, 0.8), 0px 0px 8px rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.boxShadow =
                            'inset 0px 3px 6px -4px rgba(255, 255, 255, 0.6), inset 0px -3px 6px -2px rgba(0, 0, 0, 0.8)';
                        }
                      }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="mt-16 lg:mt-24">
              <div className="mb-8 text-center">
                <p className="text-xs md:text-sm tracking-[0.25em] uppercase text-gray-500 mb-4">
                  Find Us
                </p>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
                  Visit Our Location
                </h2>
                <p className="text-base md:text-lg text-gray-700 max-w-2xl mx-auto">
                  Located in the heart of Guéliz, Marrakesh. Come visit us to see our luxury vehicles in person.
                </p>
              </div>
              
              <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3396.5!2d-8.0089!3d31.6295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xdafee8d96179e51%3A0x5950b6534f87adb8!2sGu%C3%A9liz%2C%20Marrakesh%2040000%2C%20Morocco!5e0!3m2!1sen!2sus!4v1699123456789!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="DB Luxury Cars Location - Guéliz Marrakesh"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
