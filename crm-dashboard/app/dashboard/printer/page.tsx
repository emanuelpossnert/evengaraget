'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Printer, MapPin, Calendar, Phone, Mail, Image, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FoilingOrder {
  id: string;
  booking_number: string;
  event_date: string;
  location: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  products_requested: any[];
  image_count: number;
  latest_image_uploaded: string;
}

interface FoilingImage {
  id: string;
  file_name: string;
  image_url: string;
  uploaded_at: string;
}

export default function PrinterPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<FoilingOrder[]>([]);
  const [images, setImages] = useState<Map<string, FoilingImage[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch confirmed orders with foiling
      const { data: ordersData, error: ordersError } = await supabase
        .from('printer_foiling_orders')
        .select('*')
        .order('event_date', { ascending: true });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (ordersData) {
        setOrders(ordersData as FoilingOrder[]);

        // Fetch images for each order
        const imagesMap = new Map();
        for (const order of ordersData) {
          const { data: imgsData } = await supabase
            .from('booking_wrapping_images')
            .select('id, file_name, image_url, uploaded_at')
            .eq('booking_id', order.id)
            .order('uploaded_at', { ascending: false });

          if (imgsData) {
            imagesMap.set(order.id, imgsData);
          }
        }
        setImages(imagesMap);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredOrders = orders;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🖨️ Tryckeri - Foliering</h1>
              <p className="text-gray-600 mt-1">Bekräftade ordrar för foliering</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            🔄 Uppdatera
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Aktiva Ordrar</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredOrders.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Bilder Uppladdade</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {Array.from(images.values()).reduce((sum, imgs) => sum + imgs.length, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Denna Vecka</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {filteredOrders.filter(o => {
                const eventDate = new Date(o.event_date);
                const today = new Date();
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return eventDate >= today && eventDate <= weekFromNow;
              }).length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Väntande Bilder</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {filteredOrders.filter(o => (o.image_count || 0) === 0).length}
            </p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <Printer size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-semibold">Inga folierings-ordrar</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const orderImages = images.get(order.id) || [];
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition"
                >
                  {/* Header Row */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{order.booking_number}</h3>
                      <p className="text-sm text-gray-600 mt-1">{order.customer_name}</p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-blue-600" />
                        <span>{new Date(order.event_date).toLocaleDateString('sv-SE')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span>{order.location}</span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone size={16} className="text-green-600" />
                        <a href={`tel:${order.customer_phone}`} className="text-blue-600 hover:underline">
                          {order.customer_phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-green-600" />
                        <a href={`mailto:${order.customer_email}`} className="text-blue-600 hover:underline text-xs">
                          {order.customer_email}
                        </a>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                        <Image size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-600">
                          {orderImages.length} bilder
                        </span>
                      </div>
                      {orderImages.length === 0 && (
                        <p className="text-xs text-orange-600 mt-2 font-semibold">⚠️ Väntande bilder</p>
                      )}
                    </div>

                    <div>
                      <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition text-sm"
                      >
                        {expandedOrderId === order.id ? '▼ Göm' : '▶ Visa Bilder'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section - Images */}
                  {expandedOrderId === order.id && (
                    <div className="border-t pt-4 mt-4">
                      {/* Products */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">📦 Produkter för Foliering:</p>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {(() => {
                            let products: any[] = [];
                            try {
                              if (typeof order.products_requested === 'string') {
                                products = JSON.parse(order.products_requested);
                              } else if (Array.isArray(order.products_requested)) {
                                products = order.products_requested;
                              }
                            } catch (e) {
                              console.error('Error parsing products:', e);
                            }

                            return products
                              .filter(p => p.wrapping_requested)
                              .map((p, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                                  <span className="text-blue-600">✓</span>
                                  <span>
                                    <strong>{p.name}</strong> {p.quantity && `(x${p.quantity})`}
                                  </span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      {/* Images Grid */}
                      {orderImages.length > 0 ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">📸 Uppladdade Bilder:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {orderImages.map(img => (
                              <a
                                key={img.id}
                                href={img.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-500 transition"
                              >
                                <img
                                  src={img.image_url}
                                  alt={img.file_name}
                                  className="w-full h-32 object-cover group-hover:scale-110 transition"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg">
                                  <Download size={24} className="text-white" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-xs text-white font-semibold truncate">{img.file_name}</p>
                                  <p className="text-xs text-gray-300">
                                    {new Date(img.uploaded_at).toLocaleDateString('sv-SE')}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-orange-700 font-semibold">
                            ⏳ Väntar på att kunden laddar upp folierings-bilder...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
