"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Mail,
  Phone,
  Building2,
  Truck,
  Eye,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  Trash2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import jsPDF from "jspdf";
import BookingChatPanel from "@/components/BookingChatPanel";

interface BookingDetail {
  id: string;
  booking_number: string;
  customer_id: string;
  status: string;
  event_date: string;
  event_end_date?: string;
  delivery_date: string;
  pickup_date?: string;
  delivery_time?: string;
  pickup_time?: string;
  location: string;
  total_amount: number;
  tax_amount?: number;
  shipping_cost?: number;
  ob_cost?: number;
  delivery_type?: string;
  products_requested: any;
  delivery_street_address?: string;
  delivery_postal_code?: string;
  delivery_city?: string;
  contract_signed?: boolean;
  contract_signed_at?: string;
  created_at: string;
}

interface WrappingImage {
  id: string;
  booking_id: string;
  image_url: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
  image_type: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  address?: string;
  postal_code?: string;
  city?: string;
}

interface ReviewCheckItem {
  id: string;
  label: string;
  completed: boolean;
}

interface BookingNote {
  id: string;
  booking_id: string;
  note: string;
  created_by_email: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export default function BookingReviewPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wrappingImages, setWrappingImages] = useState<WrappingImage[]>([]);
  const [bookingNotes, setBookingNotes] = useState<BookingNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Review state
  const [reviewMode, setReviewMode] = useState(true);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [showSignedAgreement, setShowSignedAgreement] = useState(false);

  // Review checklist
  const [reviewChecklist, setReviewChecklist] = useState<ReviewCheckItem[]>([
    { id: "customer", label: "Kunduppgifter verifierade", completed: false },
    { id: "event", label: "Event-detaljer kontrollerade", completed: false },
    { id: "delivery", label: "Leverans-adress OK", completed: false },
    { id: "products", label: "Produkter är korrekta", completed: false },
    { id: "pricing", label: "Prissättning verifierad", completed: false },
    { id: "agreement", label: "Avtal granskat", completed: false },
  ]);

  // Edit forms
  const [editForm, setEditForm] = useState<Partial<BookingDetail>>({});

  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  const fetchBookingData = async () => {
    try {
      setLoading(true);

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);
      setEditForm(bookingData);

      if (bookingData?.customer_id) {
        const { data: customerData } = await supabase
          .from("customers")
          .select("*")
          .eq("id", bookingData.customer_id)
          .single();

        if (customerData) setCustomer(customerData);
      }

      // Fetch wrapping images
      const { data: imagesData } = await supabase
        .from("booking_wrapping_images")
        .select("*")
        .eq("booking_id", bookingId)
        .order("uploaded_at", { ascending: false });

      if (imagesData) setWrappingImages(imagesData);

      // Fetch booking notes
      const { data: notesData } = await supabase
        .from("booking_notes")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false });

      if (notesData) setBookingNotes(notesData);
    } catch (error) {
      console.error("Error fetching booking data:", error);
      setMessage({ type: "error", text: "Kunde inte ladda bokningsdata" });
    } finally {
      setLoading(false);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setReviewChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const allItemsCompleted = reviewChecklist.every((item) => item.completed);

  const handleSaveEdit = async (section: string) => {
    try {
      setActionLoading(true);

      const updateData: any = {};

      if (section === "delivery") {
        updateData.delivery_date = editForm.delivery_date;
        updateData.pickup_date = editForm.pickup_date;
        updateData.delivery_time = editForm.delivery_time;
        updateData.pickup_time = editForm.pickup_time;
        updateData.delivery_street_address = editForm.delivery_street_address;
        updateData.delivery_postal_code = editForm.delivery_postal_code;
        updateData.delivery_city = editForm.delivery_city;
        updateData.delivery_type = editForm.delivery_type;
      } else if (section === "products") {
        // Convert products array to JSON string
        updateData.products_requested = JSON.stringify(editForm.products_requested || []);
      } else if (section === "pricing") {
        updateData.total_amount = editForm.total_amount;
        updateData.tax_amount = editForm.tax_amount;
        updateData.shipping_cost = editForm.shipping_cost;
      }

      const { error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) throw error;

      setBooking((prev) => (prev ? { ...prev, ...editForm } : null));
      setEditSection(null);
      setMessage({ type: "success", text: `${section} uppdaterad!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating booking:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!allItemsCompleted) {
      setMessage({ type: "error", text: "Checka av alla kontroller innan du godkänner!" });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setActionLoading(true);
      
      console.log("🔄 Starting booking approval for:", bookingId);
      
      // 1. Generate unique token
      const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      console.log("✅ Generated token:", token);
      
      // 2. Create booking token for customer link
      console.log("📝 Inserting booking token...");
      const { error: tokenError } = await supabase
        .from("booking_tokens")
        .insert([{ booking_id: bookingId, token }]);
      
      if (tokenError) {
        console.error("❌ Token error:", tokenError);
        throw new Error(`Token error: ${tokenError.message}`);
      }
      console.log("✅ Token created successfully");
      
      // 3. Update booking status to "pending" (next review step)
      console.log("🔄 Updating booking status to pending...");
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "pending" })
        .eq("id", bookingId);

      if (bookingError) {
        console.error("❌ Booking update error:", bookingError);
        throw new Error(`Booking update error: ${bookingError.message}`);
      }
      console.log("✅ Booking status updated to pending");
      
      // 4. Create booking confirmation entry (triggers webhook via DB trigger)
      // First check if it already exists
      console.log("📋 Checking for existing booking confirmation...");
      const { data: existingConfirm } = await supabase
        .from("booking_confirmations")
        .select("id")
        .eq("booking_id", bookingId)
        .single();

      if (!existingConfirm) {
        console.log("📋 Creating booking confirmation...");
        const { error: confirmError } = await supabase
          .from("booking_confirmations")
          .insert([{
            booking_id: bookingId,
            email_sent: false,
          }]);

        if (confirmError) {
          console.error("⚠️ Confirmation error (non-critical):", confirmError);
          // Don't throw - this is non-critical for the main booking confirm flow
        } else {
          console.log("✅ Booking confirmation created");
        }
      } else {
        console.log("✅ Booking confirmation already exists - updating email_sent flag...");
        const { error: updateError } = await supabase
          .from("booking_confirmations")
          .update({ email_sent: false })
          .eq("booking_id", bookingId);

        if (updateError) {
          console.error("⚠️ Update confirmation error:", updateError);
        } else {
          console.log("✅ Booking confirmation updated");
        }
      }
      
      setBooking((prev) => (prev ? { ...prev, status: "pending" } : null));
      setMessage({ type: "success", text: "✅ Bokning godkänd för granskning! Status: Väntande på godkännande..." });
      setTimeout(() => {
        router.push("/dashboard/bookings");
      }, 2000);
    } catch (error) {
      console.error("❌ Error approving booking:", error);
      const errorMessage = error instanceof Error ? error.message : "Okänt fel";
      setMessage({ type: "error", text: `Kunde inte godkänna bokning: ${errorMessage}` });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  // Image Upload Function
  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    try {
      setUploadingImages(true);
      const uploadedImages: WrappingImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${bookingId}_${Date.now()}_${i}_${file.name}`;
        const filePath = `booking_images/${bookingId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("booking-wrapping-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("booking-wrapping-images")
          .getPublicUrl(filePath);

        // Save to database
        const { data: imgData, error: dbError } = await supabase
          .from("booking_wrapping_images")
          .insert([
            {
              booking_id: bookingId,
              file_name: file.name,
              image_url: urlData.publicUrl,
              uploaded_by: "customer",
              image_type: "customer_upload",
            },
          ])
          .select()
          .single();

        if (dbError) throw dbError;
        if (imgData) uploadedImages.push(imgData);
      }

      setWrappingImages((prev) => [...uploadedImages, ...prev]);
      setMessage({ type: "success", text: `${uploadedImages.length} fil(er) uppladdade!` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error uploading images:", error);
      setMessage({ type: "error", text: "Kunde inte ladda upp fil(er)" });
    } finally {
      setUploadingImages(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from("booking_wrapping_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
      setWrappingImages((prev) => prev.filter((img) => img.id !== imageId));
      setMessage({ type: "success", text: "Bild borttagen!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error deleting image:", error);
      setMessage({ type: "error", text: "Kunde inte ta bort bild" });
    }
  };
  const generateAgreementPDF = async () => {
    if (!booking) return;

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.text("SIGNERAT AVTAL", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Booking Info
      pdf.setFontSize(12);
      pdf.text(`Bokningsnummer: ${booking.booking_number}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Datum signerat: ${booking.contract_signed_at ? format(new Date(booking.contract_signed_at), "d MMMM yyyy HH:mm", { locale: sv }) : "N/A"}`, 20, yPosition);
      yPosition += 12;

      // Kund Info
      pdf.setFontSize(14);
      pdf.text("Kunduppgifter", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Namn: ${customer?.name || "N/A"}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${customer?.email || "N/A"}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Telefon: ${customer?.phone || "N/A"}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Företag: ${customer?.company_name || "N/A"}`, 20, yPosition);
      yPosition += 12;

      // Event Info
      pdf.setFontSize(14);
      pdf.text("Event-information", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Event Datum: ${format(new Date(booking.event_date), "d MMMM yyyy", { locale: sv })}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Plats: ${booking.location}`, 20, yPosition);
      yPosition += 12;

      // Leverans Info
      pdf.setFontSize(14);
      pdf.text("Leveransinformation", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Datum: ${format(new Date(booking.delivery_date), "d MMMM yyyy", { locale: sv })}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Adress: ${booking.delivery_street_address}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`${booking.delivery_postal_code} ${booking.delivery_city}`, 20, yPosition);
      yPosition += 12;

      // Belopp
      pdf.setFontSize(14);
      pdf.text("Belopp", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Summa: ${booking.total_amount?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
      yPosition += 6;
      if (booking.tax_amount) {
        pdf.text(`Moms: ${booking.tax_amount?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
        yPosition += 6;
      }
      if (booking.shipping_cost) {
        pdf.text(`Frakt: ${booking.shipping_cost?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
        yPosition += 6;
      }

      pdf.save(`${booking.booking_number}_avtal.pdf`);
      setMessage({ type: "success", text: "PDF hämtad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setMessage({ type: "error", text: "Kunde inte generera PDF" });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const generateBookingPDF = async () => {
    if (!booking) return;

    try {
      const pdf = new jsPDF();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.text("BOKNINGSÖVERSIKT", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Booking Number & Status
      pdf.setFontSize(12);
      pdf.text(`Bokningsnummer: ${booking.booking_number}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Status: ${booking.status === "draft" ? "Utkast" : booking.status === "pending" ? "Väntande" : booking.status === "confirmed" ? "Bekräftad" : booking.status}`, 20, yPosition);
      yPosition += 12;

      // KUND
      pdf.setFontSize(14);
      pdf.text("KUND", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Namn: ${customer?.name}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${customer?.email}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Telefon: ${customer?.phone}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Företag: ${customer?.company_name || "-"}`, 20, yPosition);
      yPosition += 12;

      // EVENT
      pdf.setFontSize(14);
      pdf.text("EVENT", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Start: ${format(new Date(booking.event_date), "d MMMM yyyy", { locale: sv })}`, 20, yPosition);
      yPosition += 6;
      if (booking.event_end_date && booking.event_end_date !== booking.event_date) {
        pdf.text(`Slut: ${format(new Date(booking.event_end_date), "d MMMM yyyy", { locale: sv })}`, 20, yPosition);
        yPosition += 6;
      }
      pdf.text(`Plats: ${booking.location}`, 20, yPosition);
      yPosition += 12;

      // LEVERANS
      pdf.setFontSize(14);
      pdf.text("LEVERANS", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Datum: ${format(new Date(booking.delivery_date), "d MMMM yyyy", { locale: sv })}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Adress: ${booking.delivery_street_address}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`${booking.delivery_postal_code} ${booking.delivery_city}`, 20, yPosition);
      yPosition += 12;

      // PRODUKTER
      let products = [];
      try {
        if (booking.products_requested) {
          let pr = booking.products_requested;
          if (typeof pr === "string") {
            if (pr.startsWith('"')) pr = JSON.parse(pr);
            pr = JSON.parse(pr);
          }
          products = Array.isArray(pr) ? pr : [];
        }
      } catch (e) {
        console.error("Error parsing products:", e);
      }

      pdf.setFontSize(14);
      pdf.text("PRODUKTER", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      if (products.length > 0) {
        products.forEach((p: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`• ${p.name} (${p.quantity || 1} st)`, 25, yPosition);
          yPosition += 6;
        });
      } else {
        pdf.text("Ingen produkter listade", 25, yPosition);
        yPosition += 6;
      }
      yPosition += 6;

      // BELOPP
      pdf.setFontSize(14);
      pdf.text("BELOPP", 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Summa: ${booking.total_amount?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
      yPosition += 6;
      if (booking.tax_amount && booking.tax_amount > 0) {
        pdf.text(`Moms: ${booking.tax_amount?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
        yPosition += 6;
      }
      if (booking.shipping_cost && booking.shipping_cost > 0) {
        pdf.text(`Frakt: ${booking.shipping_cost?.toLocaleString("sv-SE")} SEK`, 20, yPosition);
        yPosition += 6;
      }
      
      // Total
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      const totalAmount = (booking.total_amount || 0) + (booking.tax_amount || 0) + (booking.shipping_cost || 0);
      pdf.text(`TOTALT: ${totalAmount.toLocaleString("sv-SE")} SEK`, 20, yPosition);

      pdf.save(`${booking.booking_number}_bokning.pdf`);
      setMessage({ type: "success", text: "Boknings-PDF hämtad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error generating booking PDF:", error);
      setMessage({ type: "error", text: "Kunde inte generera boknings-PDF" });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Laddar...</div>;
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-semibold">Bokning inte hittad</p>
      </div>
    );
  }

  let products = [];
  try {
    if (booking.products_requested) {
      let pr = booking.products_requested;
      if (typeof pr === "string") {
        if (pr.startsWith('"')) pr = JSON.parse(pr);
        pr = JSON.parse(pr);
      }
      products = Array.isArray(pr) ? pr : [];
    }
  } catch (e) {
    console.error("Error parsing products:", e);
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      setMessage({ type: "error", text: "Anteckningen kan inte vara tom" });
      return;
    }

    try {
      setActionLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("booking_notes")
        .insert([{
          booking_id: bookingId,
          note: newNote,
          created_by_email: user?.email || "unknown",
          created_by_name: user?.user_metadata?.full_name || user?.email || "Unknown",
        }]);

      if (error) throw error;

      setMessage({ type: "success", text: "Anteckning tillagd!" });
      setNewNote("");
      fetchBookingData(); // Reload notes
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error adding note:", error);
      setMessage({ type: "error", text: "Kunde inte lägga till anteckning" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Ta bort denna anteckning?")) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("booking_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      setMessage({ type: "success", text: "Anteckning borttagen" });
      fetchBookingData(); // Reload notes
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error deleting note:", error);
      setMessage({ type: "error", text: "Kunde inte ta bort anteckning" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg font-semibold flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">{booking.booking_number}</h1>
        <div className="w-24"></div>
      </div>

      {/* Main Layout: Review Checklist + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Review Checklist */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-orange-600" />
            Granskning
          </h2>
          <div className="space-y-3">
            {reviewChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className={`text-sm ${item.completed ? "text-gray-600 line-through" : "text-gray-700 font-medium"}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          {/* Approval Button */}
          <button
            onClick={handleApprove}
            disabled={!allItemsCompleted || actionLoading}
            className={`w-full mt-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              allItemsCompleted
                ? "bg-green-100 text-green-600 hover:bg-green-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 size={18} />
            Godkänn Bokning
          </button>

          {/* Reject Button */}
          {booking?.status === "draft" && (
            <button
              onClick={async () => {
                try {
                  setActionLoading(true);
                  const { error } = await supabase
                    .from("bookings")
                    .update({ status: "cancelled" })
                    .eq("id", bookingId);

                  if (error) throw error;
                  setMessage({ type: "success", text: "Bokning avböjd" });
                  setTimeout(() => {
                    router.push("/dashboard/bookings");
                  }, 2000);
                } catch (error) {
                  console.error("Error rejecting booking:", error);
                  setMessage({ type: "error", text: "Kunde inte avböja bokning" });
                  setTimeout(() => setMessage(null), 3000);
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
            >
              <XCircle size={18} />
              Avböj Bokning
            </button>
          )}

          {!allItemsCompleted && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Checka av alla innan godkännande
            </p>
          )}
        </div>

        {/* Right: Details (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-75">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={18} /> Kund
              </h3>
              <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded">🔒 Låst</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-gray-900">{customer?.name}</p>
              <p className="text-gray-600">{customer?.company_name}</p>
              <p className="text-blue-600">{customer?.email}</p>
              <p className="text-blue-600">{customer?.phone}</p>
            </div>
          </div>

          {/* Event Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={18} /> Event
              </h3>
              {editSection !== "event" && (
                <button
                  onClick={() => {
                    setEditSection("event");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "event" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Event Start-datum</label>
                  <input
                    type="date"
                    value={editForm.event_date?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                {editForm.event_end_date && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Event Slut-datum</label>
                    <input
                      type="date"
                      value={editForm.event_end_date?.split("T")[0] || ""}
                      onChange={(e) => setEditForm({ ...editForm, event_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("event")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm font-semibold hover:bg-blue-200"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Start:</span> {format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}
                </p>
                {booking.event_end_date && (
                  <p>
                    <span className="text-gray-600">Slut:</span> {format(new Date(booking.event_end_date), "d MMM yyyy", { locale: sv })}
                  </p>
                )}
                <p>
                  <span className="text-gray-600">Plats:</span> 
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(booking.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                    title="Öppna i Google Maps"
                  >
                    {booking.location} 🗺️
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Delivery Section - Editable */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Truck size={18} /> Leverans
              </h3>
              {editSection !== "delivery" && (
                <button
                  onClick={() => {
                    setEditSection("delivery");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "delivery" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Leveransdatum 📦 (Grön i kalender)</label>
                  <input
                    type="date"
                    value={editForm.delivery_date?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Leveranstid (HH:MM, valfritt)</label>
                  <input
                    type="time"
                    value={editForm.delivery_time || ""}
                    onChange={(e) => setEditForm({ ...editForm, delivery_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Returdatum 🔄 (Orange i kalender)</label>
                  <input
                    type="date"
                    value={editForm.pickup_date?.split("T")[0] || ""}
                    onChange={(e) => setEditForm({ ...editForm, pickup_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Upphämtningstid (HH:MM, valfritt)</label>
                  <input
                    type="time"
                    value={editForm.pickup_time || ""}
                    onChange={(e) => setEditForm({ ...editForm, pickup_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Adress</label>
                  <input
                    type="text"
                    value={editForm.delivery_street_address || ""}
                    onChange={(e) => setEditForm({ ...editForm, delivery_street_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Postnummer</label>
                    <input
                      type="text"
                      value={editForm.delivery_postal_code || ""}
                      onChange={(e) => setEditForm({ ...editForm, delivery_postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stad</label>
                    <input
                      type="text"
                      value={editForm.delivery_city || ""}
                      onChange={(e) => setEditForm({ ...editForm, delivery_city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Leveranstyp</label>
                  <select
                    value={editForm.delivery_type || "internal"}
                    onChange={(e) => setEditForm({ ...editForm, delivery_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="internal">✅ INTERN - EventGaraget levererar (Stockholm)</option>
                    <option value="external">📦 EXTERN - Fraktpartner levererar</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.delivery_type === "internal" 
                      ? "EventGaraget hanterar leveransen inom Stockholm-området." 
                      : "En extern fraktpartner kommer att hantera leveransen."}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("delivery")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded text-sm font-semibold hover:bg-green-200"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Leveransdatum 📦:</span> {format(new Date(booking.delivery_date), "d MMM yyyy", { locale: sv })}
                  {booking.delivery_time && ` kl ${booking.delivery_time}`}
                </p>
                {booking.pickup_date && (
                  <p>
                    <span className="text-gray-600">Returdatum 🔄:</span> {format(new Date(booking.pickup_date), "d MMM yyyy", { locale: sv })}
                    {booking.pickup_time && ` kl ${booking.pickup_time}`}
                  </p>
                )}
                <p>
                  <span className="text-gray-600">Adress:</span>
                  <a 
                    href={`https://www.google.com/maps/search/${encodeURIComponent(`${booking.delivery_street_address}, ${booking.delivery_postal_code} ${booking.delivery_city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                    title="Öppna i Google Maps"
                  >
                    {booking.delivery_street_address} 🗺️
                  </a>
                </p>
                <p>
                  <span className="text-gray-600">Postadress:</span> {booking.delivery_postal_code} {booking.delivery_city}
                </p>
                
                <div className="mt-3 p-2 rounded bg-gray-50 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">📦 Leveranstyp:</p>
                  {booking.delivery_type === "internal" ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        ✅ INTERN
                      </span>
                      <span className="text-gray-600 text-xs">EventGaraget levererar (Stockholm)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                        📦 EXTERN
                      </span>
                      <span className="text-gray-600 text-xs">Fraktpartner levererar</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Products Section - Editable */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Package size={18} /> Produkter ({products.length})
              </h3>
              {editSection !== "products" && (
                <button
                  onClick={() => {
                    setEditSection("products");
                    setEditForm({ ...editForm, products_requested: products });
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "products" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-2 font-semibold">Befintliga produkter:</label>
                  <div className="space-y-3 mb-4">
                    {products.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Produktnamn</label>
                            <input
                              type="text"
                              value={p.name}
                              onChange={(e) => {
                                const updated = [...products];
                                updated[idx].name = e.target.value;
                                setEditForm({ ...editForm, products_requested: updated });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Produktnamn"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-500 mb-1">Antal</label>
                            <input
                              type="number"
                              min="1"
                              value={p.quantity}
                              onChange={(e) => {
                                const updated = [...products];
                                updated[idx].quantity = parseInt(e.target.value) || 1;
                                setEditForm({ ...editForm, products_requested: updated });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Qty"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const updated = products.filter((_: any, i: number) => i !== idx);
                              setEditForm({ ...editForm, products_requested: updated });
                            }}
                            className="mt-5 px-2 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        {/* Addons för denna produkt */}
                        {p.addons && p.addons.length > 0 && (
                          <div className="ml-2 pl-2 border-l-2 border-gray-300 pt-2">
                            <label className="block text-xs text-gray-600 font-semibold mb-2">Tillägg:</label>
                            <div className="space-y-1">
                              {p.addons.map((addon: any, addonIdx: number) => (
                                <label key={addonIdx} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={addon.selected || false}
                                    onChange={(e) => {
                                      const updated = [...products];
                                      if (!updated[idx].addons) updated[idx].addons = [];
                                      updated[idx].addons[addonIdx].selected = e.target.checked;
                                      setEditForm({ ...editForm, products_requested: updated });
                                    }}
                                    className="w-4 h-4 rounded border-gray-300"
                                  />
                                  <span className="text-xs text-gray-700">{addon.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new product */}
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={() => {
                      const updated = [...products, { name: '', quantity: 1, addons: [] }];
                      setEditForm({ ...editForm, products_requested: updated });
                    }}
                    className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm font-semibold hover:bg-blue-200 flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Lägg till produkt
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("products")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm font-semibold hover:bg-blue-200"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((p: any, idx: number) => (
                  <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-700 font-medium">{p.name}</span>
                      <span className="font-semibold text-gray-900">{p.quantity} st</span>
                    </div>
                    {p.addons && p.addons.length > 0 && (
                      <div className="ml-2 text-xs text-gray-600">
                        {p.addons.filter((a: any) => a.selected).map((addon: any, i: number) => (
                          <div key={i}>✓ {addon.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Section - Editable */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} /> Prissättning
              </h3>
              {editSection !== "pricing" && (
                <button
                  onClick={() => {
                    setEditSection("pricing");
                    setEditForm(booking);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center gap-1"
                >
                  <Edit2 size={14} /> Redigera
                </button>
              )}
            </div>

            {editSection === "pricing" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Summa (ex moms)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.total_amount || ""}
                    onChange={(e) => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Moms</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.tax_amount || ""}
                      onChange={(e) => setEditForm({ ...editForm, tax_amount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Frakt</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.shipping_cost || ""}
                      onChange={(e) => setEditForm({ ...editForm, shipping_cost: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit("pricing")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded text-sm font-semibold"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setEditSection(null)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Summa:</span>
                  <span className="font-semibold">{booking.total_amount?.toLocaleString("sv-SE")} SEK</span>
                </div>
                {booking.tax_amount !== undefined && booking.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Moms:</span>
                    <span className="font-semibold">{booking.tax_amount?.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                {booking.shipping_cost !== undefined && booking.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frakt:</span>
                    <span className="font-semibold">{booking.shipping_cost?.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                {booking.ob_cost !== undefined && booking.ob_cost > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span className="font-semibold">OB-kostnad:</span>
                    <span className="font-semibold">{booking.ob_cost?.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                <div className="pt-2 border-t border-green-200 flex justify-between">
                  <span className="text-gray-700 font-bold">Totalt:</span>
                  <span className="text-xl font-bold text-green-700">
                    {(
                      (booking.total_amount || 0) +
                      (booking.tax_amount || 0) +
                      (booking.shipping_cost || 0) +
                      (booking.ob_cost || 0)
                    ).toLocaleString("sv-SE")} SEK
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Booking Export Section */}
          <button
            onClick={generateBookingPDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors font-semibold"
          >
            <FileText size={18} />
            Exportera Bokning (PDF)
          </button>

          {/* Wrapping Images Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎨 Foliering Bilder ({wrappingImages.length})
            </h3>

            {/* Upload Section */}
            <div className="mb-6 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload size={24} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">Ladda upp folierings-bilder</span>
                <span className="text-xs text-gray-600">(Klicka eller dra bilder här)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  disabled={uploadingImages}
                  className="hidden"
                />
              </label>
              {uploadingImages && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs text-blue-600 text-center mt-2">Laddar upp...</p>
                </div>
              )}
            </div>

            {/* Images Grid */}
            {wrappingImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wrappingImages.map((img) => (
                  <div
                    key={img.id}
                    className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-blue-500 transition"
                  >
                    <a
                      href={img.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={img.image_url}
                        alt={img.file_name}
                        className="w-full h-32 object-cover group-hover:scale-110 transition"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23999"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition text-sm font-semibold">Öppna</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                        <p className="text-xs truncate font-semibold">{img.file_name}</p>
                        <p className="text-xs opacity-75">
                          {new Date(img.uploaded_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </a>
                    <div className="absolute top-2 right-2 gap-1 flex opacity-0 group-hover:opacity-100 transition">
                      <a
                        href={img.image_url}
                        download={img.file_name}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                        title="Ladda ner fil"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                        title="Ta bort fil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Inga bilder uppladdade än</p>
              </div>
            )}
          </div>

          {/* Booking Notes Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 Anteckningar
            </h3>

            {/* Add Note Form */}
            <div className="mb-4 space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Lägg till en anteckning..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={actionLoading || !newNote.trim()}
                className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 font-semibold transition-colors"
              >
                {actionLoading ? "Lägger till..." : "Lägg till anteckning"}
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-3">
              {bookingNotes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Inga anteckningar än</p>
              ) : (
                bookingNotes.map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">{note.created_by_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString('sv-SE')} kl {new Date(note.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={actionLoading}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:text-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="mt-6">
            <BookingChatPanel bookingId={bookingId} />
          </div>

          {/* Signed Agreement Section */}
          {booking.contract_signed && (
            <button
              onClick={() => setShowSignedAgreement(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors font-semibold"
            >
              <FileText size={18} />
              Se Signerat Avtal
            </button>
          )}
        </div>
      </div>

      {/* Signed Agreement Modal */}
      {showSignedAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Signerat Avtal</h2>
              <button
                onClick={() => setShowSignedAgreement(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700 font-semibold">
                  ✅ Signerat {booking.contract_signed_at && format(new Date(booking.contract_signed_at), "d MMM yyyy HH:mm", { locale: sv })}
                </p>
              </div>

              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-semibold mb-2">Signerat Avtal</p>
                <p className="text-sm text-gray-500">Bokning: {booking.booking_number}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={generateAgreementPDF}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                >
                  <FileText size={18} />
                  Ladda ner PDF
                </button>
                <button
                  onClick={() => setShowSignedAgreement(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

