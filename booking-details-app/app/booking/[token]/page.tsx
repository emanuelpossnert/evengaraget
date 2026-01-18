'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import BookingChat from '@/components/BookingChat';

interface Product {
  name: string;
  wrapping_requested?: boolean;
}

interface BookingDetail {
  id: string;
  booking_number: string;
  event_date: string;
  location: string;
  total_amount: number;
  products_requested: Product[];
  customer_email: string;
  customer_phone?: string;
  delivery_date?: string;
  notes?: string;
}

interface UploadedImage {
  id: string;
  file_name: string;
  uploaded_at: string;
  image_type: string;
  wrapping_item_name?: string;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBookingData();
    }
  }, [token]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get booking via token
      const { data: tokenData, error: tokenError } = await supabase
        .from('booking_tokens')
        .select('booking_id')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        setError('Bokning hittades inte. Länken kan ha upphört att gälla.');
        setLoading(false);
        return;
      }

      // Get booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', tokenData.booking_id)
        .single();

      if (bookingError || !bookingData) {
        setError('Kunde inte hämta bokningsdetaljer.');
        setLoading(false);
        return;
      }

      setBooking(bookingData as BookingDetail);

      // Get uploaded images
      const { data: imagesData, error: imagesError } = await supabase
        .from('booking_wrapping_images')
        .select('*')
        .eq('booking_id', tokenData.booking_id)
        .order('uploaded_at', { ascending: false });

      if (!imagesError) {
        setImages(imagesData as UploadedImage[]);
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Ett fel uppstod när bokningens detaljer hämtades.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validera filstorlek (max 10MB per fil)
      const validFiles = files.filter(f => {
        if (f.size > 10 * 1024 * 1024) {
          setUploadError(`${f.name} är för stor (max 10MB)`);
          return false;
        }
        return true;
      });

      setSelectedFiles(validFiles);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !booking) return;

    try {
      setUploading(true);
      setUploadError(null);

      for (const file of selectedFiles) {
        // Upload to Supabase Storage
        const fileName = `${booking.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadFileError } = await supabase.storage
          .from('booking-wrapping-images')
          .upload(fileName, file);

        if (uploadFileError) {
          throw new Error(`Kunde inte ladda upp ${file.name}: ${uploadFileError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('booking-wrapping-images')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('booking_wrapping_images')
          .insert([{
            booking_id: booking.id,
            image_url: urlData.publicUrl,
            file_name: file.name,
            uploaded_by: booking.customer_email,
            image_type: 'design'
          }]);

        if (dbError) {
          throw new Error(`Kunde inte spara filinfo: ${dbError.message}`);
        }
      }

      setSelectedFiles([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      await fetchBookingData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ett okänt fel uppstod';
      console.error('Upload error:', err);
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="mx-auto mb-4 text-blue-600 animate-spin" size={40} />
          <p className="text-gray-600">Laddar bokningsdetaljer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={40} />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Något gick fel</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600">Bokning hittades inte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <img 
              src="/eventgaraget-logo.png" 
              alt="EventGaraget" 
              className="h-16 mx-auto"
            />
          </div>
          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900">Bokningsdetaljer</h1>
            <p className="text-gray-600 mt-2">
              Bokningsnummer: <span className="font-semibold">{booking.booking_number}</span>
            </p>
          </div>

          {/* Booking Details Grid */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-gray-600">📅 Event-datum</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booking.event_date ? new Date(booking.event_date).toLocaleDateString('sv-SE') : 'Ej angett'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">📍 Plats</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booking.location || 'Ej angett'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">💰 Totalt belopp</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booking.total_amount?.toLocaleString('sv-SE')} SEK
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">📞 Kontakt</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booking.customer_phone || booking.customer_email || 'Ej angett'}
              </p>
            </div>
          </div>

          {/* Products Section */}
          {booking.products_requested && (() => {
            // Parse products_requested if it's a string
            let products: Product[] = [];
            try {
              if (typeof booking.products_requested === 'string') {
                products = JSON.parse(booking.products_requested);
              } else {
                products = Array.isArray(booking.products_requested) ? booking.products_requested : [];
              }
            } catch (e) {
              console.error('Error parsing products:', e);
            }
            
            return products.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-3">📦 Produkter</h3>
                <ul className="space-y-2">
                  {products.map((p: Product, i: number) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <span className="mr-2">•</span>
                      <span>{p.name}</span>
                      {p.wrapping_requested && <span className="ml-2 text-blue-600">🎨 (med folierung)</span>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {booking.notes && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">📝 Anteckningar</h3>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="border-b pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🎨 Ladda upp foliering-design</h2>
            <p className="text-gray-600 mt-2">Ladda upp dina foliering-designs som PDF eller bilder</p>
          </div>

          {/* Status Messages */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="text-red-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-red-800">{uploadError}</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <CheckCircle className="text-green-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <p className="text-green-800">Filer uppladdade framgångsrikt! ✓</p>
            </div>
          )}

          {/* File Drop Zone */}
          <div className="mb-6 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition">
            <Upload className="mx-auto mb-3 text-blue-600" size={40} />
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept="image/*,.pdf"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <p className="text-gray-900 font-semibold">Klicka eller dra filer här</p>
              <p className="text-sm text-gray-600 mt-1">Stöd: PNG, JPG, PDF (max 10MB per fil)</p>
            </label>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Valda filer ({selectedFiles.length})</h4>
              <ul className="space-y-2">
                {selectedFiles.map((f, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="flex-1">{f.name}</span>
                    <span className="text-xs text-gray-500">
                      {(f.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Laddar upp...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Ladda upp filer
              </>
            )}
          </button>
        </div>

        {/* Uploaded Images Section */}
        {images.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
            <div className="border-b pb-6 mb-6">
              <h3 className="text-2xl font-bold text-gray-900">✅ Dina uppladdningar</h3>
              <p className="text-gray-600 mt-2">{images.length} fil(er) uppladdad(e)</p>
            </div>

            <div className="space-y-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200 hover:border-green-400 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{img.file_name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Uppladdad: {new Date(img.uploaded_at).toLocaleDateString('sv-SE')} kl.{' '}
                      {new Date(img.uploaded_at).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <CheckCircle className="text-green-600 flex-shrink-0 ml-4" size={24} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h4 className="font-semibold text-blue-900 mb-3">💡 Information</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Ladda upp dina foliering-designs så snart som möjligt</li>
            <li>• Vi behöver alla designs senast 3 dagar före eventet</li>
            <li>• Godkänd design returneras innan leveransdatum</li>
            <li>• Kontakta oss om du har frågor</li>
          </ul>
        </div>

        {/* Chat Section */}
        <div className="mt-6">
          <BookingChat bookingId={booking.id} customerEmail={booking.customer_email} />
        </div>
      </div>
    </div>
  );
}

