"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
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
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all bookings with customer names
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, name");

      const customerMap = new Map(customers?.map(c => [c.id, c.name]) || []);

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

      // Get pending review and confirmation bookings
      const draftBookings = bookings?.filter(b => b.status === "draft") || [];
      const pendingBookings = bookings?.filter(b => b.status === "pending") || [];

      const pendingReviewWithNames = draftBookings.slice(0, 5).map(b => ({
        ...b,
        customer_name: customerMap.get(b.customer_id) || "Okänd",
      }));

      const pendingConfirmWithNames = pendingBookings.slice(0, 5).map(b => ({
        ...b,
        customer_name: customerMap.get(b.customer_id) || "Okänd",
      }));

      // Generate monthly data
      const monthlyStats: Record<string, { revenue: number; bookings: number }> = {};
      bookings?.forEach(b => {
        const month = format(new Date(b.created_at), "MMM", { locale: sv });
        if (!monthlyStats[month]) {
          monthlyStats[month] = { revenue: 0, bookings: 0 };
        }
        monthlyStats[month].revenue += b.total_amount || 0;
        monthlyStats[month].bookings += 1;
      });

      const monthly = Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue / 1000),
        bookings: data.bookings,
      }));

      setStats({
        totalBookings: bookings?.length || 0,
        totalRevenue: totalRevenue,
        totalCustomers: customers?.length || 0,
        pendingReview: draftBookings.length,
        pendingConfirmation: pendingBookings.length,
        confirmedThisMonth: thisMonth.filter(b => b.status === "confirmed").length,
        revenueThisMonth: thisMonthRevenue,
        revenueGrowth: revenueGrowth,
      });

      setPendingReviewBookings(pendingReviewWithNames);
      setPendingConfirmationBookings(pendingConfirmWithNames);
      setMonthlyData(monthly);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Laddar...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Överblick över bokningar och intäkter</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Totala Bokningar"
          value={stats.totalBookings}
          icon={ShoppingCart}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Total Intäkt"
          value={`${(stats.totalRevenue / 1000).toFixed(0)}k SEK`}
          icon={DollarSign}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          title="Aktiva Kunder"
          value={stats.totalCustomers}
          icon={Users}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Denna Månad"
          value={`${(stats.revenueThisMonth / 1000).toFixed(0)}k SEK`}
          subtitle={`${stats.revenueGrowth > 0 ? "+" : ""}${stats.revenueGrowth.toFixed(0)}% från förra`}
          icon={TrendingUp}
          color={`${stats.revenueGrowth > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
        />
      </div>

      {/* Pending Actions - Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Review Card */}
        <div
          onClick={() => {
            if (pendingReviewBookings.length > 0) {
              router.push(`/dashboard/bookings/${pendingReviewBookings[0].id}`);
            } else {
              router.push("/dashboard/bookings");
            }
          }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-orange-900">Granska Bokningar</h2>
              <p className="text-orange-700 text-sm mt-1">
                {stats.pendingReview} väntar på granskning
              </p>
            </div>
            <AlertCircle className="text-orange-600" size={28} />
          </div>
          {pendingReviewBookings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <p className="text-sm text-orange-700 font-medium mb-2">Nästa:</p>
              <p className="font-semibold text-orange-900">{pendingReviewBookings[0].booking_number}</p>
              <p className="text-xs text-orange-700">{pendingReviewBookings[0].customer_name}</p>
            </div>
          )}
        </div>

        {/* Pending Confirmation Card */}
        <div
          onClick={() => {
            if (pendingConfirmationBookings.length > 0) {
              router.push(`/dashboard/bookings/${pendingConfirmationBookings[0].id}`);
            } else {
              router.push("/dashboard/bookings");
            }
          }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-900">Bekräfta Bokningar</h2>
              <p className="text-yellow-700 text-sm mt-1">
                {stats.pendingConfirmation} redo för bekräftelse
              </p>
            </div>
            <Calendar className="text-yellow-600" size={28} />
          </div>
          {pendingConfirmationBookings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-sm text-yellow-700 font-medium mb-2">Nästa:</p>
              <p className="font-semibold text-yellow-900">{pendingConfirmationBookings[0].booking_number}</p>
              <p className="text-xs text-yellow-700">{pendingConfirmationBookings[0].customer_name}</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Intäkt Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}k SEK`} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Intäkt (k SEK)"
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
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
        >
          <ShoppingCart className="text-blue-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900">Alla Bokningar</p>
          <p className="text-sm text-gray-500">{stats.totalBookings} bokningar</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/customers")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
        >
          <Users className="text-purple-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900">Kunder</p>
          <p className="text-sm text-gray-500">{stats.totalCustomers} kunder</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/calendar")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
        >
          <Calendar className="text-green-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900">Kalender</p>
          <p className="text-sm text-gray-500">Se alla event</p>
        </button>

        <button
          onClick={() => router.push("/dashboard/products")}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
        >
          <ShoppingCart className="text-orange-600 mb-2" size={24} />
          <p className="font-semibold text-gray-900">Produkter</p>
          <p className="text-sm text-gray-500">Hantera produkter</p>
        </button>
      </div>
    </div>
  );
}

