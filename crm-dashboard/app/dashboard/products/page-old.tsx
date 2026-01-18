"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Download } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price_per_day: number;
  category: string;
  status: string;
  image_url?: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "pricing">("cards");
  const [categories, setCategories] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_per_day: "",
    category: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const cats = Array.from(new Set(products.map((p) => p.category)));
      setCategories(cats as string[]);
    }
  }, [products]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, categoryFilter, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            description: formData.description,
            price_per_day: parseFloat(formData.price_per_day),
            category: formData.category,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert([
            {
              name: formData.name,
              description: formData.description,
              price_per_day: parseFloat(formData.price_per_day),
              category: formData.category,
              status: "active",
            },
          ]);

        if (error) throw error;
      }

      setFormData({ name: "", description: "", price_per_day: "", category: "" });
      setShowForm(false);
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price_per_day: (product.price_per_day || 0).toString(),
      category: product.category,
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna produkt?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Produktnamn", "Kategori", "Pris/dag (SEK)"],
      ...filteredProducts.map((p) => [p.name, p.category, (p.price_per_day || 0)]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produkter-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.price_per_day || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produkter & Prislista</h1>
          <p className="text-gray-500 mt-1">Hantera produktkatalog och prissättning</p>
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
              setFormData({ name: "", description: "", price_per_day: "", category: "" });
              setEditingId(null);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            Ny Produkt
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produktnamn *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="T.ex. Grillstation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategori *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="T.ex. Grill"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pris per dag (SEK) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_per_day}
                onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivning</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                placeholder="Beskrivning..."
              />
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Totala Produkter</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{filteredProducts.length}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Genomsnittligt Pris/dag</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">
            {(totalRevenue / Math.max(filteredProducts.length, 1)).toLocaleString("sv-SE")} SEK
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Totalt Pris/dag</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {totalRevenue.toLocaleString("sv-SE")} SEK
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök efter produkter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-red-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              categoryFilter === "all"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Alla
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                categoryFilter === cat
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-lg font-medium ${viewMode === "cards" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
            >
              📊 Kort
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg font-medium ${viewMode === "table" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
            >
              📋 Tabell
            </button>
            <button
              onClick={() => setViewMode("pricing")}
              className={`px-4 py-2 rounded-lg font-medium ${viewMode === "pricing" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
            >
              💵 Prislista
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500">{filteredProducts.length} produkter hittades</p>
      </div>

      {/* View Modes */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Laddar produkter...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">Inga produkter hittades</div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="mb-4">
                  <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg h-40 flex items-center justify-center mb-4">
                    <div className="text-6xl">📦</div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>

                <p className="text-sm text-gray-600 mb-4">{product.description}</p>

                <div className="flex items-center gap-2 mb-6 p-3 bg-gray-50 rounded-lg">
                  <DollarSign size={18} className="text-red-600" />
                  <div>
                    <p className="text-xs text-gray-500">Pris per dag</p>
                    <p className="text-lg font-bold text-gray-900">{(product.price_per_day || 0).toLocaleString("sv-SE")} SEK</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
                  >
                    <Edit2 size={16} />
                    Redigera
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                  >
                    <Trash2 size={16} />
                    Ta bort
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Laddar produkter...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">Inga produkter hittades</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Namn</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kategori</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Beskrivning</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Pris/dag</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Åtgärd</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{product.description || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-gray-900">{(product.price_per_day || 0).toLocaleString("sv-SE")} SEK</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {viewMode === "pricing" && (
        <div className="space-y-6">
          {/* Pricing Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Laddar prislista...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Inga produkter hittades</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Produktnamn</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Per dag</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Per vecka</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Per månad</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-gray-900">{(product.price_per_day || 0).toLocaleString("sv-SE")} SEK</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-600">{(((product.price_per_day || 0) * 7)).toLocaleString("sv-SE")} SEK</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm text-gray-600">{(((product.price_per_day || 0) * 30)).toLocaleString("sv-SE")} SEK</p>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-red-50 to-orange-50 border-t-2 border-gray-300">
                    <td colSpan={1} className="px-6 py-4">
                      <p className="font-bold text-gray-900">TOTALT</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-red-600">{totalRevenue.toLocaleString("sv-SE")} SEK</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-red-600">{(totalRevenue * 7).toLocaleString("sv-SE")} SEK</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-red-600">{(totalRevenue * 30).toLocaleString("sv-SE")} SEK</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Dyraste Produkter
              </h3>
              <div className="space-y-3">
                {filteredProducts
                  .sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0))
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <p className="text-sm text-gray-600">{product.name}</p>
                      <p className="font-medium text-gray-900">{(product.price_per_day || 0).toLocaleString("sv-SE")} SEK</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="text-orange-600" size={20} />
                Billigaste Produkter
              </h3>
              <div className="space-y-3">
                {filteredProducts
                  .sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0))
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <p className="text-sm text-gray-600">{product.name}</p>
                      <p className="font-medium text-gray-900">{(product.price_per_day || 0).toLocaleString("sv-SE")} SEK</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
