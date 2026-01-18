'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import Image from 'next/image';

export default function SignaturePage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.token as string;
  
  const [quotation, setQuotation] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasDeliveryInfo, setHasDeliveryInfo] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    street_address: '',
    postal_code: '',
    city: '',
    org_number: '',
    delivery_street_address: '',
    delivery_postal_code: '',
    delivery_city: '',
    delivery_date: '',
    signature_name: '',
  });

  const signatureRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!bookingId) return;
    loadData();
  }, [bookingId]);

  const loadData = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      const bRes = await fetch(
        `${url}/rest/v1/bookings?id=eq.${bookingId}&select=*`,
        { 
          method: 'GET',
          headers: { 'apikey': apiKey!, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        }
      );

      if (!bRes.ok) throw new Error('Booking fetch failed');
      const bookings = await bRes.json();
      if (!bookings?.length) throw new Error('Bokningen hittades inte');

      const bookingData = bookings[0];
      setBooking(bookingData);

      const cRes = await fetch(
        `${url}/rest/v1/customers?id=eq.${bookingData.customer_id}&select=*`,
        { 
          method: 'GET',
          headers: { 'apikey': apiKey!, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        }
      );

      if (!cRes.ok) throw new Error('Customer fetch failed');
      const customers = await cRes.json();
      const customerData = customers?.[0] || null;
      setCustomer(customerData);

      if (customerData && bookingData) {
        setFormData(prev => ({
          ...prev,
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          company_name: customerData.company_name || '',
          street_address: customerData.street_address || '',
          postal_code: customerData.postal_code || '',
          city: customerData.city || '',
          org_number: customerData.org_number || '',
          delivery_date: bookingData.event_date || '',
          delivery_street_address: bookingData.delivery_street_address || bookingData.location || '',
          delivery_postal_code: bookingData.delivery_postal_code || '',
          delivery_city: bookingData.delivery_city || '',
        }));
      }

      const qRes = await fetch(
        `${url}/rest/v1/quotations?booking_id=eq.${bookingData.id}&select=*`,
        { 
          method: 'GET',
          headers: { 'apikey': apiKey!, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        }
      );

      if (!qRes.ok) throw new Error('Quotation fetch failed');
      const quotations = await qRes.json();
      const quotationData = quotations?.[0];
      
      if (!quotationData) throw new Error('Offert hittades inte för denna bokning');
      
      if (quotationData.signed_at) {
        setError('Detta avtal har redan signerats.');
        setLoading(false);
        return;
      }

      setQuotation(quotationData);

      if (quotationData.addon_notes) {
        try {
          setAddons(JSON.parse(quotationData.addon_notes));
        } catch (e) {
          console.warn('Could not parse addon_notes');
          setAddons([]);
        }
      }

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Kunde inte ladda bokningsdata');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleFormChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    const requiredBilling = ['name', 'email', 'phone', 'street_address', 'postal_code', 'city'];
    const missingBilling = requiredBilling.filter(field => !formData[field as keyof typeof formData]?.toString().trim());
    
    if (missingBilling.length > 0) {
      const fieldNames: {[key: string]: string} = {
        name: 'Namn',
        email: 'Email',
        phone: 'Telefon',
        street_address: 'Gata/väg',
        postal_code: 'Postnummer',
        city: 'Stad'
      };
      const missing = missingBilling.map(f => fieldNames[f]).join(', ');
      setError(`Obligatoriska faktureringsfält saknas: ${missing}`);
      return false;
    }

    // Only check delivery info if user checked the checkbox
    if (hasDeliveryInfo) {
      const requiredDelivery = ['delivery_street_address', 'delivery_postal_code', 'delivery_city', 'delivery_date'];
      const missingDelivery = requiredDelivery.filter(field => !formData[field as keyof typeof formData]?.toString().trim());
      
      if (missingDelivery.length > 0) {
        const fieldNames: {[key: string]: string} = {
          delivery_street_address: 'Leveransadress',
          delivery_postal_code: 'Leverans postnummer',
          delivery_city: 'Leverans stad',
          delivery_date: 'Leveransdatum'
        };
        const missing = missingDelivery.map(f => fieldNames[f]).join(', ');
        setError(`Obligatoriska leveransfält saknas: ${missing}`);
        return false;
      }
    }

    return true;
  };

  const handleSign = async () => {
    if (!quotation || !customer || !booking) return;
    
    if (!agreed) {
      setError('Du måste godkänna villkoren för att signera');
      return;
    }
    
    if (signatureRef.current?.isEmpty()) {
      setError('Vänligen signera i rutan');
      return;
    }

    if (!formData.signature_name?.toString().trim()) {
      setError('Vänligen ange ditt namn under signaturrutan');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSigning(true);
    setError('');
    
    try {
      const signatureDataURL = signatureRef.current?.toDataURL();
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      let products = [];
      if (booking.products_requested) {
        try {
          let pr = booking.products_requested;
          if (typeof pr === 'string' && pr.startsWith('"')) {
            pr = JSON.parse(pr);
          }
          products = JSON.parse(pr);
        } catch (e) {
          console.warn('Error parsing products');
        }
      }

      const grandTotal = quotation?.total_amount ? Number(quotation.total_amount) : 0;
      const totalTax = quotation?.tax_amount ? Number(quotation.tax_amount) : 0;
      const subtotal = grandTotal - totalTax;
      
      const pdf = new jsPDF();
      let yPos = 20;

      pdf.setFontSize(20);
      pdf.text('EventGaraget', 20, yPos);
      pdf.setFontSize(10);
      pdf.text('Faktura & Bokningsbekräftelse', 20, yPos + 8);
      yPos += 20;

      pdf.setFontSize(11);
      pdf.text(`Offertno: ${quotation.quotation_number}`, 20, yPos);
      yPos += 6;

      pdf.setFontSize(10);
      pdf.text('FAKTURERING:', 20, yPos);
      yPos += 5;
      pdf.text(`${formData.name}`, 20, yPos);
      yPos += 4;
      if (formData.company_name) {
        pdf.text(`${formData.company_name}`, 20, yPos);
        yPos += 4;
      }
      pdf.text(`${formData.street_address}`, 20, yPos);
      yPos += 4;
      pdf.text(`${formData.postal_code} ${formData.city}`, 20, yPos);
      yPos += 4;
      pdf.text(`Email: ${formData.email}`, 20, yPos);
      yPos += 4;
      pdf.text(`Telefon: ${formData.phone}`, 20, yPos);
      if (formData.org_number) {
        yPos += 4;
        pdf.text(`Org.nr: ${formData.org_number}`, 20, yPos);
      }
      yPos += 8;

      pdf.text('LEVERANS:', 20, yPos);
      yPos += 5;
      pdf.text(`${formData.delivery_street_address}`, 20, yPos);
      yPos += 4;
      pdf.text(`${formData.delivery_postal_code} ${formData.delivery_city}`, 20, yPos);
      yPos += 4;
      pdf.text(`Datum: ${new Date(formData.delivery_date).toLocaleDateString('sv-SE')}`, 20, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.text('PRODUKTER & TILLÄGG:', 20, yPos);
      yPos += 6;
      
      pdf.setFontSize(9);
      products.forEach((p: any) => {
        const qty = p.quantity || 1;
        const price = p.pricePerDay || p.price || 0;
        pdf.text(`${p.name} - ${qty} st × ${price} SEK`, 25, yPos);
        yPos += 4;
      });

      if (addons.length > 0) {
        yPos += 2;
        addons.forEach((a: any) => {
          pdf.text(`${a.name} ${a.type === 'wrapping' ? '' : '× ' + (a.quantity || 1)} = ${(a.quantity || 1) * a.price} SEK`, 25, yPos);
          yPos += 4;
        });
      }

      yPos += 4;
      pdf.setFontSize(10);
      pdf.text(`Subtotal (före moms): ${subtotal.toFixed(2)} SEK`, 20, yPos);
      yPos += 5;
      pdf.text(`Moms (25%): ${totalTax.toFixed(2)} SEK`, 20, yPos);
      yPos += 6;
      
      pdf.setFontSize(12);
      pdf.text(`TOTALT: ${grandTotal.toFixed(2)} SEK`, 20, yPos);
      yPos += 6;
      pdf.setFontSize(10);
      pdf.text(`Handpenning (50%): ${(grandTotal * 0.5).toFixed(2)} SEK`, 20, yPos);
      yPos += 4;
      pdf.text(`Restbelopp: ${(grandTotal * 0.5).toFixed(2)} SEK`, 20, yPos);
      yPos += 10;

      pdf.text('Signatur:', 20, yPos);
      yPos += 5;
      if (signatureDataURL) {
        pdf.addImage(signatureDataURL, 'PNG', 20, yPos, 60, 20);
      }
      pdf.text(`Signerad: ${new Date().toLocaleString('sv-SE')}`, 20, yPos + 25);
      
      const pdfBlob = pdf.output('blob');
      
      // Upload PDF to Supabase Storage
      let pdfUrl = '';
      const fileName = `quotation-${quotation.quotation_number}-${Date.now()}.pdf`;
      const uploadFormData = new FormData();
      uploadFormData.append('file', pdfBlob, fileName);

      try {
        console.log('📤 Uploading PDF to:', fileName);
        const uploadRes = await fetch(
          `${url}/storage/v1/object/signed-quotations/${fileName}`,
          {
            method: 'POST',
            headers: {
              'apikey': apiKey!,
              'Authorization': `Bearer ${apiKey!}`,
            },
            body: uploadFormData,
          }
        );

        if (uploadRes.ok) {
          pdfUrl = `${url}/storage/v1/object/public/signed-quotations/${fileName}`;
          console.log('✅ PDF uploaded to:', pdfUrl);
        } else {
          const errText = await uploadRes.text();
          console.warn('⚠️ PDF upload failed:', errText);
        }
      } catch (uploadErr) {
        console.warn('⚠️ PDF upload error:', uploadErr);
      }

      // Update quotation with PDF URL
      const updateBody: any = {
        status: 'signed',
        signed_at: new Date().toISOString(),
      };
      
      if (pdfUrl) {
        updateBody.pdf_url = pdfUrl;
      }

      console.log('📝 Updating quotation:', updateBody);

      const updateRes = await fetch(
        `${url}/rest/v1/quotations?id=eq.${quotation.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error('❌ Quotation update failed:', errText);
        throw new Error('Failed to update quotation: ' + errText);
      }
      
      console.log('✅ Quotation updated successfully');
      
      // Update customer
      const customerUpdateRes = await fetch(
        `${url}/rest/v1/customers?id=eq.${customer.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': apiKey!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company_name: formData.company_name,
            street_address: formData.street_address,
            postal_code: formData.postal_code,
            city: formData.city,
            org_number: formData.org_number,
          }),
        }
      );

      if (!customerUpdateRes.ok) console.warn('⚠️ Customer update failed');
      
      // Update booking - only safe existing columns
      try {
        const bookingUpdateBody = {
          total_amount: grandTotal,
          delivery_street_address: formData.delivery_street_address,
          delivery_postal_code: formData.delivery_postal_code,
          delivery_city: formData.delivery_city,
        };

        console.log('📝 Updating booking:', bookingUpdateBody);

        const bookingUpdateRes = await fetch(
          `${url}/rest/v1/bookings?id=eq.${booking.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': apiKey!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingUpdateBody),
          }
        );

        if (!bookingUpdateRes.ok) {
          const errText = await bookingUpdateRes.text();
          console.error('❌ Booking update failed:', errText);
        } else {
          console.log('✅ Booking updated successfully');
        }
      } catch (bookingErr) {
        console.error('⚠️ Booking update error:', bookingErr);
      }
      
      // Save event to Supabase - Supabase webhook will trigger n8n automatically
      try {
        const eventRes = await fetch(
          `${url}/rest/v1/quotation_events`,
          {
            method: "POST",
            headers: {
              "apikey": apiKey!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              quotation_id: quotation.id,
              event_type: "signed",
              event_data: JSON.stringify({
                booking_id: booking.id,
                booking_number: booking.booking_number,
                customer_email: formData.email,
                customer_name: formData.name,
                total_amount: grandTotal,
                signed_at: new Date().toISOString(),
                pdf_url: pdfUrl,
              }),
            }),
          }
        );

        if (eventRes.ok) {
          console.log("✅ Event saved to Supabase - n8n webhook will trigger");
        } else {
          console.warn("⚠️ Event save failed but signature is complete");
        }
      } catch (eventErr) {
        console.warn("⚠️ Event save error but signature is complete:", eventErr);
      }
      
      router.push(`/sign/${bookingId}/success`);
      
    } catch (err: any) {
      console.error('Signing error:', err);
      setError('Ett fel uppstod vid signering. Försök igen: ' + err.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation || !customer || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border-l-4 border-red-600">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Fel</h2>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
          <button onClick={() => router.push('/')} className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 rounded-lg hover:from-red-700 hover:to-orange-600 font-semibold">
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  let products = [];
  if (booking.products_requested) {
    try {
      let pr = booking.products_requested;
      if (typeof pr === 'string' && pr.startsWith('"')) {
        pr = JSON.parse(pr);
      }
      products = JSON.parse(pr);
    } catch (e) {
      console.warn('Error parsing products');
    }
  }

  const grandTotal = quotation?.total_amount ? Number(quotation.total_amount) : 0;
  const totalTax = quotation?.tax_amount ? Number(quotation.tax_amount) : 0;
  const subtotal = grandTotal - totalTax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header with Logo */}
        <div className="mb-8 text-center">
          <img 
            src="/logo.png" 
            alt="EventGaraget Logo" 
            className="h-20 mx-auto mb-4"
          />
        </div>

        {/* Main Header Card */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg p-6 mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Bokningsbekräftelse & Signering</h1>
          <p className="text-red-100">Grattis på din bokning! Slutför processen nedan.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-600">
              <h2 className="text-xl font-bold mb-4 text-red-600">👤 Faktureringsinformation *</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-red-600">Namn *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Telefon *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Företag</label>
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Gata/väg *</label>
                  <input type="text" name="street_address" value={formData.street_address} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Org.nr</label>
                  <input type="text" name="org_number" value={formData.org_number} onChange={handleFormChange} className="w-full mt-1 p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Postnummer *</label>
                  <input type="text" name="postal_code" value={formData.postal_code} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-600">Stad *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200" placeholder="Obligatorisk" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  checked={hasDeliveryInfo} 
                  onChange={(e) => setHasDeliveryInfo(e.target.checked)}
                  className="h-5 w-5 text-orange-600 accent-orange-600 mr-3 cursor-pointer"
                />
                <h2 className="text-xl font-bold text-orange-600 cursor-pointer" onClick={() => setHasDeliveryInfo(!hasDeliveryInfo)}>
                  📦 Leveransinformation {!hasDeliveryInfo && '(Valfritt)'}
                </h2>
              </div>
              
              {hasDeliveryInfo && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-red-600">Gata/väg *</label>
                    <input type="text" name="delivery_street_address" value={formData.delivery_street_address} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Obligatorisk" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-red-600">Postnummer *</label>
                    <input type="text" name="delivery_postal_code" value={formData.delivery_postal_code} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Obligatorisk" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-red-600">Stad *</label>
                    <input type="text" name="delivery_city" value={formData.delivery_city} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Obligatorisk" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-red-600">Leveransdatum *</label>
                    <input type="date" name="delivery_date" value={formData.delivery_date} onChange={handleFormChange} className="w-full mt-1 p-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200" />
                  </div>
                </div>
              )}
              
              {!hasDeliveryInfo && (
                <p className="text-sm text-gray-600 italic">Du kan fylla i leveransinformationen senare i portalen</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-600">
              <h3 className="font-bold mb-4 text-lg text-red-600">📦 Produkter & Tillägg</h3>
              
              {products.map((p: any, i: number) => {
                const qty = p.quantity || 1;
                const price = p.pricePerDay || p.price || 0;
                const total = qty * price;
                return (
                  <div key={i} className="p-3 bg-red-50 rounded mb-2 flex justify-between border-l-2 border-red-300">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-gray-600">{qty} st × {price} SEK</p>
                    </div>
                    <p className="font-bold text-red-600">{total} SEK</p>
                  </div>
                );
              })}

              {addons.length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-orange-300">
                  {addons.map((a: any) => {
                    const total = (a.quantity || 1) * a.price;
                    return (
                      <div key={a.id || a.name} className="p-3 bg-orange-50 rounded mb-2 flex justify-between border-l-2 border-orange-400">
                        <p className="font-semibold text-sm text-gray-800">{a.name}</p>
                        <p className="font-bold text-orange-600">{total.toFixed(2)} SEK</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-600">
              <h3 className="text-xl font-bold mb-4 text-red-600">💰 Totalt</h3>
              
              <div className="space-y-2 text-sm mb-4 pb-4 border-b-2 border-red-200">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold">{subtotal.toFixed(2)} SEK</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Moms (25%):</span>
                  <span className="font-bold">{totalTax.toFixed(2)} SEK</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded mb-4 border-2 border-red-300">
                <p className="text-xs text-gray-600 mb-1">TOTALT BELOPP</p>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">{grandTotal.toFixed(2)} SEK</p>
              </div>

              <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded">
                <p>50% handpenning: <span className="font-bold text-gray-900">{(grandTotal * 0.5).toFixed(2)} SEK</span></p>
                <p>Restbelopp: <span className="font-bold text-gray-900">{(grandTotal * 0.5).toFixed(2)} SEK</span></p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-600">
              <h2 className="text-xl font-bold mb-4 text-red-600">✍️ Signera</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-5 w-5 text-red-600 accent-red-600" />
                  <span className="text-sm text-gray-700">Jag godkänner villkoren och bekräftar att uppgifterna är korrekta</span>
                </label>
              </div>

              <div className="border-3 border-red-300 rounded-lg p-3 bg-white mb-4">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Signera här:</p>
                <SignatureCanvas ref={signatureRef} canvasProps={{ className: 'w-full h-32 border border-gray-300 rounded bg-white' }} />
                <div className="mt-3">
                  <label className="text-xs text-gray-600 font-semibold">Ditt namn under signaturen:</label>
                  <input 
                    type="text" 
                    name="signature_name"
                    value={formData.signature_name}
                    onChange={handleFormChange}
                    placeholder="Skriv ditt namn här"
                    className="w-full mt-1 p-2 border-2 border-red-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={clearSignature} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-semibold text-sm transition">
                  Rensa
                </button>
                <button onClick={handleSign} disabled={signing || !agreed} className="flex-1 bg-gradient-to-r from-red-600 to-orange-500 text-white py-2 rounded-lg hover:from-red-700 hover:to-orange-600 font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition">
                  {signing ? '⏳ Signerar...' : '✅ Signera'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600 border-t border-gray-300 pt-6">
          <p>EventGaraget AB | <span className="text-red-600 font-semibold">booking@eventgaraget.se</span></p>
          <p>www.eventgaraget.se | Tel: +46 (0) XXX XXX XXX</p>
        </div>
      </div>
    </div>
  );
}
