'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, Calendar, AlertCircle, CheckCircle2, Image, ExternalLink, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WarehouseTask {
  id: string;
  booking_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  due_date: string;
  booking_number: string;
  location: string;
  event_date: string;
  customer_name: string;
  delivery_type?: string; // "internal" or "external"
}

interface WrappingImage {
  id: string;
  file_name: string;
  image_url: string;
}

interface BookingNote {
  id: string;
  booking_id: string;
  note: string;
  created_by_name: string;
  created_at: string;
}

interface BookingDetail {
  id: string;
  products_requested: any[];
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function WarehousePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<WarehouseTask[]>([]);
  const [images, setImages] = useState<Map<string, WrappingImage[]>>(new Map());
  const [bookingNotes, setBookingNotes] = useState<Map<string, BookingNote[]>>(new Map());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [bookingDetails, setBookingDetails] = useState<Map<string, BookingDetail>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: 'error', text: 'Inte inloggad' });
        return;
      }
      setUserId(user.id);

      // Fetch tasks assigned to this user
      const { data: tasksData, error: tasksError } = await supabase
        .from('booking_tasks')
        .select('id, booking_id, title, description, priority, status, due_date, assigned_to_user_id')
        .eq('assigned_to_user_id', user.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      if (tasksData && tasksData.length > 0) {
        // Fetch booking details
        const bookingIds = [...new Set(tasksData.map(t => t.booking_id))];
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, booking_number, location, event_date, products_requested, customer_id, delivery_type')
          .in('id', bookingIds);

        // Fetch customer names
        const customerIds = bookingsData?.map(b => b.customer_id).filter(Boolean) || [];
        const { data: customersData } = await supabase
          .from('customers')
          .select('id, name')
          .in('id', customerIds);

        const customerMap = new Map(customersData?.map(c => [c.id, c.name]) || []);
        const bookingMap = new Map(bookingsData?.map(b => [b.id, b]) || []);

        const enrichedTasks = tasksData.map(t => {
          const booking = bookingMap.get(t.booking_id);
          return {
            ...t,
            booking_number: booking?.booking_number || 'N/A',
            location: booking?.location || 'N/A',
            event_date: booking?.event_date || 'N/A',
            customer_name: customerMap.get(booking?.customer_id) || 'Okänd kund',
            delivery_type: booking?.delivery_type,
          };
        });
        setTasks(enrichedTasks as WarehouseTask[]);
        setBookingDetails(bookingMap);

        // Fetch wrapping images for each booking
        const imagesMap = new Map();
        for (const bookingId of bookingIds) {
          const { data: imgsData } = await supabase
            .from('booking_wrapping_images')
            .select('id, file_name, image_url')
            .eq('booking_id', bookingId);

          if (imgsData) {
            imagesMap.set(bookingId, imgsData);
          }
        }
        setImages(imagesMap);

        // Fetch booking notes for each booking
        const { data: notesData } = await supabase
          .from('booking_notes')
          .select('*')
          .in('booking_id', bookingIds)
          .order('created_at', { ascending: false });

        if (notesData) {
          const notesMap = new Map<string, BookingNote[]>();
          notesData.forEach(note => {
            if (!notesMap.has(note.booking_id)) {
              notesMap.set(note.booking_id, []);
            }
            notesMap.get(note.booking_id)!.push(note);
          });
          setBookingNotes(notesMap);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Kunde inte ladda data' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('booking_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
      setMessage({ type: 'success', text: 'Status uppdaterad!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Kunde inte uppdatera status' });
    }
  };

  // Filter tasks based on date range
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.event_date);
    if (startDate) {
      const start = new Date(startDate);
      if (taskDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (taskDate > end) return false;
    }
    return true;
  });

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleTodayClick = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900">📦 Mina Körningar</h1>
              <p className="text-gray-600 mt-1">Uppgifter tilldelade till dig</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Date Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Från Datum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Till Datum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTodayClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              📅 Idag
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold flex items-center gap-2 transition"
              >
                <X size={18} />
                Rensa Filter
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Mina Uppgifter</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredTasks.length}</p>
            {(startDate || endDate) && <p className="text-xs text-gray-500 mt-1">{tasks.length} totalt</p>}
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Brådskande</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {filteredTasks.filter(t => t.priority === 'urgent').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Pågående</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {filteredTasks.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <CheckCircle2 size={48} className="mx-auto text-green-300 mb-4" />
              <p className="text-gray-500 font-semibold">
                {tasks.length === 0 ? 'Inga uppgifter tilldelade' : 'Inga uppgifter för valda datum'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-lg border-2 p-4 transition ${
                  task.priority === 'urgent' ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                {/* Task Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{task.title}</h3>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>📌 {task.booking_number}</span>
                      <span>👤 {task.customer_name}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${priorityColors[task.priority]}`}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    {task.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    {new Date(task.event_date).toLocaleDateString('sv-SE')}
                  </div>
                  <div>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(task.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <ExternalLink size={16} />
                      Google Maps
                    </a>
                  </div>
                </div>

                {/* Delivery Type (if applicable) */}
                {task.delivery_type && (
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                      task.delivery_type === 'internal' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {task.delivery_type === 'internal' ? '🏢 Intern leverans' : '🚚 Extern leverans'}
                    </span>
                  </div>
                )}

                {/* Expandable Section */}
                <button
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  className="w-full mb-4 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition text-left"
                >
                  {expandedTaskId === task.id ? '▼' : '▶'} Detaljer & Bilder
                </button>

                {expandedTaskId === task.id && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                    {task.description && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Beskrivning:</p>
                        <p className="text-sm text-gray-700">{task.description}</p>
                      </div>
                    )}

                    {/* Products */}
                    {bookingDetails.get(task.booking_id)?.products_requested && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">📦 Produkter i Leveransen:</p>
                        <div className="bg-white rounded p-3 border border-gray-200">
                          {(() => {
                            let products: any[] = [];
                            const productsData = bookingDetails.get(task.booking_id)?.products_requested;
                            try {
                              if (typeof productsData === 'string') {
                                products = JSON.parse(productsData);
                              } else if (Array.isArray(productsData)) {
                                products = productsData;
                              }
                            } catch (e) {
                              console.error('Error parsing products:', e);
                            }

                            return (
                              <ul className="space-y-1">
                                {products.map((p: any, i: number) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-gray-400">•</span>
                                    <span>
                                      <strong>{p.name}</strong>
                                      {p.quantity && <span className="text-gray-600"> (x{p.quantity})</span>}
                                      {p.wrapping_requested && <span className="ml-2 text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded">🎨 Foliering</span>}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Booking Notes */}
                    {bookingNotes.get(task.booking_id) && bookingNotes.get(task.booking_id)!.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">📝 Anteckningar ({bookingNotes.get(task.booking_id)!.length})</p>
                        <div className="space-y-2">
                          {bookingNotes.get(task.booking_id)!.map((note) => (
                            <div key={note.id} className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-semibold text-gray-600">{note.created_by_name}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(note.created_at).toLocaleDateString('sv-SE')} kl {new Date(note.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wrapping Images */}
                    {images.get(task.booking_id) && images.get(task.booking_id)!.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                          <Image size={14} /> Foliering Bilder ({images.get(task.booking_id)!.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {images.get(task.booking_id)!.map(img => (
                            <a
                              key={img.id}
                              href={img.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative overflow-hidden rounded-lg border border-gray-300 hover:border-blue-500 transition"
                            >
                              <img
                                src={img.image_url}
                                alt={img.file_name}
                                className="w-full h-24 object-cover hover:scale-110 transition"
                              />
                              <p className="text-xs text-gray-600 p-1 bg-white truncate">{img.file_name}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {['pending', 'in_progress', 'completed'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(task.id, status)}
                      className={`px-4 py-2 rounded text-sm font-semibold transition ${
                        task.status === status
                          ? 'ring-2 ring-offset-2 ring-blue-600 ' + statusColors[status as keyof typeof statusColors]
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'pending' && '⏳ Väntande'}
                      {status === 'in_progress' && '⚡ Pågåande'}
                      {status === 'completed' && '✅ Slutförd'}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
