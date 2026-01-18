// This is a shared branding component for all pages
export const EventGaraget = {
  colors: {
    primary: '#E63946', // Red from logo
    secondary: '#FF8C42', // Orange
    accent: '#1A1A1A', // Dark from logo
    text: '#333333',
    light: '#F8F8F8',
  },
  gradient: 'from-red-600 to-orange-500',
  logo: '🎪', // Placeholder until we add the actual logo
};

export function BrandedHeader() {
  return (
    <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EventGaraget</h1>
          <p className="text-red-100">Din boknings- och signeringslösning</p>
        </div>
        <div className="text-5xl">🎪</div>
      </div>
    </div>
  );
}
