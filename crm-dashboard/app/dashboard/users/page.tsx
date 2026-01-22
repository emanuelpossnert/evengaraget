"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Edit2, Trash2, Mail, Shield, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "sales" | "warehouse" | "printer" | "support";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    email: string;
    full_name: string;
    role: "admin" | "sales" | "warehouse" | "printer" | "support";
    password?: string;
  }>({
    email: "",
    full_name: "",
    role: "sales",
    password: "",
  });
  const [newUserPassword, setNewUserPassword] = useState<{ email: string; password: string } | null>(null);
  const [visiblePassword, setVisiblePassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const roles = [
    { value: "admin", label: "👑 Admin", description: "Full tillgång - alla sidor, användarlistan, inställningar", color: "bg-red-100 text-red-700" },
    { value: "sales", label: "📊 Säljare / Support", description: "Hantera bokningar, kunder, produkter, analytics och kundsupport", color: "bg-blue-100 text-blue-700" },
    { value: "support", label: "💬 Support", description: "Hantera kundkommunikation och supportärenden", color: "bg-green-100 text-green-700" },
    { value: "warehouse", label: "📦 Lager", description: "Leveranser, placeringar, foliering-bilder, lagerlistan", color: "bg-yellow-100 text-yellow-700" },
    { value: "printer", label: "🖨️ Tryckeri", description: "Se bekräftade ordrar med foliering och uppladdade bilder", color: "bg-purple-100 text-purple-700" },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "Kunde inte ladda användare" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name) {
      setMessage({ type: "error", text: "Fyll i alla fält" });
      return;
    }

    try {
      if (editingId) {
        // Update existing user
        const { error } = await supabase
          .from("user_profiles")
          .update({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
          })
          .eq("id", editingId);

        if (error) throw error;
        setMessage({ type: "success", text: "Användare uppdaterad!" });
      } else {
        // Create new user via Supabase Admin API
        const password = formData.password || Math.random().toString(36).slice(-12);
        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            password: password,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Kunde inte skapa användare");

        // Show password to admin
        if (data.user?.password) {
          setNewUserPassword({
            email: data.user.email,
            password: data.user.password,
          });
        }

        setMessage({ type: "success", text: "Användare skapad! Se lösenordet nedan." });
      }

      setFormData({ email: "", full_name: "", role: "sales", password: "" });
      setEditingId(null);
      setShowForm(false);
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMsg = error instanceof Error ? error.message : "Kunde inte spara användare";
      setMessage({ type: "error", text: errorMsg });
    }
  };

  const handleResetPassword = async (user: UserProfile) => {
    const newPassword = prompt(`Ange nytt lösenord för ${user.full_name}:`);
    if (!newPassword) return;

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Lösenordet måste vara minst 6 tecken" });
      return;
    }

    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Kunde inte reseta lösenord");

      // Show new password to admin
      setVisiblePassword(newPassword);
      setShowPasswordModal(true);
      setMessage({ type: "success", text: `Lösenord resetat för ${user.full_name}` });
    } catch (error) {
      console.error("Error resetting password:", error);
      const errorMsg = error instanceof Error ? error.message : "Kunde inte reseta lösenord";
      setMessage({ type: "error", text: errorMsg });
    }
  };

  const handleEdit = (user: UserProfile) => {
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Är du säker på att du vill radera denna användare?")) return;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      setMessage({ type: "success", text: "Användare raderad!" });
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ type: "error", text: "Kunde inte radera användare" });
    }
  };

  const handleCancel = () => {
    setFormData({ email: "", full_name: "", role: "manager" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleShowPassword = async (userId: string, userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from("user_credentials")
        .select("password")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        setMessage({ type: "error", text: "Kunde inte hämta lösenordet" });
        return;
      }

      setVisiblePassword(data.password);
      setShowPasswordModal(true);
    } catch (error) {
      console.error("Error fetching password:", error);
      setMessage({ type: "error", text: "Fel vid hämtning av lösenord" });
    }
  };

  const getRoleColor = (role: string) => {
    const roleObj = roles.find((r) => r.value === role);
    return roleObj?.color || "bg-gray-100 text-gray-700";
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

      {/* Password Display Modal */}
      {showPasswordModal && visiblePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Användarens Lösenord</h2>
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-600 font-semibold mb-2">LÖSENORD:</p>
              <div className="flex gap-2">
                <p className="font-mono text-sm bg-white p-3 rounded border border-gray-200 flex-1 break-all">{visiblePassword}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(visiblePassword);
                    setMessage({ type: "success", text: "Kopierat!" });
                    setTimeout(() => setMessage(null), 2000);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                >
                  Kopiera
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ⚠️ <strong>Dela detta lösenord säkert med personen.</strong> De kan byta det efter första inloggningen.
            </p>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setVisiblePassword(null);
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* New User Password Display Modal */}
      {newUserPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">✅ Användare Skapad!</h2>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6 space-y-3">
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">EMAIL:</p>
                <p className="font-mono text-sm bg-white p-2 rounded border border-gray-200">{newUserPassword.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-semibold mb-1">LÖSENORD:</p>
                <div className="flex gap-2">
                  <p className="font-mono text-sm bg-white p-2 rounded border border-gray-200 flex-1">{newUserPassword.password}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newUserPassword.password);
                      setMessage({ type: "success", text: "Kopierat!" });
                      setTimeout(() => setMessage(null), 2000);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                  >
                    Kopiera
                  </button>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              💡 <strong>Dela denna information med personen.</strong> De kan logga in och byta lösenord efter första inloggningen.
            </p>
            <button
              onClick={() => {
                setNewUserPassword(null);
                setFormData({ email: "", full_name: "", role: "sales", password: "" });
                setShowForm(false);
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Stäng
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Användare</h1>
          <p className="text-gray-600 mt-1">Hantera team-medlemmar och roller</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ email: "", full_name: "", role: "sales", password: "" });
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus size={20} />
          Ny Användare
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? "Redigera Användare" : "Ny Användare"}
              </h2>

              {!editingId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    <strong>✅ Ny användare</strong> skapas automatiskt. Ett lösenordsmail skickas till dem.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namn
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initialt Lösenord (valfritt)
                    </label>
                    <input
                      type="text"
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Läm tomt för slumpmässigt lösenord"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Om tomt genereras ett slumpmässigt lösenord</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "sales" | "warehouse" | "printer" | "support",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {editingId ? "Uppdatera" : "Skapa"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Avbryt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök efter namn eller email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Laddar användare...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Inga användare hittades</div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* User Info */}
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Mail size={14} />
                    {user.email}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>
                    <Shield size={14} className="mr-1" />
                    {roles.find((r) => r.value === user.role)?.label}
                  </span>
                </div>

                {/* Created At */}
                <div>
                  <p className="text-xs text-gray-500">Skapad</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(user.created_at).toLocaleDateString("sv-SE")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleShowPassword(user.id, user.email)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Visa lösenord"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleResetPassword(user)}
                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Reseta lösenord"
                  >
                    🔑
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles Legend */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Roller & Behörigheter</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <div key={role.value} className="p-3 bg-gray-50 rounded-lg">
              <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${role.color}`}>
                {role.label}
              </span>
              <div className="text-xs text-gray-600 space-y-1">
                {role.value === "admin" && (
                  <>
                    <p>👑 Full tillgång</p>
                    <p>👥 Användarhantering</p>
                    <p>⚙️ Inställningar</p>
                  </>
                )}
                {role.value === "manager" && (
                  <>
                    <p>📊 Bokningar & Kunder</p>
                    <p>📦 Produkter</p>
                    <p>📈 Analytics</p>
                  </>
                )}
                {role.value === "warehouse" && (
                  <>
                    <p>📦 Lager & Leveranser</p>
                    <p>🎨 Foliering-bilder</p>
                    <p>✅ Placeringar</p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

