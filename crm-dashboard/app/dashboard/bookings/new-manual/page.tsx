"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { calculateOBCost, getOBReason } from "@/lib/ob-utils";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
}

interface Product {
  id: string;
  name: string;
  base_price_per_day: number;
}

interface FormProduct {
  id?: string;
  name: string;
  quantity: number;
  wrapping_requested: boolean;
  addons?: any[];
  price_per_day?: number; // Price for calculation
}

export default function NewManualBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    pickup_date: "",
    pickup_time: "", // HH:MM format
    delivery_date: "",
    delivery_time: "", // HH:MM format
    event_date: "",
    event_end_date: "",
    location: "",
    delivery_street_address: "",
    delivery_postal_code: "",
    delivery_city: "",
    delivery_type: "internal", // internal eller external
    delivery_instructions: "",
    internal_notes: "",
    customer_notes: "",
    shipping_cost: 0, // For external delivery
    products: [] as FormProduct[],
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductQty, setNewProductQty] = useState(1);

  useEffect(() => {
    fetchCustomersAndProducts();
  }, []);

  useEffect(() => {
    if (customerSearch.trim()) {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(true);
    } else {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, [customerSearch, customers]);

  const fetchCustomersAndProducts = async () => {
    try {
      const [customersRes, productsRes, addonsRes] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("products").select("id, name, base_price_per_day").order("name"),
        supabase.from("addons").select("id, name, price, product_id"), // Don't order by product_id if not all records have it
      ]);

      if (customersRes.error) throw customersRes.error;
      if (productsRes.error) throw productsRes.error;
      // Don't throw if addonsRes has error - it might not exist yet

      setCustomers(customersRes.data || []);
      
      // Attach addons to products (handle case where addons table may not have product_id)
      const addonsData = addonsRes.data || [];
      const productsWithAddons = (productsRes.data || []).map(product => ({
        ...product,
        addons: addonsData.filter(addon => addon.product_id === product.id)
      }));
      
      setProducts(productsWithAddons);
    } catch (err) {
      console.error("Error fetching data:", err);
      // Try fetching without addons if there's an error
      try {
        const [customersRes, productsRes] = await Promise.all([
          supabase.from("customers").select("*").order("name"),
          supabase.from("products").select("id, name, base_price_per_day").order("name"),
        ]);
        setCustomers(customersRes.data || []);
        const productsWithAddons = (productsRes.data || []).map(product => ({
          ...product,
          addons: []
        }));
        setProducts(productsWithAddons);
      } catch (innerErr) {
        console.error("Error fetching products:", innerErr);
      }
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({ ...prev, customer_id: customer.id }));
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);

    // Auto-fill delivery address från customer
    setFormData((prev) => ({
      ...prev,
      delivery_street_address: customer.street_address || "",
      delivery_postal_code: customer.postal_code || "",
      delivery_city: customer.city || "",
    }));
  };

  const addProduct = () => {
    if (!newProductName.trim()) {
      setError("Välj en produkt");
      return;
    }

    const selectedProduct = products.find((p) => p.name === newProductName);
    if (!selectedProduct) {
      setError("Produkt inte hittad");
      return;
    }

    const exists = formData.products.some((p) => p.name === newProductName);
    if (exists) {
      setError("Produkten är redan tillagd");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: selectedProduct.id,
          name: newProductName,
          quantity: newProductQty,
          wrapping_requested: false,
          addons: (selectedProduct as any).addons?.map((addon: any) => ({ ...addon, selected: false })) || [],
          price_per_day: selectedProduct.base_price_per_day,
        },
      ],
    }));

    setNewProductName("");
    setNewProductQty(1);
    setError(null);
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newProducts = [...prev.products];
      newProducts[index] = { ...newProducts[index], [field]: value };
      return { ...prev, products: newProducts };
    });
  };

  const calculateTotalPrice = () => {
    if (!formData.pickup_date || !formData.delivery_date) return { subtotal: 0, discount: 0, shipping: 0, ob: 0, tax: 0, total: 0, obReasons: [] };

    const pickup = new Date(formData.pickup_date);
    const delivery = new Date(formData.delivery_date);
    
    // Ensure delivery is after pickup
    if (delivery < pickup) {
      return { subtotal: 0, discount: 0, shipping: 0, ob: 0, tax: 0, total: 0, obReasons: [] };
    }
    
    const days = Math.ceil((delivery.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Ensure days is positive
    if (days <= 0) {
      return { subtotal: 0, discount: 0, shipping: 0, ob: 0, tax: 0, total: 0, obReasons: [] };
    }

    let subtotal = 0;
    
    // Calculate products
    formData.products.forEach((p) => {
      const pricePerDay = p.price_per_day || 0;
      subtotal += pricePerDay * p.quantity * days;
      
      // Add selected addons
      if (p.addons && Array.isArray(p.addons)) {
        p.addons.forEach((addon: any) => {
          if (addon.selected) {
            subtotal += (addon.price || 0) * days;
          }
        });
      }
    });
    
    // Ensure subtotal is never negative (safety check)
    if (subtotal < 0) {
      subtotal = Math.abs(subtotal);
    }

    // Calculate discount (10% if more than 2 products)
    const productCount = formData.products.length;
    const discount = productCount > 2 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    
    // Subtotal after discount
    const subtotalAfterDiscount = Math.round((subtotal - discount) * 100) / 100;

    // Add shipping cost with 10% discount if > 2 products
    let shippingCost = formData.delivery_type === "external" ? (formData.shipping_cost || 0) : 0;
    const shippingDiscount = productCount > 2 ? Math.round(shippingCost * 0.1 * 100) / 100 : 0;
    shippingCost = Math.round((shippingCost - shippingDiscount) * 100) / 100;
    
    // Calculate OB cost (already imported at top)
    const obCost = calculateOBCost(formData.pickup_date, formData.pickup_time, formData.delivery_date, formData.delivery_time);
    const obReasons = getOBReason(formData.pickup_date, formData.pickup_time, formData.delivery_date, formData.delivery_time);
    
    // Add shipping and OB to subtotal (before tax)
    const subtotalWithShippingAndOB = Math.round((subtotalAfterDiscount + shippingCost + obCost) * 100) / 100;

    const taxRate = 0.25; // 25% Swedish VAT
    const tax = Math.round(subtotalWithShippingAndOB * taxRate * 100) / 100;
    const total = Math.round((subtotalWithShippingAndOB + tax) * 100) / 100;

    return { subtotal, discount, shipping: shippingCost, shippingDiscount, ob: obCost, tax, total, obReasons };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.customer_id) {
      setError("Välj en kund");
      return;
    }
    if (!formData.pickup_date || !formData.delivery_date) {
      setError("Pickup- och leveransdatum är obligatoriska");
      return;
    }
    if (!formData.location) {
      setError("Evenplats är obligatorisk");
      return;
    }
    if (formData.products.length === 0) {
      setError("Lägg till minst en produkt");
      return;
    }

    try {
      setLoading(true);

      const bookingNumber = `BK-${Date.now()}`;
      const pricing = calculateTotalPrice();

      const { data, error: insertError } = await supabase
        .from("bookings")
        .insert([
          {
            customer_id: formData.customer_id,
            booking_number: bookingNumber,
            pickup_date: formData.pickup_date,
            pickup_time: formData.pickup_time || null,
            delivery_date: formData.delivery_date,
            delivery_time: formData.delivery_time || null,
            event_date: formData.event_date || formData.pickup_date,
            event_end_date: formData.event_end_date || formData.delivery_date,
            location: formData.location,
            delivery_street_address: formData.delivery_street_address,
            delivery_postal_code: formData.delivery_postal_code,
            delivery_city: formData.delivery_city,
            delivery_type: formData.delivery_type || 'internal',
            delivery_instructions: formData.delivery_instructions,
            internal_notes: formData.internal_notes,
            customer_notes: formData.customer_notes,
            products_requested: JSON.stringify(formData.products),
            shipping_cost: pricing.shipping,
            ob_cost: pricing.ob,
            total_amount: pricing.total,
            total_estimated_price: pricing.total,
            status: "pending",
            requires_delivery: formData.delivery_type === "external",
            requires_setup: false,
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (data && data[0]) {
        router.push(`/dashboard/bookings/${data[0].id}`);
      }
    } catch (err: any) {
      setError(err.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ny Bokning (Manuell)</h1>
          <p className="text-gray-500 mt-1">Skapa en ny bokning manuellt</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Customer */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">1. Välj Kund</h2>
          <div className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Sök kund efter namn eller email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
            />
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectCustomer(customer)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
              <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
              {selectedCustomer.phone && (
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Event Dates */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">2. Datum</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upphämtningsdatum *
              </label>
              <input
                type="date"
                value={formData.pickup_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pickup_date: e.target.value }))
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upphämtningstid
              </label>
              <input
                type="time"
                value={formData.pickup_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pickup_time: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leveransdatum *
              </label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, delivery_date: e.target.value }))
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leveranstid
              </label>
              <input
                type="time"
                value={formData.delivery_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, delivery_time: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event-startdatum
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, event_date: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event-slutdatum
              </label>
              <input
                type="date"
                value={formData.event_end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, event_end_date: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">3. Plats & Leverans</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evenplats *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, location: e.target.value }))
                }
                required
                placeholder="T.ex. Drottninggatan 1, Stockholm"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leverans-typ *
              </label>
              <select
                value={formData.delivery_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, delivery_type: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              >
                <option value="internal">Leverans/Pick-up (Vi levererar)</option>
                <option value="external">Extern Frakt</option>
                <option value="customer_pickup">Customer Pickup</option>
              </select>
            </div>

            {/* Show shipping cost input only for external delivery */}
            {formData.delivery_type === "external" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fraktkostnad (Obligatorisk för extern frakt) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.shipping_cost || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shipping_cost: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="T.ex. 500"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                  />
                  <span className="text-gray-600 font-medium">SEK</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leverans-adress
              </label>
              <input
                type="text"
                value={formData.delivery_street_address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    delivery_street_address: e.target.value,
                  }))
                }
                placeholder="Gatuadress"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={formData.delivery_postal_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery_postal_code: e.target.value,
                    }))
                  }
                  placeholder="Postnummer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.delivery_city}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      delivery_city: e.target.value,
                    }))
                  }
                  placeholder="Stad"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leveransinstruktioner
              </label>
              <textarea
                value={formData.delivery_instructions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    delivery_instructions: e.target.value,
                  }))
                }
                placeholder="T.ex. Ring innan leverans..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Step 4: Products */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">4. Produkter *</h2>

          {/* Add Product */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produkt
                </label>
                <select
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                >
                  <option value="">Välj produkt...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.base_price_per_day} SEK/dag)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Antal
                </label>
                <input
                  type="number"
                  min="1"
                  value={newProductQty}
                  onChange={(e) => setNewProductQty(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addProduct}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Plus size={18} />
                  Lägg till
                </button>
              </div>
            </div>
          </div>

          {/* Products List */}
          {formData.products.length > 0 ? (
            <div className="space-y-3">
              {formData.products.map((product, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">Antal: {product.quantity} × {product.price_per_day || 0} SEK/dag</p>
                      {product.price_per_day && (
                        <p className="text-xs text-gray-500">= {product.quantity * (product.price_per_day || 0) * 1} SEK (1 dag)</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Addons */}
                  {product.addons && product.addons.length > 0 && (
                    <div className="ml-2 pl-2 border-l-2 border-gray-300 pt-2 space-y-1">
                      <p className="text-xs font-semibold text-gray-700">Tillgängliga tillägg:</p>
                      {product.addons.map((addon: any, addonIdx: number) => (
                        <label key={addonIdx} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={addon.selected || false}
                            onChange={(e) => {
                              const updated = [...formData.products];
                              if (updated[idx].addons) {
                                updated[idx].addons![addonIdx].selected = e.target.checked;
                              }
                              setFormData({ ...formData, products: updated });
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span>{addon.name} ({addon.price || 0} SEK)</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Inga produkter tillagda ännu
            </div>
          )}
        </div>

        {/* Step 5: Notes */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">5. Anteckningar</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interna anteckningar
              </label>
              <textarea
                value={formData.internal_notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, internal_notes: e.target.value }))
                }
                placeholder="Interna noteringar för teamet..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kundens anteckningar
              </label>
              <textarea
                value={formData.customer_notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customer_notes: e.target.value }))
                }
                placeholder="Anteckningar som kunden ser..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Prissammanfattning</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Summa (ex. moms):</span>
                  <span className="font-medium">{totalPrice.subtotal.toLocaleString("sv-SE")} SEK</span>
                </div>
                
                {/* Discount row */}
                {totalPrice.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Rabatt (10% för &gt;2 produkter):</span>
                    <span>-{totalPrice.discount.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                
                {/* Shipping row */}
                {totalPrice.shipping > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Fraktkostnad:</span>
                    <span>+{totalPrice.shipping.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                
                {/* Shipping discount row */}
                {shippingDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Fraktrabatt (10%):</span>
                    <span>-{shippingDiscount.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                
                {/* OB Cost row */}
                {totalPrice.ob > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <div className="flex flex-col">
                      <span>OB-kostnad (1500 SEK):</span>
                      <span className="text-xs text-gray-500 font-normal">
                        {totalPrice.obReasons?.join(", ") || "Kvällsleverans/helg"}
                      </span>
                    </div>
                    <span>+{totalPrice.ob.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600">
                  <span>Moms (25%):</span>
                  <span>{totalPrice.tax.toLocaleString("sv-SE")} SEK</span>
                </div>
                <div className="border-t border-red-200 pt-1 mt-1 flex justify-between">
                  <span className="font-semibold">Totalt (ink. moms):</span>
                  <span className="text-lg font-bold text-red-600">{totalPrice.total.toLocaleString("sv-SE")} SEK</span>
                </div>
                
                {/* Shipping cost at bottom */}
                {totalPrice.shipping > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-200 flex justify-between text-gray-600 text-xs">
                    <span>Fraktkostnad (ingår ovan):</span>
                    <span>{totalPrice.shipping.toLocaleString("sv-SE")} SEK</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                för {Math.ceil((new Date(formData.delivery_date).getTime() - new Date(formData.pickup_date).getTime()) / (1000 * 60 * 60 * 24)) + 1 || 0} dagar
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">
                {formData.products.length} produkt{formData.products.length !== 1 ? "er" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
          >
            <Save size={18} />
            {loading ? "Sparar..." : "Spara Bokning"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/bookings")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
}
