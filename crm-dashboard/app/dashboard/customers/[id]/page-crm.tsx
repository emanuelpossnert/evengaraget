"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  Flag,
  Tag,
  Users,
  FileText,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Heart,
  MessageSquare,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  status: string;
  total_bookings?: number;
  total_revenue?: number;
  lifetime_value?: number;
  created_at: string;
  priority?: string;
  next_action_date?: string;
  next_action_description?: string;
  sales_owner?: string;
  customer_segment?: string;
}

interface CustomerNote {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
}

interface CustomerTask {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  due_date?: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
}

interface CustomerTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CustomerContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  role: string;
  is_primary: boolean;
}

interface CustomerPipeline {
  id: string;
  stage: string;
  value_estimation?: number;
  probability_percent?: number;
}

interface CustomerCallLog {
  id: string;
  call_date: string;
  duration_minutes?: number;
  call_type: string;
  contact_person?: string;
  topic?: string;
  outcome?: string;
  notes?: string;
}

interface Booking {
  id: string;
  booking_number: string;
  status: string;
  event_date: string;
  total_amount: number;
  created_at: string;
}

export default function CustomerCRMPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [tasks, setTasks] = useState<CustomerTask[]>([]);
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [assignedTags, setAssignedTags] = useState<CustomerTag[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [pipeline, setPipeline] = useState<CustomerPipeline | null>(null);
  const [callLog, setCallLog] = useState<CustomerCallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "tasks" | "contacts" | "pipeline" | "calls" | "bookings">("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Forms
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", task_type: "call", due_date: "", priority: "normal" });
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", position: "", role: "general" });
  const [newCall, setNewCall] = useState({ call_date: "", duration: 0, call_type: "outbound", topic: "", outcome: "neutral", notes: "" });
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState<Partial<Customer>>({});

  useEffect(() => {
    fetchAllData();
  }, [customerId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch customer
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerData) {
        setCustomer(customerData);
        setCustomerForm(customerData);
      }

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (bookingsData) setBookings(bookingsData);

      // Fetch notes
      const { data: notesData } = await supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (notesData) setNotes(notesData);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from("customer_tasks")
        .select("*")
        .eq("customer_id", customerId)
        .order("due_date", { ascending: true });

      if (tasksData) setTasks(tasksData);

      // Fetch tags
      const { data: tagsData } = await supabase.from("customer_tags").select("*");
      if (tagsData) setTags(tagsData);

      // Fetch assigned tags
      const { data: assignedTagsData } = await supabase
        .from("customer_tag_assignments")
        .select("tag_id, customer_tags(*)")
        .eq("customer_id", customerId);

      if (assignedTagsData) {
        setAssignedTags(assignedTagsData.map((t: any) => t.customer_tags).filter(Boolean));
      }

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from("customer_contacts")
        .select("*")
        .eq("customer_id", customerId)
        .order("is_primary", { ascending: false });

      if (contactsData) setContacts(contactsData);

      // Fetch pipeline
      const { data: pipelineData } = await supabase
        .from("customer_pipeline")
        .select("*")
        .eq("customer_id", customerId)
        .single();

      if (pipelineData) setPipeline(pipelineData);

      // Fetch call log
      const { data: callLogData } = await supabase
        .from("customer_call_log")
        .select("*")
        .eq("customer_id", customerId)
        .order("call_date", { ascending: false });

      if (callLogData) setCallLog(callLogData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Kunde inte ladda kunddata" });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase.from("customer_notes").insert([
        {
          customer_id: customerId,
          content: newNote,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;
      setNewNote("");
      fetchAllData();
      setMessage({ type: "success", text: "Anteckning tillagd!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error adding note:", error);
      setMessage({ type: "error", text: "Kunde inte lägga till anteckning" });
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;

    try {
      const { error } = await supabase.from("customer_tasks").insert([
        {
          customer_id: customerId,
          ...newTask,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;
      setNewTask({ title: "", description: "", task_type: "call", due_date: "", priority: "normal" });
      fetchAllData();
      setMessage({ type: "success", text: "Uppgift skapad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error adding task:", error);
      setMessage({ type: "error", text: "Kunde inte skapa uppgift" });
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("customer_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);

      if (error) throw error;
      fetchAllData();
      setMessage({ type: "success", text: "Uppgift slutförd!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("customer_tasks").delete().eq("id", taskId);
      if (error) throw error;
      fetchAllData();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const addContact = async () => {
    if (!newContact.name.trim()) return;

    try {
      const { error } = await supabase.from("customer_contacts").insert([
        {
          customer_id: customerId,
          ...newContact,
        },
      ]);

      if (error) throw error;
      setNewContact({ name: "", email: "", phone: "", position: "", role: "general" });
      fetchAllData();
      setMessage({ type: "success", text: "Kontakt tillagd!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error adding contact:", error);
      setMessage({ type: "error", text: "Kunde inte lägga till kontakt" });
    }
  };

  const addCallLog = async () => {
    if (!newCall.call_date || !newCall.topic) return;

    try {
      const { error } = await supabase.from("customer_call_log").insert([
        {
          customer_id: customerId,
          call_date: newCall.call_date,
          duration_minutes: newCall.duration,
          call_type: newCall.call_type,
          topic: newCall.topic,
          outcome: newCall.outcome,
          notes: newCall.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) throw error;
      setNewCall({ call_date: "", duration: 0, call_type: "outbound", topic: "", outcome: "neutral", notes: "" });
      fetchAllData();
      setMessage({ type: "success", text: "Samtal loggat!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error adding call:", error);
      setMessage({ type: "error", text: "Kunde inte logga samtal" });
    }
  };

  const toggleTag = async (tagId: string) => {
    try {
      const isAssigned = assignedTags.some((t) => t.id === tagId);

      if (isAssigned) {
        const { error } = await supabase
          .from("customer_tag_assignments")
          .delete()
          .eq("customer_id", customerId)
          .eq("tag_id", tagId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_tag_assignments").insert([
          {
            customer_id: customerId,
            tag_id: tagId,
          },
        ]);

        if (error) throw error;
      }

      fetchAllData();
    } catch (error) {
      console.error("Error toggling tag:", error);
    }
  };

  const savePipeline = async (newStage: string) => {
    try {
      if (pipeline) {
        const { error } = await supabase
          .from("customer_pipeline")
          .update({ stage: newStage })
          .eq("id", pipeline.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("customer_pipeline").insert([
          {
            customer_id: customerId,
            stage: newStage,
            probability_percent: 50,
          },
        ]);

        if (error) throw error;
      }

      fetchAllData();
      setMessage({ type: "success", text: "Pipeline uppdaterad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error saving pipeline:", error);
    }
  };

  const updateCustomer = async () => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          priority: customerForm.priority,
          next_action_date: customerForm.next_action_date,
          next_action_description: customerForm.next_action_description,
        })
        .eq("id", customerId);

      if (error) throw error;
      setEditingCustomer(false);
      fetchAllData();
      setMessage({ type: "success", text: "Kund uppdaterad!" });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error("Error updating customer:", error);
      setMessage({ type: "error", text: "Kunde inte uppdatera kund" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Laddar kunddata...</div>;
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-screen text-red-600">Kund inte hittad</div>;
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const upcomingTasks = tasks.filter((t) => t.status === "pending" && t.due_date && new Date(t.due_date) > new Date()).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/customers")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-500 mt-1">{customer.company_name || "Privatperson"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {customer.priority === "urgent" && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">🚨 BRÅDSKANDE</span>}
          {customer.priority === "high" && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">⬆️ HÖG PRIORITET</span>}
          {pendingTasks > 0 && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{pendingTasks} Uppgifter</span>}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Totala Bokningar</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{customer.total_bookings || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-600 font-medium">Total Intäkt</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{(customer.total_revenue || 0).toLocaleString("sv-SE")} SEK</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-purple-600 font-medium">Livstidsvärde</p>
          <p className="text-2xl font-bold text-purple-900 mt-1">{(customer.lifetime_value || 0).toLocaleString("sv-SE")} SEK</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs text-orange-600 font-medium">Status</p>
          <p className="text-lg font-bold text-orange-900 mt-1 capitalize">{customer.status}</p>
        </div>
      </div>

      {/* Next Action Alert */}
      {customer.next_action_date && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-yellow-900">Nästa åtgärd</p>
            <p className="text-sm text-yellow-800">{customer.next_action_description}</p>
            <p className="text-xs text-yellow-700 mt-1">
              {format(new Date(customer.next_action_date), "d MMMM yyyy", { locale: sv })}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg p-2 border border-gray-200 overflow-x-auto">
        {[
          { id: "overview", label: "Översikt", icon: "📊" },
          { id: "notes", label: `Anteckningar (${notes.length})`, icon: "📝" },
          { id: "tasks", label: `Uppgifter (${pendingTasks})`, icon: "✓" },
          { id: "contacts", label: `Kontakter (${contacts.length})`, icon: "👥" },
          { id: "pipeline", label: "Pipeline", icon: "🎯" },
          { id: "calls", label: `Samtal (${callLog.length})`, icon: "☎️" },
          { id: "bookings", label: `Bokningar (${bookings.length})`, icon: "📦" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Kontaktinformation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="text-gray-900 font-medium mt-1">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Telefon</p>
                <p className="text-gray-900 font-medium mt-1">{customer.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Företag</p>
                <p className="text-gray-900 font-medium mt-1">{customer.company_name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Adress</p>
                <p className="text-gray-900 font-medium mt-1">
                  {customer.address}, {customer.postal_code} {customer.city}
                </p>
              </div>
            </div>
          </div>

          {/* Priority & Next Action */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">⚡ Prioritet & Nästa Åtgärd</h2>
              <button
                onClick={() => setEditingCustomer(!editingCustomer)}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm font-semibold hover:bg-blue-100"
              >
                {editingCustomer ? "Avbryt" : "Redigera"}
              </button>
            </div>

            {editingCustomer ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prioritet</label>
                  <select
                    value={customerForm.priority || "normal"}
                    onChange={(e) => setCustomerForm({ ...customerForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="low">🟢 Låg</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="high">🟠 Hög</option>
                    <option value="urgent">🔴 Brådskande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nästa åtgärd</label>
                  <input
                    type="text"
                    value={customerForm.next_action_description || ""}
                    onChange={(e) => setCustomerForm({ ...customerForm, next_action_description: e.target.value })}
                    placeholder="Ex: Ring för att följa upp"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Datum för nästa åtgärd</label>
                  <input
                    type="date"
                    value={customerForm.next_action_date?.split("T")[0] || ""}
                    onChange={(e) => setCustomerForm({ ...customerForm, next_action_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <button
                  onClick={updateCustomer}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                >
                  Spara
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  <span className="text-gray-600">Prioritet:</span>{" "}
                  <span className="font-semibold">
                    {customer.priority === "urgent"
                      ? "🔴 Brådskande"
                      : customer.priority === "high"
                        ? "🟠 Hög"
                        : customer.priority === "low"
                          ? "🟢 Låg"
                          : "🟡 Normal"}
                  </span>
                </p>
                {customer.next_action_description && <p className="text-gray-700">{customer.next_action_description}</p>}
                {customer.next_action_date && (
                  <p className="text-sm text-gray-600">
                    {format(new Date(customer.next_action_date), "d MMMM yyyy", { locale: sv })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🏷️ Taggar</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isAssigned = assignedTags.some((t) => t.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isAssigned
                        ? `${tag.color} ring-2 ring-offset-2 ring-gray-400`
                        : `${tag.color} opacity-50 hover:opacity-75`
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🕐 Senaste Aktivitet</h2>
            <div className="space-y-3">
              {notes.slice(0, 3).map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{format(new Date(note.created_at), "d MMM yyyy HH:mm", { locale: sv })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📝 Lägg till Anteckning</h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Skriv en anteckning om kunden..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-24"
            />
            <button
              onClick={addNote}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
            >
              Spara Anteckning
            </button>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-gray-900">{note.content}</p>
                <p className="text-xs text-gray-500 mt-2">{format(new Date(note.created_at), "d MMM yyyy HH:mm", { locale: sv })}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">✓ Ny Uppgift</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Titel på uppgift"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Beskrivning (valfritt)"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-16"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newTask.task_type}
                  onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="call">☎️ Samtal</option>
                  <option value="email">📧 Email</option>
                  <option value="meeting">📅 Möte</option>
                  <option value="follow-up">🔄 Följ upp</option>
                  <option value="other">📌 Övrigt</option>
                </select>

                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="low">🟢 Låg</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="high">🟠 Hög</option>
                  <option value="urgent">🔴 Brådskande</option>
                </select>
              </div>

              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <button
                onClick={addTask}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                Skapa Uppgift
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 ${
                  task.status === "completed" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === "completed"}
                        onChange={() => {
                          if (task.status === "completed") {
                            // Mark as pending (not implemented full toggle)
                          } else {
                            completeTask(task.id);
                          }
                        }}
                        className="w-5 h-5"
                      />
                      <span
                        className={`font-semibold ${
                          task.status === "completed"
                            ? "line-through text-gray-500"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === "urgent"
                            ? "bg-red-100 text-red-700"
                            : task.priority === "high"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {task.due_date
                        ? `Förfallet: ${format(new Date(task.due_date), "d MMM yyyy", { locale: sv })}`
                        : "Ingen deadline"}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTACTS TAB */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">👥 Lägg till Kontaktperson</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Namn"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Telefon"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <input
                type="text"
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                placeholder="Position/titel"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <select
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="general">Allmän</option>
                <option value="main">Huvudkontakt</option>
                <option value="technical">Teknisk</option>
                <option value="financial">Ekonomisk</option>
              </select>

              <button
                onClick={addContact}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                Lägg till Kontakt
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {contact.name}
                      {contact.is_primary && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded ml-2">Huvudkontakt</span>}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{contact.position}</p>
                    {contact.email && <p className="text-xs text-gray-600">📧 {contact.email}</p>}
                    {contact.phone && <p className="text-xs text-gray-600">☎️ {contact.phone}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">{contact.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIPELINE TAB */}
      {activeTab === "pipeline" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎯 Försäljningspipeline</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6">
            {[
              { stage: "prospect", label: "Prospect", color: "bg-gray-100" },
              { stage: "lead", label: "Lead", color: "bg-blue-100" },
              { stage: "negotiation", label: "Förhandling", color: "bg-yellow-100" },
              { stage: "customer", label: "Kund", color: "bg-green-100" },
              { stage: "vip", label: "VIP", color: "bg-purple-100" },
            ].map((s) => (
              <button
                key={s.stage}
                onClick={() => savePipeline(s.stage)}
                className={`p-4 rounded-lg font-semibold transition-all ${
                  pipeline?.stage === s.stage
                    ? `${s.color} ring-2 ring-gray-400`
                    : `${s.color} opacity-60 hover:opacity-100`
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {pipeline && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estimerat värde (SEK)</label>
                <input
                  type="number"
                  defaultValue={pipeline.value_estimation || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Sannolikhet (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue={pipeline.probability_percent || 50}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CALLS TAB */}
      {activeTab === "calls" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">☎️ Logga Samtal</h2>
            <div className="space-y-3">
              <input
                type="datetime-local"
                value={newCall.call_date}
                onChange={(e) => setNewCall({ ...newCall, call_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newCall.call_type}
                  onChange={(e) => setNewCall({ ...newCall, call_type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="inbound">Inkommande</option>
                  <option value="outbound">Utgående</option>
                </select>

                <input
                  type="number"
                  value={newCall.duration}
                  onChange={(e) => setNewCall({ ...newCall, duration: parseInt(e.target.value) })}
                  placeholder="Längd (min)"
                  className="px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>

              <input
                type="text"
                value={newCall.topic}
                onChange={(e) => setNewCall({ ...newCall, topic: e.target.value })}
                placeholder="Ämne"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />

              <select
                value={newCall.outcome}
                onChange={(e) => setNewCall({ ...newCall, outcome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="positive">✅ Positivt</option>
                <option value="neutral">➖ Neutralt</option>
                <option value="negative">❌ Negativt</option>
                <option value="no_answer">📵 Svar ej</option>
              </select>

              <textarea
                value={newCall.notes}
                onChange={(e) => setNewCall({ ...newCall, notes: e.target.value })}
                placeholder="Noteringar"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm h-16"
              />

              <button
                onClick={addCallLog}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              >
                Logga Samtal
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {callLog.map((call) => (
              <div key={call.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{call.topic}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(call.call_date), "d MMM yyyy HH:mm", { locale: sv })}
                      {call.duration_minutes && ` • ${call.duration_minutes} min`}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      call.outcome === "positive"
                        ? "bg-green-100 text-green-700"
                        : call.outcome === "negative"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {call.outcome === "positive"
                      ? "✅ Positivt"
                      : call.outcome === "negative"
                        ? "❌ Negativt"
                        : "➖ Neutralt"}
                  </span>
                </div>
                {call.notes && <p className="text-sm text-gray-700">{call.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {activeTab === "bookings" && (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                  <p className="text-sm text-gray-600">{format(new Date(booking.event_date), "d MMM yyyy", { locale: sv })}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{booking.total_amount.toLocaleString("sv-SE")} SEK</p>
                  <span
                    className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {booking.status === "confirmed"
                      ? "✅ Bekräftad"
                      : booking.status === "pending"
                        ? "⏳ Väntande"
                        : "Utkast"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Se detaljer →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

