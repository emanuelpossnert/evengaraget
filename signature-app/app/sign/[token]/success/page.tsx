'use client';

import { useParams } from 'next/navigation';

export default function SignatureSuccess() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border-l-4 border-red-600">
        {/* Logo */}
        <div className="mb-6">
          <img 
            src="/logo.png" 
            alt="EventGaraget Logo" 
            className="h-16 mx-auto"
          />
        </div>

        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 mb-4">
          Avtalet är signerat! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tack för att du valde EventGaraget! Du får en bekräftelse på email snart.
        </p>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <h2 className="font-semibold text-gray-900 mb-2">Vad händer nu?</h2>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">📧</span>
              <span>Du får en bekräftelse på email med det signerade avtalet</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💰</span>
              <span>Faktura för handpenningen skickas inom 24 timmar</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🚚</span>
              <span>Vi kontaktar dig 1-2 dagar före leverans för att bekräfta tid</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📞</span>
              <span>Har du frågor? Ring oss på 08-123 456 78</span>
            </li>
          </ul>
        </div>

        {/* Booking Number */}
        <div className="border-t-2 border-red-200 pt-4">
          <p className="text-sm text-gray-500">Bokningsnummer</p>
          <p className="font-mono font-semibold text-red-600">{token}</p>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <a 
            href="https://eventgaraget.se" 
            className="text-red-600 hover:text-red-700 text-sm font-medium transition"
          >
            ← Tillbaka till eventgaraget.se
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-400 mt-8">
          Ett signerat avtal har sparats säkert och skickats till både dig och EventGaraget.
        </p>
      </div>
    </div>
  );
}
