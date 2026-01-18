'use client';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        <img 
          src="/eventgaraget-logo.png" 
          alt="EventGaraget" 
          className="h-24 mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">EventGaraget</h1>
        <p className="text-gray-600 mb-4">Välkommen till bokningsdetaljer-appen</p>
        <p className="text-sm text-gray-500">Använd länken från bekräftelsemail för att se din bokning och ladda upp dina foliering-designs</p>
      </div>
    </div>
  );
}

