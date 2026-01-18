"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  Calendar,
  Truck,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BookingSummary {
  id: string;
  booking_number: string;
  customer_name: string;
  event_date: string;
  delivery_date: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface DailyStats {
  date: string;
  bookings: number;
  revenue: number;
}

// Status badge helper
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-orange-100", text: "text-orange-800", label: "Utkast" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Väntande" },
    confirmed: { bg: "bg-green-100", text: "text-green-800", label: "Bekräftad" },
    completed: { bg: "bg-blue-100", text: "text-blue-800", label: "Slutförd" },
    cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Avbruten" },
  };

  const config = statusConfig[status] || statusConfig.draft;
  return config;
};

export default function DashboardProPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data states
  const [totalStats, setTotalStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    pendingReview: 0,
    pendingConfirmation: 0,
    averageBookingValue: 0,
    confirmedBookings: 0,
    completedBookings: 0,
  });

  const [weekStats, setWeekStats] = useState({
    bookings: 0,
    revenue: 0,
    growth: 0,
  });

  const [todayStats, setTodayStats] = useState({
    bookings: 0,
    revenue: 0,
  });

  const [newBookings, setNewBookings] = useState<BookingSummary[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<BookingSummary[]>([]);
  const [overdueDeliveries, setOverdueDeliveries] = useState<BookingSummary[]>([]);
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const COLORS = ["#EF4444", "#FBBF24", "#34D399", "#3B82F6"];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (!bookings) return;

      // Fetch customers for names
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name");

      const customerMap = new Map(customers?.map((c) => [c.id, c.name]) || []);

      // Add customer names to bookings
      const bookingsWithNames = bookings.map((b) => ({
        ...b,
        customer_name: customerMap.get(b.customer_id) || "Okänd",
      }));

      // Calculate total stats
      const totalRevenue = bookingsWithNames.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const draftCount = bookingsWithNames.filter((b) => b.status === "draft").length;
      const pendingCount = bookingsWithNames.filter((b) => b.status === "pending").length;
      const confirmedCount = bookingsWithNames.filter((b) => b.status === "confirmed").length;
      const completedCount = bookingsWithNames.filter((b) => b.status === "completed").length;

      setTotalStats({
        totalBookings: bookingsWithNames.length,
        totalRevenue,
        pendingReview: draftCount,
        pendingConfirmation: pendingCount,
        averageBookingValue: bookingsWithNames.length > 0 ? Math.round(totalRevenue / bookingsWithNames.length) : 0,
        confirmedBookings: confirmedCount,
        completedBookings: completedCount,
      });

      // Calculate this week stats
      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      const weekBookings = bookingsWithNames.filter((b) => {
        const date = new Date(b.created_at);
        return date >= weekStart && date <= weekEnd;
      });

      const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

      // Last week for comparison
      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(weekEnd);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

      const lastWeekBookings = bookingsWithNames.filter((b) => {
        const date = new Date(b.created_at);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });

      const lastWeekRevenue = lastWeekBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const growth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      setWeekStats({
        bookings: weekBookings.length,
        revenue: weekRevenue,
        growth,
      });

      // Today stats
      const todayBookings = bookingsWithNames.filter((b) => {
        const date = new Date(b.created_at);
        return isSameDay(date, today);
      });

      setTodayStats({
        bookings: todayBookings.length,
        revenue: todayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      });

      // New bookings (last 5)
      setNewBookings(bookingsWithNames.slice(0, 5));

      // Upcoming deliveries (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const upcoming = bookingsWithNames
        .filter((b) => {
          const delDate = new Date(b.delivery_date);
          return delDate >= today && delDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
        .slice(0, 5);

      setUpcomingDeliveries(upcoming);

      // Overdue deliveries (past due date but not completed)
      const overdue = bookingsWithNames
        .filter((b) => {
          const delDate = new Date(b.delivery_date);
          return delDate < today && b.status !== "completed";
        })
        .sort((a, b) => new Date(a.delivery_date).getTime() - new Date(b.delivery_date).getTime())
        .slice(0, 5);

      setOverdueDeliveries(overdue);

      // Daily data (last 30 days)
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

      const dailyStats = daysInMonth.map((day) => {
        const dayBookings = bookingsWithNames.filter((b) => isSameDay(new Date(b.created_at), day));
        const totalDayRevenue = dayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        return {
          date: format(day, "d MMM", { locale: sv }),
          bookings: dayBookings.length,
          revenue: totalDayRevenue,
        };
      });

      setDailyData(dailyStats);

      // Weekly data (last 12 weeks)
      const weeklyStats = [];
      for (let i = 11; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        const weekBks = bookingsWithNames.filter((b) => {
          const date = new Date(b.created_at);
          return date >= weekStart && date <= weekEnd;
        });

        weeklyStats.push({
          week: format(weekEnd, "dd MMM", { locale: sv }),
          bookings: weekBks.length,
          revenue: weekBks.reduce((sum, b) => sum + (b.total_amount || 0), 0),
        });
      }

      setWeeklyData(weeklyStats);

      // Status breakdown
      const statusBreakdown = [
        {
          name: "Utkast",
          value: bookingsWithNames.filter((b) => b.status === "draft").length,
        },
        {
          name: "Väntande",
          value: bookingsWithNames.filter((b) => b.status === "pending").length,
        },
        {
          name: "Bekräftad",
          value: bookingsWithNames.filter((b) => b.status === "confirmed").length,
        },
        {
          name: "Slutförd",
          value: bookingsWithNames.filter((b) => b.status === "completed").length,
        },
      ].filter((s) => s.value > 0);

      setStatusData(statusBreakdown);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Laddar dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: sv })}
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Idag</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{todayStats.revenue.toLocaleString("sv-SE")} SEK</p>
          <p className="text-xs text-blue-700 mt-1">{todayStats.bookings} bokningar</p>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Denna vecka</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{weekStats.revenue.toLocaleString("sv-SE")} SEK</p>
          <p className={`text-xs mt-1 ${weekStats.growth >= 0 ? "text-green-700" : "text-red-700"}`}>
            {weekStats.growth > 0 ? "+" : ""}
            {weekStats.growth.toFixed(0)}% från förra veckan
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Total Intäkt</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">
            {totalStats.totalRevenue.toLocaleString("sv-SE")} SEK
          </p>
          <p className="text-xs text-purple-700 mt-1">Samtliga bokningar</p>
        </div>

        {/* Average Booking Value */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border border-indigo-200">
          <p className="text-sm text-indigo-700 font-medium">Genomsnittligt Värde</p>
          <p className="text-3xl font-bold text-indigo-900 mt-2">
            {totalStats.averageBookingValue.toLocaleString("sv-SE")} SEK
          </p>
          <p className="text-xs text-indigo-700 mt-1">Per bokning</p>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Bookings */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Totala Bokningar</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{totalStats.totalBookings}</p>
          <p className="text-xs text-orange-700 mt-1">{totalStats.pendingReview + totalStats.pendingConfirmation} väntande</p>
        </div>

        {/* Confirmed */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 font-medium">Bekräftade Bokningar</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{totalStats.confirmedBookings}</p>
          <p className="text-xs text-green-700 mt-1">Väntande leverans</p>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Slutförda Bokningar</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{totalStats.completedBookings}</p>
          <p className="text-xs text-blue-700 mt-1">Levererad</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Granska - Draft bookings */}
        <button
          onClick={() => router.push("/dashboard/bookings?status=draft")}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:shadow-lg transition-all cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-orange-900">➜ Granska Bokningar</h3>
              <p className="text-orange-700 text-sm mt-1">Klicka för att granska utkast</p>
            </div>
            <AlertCircle className="text-orange-600" size={28} />
          </div>
        </button>

        {/* Bekräfta - Pending bookings */}
        <button
          onClick={() => router.push("/dashboard/bookings?status=pending")}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:shadow-lg transition-all cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-900">✓ Bekräfta Bokningar</h3>
              <p className="text-yellow-700 text-sm mt-1">Klicka för att bekräfta väntande</p>
            </div>
            <Clock className="text-yellow-600" size={28} />
          </div>
        </button>
      </div>

      {/* Charts Row 1: Revenue & Bookings Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Intäkt - Denna Månad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value) => `${(value as number).toLocaleString("sv-SE")} SEK`}
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="revenue" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Trend - Senaste 12 Veckor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                formatter={(value) => `${(value as number).toLocaleString("sv-SE")} SEK`}
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
                name="Intäkt (SEK)"
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#FBBF24"
                strokeWidth={2}
                dot={{ fill: "#FBBF24", r: 4 }}
                name="Bokningar"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Status & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Boknings Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Ingen data</div>
          )}
        </div>

        {/* New Bookings */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-blue-600" />
            Nya Bokningar
          </h3>
          <div className="space-y-3">
            {newBookings.length === 0 ? (
              <p className="text-sm text-gray-500">Inga nya bokningar</p>
            ) : (
              newBookings.map((booking) => {
                const statusConfig = getStatusBadge(booking.status);
                return (
                  <div
                    key={booking.id}
                    onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
                    className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{booking.booking_number}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{booking.customer_name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        {format(new Date(booking.created_at), "d MMM HH:mm", { locale: sv })}
                      </p>
                      <p className="text-sm font-bold text-blue-600">
                        {booking.total_amount.toLocaleString("sv-SE")} SEK
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {newBookings.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/bookings")}
                className="w-full mt-3 text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center justify-center gap-2"
              >
                Se alla <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={20} className="text-green-600" />
            Kommande Leveranser
          </h3>
          <div className="space-y-3">
            {upcomingDeliveries.length === 0 ? (
              <p className="text-sm text-gray-500">Inga kommande leveranser</p>
            ) : (
              upcomingDeliveries.map((delivery) => {
                const statusConfig = getStatusBadge(delivery.status);
                return (
                  <div
                    key={delivery.id}
                    onClick={() => router.push(`/dashboard/bookings/${delivery.id}`)}
                    className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer border border-green-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">{delivery.booking_number}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{delivery.customer_name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {format(new Date(delivery.delivery_date), "d MMM", { locale: sv })}
                      </div>
                      <p className="text-sm font-bold text-green-600">
                        {delivery.total_amount.toLocaleString("sv-SE")} SEK
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {upcomingDeliveries.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/bookings")}
                className="w-full mt-3 text-green-600 hover:text-green-700 text-sm font-semibold flex items-center justify-center gap-2"
              >
                Se alla <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Deliveries Alert */}
      {overdueDeliveries.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-3">Överdue Leveranser ({overdueDeliveries.length})</h3>
              <div className="space-y-2">
                {overdueDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    onClick={() => router.push(`/dashboard/bookings/${delivery.id}`)}
                    className="flex items-center justify-between p-3 bg-white rounded border border-red-200 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{delivery.booking_number}</p>
                      <p className="text-xs text-gray-600">{delivery.customer_name} • Skulle levereras {format(new Date(delivery.delivery_date), "d MMM", { locale: sv })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{delivery.total_amount.toLocaleString("sv-SE")} SEK</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/dashboard/bookings?status=confirmed")}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition-colors text-sm"
              >
                Se alla väntande leveranser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left hover:border-blue-300"
        >
          <ShoppingCart className="text-blue-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900 text-sm">Bokningar</p>
          <p className="text-xs text-gray-500">{totalStats.totalBookings} totalt</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/customers")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left hover:border-purple-300"
        >
          <Users className="text-purple-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900 text-sm">Kunder</p>
          <p className="text-xs text-gray-500">Hantera kunder</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/calendar")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left hover:border-green-300"
        >
          <Calendar className="text-green-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900 text-sm">Kalender</p>
          <p className="text-xs text-gray-500">Se event</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/products")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left hover:border-orange-300"
        >
          <ShoppingCart className="text-orange-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900 text-sm">Produkter</p>
          <p className="text-xs text-gray-500">Hantera</p>
        </button>
      </div>
    </div>
  );
}

