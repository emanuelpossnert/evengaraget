"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, Download, X } from "lucide-react";

interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchAddons();
  }, []);

  useEffect(() => {
    if (addons.length > 0) {
      const cats = Array.from(new Set(addons.map((a) => a.category).filter(Boolean)));
      setCategories(cats as string[]);
    }
  }, [addons]);

  const fetchAddons = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("addons")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setAddons(data || []);
    } catch (error) {
      console.error("Error fetching addons:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const addonData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        is_active: formData.is_active,
      };

      if (editingId) {
        // Update
        const { error } = await supabase
          .from("addons")
          .update(addonData)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("addons")
          .insert([addonData]);

        if (error) throw error;
      }

      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        is_active: true,
      });
      setShowForm(false);
      setEditingId(null);
      fetchAddons();
    } catch (error) {
      console.error("Error saving addon:", error);
      alert("Kunde inte spara tillägg: " + (error as any).message);
    }
  };

  const handleEdit = (addon: Addon) => {
    setFormData({
      name: addon.name,
      price: addon.price.toString(),
      category: addon.category,
      description: addon.description,
      is_active: addon.is_active,
    });
    setEditingId(addon.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna addon? Alla produktkopplingar kommer att tas bort.")) return;

    try {
      const { error } = await supabase.from("addons").delete().eq("id", id);

      if (error) throw error;
      fetchAddons();
    } catch (error) {
      console.error("Error deleting addon:", error);
    }
  };

  const filteredAddons = filterCategory === "all" ? addons : addons.filter((a) => a.category === filterCategory);

  const handleExportCSV = () => {
    const csv = [
      ["Addon namn", "Kategori", "Pris (SEK)", "Status"],
      ...filteredAddons.map((a) => [a.name, a.category, a.price, a.is_active ? "Aktiv" : "Inaktiv"]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `addons-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tillägg</h1>
          <p className="text-gray-500 mt-1">Hantera valfria tillägg som kan kopplas till produkter</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={() => {
              setFormData({
                name: "",
                price: "",
                category: "",
                description: "",
                is_active: true,
              });
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            Nytt Tillägg
          </button>
        </div>
      </div>

      {/* Filter */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filtrera på kategori</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterCategory === "all" ? "bg-gradient-to-r from-red-600 to-orange-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Alla
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === cat ? "bg-gradient-to-r from-red-600 to-orange-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Addons Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laddar addons...</div>
      ) : filteredAddons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Inga tillägg än. Skapa det första!</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Namn
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beskrivning
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pris
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Åtgärder</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAddons.map((addon) => (
                <tr key={addon.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{addon.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{addon.description}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-semibold text-gray-900">{addon.price} SEK</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${addon.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {addon.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(addon)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit2 size={18} className="inline" />
                    </button>
                    <button onClick={() => handleDelete(addon.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{editingId ? "Redigera Tillägg" : "Nytt Tillägg"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tilläggsnamn *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ex: Grillkol, LED-belysning, Extravärmefläkt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Välj kategori</option>
                    <option value="Tillbehör">Tillbehör</option>
                    <option value="Belysning">Belysning</option>
                    <option value="Värme">Värme</option>
                    <option value="Tjänster">Tjänster</option>
                    <option value="Transport">Transport</option>
                    <option value="Försäkring">Försäkring</option>
                    <option value="Övrigt">Övrigt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pris (SEK) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivning</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Beskrivning av tillägg..."
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Aktiv (tillgänglig för användning)</span>
              </label>

              <div className="flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingId ? "Uppdatera" : "Skapa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
