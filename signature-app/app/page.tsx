export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="EventGaraget Logo" 
            className="h-24 mx-auto mb-4"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 mb-2">
          EventGaraget
        </h1>
        <p className="text-lg text-red-600 font-semibold mb-8">
          Digital Signeringstjänst
        </p>

        {/* Main Info Box */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto border-l-4 border-red-600">
          <div className="mb-6">
            <svg 
              className="w-12 h-12 mx-auto text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>

          <p className="text-gray-700 font-semibold mb-4">
            Välkommen till EventGaraget's signeringssystem!
          </p>

          <p className="text-sm text-gray-600 mb-6">
            För att signera ditt avtal, använd länken som skickats till din email.
          </p>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-xs text-gray-500 mb-2">Exempel på länk:</p>
            <code className="bg-white px-3 py-2 rounded text-red-600 font-mono text-sm block break-all">
              sign.eventgaraget.se/quotation/XXXX...
            </code>
          </div>

          <div className="mt-6 pt-6 border-t border-red-200">
            <p className="text-xs text-gray-500">
              En signeringsrättning kommer att skickas till din e-postadress
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>EventGaraget AB</p>
          <p className="text-red-600 font-semibold">booking@eventgaraget.se</p>
        </div>
      </div>
    </div>
  )
}
