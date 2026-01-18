"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  created_at: string;
}

export default function FAQPage() {
  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    priority: "0",
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  useEffect(() => {
    let filtered = faqs;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => b.priority - a.priority);
    setFilteredFAQs(filtered);
  }, [searchTerm, faqs]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("faq")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFAQs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("faq")
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            priority: parseInt(formData.priority),
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("faq")
          .insert([
            {
              question: formData.question,
              answer: formData.answer,
              category: formData.category,
              priority: parseInt(formData.priority),
            },
          ]);

        if (error) throw error;
      }

      setFormData({ question: "", answer: "", category: "", priority: "0" });
      setShowForm(false);
      setEditingId(null);
      fetchFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority.toString(),
    });
    setEditingId(faq.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna FAQ?")) return;

    try {
      const { error } = await supabase
        .from("faq")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const handlePriorityChange = async (id: string, newPriority: number) => {
    try {
      const { error } = await supabase
        .from("faq")
        .update({ priority: newPriority })
        .eq("id", id);

      if (error) throw error;

      fetchFAQs();
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ - Vanliga Frågor</h1>
          <p className="text-gray-500 mt-1">Hantera frequently asked questions</p>
        </div>
        <button
          onClick={() => {
            setFormData({ question: "", answer: "", category: "", priority: "0" });
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus size={20} />
          Ny FAQ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fråga *</label>
              <input
                type="text"
                required
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="Vad är hyresperioden?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Svar *</label>
              <textarea
                required
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 h-32"
                placeholder="Skriv detaljerat svar..."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="T.ex. Bokning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioritet (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  placeholder="50"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              {editingId ? "Uppdatera" : "Lägg Till"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök i FAQ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-red-500"
          />
        </div>
        <p className="text-sm text-gray-500 mt-3">{filteredFAQs.length} FAQ hittades</p>
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Laddar FAQ...</div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Ingen FAQ hittad</div>
        ) : (
          filteredFAQs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                  <p className="text-sm text-gray-500 mt-1">{faq.category}</p>
                </div>
                {expandedId === faq.id ? (
                  <ChevronUp className="text-gray-400" size={24} />
                ) : (
                  <ChevronDown className="text-gray-400" size={24} />
                )}
              </div>

              {expandedId === faq.id && (
                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-600 mb-6 whitespace-pre-wrap">{faq.answer}</p>

                  <div className="flex gap-2 items-center justify-between">
                    <div className="text-sm text-gray-500">Prioritet: {faq.priority}</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePriorityChange(faq.id, faq.priority + 10)}
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                        title="Öka prioritet"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handlePriorityChange(faq.id, Math.max(0, faq.priority - 10))}
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                        title="Minska prioritet"
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(faq)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                      >
                        <Edit2 size={14} />
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                      >
                        <Trash2 size={14} />
                        Ta bort
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

