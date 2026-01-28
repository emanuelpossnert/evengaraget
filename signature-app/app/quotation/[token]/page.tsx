'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// OB-kostnad beräkning
const SWEDISH_HOLIDAYS_2025_2026 = [
  // 2025
  '2025-01-01', '2025-01-06', '2025-04-18', '2025-04-20', '2025-04-21',
  '2025-05-01', '2025-05-09', '2025-05-19', '2025-06-06', '2025-06-21',
  '2025-11-01', '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-31',
  // 2026
  '2026-01-01', '2026-01-06', '2026-04-03', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-14', '2026-05-24', '2026-06-06', '2026-06-20',
  '2026-11-01', '2026-12-24', '2026-12-25', '2026-12-26', '2026-12-31',
];

function isSwedishHoliday(dateString: string): boolean {
  const parts = dateString.split('-');
  if (parts.length >= 3) {
    const formattedDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
    return SWEDISH_HOLIDAYS_2025_2026.includes(formattedDate);
  }
  return false;
}

function isOBHour(timeString: string): boolean {
  if (!timeString) return false;
  const [hours, minutes] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 18 * 60 || totalMinutes < 7 * 60;
}

function isWeekend(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function calculateOBCost(
  pickupDate: string,
  pickupTime: string,
  deliveryDate: string,
  deliveryTime: string
): number {
  if (
    (pickupTime && isOBHour(pickupTime)) ||
    isWeekend(pickupDate) ||
    isSwedishHoliday(pickupDate)
  ) {
    return 1500;
  }

  if (
    (deliveryTime && isOBHour(deliveryTime)) ||
    isWeekend(deliveryDate) ||
    isSwedishHoliday(deliveryDate)
  ) {
    return 1500;
  }

  return 0;
}

export default function QuotationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [selectedAddons, setSelectedAddons] = useState<Map<string, {quantity: number, price: number, name: string}>>(new Map());
  const [selectedWrapping, setSelectedWrapping] = useState<Map<string, boolean>>(new Map());
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [deliveryOption, setDeliveryOption] = useState<string>(""); // delivery_type från booking

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  const load = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!apiKey || !url) throw new Error('Missing env vars');

      const qRes = await fetch(
        `${url}/rest/v1/quotations?signature_token=eq.${encodeURIComponent(token)}&select=id,booking_id,customer_id,total_amount,tax_amount,quotation_number,created_at,products_json`,
        { 
          method: 'GET',
          headers: { 
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );
      
      if (!qRes.ok) throw new Error('Quotation fetch failed: ' + qRes.statusText);
      const quotations = await qRes.json();
      if (!quotations?.length) throw new Error('Offert ej funnen');

      const q = quotations[0];

      const bRes = await fetch(
        `${url}/rest/v1/bookings?id=eq.${q.booking_id}&select=id,products_requested,event_date,event_end_date,location,delivery_street_address,delivery_postal_code,delivery_city,total_amount,pickup_date,pickup_time,delivery_date,delivery_time,ob_cost,delivery_type,shipping_cost`,
        { 
          method: 'GET',
          headers: { 
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      if (!bRes.ok) throw new Error('Booking fetch failed: ' + bRes.statusText);
      const bookings = await bRes.json();
      const booking = bookings?.[0] || null;

      const cRes = await fetch(
        `${url}/rest/v1/customers?id=eq.${q.customer_id}&select=id,name,email,phone,company_name,street_address,postal_code,city`,
        { 
          method: 'GET',
          headers: { 
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      if (!cRes.ok) throw new Error('Customer fetch failed: ' + cRes.statusText);
      const customers = await cRes.json();
      const customer = customers?.[0] || null;

      const pRes = await fetch(
        `${url}/rest/v1/products?select=id,name,base_price_per_day,can_be_wrapped,wrapping_cost`,
        { 
          method: 'GET',
          headers: { 
            'apikey': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      if (pRes.ok) {
        const productsData = await pRes.json();
        setAllProducts(productsData || []);
      }

      // Get product IDs from products requested
      let productIds: string[] = [];
      try {
        let pr = booking?.products_requested;
        if (typeof pr === 'string' && pr.startsWith('"')) {
          pr = JSON.parse(pr);
        }
        const productsArr = JSON.parse(pr);
        // Match product names to IDs
        productIds = productsArr
          .map((p: any) => allProducts.find(ap => ap.name === p.name)?.id)
          .filter(Boolean);
      } catch (e) {
        console.warn('Error parsing product IDs:', e);
      }

      // Fetch addons linked to these specific products
      let addonsData: any[] = [];
      if (productIds.length > 0) {
        const adRes = await fetch(
          `${url}/rest/v1/product_addons?product_id=in.(${productIds.join(',')})&select=addon_id,addons(id,name,price,category,description),display_order`,
          { 
            method: 'GET',
            headers: { 
              'apikey': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            } 
          }
        );

        if (adRes.ok) {
          const productAddons = await adRes.json();
          // Flatten and deduplicate addons
          const addonMap = new Map();
          productAddons.forEach((pa: any) => {
            if (pa.addons && !addonMap.has(pa.addons.id)) {
              addonMap.set(pa.addons.id, pa.addons);
            }
          });
          addonsData = Array.from(addonMap.values());
        } else {
          console.warn('Product addons fetch failed, trying fallback...');
          // Fallback: fetch all addons if product_addons fails
          const fbRes = await fetch(
            `${url}/rest/v1/addons?select=id,name,price,description`,
            { 
              method: 'GET',
              headers: { 
                'apikey': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              } 
            }
          );
          if (fbRes.ok) {
            addonsData = await fbRes.json();
          }
        }
      }

      setData({ ...q, booking, customer, addons: addonsData || [] });
      setDeliveryOption(booking?.delivery_type || "internal");
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Kunde inte ladda offerten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Laddar offert...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Fel: {error}</div>;
  if (!data) return <div className="p-8 text-center">Ingen data</div>;

  // Parse products
  let products = [];
  if (data.booking?.products_requested) {
    try {
      let pr = data.booking.products_requested;
      if (typeof pr === 'string' && pr.startsWith('"')) {
        pr = JSON.parse(pr);
      }
      products = JSON.parse(pr);
    } catch (e) {
      console.warn('Error parsing products:', e);
    }
  }

  // Get product details
  const productsWithDetails = products.map((p: any) => {
    const productDetail = allProducts.find(ap => ap.name === p.name);
    return {
      ...p,
      base_price_per_day: productDetail?.base_price_per_day || 0,
      can_be_wrapped: productDetail?.can_be_wrapped || false,
      wrapping_cost: productDetail?.wrapping_cost || 0,
      id: productDetail?.id,
    };
  });

  // ✅ CORRECT CALCULATION - Calculate from products, NOT from DB
  const productSubtotal = productsWithDetails.reduce((sum: number, p: any) => {
    const qty = p.quantity || 1;
    const price = p.base_price_per_day || 0;
    return sum + (qty * price);
  }, 0);

  // Selected addons
  const selectedAddonsTotal = Array.from(selectedAddons.values()).reduce(
    (sum, addon) => sum + (addon.quantity * addon.price),
    0
  );

  // Selected wrapping
  const selectedWrappingTotal = productsWithDetails.reduce((sum: number, p: any) => {
    return sum + (selectedWrapping.get(p.id) ? p.wrapping_cost : 0);
  }, 0);

  // ✅ ALL SUBTOTAL (products + addons + wrapping) BEFORE TAX
  const allSubtotal = productSubtotal + selectedAddonsTotal + selectedWrappingTotal;
  
  // Calculate shipping discount (10% if > 2 products, for external delivery only)
  const productCount = productsWithDetails.length;
  let shippingCost = (data.booking?.shipping_cost || 0);
  const shippingDiscount = deliveryOption === "external" && productCount > 2 ? Math.round(shippingCost * 0.1 * 100) / 100 : 0;
  shippingCost = Math.round((shippingCost - shippingDiscount) * 100) / 100;
  
  // Calculate OB cost
  const obCost = calculateOBCost(
    data.booking?.pickup_date || '',
    data.booking?.pickup_time || '',
    data.booking?.delivery_date || '',
    data.booking?.delivery_time || ''
  );
  
  // ✅ SUBTOTAL WITH SHIPPING, DISCOUNT, OB (products + addons + wrapping + shipping + OB) BEFORE TAX
  const subtotalWithShippingAndOB = allSubtotal + shippingCost + obCost;
  
  // ✅ TAX ON EVERYTHING (25%)
  const allTax = Math.round(subtotalWithShippingAndOB * 0.25 * 100) / 100;
  
  // ✅ GRAND TOTAL = Subtotal + Shipping + OB + Tax
  const grandTotal = subtotalWithShippingAndOB + allTax;

  const toggleAddon = (addonId: string, addon: any) => {
    const newSelected = new Map(selectedAddons);
    if (newSelected.has(addonId)) {
      newSelected.delete(addonId);
    } else {
      newSelected.set(addonId, { quantity: 1, price: addon.price, name: addon.name });
    }
    setSelectedAddons(newSelected);
  };

  const toggleWrapping = (productId: string) => {
    const newWrapping = new Map(selectedWrapping);
    if (newWrapping.has(productId)) {
      newWrapping.delete(productId);
    } else {
      newWrapping.set(productId, true);
    }
    setSelectedWrapping(newWrapping);
  };

  const handleProceed = async () => {
    if (!data.booking_id) return;

    setSaving(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const allSelectedItems = [
        ...Array.from(selectedAddons.values()),
        ...productsWithDetails
          .filter((p: any) => selectedWrapping.has(p.id))
          .map((p: any) => ({
            name: `Folierung: ${p.name}`,
            price: p.wrapping_cost,
            quantity: 1,
            type: 'wrapping',
          }))
      ];

      console.log('Saving with correct totals:', {
        productSubtotal,
        selectedAddonsTotal,
        selectedWrappingTotal,
        allSubtotal,
        obCost,
        subtotalWithOB,
        tax: allTax,
        grandTotal,
      });

      const qUpdateRes = await fetch(
        `${url}/rest/v1/quotations?id=eq.${data.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            addon_notes: JSON.stringify(allSelectedItems),
            total_amount: grandTotal,
            tax_amount: allTax,
          }),
        }
      );

      if (!qUpdateRes.ok) {
        const errorData = await qUpdateRes.json().catch(() => ({}));
        console.error('Quotation update error:', errorData);
        throw new Error('Kunde inte uppdatera offert: ' + JSON.stringify(errorData));
      }

      const bUpdateRes = await fetch(
        `${url}/rest/v1/bookings?id=eq.${data.booking_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            total_amount: grandTotal,
            ob_cost: obCost,
          }),
        }
      );

      if (!bUpdateRes.ok) throw new Error('Kunde inte uppdatera bokning');

      router.push(`/sign/${data.booking_id}`);
    } catch (err: any) {
      console.error('Error saving:', err);
      setError('Kunde inte spara: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Logo Header */}
        <div className="mb-8 text-center">
          <img 
            src="/logo.png" 
            alt="EventGaraget Logo" 
            className="h-20 mx-auto mb-4"
          />
        </div>

        {/* Main Header with Red Gradient */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-bold">📋 Offert {data.quotation_number}</h1>
          <p className="text-red-100">Skapade: {new Date(data.created_at).toLocaleDateString('sv-SE')}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">📋 Offert {data.quotation_number}</h1>
              <p className="text-gray-600">Skapade: {new Date(data.created_at).toLocaleDateString('sv-SE')}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6 pb-6 border-b">
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">KUNDUPPGIFTER</h3>
              <p className="font-semibold">{data.customer?.name || 'N/A'}</p>
              {data.customer?.company_name && <p className="text-sm text-gray-600">{data.customer.company_name}</p>}
              <p className="text-sm text-gray-600">{data.customer?.street_address || 'N/A'}</p>
              <p className="text-sm text-gray-600">{data.customer?.postal_code} {data.customer?.city}</p>
              <p className="text-sm text-gray-600 mt-2">Email: {data.customer?.email}</p>
              <p className="text-sm text-gray-600">Tel: {data.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">EVENT</h3>
              <p className="text-sm"><strong>Plats:</strong> {data.booking?.location || 'N/A'}</p>
              <p className="text-sm"><strong>Start:</strong> {data.booking?.event_date ? new Date(data.booking.event_date).toLocaleDateString('sv-SE') : 'N/A'}</p>
              <p className="text-sm"><strong>Slut:</strong> {data.booking?.event_end_date ? new Date(data.booking.event_end_date).toLocaleDateString('sv-SE') : 'N/A'}</p>
              <p className="text-sm mt-2"><strong>Leverans:</strong> {data.booking?.delivery_date ? new Date(data.booking.delivery_date).toLocaleDateString('sv-SE') : 'N/A'} {data.booking?.delivery_time && `kl ${data.booking.delivery_time}`}</p>
              <p className="text-sm"><strong>Upphämtning:</strong> {data.booking?.pickup_date ? new Date(data.booking.pickup_date).toLocaleDateString('sv-SE') : 'N/A'} {data.booking?.pickup_time && `kl ${data.booking.pickup_time}`}</p>
            </div>
          </div>

          {/* PRODUCTS */}
          <h3 className="font-semibold mb-3 text-lg">📦 HYRA VAROR</h3>
          <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded">
            {productsWithDetails.length > 0 ? productsWithDetails.map((p: any, i: number) => {
              const qty = p.quantity || 1;
              const price = p.base_price_per_day || 0;
              const subtotal = qty * price;
              
              return (
                <div key={i} className="border rounded p-3 bg-white">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{p.name}</span>
                    <span className="font-bold text-indigo-600">{subtotal} SEK</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{qty} st × {price} SEK</p>
                  
                  {p.can_be_wrapped && (
                    <label className="flex items-center space-x-2 cursor-pointer text-sm bg-orange-50 p-2 rounded">
                      <input 
                        type="checkbox"
                        checked={selectedWrapping.has(p.id) || false}
                        onChange={() => toggleWrapping(p.id)}
                        className="w-4 h-4 text-orange-600"
                      />
                      <span>🎁 Folierung/Branding (+{p.wrapping_cost} SEK)</span>
                    </label>
                  )}
                </div>
              );
            }) : <p className="text-gray-600">Inga produkter</p>}
          </div>

          {/* ADDONS */}
          <h3 className="font-semibold mb-3 text-lg">➕ VALFRIA TILLÄGG</h3>
          <div className="space-y-2 mb-6 bg-red-50 p-4 rounded">
            {data.addons?.length > 0 ? data.addons.map((a: any) => {
              const isSelected = selectedAddons.has(a.id);
              return (
                <label 
                  key={a.id}
                  className={`p-3 rounded border-2 cursor-pointer transition flex items-start space-x-3 ${
                    isSelected 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleAddon(a.id, a)}
                    className="mt-1 w-5 h-5 text-indigo-600"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{a.name}</p>
                    {a.description && <p className="text-xs text-gray-600">{a.description}</p>}
                  </div>
                  <span className="font-bold text-indigo-600 whitespace-nowrap">{a.price} SEK</span>
                </label>
              );
            }) : <p className="text-gray-600">Inga tillägg tillgängliga</p>}
          </div>

          {/* DELIVERY OPTION */}
          <h3 className="font-semibold mb-3 text-lg">🚚 LEVERANSSÄTT</h3>
          <div className="space-y-2 mb-6 bg-blue-50 p-4 rounded">
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded border-2 border-blue-200 bg-white hover:border-blue-500 transition">
              <input 
                type="radio"
                name="delivery"
                value="internal"
                checked={deliveryOption === "internal"}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">✅ EventGaraget levererar</p>
                <p className="text-xs text-gray-600">Vi hanterar leveransen inom Stockholm-området</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded border-2 border-blue-200 bg-white hover:border-blue-500 transition">
              <input 
                type="radio"
                name="delivery"
                value="external"
                checked={deliveryOption === "external"}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">📦 Extern frakt</p>
                <p className="text-xs text-gray-600">Fraktpartner hanterar leveransen</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded border-2 border-blue-200 bg-white hover:border-blue-500 transition">
              <input 
                type="radio"
                name="delivery"
                value="pickup"
                checked={deliveryOption === "pickup"}
                onChange={(e) => setDeliveryOption(e.target.value)}
                className="w-5 h-5 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">🚗 Jag hämtar upp själv</p>
                <p className="text-xs text-gray-600">Jag hämtar produkterna på lagret</p>
              </div>
            </label>
          </div>

          {/* PRICE SUMMARY */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Produkter:</span>
              <span className="font-semibold">{productSubtotal.toFixed(2)} SEK</span>
            </div>
            
            {selectedWrappingTotal > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Folierung/Branding:</span>
                <span className="font-semibold">{selectedWrappingTotal.toFixed(2)} SEK</span>
              </div>
            )}

            {selectedAddonsTotal > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Valda tillägg:</span>
                <span className="font-semibold">{selectedAddonsTotal.toFixed(2)} SEK</span>
              </div>
            )}

            {obCost > 0 && (
              <div className="flex justify-between text-sm text-orange-600 border-t pt-2">
                <span>OB-kostnad (18:00-07:00, helg, helgdag):</span>
                <span className="font-semibold">{obCost.toFixed(2)} SEK</span>
              </div>
            )}

            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-semibold">Subtotal (före moms):</span>
              <span className="font-bold">{subtotalWithOB.toFixed(2)} SEK</span>
            </div>

            <div className="flex justify-between text-sm text-green-600 border-t pt-2">
              <span>Moms (25%):</span>
              <span className="font-semibold">{allTax.toFixed(2)} SEK</span>
            </div>

            <div className="border-t pt-2 flex justify-between text-lg font-bold text-indigo-600">
              <span>TOTALT BELOPP:</span>
              <span>{grandTotal.toFixed(2)} SEK</span>
            </div>

            <div className="text-xs text-gray-600 pt-2 border-t">
              <p>Handpenning (50%): <span className="font-semibold">{(grandTotal * 0.5).toFixed(2)} SEK</span></p>
              <p>Restbelopp: <span className="font-semibold">{(grandTotal * 0.5).toFixed(2)} SEK</span></p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={handleProceed}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Sparar...' : '✍️ Nästa - Signera offert'}
            </button>
            <button 
              onClick={() => router.back()}
              className="px-6 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Tillbaka
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Genom att signera godkänner du EventGaraget's villkor
          </p>
        </div>
      </div>
    </div>
  );
}
