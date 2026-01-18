"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, DollarSign, Download, X, Search, LayoutGrid, List } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price_per_day: number;
  min_rental_days: number;
  quantity_total: number;
  quantity_available: number;
  requires_setup: boolean;
  setup_cost: number;
  can_be_wrapped: boolean;
  wrapping_cost: number;
  image_url: string;
  specifications: any;
  created_at: string;
  updated_at: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
  is_active: boolean;
  description: string;
}

interface ProductAddon {
  id: string;
  addon_id: string;
  display_order: number;
  is_mandatory: boolean;
  addons?: Addon | Addon[] | any;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productAddons, setProductAddons] = useState<ProductAddon[]>([]);
  const [showAddonManager, setShowAddonManager] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [addonSearchTerm, setAddonSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    base_price_per_day: "",
    min_rental_days: "1",
    quantity_total: "1",
    quantity_available: "1",
    requires_setup: false,
    setup_cost: "",
    can_be_wrapped: false,
    wrapping_cost: "",
    image_url: "",
    specifications: "",
  });

  const [selectedAddonsMap, setSelectedAddonsMap] = useState<
    Map<string, { addon: Addon; is_mandatory: boolean; display_order: number }>
  >(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter products by search term
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  useEffect(() => {
    // Filter addons by search term
    let filtered = allAddons;
    if (addonSearchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(addonSearchTerm.toLowerCase()) ||
          a.category?.toLowerCase().includes(addonSearchTerm.toLowerCase()) ||
          a.description?.toLowerCase().includes(addonSearchTerm.toLowerCase())
      );
    }
    setFilteredAddons(filtered);
  }, [addonSearchTerm, allAddons]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch all addons
      const { data: addonsData, error: addonsError } = await supabase
        .from("addons")
        .select("*")
        .order("name", { ascending: true });

      if (addonsError) throw addonsError;
      setAllAddons(addonsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAddons = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("product_addons")
        .select(
          `
          id,
          addon_id,
          display_order,
          is_mandatory,
          addons(*)
          `
        )
        .eq("product_id", productId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setProductAddons(data || []);

      // Build selected map
      const newMap = new Map();
      data?.forEach((pa: any) => {
        if (pa.addons) {
          newMap.set(pa.addon_id, {
            addon: pa.addons,
            is_mandatory: pa.is_mandatory,
            display_order: pa.display_order,
          });
        }
      });
      setSelectedAddonsMap(newMap);
    } catch (error) {
      console.error("Error fetching product addons:", error);
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
      const productData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        base_price_per_day: parseFloat(formData.base_price_per_day),
        min_rental_days: parseInt(formData.min_rental_days),
        quantity_total: parseInt(formData.quantity_total),
        quantity_available: parseInt(formData.quantity_available),
        requires_setup: formData.requires_setup,
        setup_cost: formData.requires_setup ? parseFloat(formData.setup_cost) : 0,
        can_be_wrapped: formData.can_be_wrapped,
        wrapping_cost: formData.can_be_wrapped ? parseFloat(formData.wrapping_cost) : 0,
        image_url: formData.image_url || null,
        specifications: formData.specifications ? JSON.parse(formData.specifications) : null,
      };

      let productId = editingId;

      if (editingId) {
        // Update existing
        const { error } = await supabase.from("products").update(productData).eq("id", editingId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase.from("products").insert([productData]).select();

        if (error) throw error;
        productId = data?.[0]?.id;
      }

      // Save selected addons
      if (productId && selectedAddonsMap.size > 0) {
        // Delete existing addon links
        await supabase.from("product_addons").delete().eq("product_id", productId);

        // Insert new addon links
        const addonInserts = Array.from(selectedAddonsMap.entries()).map(([addonId], index) => ({
          product_id: productId,
          addon_id: addonId,
          display_order: index + 1,
          is_mandatory: selectedAddonsMap.get(addonId)?.is_mandatory || false,
        }));

        const { error: addonError } = await supabase.from("product_addons").insert(addonInserts);

        if (addonError) throw addonError;
      }

      // Reset form
      setFormData({
        name: "",
        category: "",
        description: "",
        base_price_per_day: "",
        min_rental_days: "1",
        quantity_total: "1",
        quantity_available: "1",
        requires_setup: false,
        setup_cost: "",
        can_be_wrapped: false,
        wrapping_cost: "",
        image_url: "",
        specifications: "",
      });
      setSelectedAddonsMap(new Map());
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Kunde inte spara produkt: " + (error as any).message);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      base_price_per_day: product.base_price_per_day.toString(),
      min_rental_days: product.min_rental_days.toString(),
      quantity_total: product.quantity_total.toString(),
      quantity_available: product.quantity_available.toString(),
      requires_setup: product.requires_setup,
      setup_cost: product.setup_cost.toString(),
      can_be_wrapped: product.can_be_wrapped,
      wrapping_cost: product.wrapping_cost.toString(),
      image_url: product.image_url || "",
      specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : "",
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna produkt?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const toggleAddon = (addon: Addon) => {
    const newMap = new Map(selectedAddonsMap);
    if (newMap.has(addon.id)) {
      newMap.delete(addon.id);
    } else {
      newMap.set(addon.id, {
        addon,
        is_mandatory: false,
        display_order: newMap.size + 1,
      });
    }
    setSelectedAddonsMap(newMap);
  };

  const toggleMandatory = (addonId: string) => {
    const newMap = new Map(selectedAddonsMap);
    const item = newMap.get(addonId);
    if (item) {
      item.is_mandatory = !item.is_mandatory;
      newMap.set(addonId, item);
      setSelectedAddonsMap(newMap);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Produktnamn", "Kategori", "Pris/dag (SEK)", "Min hyrtid", "Total lager", "Tillgänglig", "Setup", "Wrapping"],
      ...filteredProducts.map((p) => [
        p.name,
        p.category,
        p.base_price_per_day,
        p.min_rental_days,
        p.quantity_total,
        p.quantity_available,
        p.requires_setup ? `Ja (${p.setup_cost} SEK)` : "Nej",
        p.can_be_wrapped ? `Ja (${p.wrapping_cost} SEK)` : "Nej",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `produkter-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produkter & Prislista</h1>
          <p className="text-gray-500 mt-1">Hantera produkter, priser och tillkopplade addons</p>
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
                category: "",
                description: "",
                base_price_per_day: "",
                min_rental_days: "1",
                quantity_total: "1",
                quantity_available: "1",
                requires_setup: false,
                setup_cost: "",
                can_be_wrapped: false,
                wrapping_cost: "",
                image_url: "",
                specifications: "",
              });
              setSelectedAddonsMap(new Map());
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus size={20} />
            Ny Produkt
          </button>
        </div>
      </div>

      {/* Search & View Mode */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600">
            <Search size={20} />
            <input
              type="text"
              placeholder="Sök produkter efter namn, kategori eller beskrivning..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-0 focus:outline-none text-gray-900"
            />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "cards"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <LayoutGrid size={18} />
            Kort
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "table"
                ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <List size={18} />
            Tabell
          </button>
        </div>
      </div>

      {/* Products Grid/Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laddar produkter...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? "Inga produkter motsvarar din sökning" : "Inga produkter än. Skapa den första!"}
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg p-6 border border-gray-200 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
              </div>

              {/* Description */}
              {product.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>}

              {/* Price */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-600 mb-1">Pris per dag</p>
                <p className="text-2xl font-bold text-red-600">{product.base_price_per_day} SEK</p>
                {product.min_rental_days > 1 && <p className="text-xs text-gray-600 mt-1">Min. {product.min_rental_days} dag(ar)</p>}
              </div>

              {/* Inventory */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="font-semibold text-blue-600">{product.quantity_total}</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Tillgänglig</p>
                  <p className="font-semibold text-green-600">{product.quantity_available}</p>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-2 mb-4 text-xs">
                {product.requires_setup && <p className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Setup: {product.setup_cost} SEK</p>}
                {product.can_be_wrapped && <p className="bg-orange-50 text-orange-700 px-2 py-1 rounded">Foliering: {product.wrapping_cost} SEK</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => {
                    setSelectedProduct(product);
                    fetchProductAddons(product.id);
                    setShowAddonManager(true);
                  }}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm"
                >
                  Addons
                </button>
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-yellow-50 text-yellow-600 py-2 rounded-lg hover:bg-yellow-100 transition-colors font-semibold text-sm"
                >
                  <Edit2 size={16} className="inline mr-1" />
                  Redigera
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm"
                >
                  <Trash2 size={16} className="inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produktnamn
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pris/dag
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lager
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tjänster
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Åtgärder</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.description?.substring(0, 40)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-sm font-semibold text-gray-900">{product.base_price_per_day} SEK</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <p className="text-xs text-gray-600">
                      {product.quantity_available}/{product.quantity_total}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex gap-1 justify-center">
                      {product.requires_setup && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Setup</span>}
                      {product.can_be_wrapped && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Wrap</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        fetchProductAddons(product.id);
                        setShowAddonManager(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Addons
                    </button>
                    <button onClick={() => handleEdit(product)} className="text-yellow-600 hover:text-yellow-900 mr-3">
                      <Edit2 size={16} className="inline" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">{editingId ? "Redigera Produkt" : "Ny Produkt"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Bas Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bas Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Produktnamn *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Ex: Grillstation"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      >
                        <option value="">Välj kategori</option>
                        <option value="Tält">Tält</option>
                        <option value="Möbler">Möbler</option>
                        <option value="Grill">Grill</option>
                        <option value="Belysning">Belysning</option>
                        <option value="Värme">Värme</option>
                        <option value="Övrigt">Övrigt</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bild URL</label>
                      <input
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Produktbeskrivning..."
                    />
                  </div>
                </div>
              </div>

              {/* Priser */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priser</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pris per dag (SEK) *</label>
                      <input
                        type="number"
                        name="base_price_per_day"
                        value={formData.base_price_per_day}
                        onChange={handleChange}
                        required
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min. hyrtid (dagar)</label>
                      <input
                        type="number"
                        name="min_rental_days"
                        value={formData.min_rental_days}
                        onChange={handleChange}
                        min="1"
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lager */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lager</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total antal *</label>
                    <input
                      type="number"
                      name="quantity_total"
                      value={formData.quantity_total}
                      onChange={handleChange}
                      required
                      min="1"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tillgängligt nu *</label>
                    <input
                      type="number"
                      name="quantity_available"
                      value={formData.quantity_available}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Tjänster */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tjänster</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requires_setup"
                      checked={formData.requires_setup}
                      onChange={handleChange}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Kräver setup/montering?</span>
                  </label>

                  {formData.requires_setup && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Setup kostnad (SEK)</label>
                      <input
                        type="number"
                        name="setup_cost"
                        value={formData.setup_cost}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="can_be_wrapped"
                      checked={formData.can_be_wrapped}
                      onChange={handleChange}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Kan folieras/brandas?</span>
                  </label>

                  {formData.can_be_wrapped && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Folieringskostnad (SEK)</label>
                      <input
                        type="number"
                        name="wrapping_cost"
                        value={formData.wrapping_cost}
                        onChange={handleChange}
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Tekniska detaljer */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tekniska Detaljer</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specifikationer (JSON)</label>
                  <textarea
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-2 font-mono text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder='{"längd": "5m", "bredd": "3m"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">Valfritt JSON-format för tekniska specifikationer</p>
                </div>
              </div>

              {/* Kopplade Addons */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kopplade Addons</h3>
                
                {/* Addon Search */}
                {allAddons.length > 5 && (
                  <div className="mb-4 relative">
                    <div className="flex items-center gap-2 text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Sök addons..."
                        value={addonSearchTerm}
                        onChange={(e) => setAddonSearchTerm(e.target.value)}
                        className="flex-1 border-0 focus:outline-none text-gray-900"
                      />
                    </div>
                  </div>
                )}

                {/* Selected Addons Summary */}
                {selectedAddonsMap.size > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-900 mb-2">
                      {selectedAddonsMap.size} addon{selectedAddonsMap.size !== 1 ? "s" : ""} vald{selectedAddonsMap.size !== 1 ? "a" : ""}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selectedAddonsMap.values()).map((item) => (
                        <span key={item.addon.id} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {item.addon.name}
                          {item.is_mandatory && <span className="font-bold">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Addons Grid */}
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {filteredAddons.map((addon) => (
                    <label key={addon.id} className="flex items-start space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedAddonsMap.has(addon.id)}
                        onChange={() => toggleAddon(addon)}
                        className="w-4 h-4 text-red-600 rounded mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                        <p className="text-xs text-gray-600">{addon.category}</p>
                        <p className="text-xs text-red-600 font-semibold">{addon.price} SEK</p>
                      </div>
                    </label>
                  ))}
                </div>

                {filteredAddons.length === 0 && allAddons.length > 0 && (
                  <div className="text-center py-8 text-gray-500">Inga addons motsvarar din sökning</div>
                )}

                {allAddons.length === 0 && (
                  <div className="text-center py-8 text-gray-500">Inga addons tillgängliga. Skapa dem först på Addons-sidan!</div>
                )}
              </div>

              {/* Buttons */}
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

      {/* Addon Manager Modal */}
      {showAddonManager && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Addons för {selectedProduct.name}</h2>
              <button onClick={() => setShowAddonManager(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {allAddons.map((addon) => {
                const isSelected = selectedAddonsMap.has(addon.id);
                const item = selectedAddonsMap.get(addon.id);

                return (
                  <div key={addon.id} className={`p-4 border rounded-lg ${isSelected ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <label className="flex items-center space-x-3 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAddon(addon)}
                            className="w-4 h-4 text-red-600 rounded"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{addon.name}</p>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          </div>
                        </label>
                      </div>
                      <p className="text-lg font-bold text-red-600">{addon.price} SEK</p>
                    </div>

                    {isSelected && (
                      <div className="ml-7 space-y-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item?.is_mandatory || false}
                            onChange={() => toggleMandatory(addon.id)}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Obligatorisk för denna produkt?</span>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddonManager(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

