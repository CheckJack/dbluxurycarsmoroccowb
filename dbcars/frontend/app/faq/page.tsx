'use client';

import { useState } from 'react';
import Image from 'next/image';

const faqs = [
  {
    question: 'What documents do I need to rent?',
    answer:
      'You need a valid driver\'s license (held for at least 2 years), International Driving Permit (for non-Moroccan licenses), passport, and a major credit card in the driver\'s name.',
  },
  {
    question: 'What is the minimum age to rent?',
    answer:
      'The minimum age is 25 years old for most vehicles. Supercars may require drivers to be 30+ with additional experience.',
  },
  {
    question: 'Do you offer delivery service?',
    answer:
      'Yes, we provide complimentary delivery within Casablanca, Marrakech, Rabat, and Fez city centers. Airport delivery is available for an additional fee of €50-150 depending on location.',
  },
  {
    question: 'What is included in the rental price?',
    answer:
      'All rentals include comprehensive insurance, 24/7 roadside assistance, GPS navigation, and basic cleaning. Fuel and any traffic violations are the customer\'s responsibility.',
  },
  {
    question: 'How much is the security deposit?',
    answer:
      'Security deposits vary by vehicle category: Economic: €500, Luxury Sedans: €1,000, Sportscars: €2,000, SUVs: €1,500, Supercars: €5,000. The deposit is held on your credit card and released 7-14 days after return.',
  },
  {
    question: 'Can I drive to other countries?',
    answer:
      'No, our vehicles must remain within Morocco. Cross-border travel to Spain, Algeria, or other countries is not permitted and will void insurance coverage.',
  },
  {
    question: 'How do I make a reservation?',
    answer:
      'You can book online through our website, call us directly, or visit our office in Guéliz Marrakesh. Online bookings require a credit card to secure your reservation. We recommend booking in advance, especially during peak seasons.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. Cash payments are accepted for rentals over €1,000, but a credit card is still required for the security deposit.',
  },
  {
    question: 'Can I add an additional driver?',
    answer:
      'Yes, you can add additional drivers for €15-25 per day depending on the vehicle category. All additional drivers must meet the same age and license requirements and be present at pickup with their documents.',
  },
  {
    question: 'What happens if I return the vehicle late?',
    answer:
      'Late returns are charged at 1.5x the daily rate for each hour late, up to a full day\'s rental. If you need to extend your rental, please contact us at least 24 hours before your scheduled return time.',
  },
  {
    question: 'What is your cancellation policy?',
    answer:
      'Cancellations made 48 hours or more before pickup receive a full refund. Cancellations within 48 hours incur a 50% fee. No-shows are charged the full rental amount. Special events and peak season bookings may have different terms.',
  },
  {
    question: 'What insurance coverage is included?',
    answer:
      'All rentals include comprehensive third-party liability insurance and collision damage waiver (CDW) with a deductible. You can reduce the deductible to zero by purchasing our Premium Protection package for an additional daily fee.',
  },
  {
    question: 'What if the vehicle breaks down?',
    answer:
      'We provide 24/7 roadside assistance throughout Morocco. If your vehicle breaks down, call our emergency hotline and we\'ll send a replacement vehicle or arrange repairs. You\'re never stranded with our comprehensive support.',
  },
  {
    question: 'Are there mileage limits?',
    answer:
      'Most rentals include unlimited mileage within Morocco. Some long-term rentals (30+ days) may have mileage restrictions, which will be clearly stated in your rental agreement.',
  },
  {
    question: 'Can I rent a car for one way travel?',
    answer:
      'Yes, we offer one-way rentals between major cities (Casablanca, Marrakech, Rabat, Fez) for an additional fee of €100-200 depending on distance. One-way rentals must be arranged in advance.',
  },
  {
    question: 'What fuel policy do you use?',
    answer:
      'Vehicles are provided with a full tank and must be returned with a full tank. If returned with less fuel, you\'ll be charged for refueling at €2.50 per liter plus a €20 service fee.',
  },
  {
    question: 'Do you offer child seats?',
    answer:
      'Yes, we provide child seats (infant, toddler, and booster) for €5-10 per day. Please request them at the time of booking to ensure availability.',
  },
  {
    question: 'Can I modify my reservation?',
    answer:
      'Yes, you can modify your reservation online or by calling us. Changes to dates, vehicle type, or pickup location are subject to availability and may result in price adjustments. Modifications within 48 hours may incur fees.',
  },
  {
    question: 'What happens if I damage the vehicle?',
    answer:
      'Any damage beyond normal wear and tear will be charged according to our damage assessment. The cost will be deducted from your security deposit. We recommend taking photos of the vehicle at pickup and return.',
  },
  {
    question: 'Do you offer long-term rentals?',
    answer:
      'Yes, we offer monthly and extended rental packages with discounted rates. Long-term rentals (30+ days) include special benefits like reduced security deposits and priority vehicle selection. Contact us for custom quotes.',
  },
  {
    question: 'Are pets allowed in the vehicles?',
    answer:
      'Pets are allowed in most vehicles with prior approval. A cleaning fee of €50-100 may apply depending on the vehicle category. Supercars and certain luxury models may have restrictions.',
  },
  {
    question: 'What is your policy on smoking?',
    answer:
      'All our vehicles are non-smoking. A deep cleaning fee of €150-300 will be charged if evidence of smoking is found, as it requires extensive cleaning to remove odors.',
  },
  {
    question: 'Can I rent a car without a credit card?',
    answer:
      'A credit card is required for all rentals as it\'s needed for the security deposit hold. Debit cards may be accepted for payment, but a credit card is still required for the deposit authorization.',
  },
  {
    question: 'Do you offer corporate or business rates?',
    answer:
      'Yes, we offer special rates for corporate clients, travel agencies, and businesses with regular rental needs. Corporate accounts include benefits like invoicing, dedicated account management, and volume discounts.',
  },
  {
    question: 'What should I do in case of an accident?',
    answer:
      'In case of an accident, ensure everyone\'s safety first, then call the police (190) and our emergency hotline immediately. Do not admit fault. Take photos and gather witness information. We\'ll guide you through the process.',
  },
  {
    question: 'Are GPS navigation systems included?',
    answer:
      'Yes, all vehicles come equipped with GPS navigation systems. Some luxury and supercar models also include premium navigation with real-time traffic updates and points of interest.',
  },
  {
    question: 'Can I pick up the vehicle at the airport?',
    answer:
      'Yes, we offer airport pickup and drop-off services at major Moroccan airports (Casablanca, Marrakech, Rabat, Fez) for an additional fee. Airport service includes meet-and-greet assistance.',
  },
  {
    question: 'What are your operating hours?',
    answer:
      'Our main office is open Monday-Saturday 9:00 AM - 7:00 PM and Sunday 10:00 AM - 6:00 PM. After-hours pickup and return can be arranged for an additional fee. Emergency assistance is available 24/7.',
  },
  {
    question: 'Do you have vehicles available for special events?',
    answer:
      'Yes, we provide vehicles for weddings, corporate events, photo shoots, and special occasions. We offer packages with chauffeur services and can coordinate multiple vehicles for large events. Advance booking is recommended.',
  },
  {
    question: 'What is the difference between vehicle categories?',
    answer:
      'Economic: Budget-friendly options (€30-60/day). Luxury Sedans: Premium comfort and features (€80-150/day). Sportscars: High-performance vehicles (€150-300/day). SUVs: Spacious and capable (€100-200/day). Supercars: Ultimate luxury and performance (€500+/day).',
  },
  {
    question: 'Can I extend my rental period?',
    answer:
      'Yes, you can extend your rental by contacting us at least 24 hours before your scheduled return. Extensions are subject to vehicle availability and will be charged at the current daily rate.',
  },
  {
    question: 'What happens if I lose the keys?',
    answer:
      'Lost keys result in a replacement fee of €200-500 depending on the vehicle, plus any associated costs for reprogramming or towing. We recommend keeping keys secure and using the provided key holder.',
  },
  {
    question: 'Do you offer chauffeur services?',
    answer:
      'Yes, we provide professional chauffeur services for an additional fee. Our chauffeurs are experienced, multilingual, and familiar with Morocco\'s roads. Chauffeur service is available for all vehicle categories.',
  },
  {
    question: 'Are there any restrictions on where I can drive?',
    answer:
      'Vehicles can be driven on all public roads in Morocco. Off-road driving is not permitted unless the vehicle is specifically designed for it (like 4x4 SUVs). Driving on beaches or in restricted areas is prohibited.',
  },
  {
    question: 'What is your policy on traffic violations?',
    answer:
      'Any traffic violations (speeding tickets, parking fines, etc.) incurred during the rental period are the renter\'s responsibility. We will charge the fine amount plus a €25 administrative fee for processing.',
  },
  {
    question: 'Can I rent a car if I have points on my license?',
    answer:
      'Renters with serious violations or recent DUI convictions may be declined. Minor violations are generally acceptable. We review each case individually and may require additional documentation or insurance.',
  },
  {
    question: 'Do you offer winter tires or special equipment?',
    answer:
      'Winter tires are available for mountain travel during winter months for an additional fee. We also offer roof racks, bike carriers, and other equipment. Please request special equipment when booking.',
  },
  {
    question: 'What is your policy on toll roads?',
    answer:
      'Toll fees are the renter\'s responsibility. Some vehicles are equipped with electronic toll payment systems. We can provide information about major toll roads and estimated costs for your route.',
  },
  {
    question: 'Can I rent a car for someone else?',
    answer:
      'The primary renter must be present at pickup with their documents and credit card. You cannot rent a vehicle for someone else unless they are listed as an additional driver and meet all requirements.',
  },
  {
    question: 'What happens if the vehicle I booked is not available?',
    answer:
      'If your booked vehicle is unavailable due to circumstances beyond our control, we\'ll provide a comparable or upgraded vehicle at no additional cost. You\'ll be notified in advance whenever possible.',
  },
  {
    question: 'Do you offer loyalty programs or discounts?',
    answer:
      'Yes, we offer discounts for repeat customers, early bookings, and long-term rentals. Follow us on social media for special promotions and seasonal offers. Corporate clients receive additional benefits.',
  },
  {
    question: 'What should I check before leaving with the vehicle?',
    answer:
      'Before leaving, inspect the vehicle for any existing damage, check fuel level, test all features (lights, AC, GPS), ensure you have the rental agreement, emergency contact numbers, and understand the vehicle\'s features. Take photos of any existing damage.',
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  const filteredFaqs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    );
  });

  return (
    <>
      {/* Hero Section */}
      <section className="relative w-full h-[48vh] min-h-[360px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/herofaq.png"
            alt="Ferrari on scenic road"
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
              FAQ
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
              Find answer to common question about our services
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-white">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6 lg:px-12">
            {/* Section Header */}
            <div className="text-center mb-16 md:mb-20">
              <div className="inline-block mb-3">
                <span className="text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">
                  Your Questions Answered
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-5 tracking-[-0.03em] leading-[1.1]">
                Common Inquiries
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                Everything you need to know about renting luxury vehicles with DB Luxury Cars
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search for questions or answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-gray-200 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
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
                )}
              </div>
              {searchQuery && (
                <p className="mt-4 text-sm text-gray-600 text-center">
                  {filteredFaqs.length === 0
                    ? 'No results found'
                    : `Found ${filteredFaqs.length} ${filteredFaqs.length === 1 ? 'result' : 'results'}`}
                </p>
              )}
            </div>

            {/* FAQ Accordion */}
            <div className="max-w-4xl mx-auto space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  // Find original index for proper accordion state management
                  const originalIndex = faqs.indexOf(faq);
                  return (
                    <div
                      key={originalIndex}
                      className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      <button
                        onClick={() => setOpenIndex(openIndex === originalIndex ? null : originalIndex)}
                        className={`w-full px-6 md:px-8 py-5 md:py-6 text-left flex justify-between items-center transition-all duration-300 group ${
                          openIndex === originalIndex
                            ? 'bg-orange-500 border-b border-orange-600'
                            : 'hover:bg-orange-500'
                        }`}
                      >
                        <span
                          className={`font-semibold text-base md:text-lg pr-4 transition-colors duration-300 ${
                            openIndex === originalIndex 
                              ? 'text-white' 
                              : 'text-gray-900 group-hover:text-white'
                          }`}
                        >
                          {faq.question}
                        </span>
                        <svg
                          className={`w-5 h-5 md:w-6 md:h-6 flex-shrink-0 transition-all duration-300 ${
                            openIndex === originalIndex
                              ? 'rotate-180 text-white'
                              : 'text-gray-600 group-hover:text-white'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openIndex === originalIndex
                            ? 'max-h-[500px] opacity-100'
                            : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 md:px-8 py-5 md:py-6 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed text-base md:text-lg">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xl font-semibold text-gray-900 mb-2">No results found</p>
                  <p className="text-gray-600">
                    Try searching with different keywords or{' '}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-orange-600 hover:text-orange-700 font-medium underline"
                    >
                      clear your search
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

