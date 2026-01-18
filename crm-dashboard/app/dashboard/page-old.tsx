"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Clock,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingReview: number;
  pendingConfirmation: number;
  confirmedThisMonth: number;
  revenueThisMonth: number;
  revenueGrowth: number;
}

interface BookingSummary {
  id: string;
  booking_number: string;
  customer_id: string;
  customer_name: string;
  event_date: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingReview: 0,
    pendingConfirmation: 0,
    confirmedThisMonth: 0,
    revenueThisMonth: 0,
    revenueGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pendingReviewBookings, setPendingReviewBookings] = useState<BookingSummary[]>([]);
  const [pendingConfirmationBookings, setPendingConfirmationBookings] = useState<BookingSummary[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch customers
      const { data: customers } = await supabase
        .from("customers")
        .select("*");

      // Calculate stats
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const thisMonth = bookings?.filter((b) => new Date(b.created_at) >= thisMonthStart) || [];
      const lastMonth = bookings?.filter((b) => {
        const d = new Date(b.created_at);
        return d >= lastMonthStart && d <= lastMonthEnd;
      }) || [];

      const thisMonthRevenue = thisMonth.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const lastMonthRevenue = lastMonth.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      setStats({
        totalBookings: bookings?.length || 0,
        totalRevenue,
        totalCustomers: customers?.length || 0,
        pendingReview: bookings?.filter((b) => b.status === "draft" || b.status === "pending").length || 0,
        pendingConfirmation: bookings?.filter((b) => b.status === "pending").length || 0,
        confirmedThisMonth: thisMonth.filter((b) => b.status === "confirmed").length || 0,
        revenueThisMonth: thisMonthRevenue,
        revenueGrowth,
      });

      // Get bookings with customer info
      const bookingsWithCustomers = await Promise.all(
        (bookings || []).map(async (booking) => {
          const customer = customers?.find((c) => c.id === booking.customer_id);
          return {
            ...booking,
            customer_name: customer?.name || "Okänd",
          };
        })
      );

      // Separate pending bookings
      const pending = bookingsWithCustomers.filter((b) => b.status === "draft" || b.status === "pending");
      const review = pending.slice(0, 5);
      const confirmation = pending.slice(5, 10);

      setPendingReviewBookings(review);
      setPendingConfirmationBookings(confirmation);
      setRecentBookings(bookingsWithCustomers.slice(0, 10));

      // Monthly data for chart
      const monthlyMap: Record<string, { revenue: number; bookings: number }> = {};
      bookingsWithCustomers.forEach((b) => {
        const month = format(new Date(b.created_at), "MMM", { locale: sv });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { revenue: 0, bookings: 0 };
        }
        monthlyMap[month].revenue += b.total_amount || 0;
        monthlyMap[month].bookings += 1;
      });

      setMonthlyData(
        Object.entries(monthlyMap).map(([month, data]) => ({
          month,
          ...data,
        }))
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, subtitle, color }: any) => (
    <div className={`bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laddar dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Välkommen! Här är en snabb överblick av ditt system</p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Totala Bokningar"
          value={stats.totalBookings}
          icon={Calendar}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Intäkt"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}k SEK`}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Totala Kunder"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Denna Månad"
          value={`${(stats.revenueThisMonth / 1000).toFixed(0)}k SEK`}
          subtitle={`${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth.toFixed(0)}% från förra månaden`}
          icon={TrendingUp}
          color={`${stats.revenueGrowth > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
        />
      </div>

      {/* Action Cards - Review & Confirmation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Review */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => {
            const pendingReview = pendingReviewBookings[0];
            if (pendingReview) {
              router.push(`/dashboard/bookings/${pendingReview.id}`);
            }
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-orange-900">Granska Bokningar</h2>
              <p className="text-orange-700 text-sm mt-1">Nya bokningar som väntar på granskning</p>
            </div>
            <div className="bg-orange-200 p-3 rounded-lg">
              <AlertCircle size={24} className="text-orange-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Väntande</p>
              <p className="text-4xl font-bold text-orange-900">{stats.pendingReview}</p>
            </div>
            <ArrowRight className="text-orange-600" size={24} />
          </div>
        </div>

        {/* Pending Confirmation */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:shadow-lg transition-all cursor-pointer"
          onClick={() => {
            const pendingConfirm = pendingConfirmationBookings[0];
            if (pendingConfirm) {
              router.push(`/dashboard/bookings/${pendingConfirm.id}`);
            }
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">Bekräfta Bokningar</h2>
              <p className="text-blue-700 text-sm mt-1">Granskade bokningar redo för bekräftelse</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <CheckCircle2 size={24} className="text-blue-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Redo</p>
              <p className="text-4xl font-bold text-blue-900">{stats.pendingConfirmation}</p>
            </div>
            <ArrowRight className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Intäkt Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#EF4444"
                strokeWidth={2}
                name="Intäkt (SEK)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Trend */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Bokningar Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3B82F6" name="Bokningar" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Review List */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Nästa: Granska</h3>
            <AlertCircle size={20} className="text-orange-600" />
          </div>
          <div className="space-y-3">
            {pendingReviewBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Inga bokningar att granska</p>
            ) : (
              pendingReviewBookings.map((booking) => (
                <div key={booking.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/review-bookings/${booking.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                      <p className="text-xs text-gray-600">{booking.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{booking.total_amount.toLocaleString("sv-SE")} SEK</p>
                      <p className="text-xs text-gray-500">{format(new Date(booking.event_date), "d MMM", { locale: sv })}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {pendingReviewBookings.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/bookings")}
                className="w-full mt-4 text-orange-600 hover:text-orange-700 font-semibold flex items-center justify-center gap-2"
              >
                Se alla <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Pending Confirmation List */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Nästa: Bekräfta</h3>
            <CheckCircle2 size={20} className="text-blue-600" />
          </div>
          <div className="space-y-3">
            {pendingConfirmationBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Inga bokningar att bekräfta</p>
            ) : (
              pendingConfirmationBookings.map((booking) => (
                <div key={booking.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/confirm-bookings/${booking.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{booking.booking_number}</p>
                      <p className="text-xs text-gray-600">{booking.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{booking.total_amount.toLocaleString("sv-SE")} SEK</p>
                      <p className="text-xs text-gray-500">{format(new Date(booking.event_date), "d MMM", { locale: sv })}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {pendingConfirmationBookings.length > 0 && (
              <button
                onClick={() => router.push("/dashboard/bookings")}
                className="w-full mt-4 text-blue-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-2"
              >
                Se alla <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
        <div>
          <p className="text-sm text-gray-600 font-medium">Bekräftade denna månad</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.confirmedThisMonth}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">Väntande granskning</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingReview}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">Väntande bekräftelse</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.pendingConfirmation}</p>
        </div>
      </div>
    </div>
  );
}

