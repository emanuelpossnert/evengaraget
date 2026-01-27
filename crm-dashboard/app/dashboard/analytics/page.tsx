"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Download, TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Calendar, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
} from "recharts";

interface KPI {
  // Financial KPIs - ONLY REAL DATA
  totalRevenue: number;
  totalBookings: number;
  averageOrderValue: number;
  medianOrderValue: number;
  
  // Growth & Trends
  revenueGrowth: number;
  bookingGrowth: number;
  customerGrowth: number;
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  weeklyRevenue: Array<{ week: string; revenue: number }>;
  
  // Customer Metrics
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  repeatCustomerRate: number;
  
  // Product Metrics
  topProducts: Array<{ name: string; count: number; revenue: number }>;
  bottomProducts: Array<{ name: string; count: number; revenue: number }>;
  categoryPerformance: Array<{ category: string; revenue: number; bookings: number }>;
  
  // Booking Metrics
  bookingsByStatus: Array<{ status: string; count: number }>;
  bookingCancellationRate: number;
  completionRate: number;
  averageEventDuration: number;
  
  // Customer Quality
  topCustomers: Array<{ name: string; revenue: number; bookings: number }>;
  
  // Operational Metrics
  pendingBookingsCount: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [kpiData, setKpiData] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "customers" | "operational">("overview");
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    // Set default date range (last 12 months)
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(oneYearAgo.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAnalyticsData();
    }
  }, [startDate, endDate]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["confirmed", "completed", "pending", "draft", "cancelled"]);

      // Fetch all products
      const { data: productsData } = await supabase.from("products").select("*");

      // Fetch all customers
      const { data: customersData } = await supabase.from("customers").select("*");

      if (!bookingsData || !productsData || !customersData) {
        setLoading(false);
        return;
      }

      // Filter by date range
      const filteredBookings = bookingsData.filter((b) => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= new Date(startDate) && bookingDate <= new Date(endDate);
      });

      // === FINANCIAL CALCULATIONS ===
      const confirmedBookings = filteredBookings.filter((b) => b.status === "confirmed" || b.status === "completed");
      const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const totalBookings = confirmedBookings.length;
      const averageOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate median
      const sortedAmounts = confirmedBookings
        .map((b) => b.total_amount)
        .sort((a, b) => a - b);
      const medianOrderValue = sortedAmounts[Math.floor(sortedAmounts.length / 2)] || 0;

      // === GROWTH METRICS ===
      const now = new Date();
      const currentMonth = confirmedBookings.filter((b) => {
        const date = new Date(b.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const currentMonthRevenue = currentMonth.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const currentMonthBookings = currentMonth.length;

      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const lastMonthData = confirmedBookings.filter((b) => {
        const date = new Date(b.created_at);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      });
      const lastMonthRevenue = lastMonthData.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const lastMonthBookings = lastMonthData.length;

      const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 100;
      const bookingGrowth = lastMonthBookings > 0 ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 100;

      // Monthly data
      const monthlyData: Record<string, { revenue: number; bookings: number }> = {};
      confirmedBookings.forEach((booking) => {
        const date = new Date(booking.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, bookings: 0 };
        }
        monthlyData[monthKey].revenue += booking.total_amount || 0;
        monthlyData[monthKey].bookings += 1;
      });

      const monthlyRevenue = Object.entries(monthlyData)
        .sort()
        .map(([month, data]) => ({
          month: month,
          revenue: Math.round(data.revenue),
          bookings: data.bookings,
        }))
        .slice(-12);

      // Weekly data
      const weeklyData: Record<string, number> = {};
      confirmedBookings.forEach((booking) => {
        const date = new Date(booking.created_at);
        const weekNum = Math.ceil(date.getDate() / 7);
        const weekKey = `Vecka ${weekNum}`;
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (booking.total_amount || 0);
      });

      const weeklyRevenue = Object.entries(weeklyData)
        .map(([week, revenue]) => ({
          week,
          revenue: Math.round(revenue),
        }))
        .slice(-8);

      // === TOP PRODUCTS ===
      const productCount: Record<string, { count: number; revenue: number; name: string; id: string }> = {};
      confirmedBookings.forEach((booking) => {
        try {
          let products = booking.products_requested;
          if (typeof products === "string") {
            if (products.startsWith('"')) {
              products = JSON.parse(products);
            }
            if (typeof products === "string") {
              products = JSON.parse(products);
            }
          }
          if (Array.isArray(products)) {
            products.forEach((p: any) => {
              if (!productCount[p.id]) {
                productCount[p.id] = { count: 0, revenue: 0, name: p.name, id: p.id };
              }
              productCount[p.id].count += p.quantity || 1;
              productCount[p.id].revenue += (p.price || 0) * (p.quantity || 1);
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const topProducts = Object.values(productCount)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const bottomProducts = Object.values(productCount)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(-5)
        .reverse();

      // === CATEGORY PERFORMANCE ===
      const categoryData: Record<string, { revenue: number; bookings: number; count: number }> = {};
      confirmedBookings.forEach((booking) => {
        try {
          let products = booking.products_requested;
          if (typeof products === "string") {
            if (products.startsWith('"')) {
              products = JSON.parse(products);
            }
            if (typeof products === "string") {
              products = JSON.parse(products);
            }
          }
          if (Array.isArray(products)) {
            products.forEach((p: any) => {
              const product = productsData?.find((pr) => pr.id === p.id);
              const category = product?.category || "Övrigt";
              if (!categoryData[category]) {
                categoryData[category] = { revenue: 0, bookings: 0, count: 0 };
              }
              categoryData[category].revenue += (p.price || 0) * (p.quantity || 1);
              categoryData[category].count += 1;
              categoryData[category].bookings = 0;
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      const categoryPerformance = Object.entries(categoryData)
        .map(([category, data]) => ({
          category,
          revenue: Math.round(data.revenue),
          bookings: data.count,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // === CUSTOMER METRICS ===
      const totalCustomers = customersData.length;
      const repeatCustomers = customersData.filter((c) => (c.total_bookings || 0) > 1).length;
      const repeatCustomerRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      const newCustomersThisMonth = customersData.filter((c) => {
        const date = new Date(c.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      const lastMonthCustomers = customersData.filter((c) => {
        const date = new Date(c.created_at);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }).length;

      const activeCustomers = customersData.filter((c) => c.status === "active").length;
      const customerGrowth = lastMonthCustomers > 0 ? ((newCustomersThisMonth - (lastMonthCustomers - newCustomersThisMonth)) / lastMonthCustomers) * 100 : 0;

      // === BOOKING METRICS ===
      const statusCount: Record<string, number> = {};
      filteredBookings.forEach((b) => {
        statusCount[b.status] = (statusCount[b.status] || 0) + 1;
      });

      const bookingsByStatus = Object.entries(statusCount).map(([status, count]) => ({
        status:
          status === "draft"
            ? "Utkast"
            : status === "pending"
              ? "Väntande"
              : status === "confirmed"
                ? "Bekräftad"
                : status === "completed"
                  ? "Slutförd"
                  : "Avbruten",
        count,
      }));

      const bookingCancellationRate = filteredBookings.length > 0 ? ((statusCount["cancelled"] || 0) / filteredBookings.length) * 100 : 0;
      const completionRate = totalBookings > 0 ? ((confirmedBookings.filter((b) => b.status === "completed").length / confirmedBookings.length) * 100) : 0;

      // Average event duration
      const eventDurations = confirmedBookings
        .map((b) => {
          if (b.event_date && b.event_end_date) {
            const start = new Date(b.event_date);
            const end = new Date(b.event_end_date);
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }
          return 1;
        })
        .filter((d) => d > 0);

      const averageEventDuration = eventDurations.length > 0 ? Math.round(eventDurations.reduce((a, b) => a + b) / eventDurations.length) : 1;

      // === TOP CUSTOMERS ===
      const topCustomers = customersData
        .map((c) => ({
          name: c.name,
          revenue: c.total_revenue || 0,
          bookings: c.total_bookings || 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // === OPERATIONAL METRICS ===
      const pendingCount = bookingsData.filter((b) => b.status === "pending" || b.status === "draft").length;

      setKpiData({
        // Financial
        totalRevenue,
        totalBookings,
        averageOrderValue,
        medianOrderValue,

        // Growth
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        bookingGrowth: Math.round(bookingGrowth * 10) / 10,
        customerGrowth: Math.round(customerGrowth * 10) / 10,
        monthlyRevenue,
        weeklyRevenue,

        // Customers
        totalCustomers,
        activeCustomers,
        repeatCustomerRate: Math.round(repeatCustomerRate * 10) / 10,
        newCustomersThisMonth,

        // Products
        topProducts,
        bottomProducts,
        categoryPerformance,

        // Bookings
        bookingsByStatus,
        bookingCancellationRate: Math.round(bookingCancellationRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        averageEventDuration,

        // Customers
        topCustomers,

        // Operational
        pendingBookingsCount: pendingCount,
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    try {
      const element = document.getElementById("analytics-content");
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const currentDate = new Date().toLocaleDateString("sv-SE");
      pdf.save(`EventGaraget_Analyticsrapport_${currentDate}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Kunde inte generera PDF");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Laddar analytik...</div>;
  }

  if (!kpiData) {
    return <div className="flex items-center justify-center h-screen text-red-600">Kunde inte ladda analytikdata</div>;
  }

  const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">Verklig data från bokningssystemet</p>
          </div>
        </div>
        <button
          onClick={generatePDFReport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Download size={20} />
          Exportera som PDF
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4 bg-white rounded-lg p-4 border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Från datum</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Till datum</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="pt-6">
          <p className="text-xs text-gray-500">
            {startDate && endDate && `Visar data från ${new Date(startDate).toLocaleDateString('sv-SE')} till ${new Date(endDate).toLocaleDateString('sv-SE')}`}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white rounded-lg p-2 border border-gray-200">
        {[
          { id: "overview", label: "Översikt", icon: "📊" },
          { id: "products", label: "Produkter", icon: "📦" },
          { id: "customers", label: "Kunder", icon: "👥" },
          { id: "operational", label: "Drift", icon: "⚙️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Analytics Content */}
      <div id="analytics-content" className="space-y-8 bg-white p-8 rounded-lg">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Financial Overview - ONLY REAL KPIs */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Finansiell Överblick</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">Total Intäkt</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {kpiData.totalRevenue.toLocaleString("sv-SE")} SEK
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <p className="text-sm font-medium text-green-600">Totala Bokningar</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">{kpiData.totalBookings}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <p className="text-sm font-medium text-purple-600">Genomsnittligt Värde (AOV)</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {Math.round(kpiData.averageOrderValue).toLocaleString("sv-SE")} SEK
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 Nyckeltal</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Median Värde</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {Math.round(kpiData.medianOrderValue).toLocaleString("sv-SE")} SEK
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Totala Kunder</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{kpiData.totalCustomers}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Aktiva Kunder</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{kpiData.activeCustomers}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Återkommer</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{kpiData.repeatCustomerRate}%</p>
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Tillväxtmått (denna månad vs förra)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`rounded-lg p-4 border ${kpiData.revenueGrowth >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-xs font-medium ${kpiData.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Intäktstillväxt
                  </p>
                  <p className={`text-xl font-bold mt-1 ${kpiData.revenueGrowth >= 0 ? "text-green-900" : "text-red-900"}`}>
                    {kpiData.revenueGrowth > 0 ? "+" : ""}
                    {kpiData.revenueGrowth}%
                  </p>
                </div>
                <div className={`rounded-lg p-4 border ${kpiData.bookingGrowth >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-xs font-medium ${kpiData.bookingGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Bokningstillväxt
                  </p>
                  <p className={`text-xl font-bold mt-1 ${kpiData.bookingGrowth >= 0 ? "text-green-900" : "text-red-900"}`}>
                    {kpiData.bookingGrowth > 0 ? "+" : ""}
                    {kpiData.bookingGrowth}%
                  </p>
                </div>
                <div className={`rounded-lg p-4 border ${kpiData.customerGrowth >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-xs font-medium ${kpiData.customerGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Kundtillväxt
                  </p>
                  <p className={`text-xl font-bold mt-1 ${kpiData.customerGrowth >= 0 ? "text-green-900" : "text-red-900"}`}>
                    {kpiData.customerGrowth > 0 ? "+" : ""}
                    {kpiData.customerGrowth}%
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">📈 Månatlig Trend (senaste 12 månader)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={kpiData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => value.toLocaleString("sv-SE")} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#3B82F6" stroke="#3B82F6" name="Intäkt (SEK)" />
                  <Bar yAxisId="right" dataKey="bookings" fill="#10B981" name="Bokningar" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">📅 Veckovisa Intäkter</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={kpiData.weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toLocaleString("sv-SE")} SEK`} />
                  <Bar dataKey="revenue" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Booking Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Bokningsstatus</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={kpiData.bookingsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {kpiData.bookingsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Avbrytningsgrad</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpiData.bookingCancellationRate}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Slutförandegrad</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpiData.completionRate}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-600">Genomsnittlig Eventlängd</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpiData.averageEventDuration} dagar</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📦 Produktanalys</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">🏆 Topp 5 Produkter</h3>
                  <div className="space-y-3">
                    {kpiData.topProducts.map((product, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Sålda: {product.count} st</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{product.revenue.toLocaleString("sv-SE")} SEK</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Products */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">📉 Bottom 5 Produkter</h3>
                  <div className="space-y-3">
                    {kpiData.bottomProducts.map((product, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Sålda: {product.count} st</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-600">{product.revenue.toLocaleString("sv-SE")} SEK</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Performance */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">📊 Kategoriprestation</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={kpiData.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toLocaleString("sv-SE")} SEK`} />
                    <Bar dataKey="revenue" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category Table */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">Kategoriöversikt</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 px-3 font-semibold text-gray-700">Kategori</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Intäkt</th>
                      <th className="text-right py-2 px-3 font-semibold text-gray-700">Bokningar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.categoryPerformance.map((cat, idx) => (
                      <tr key={idx} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                        <td className="py-2 px-3">{cat.category}</td>
                        <td className="text-right py-2 px-3 font-semibold">{cat.revenue.toLocaleString("sv-SE")} SEK</td>
                        <td className="text-right py-2 px-3">{cat.bookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Kundanalys</h2>

              {/* Customer Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-600">Totala Kunder</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{kpiData.totalCustomers}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs font-medium text-green-600">Aktiva Kunder</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{kpiData.activeCustomers}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs font-medium text-purple-600">Nya denna månad</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{kpiData.newCustomersThisMonth}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs font-medium text-orange-600">Återkommer</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">{kpiData.repeatCustomerRate}%</p>
                </div>
              </div>

              {/* Top Customers */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">🏆 Topp 10 Kunder</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Namn</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Bokningar</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Totala Intäkt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiData.topCustomers.map((cust, idx) => (
                        <tr key={idx} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{cust.name}</td>
                          <td className="text-right py-2 px-3">{cust.bookings}</td>
                          <td className="text-right py-2 px-3 font-semibold text-green-600">
                            {cust.revenue.toLocaleString("sv-SE")} SEK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* OPERATIONAL TAB */}
        {activeTab === "operational" && (
          <>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⚙️ Driftanalys</h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-xs font-medium text-yellow-600">Väntande Bokningar</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">{kpiData.pendingBookingsCount}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-600">Slutförandegrad</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{kpiData.completionRate}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs font-medium text-green-600">Avbrytningsgrad</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{kpiData.bookingCancellationRate}%</p>
                </div>
              </div>

              {/* Operational Summary */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Driftöversikt</h3>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-700">Väntande Bokningar</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{kpiData.pendingBookingsCount}</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-700">Bokningsslutförandegrad</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{kpiData.completionRate}%</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-700">Avbrytningsgrad</td>
                      <td className="py-3 px-4 font-bold text-red-600">{kpiData.bookingCancellationRate}%</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-3 px-4 font-medium text-gray-700">Genomsnittlig Eventlängd</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{kpiData.averageEventDuration} dagar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Report Footer */}
        <div className="border-t pt-6 mt-8">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-sm font-semibold text-gray-700">EventGaraget Analytics Report</p>
            <p className="text-xs text-gray-500 mt-2">
              Rapport genererad: {new Date().toLocaleDateString("sv-SE")} kl {new Date().toLocaleTimeString("sv-SE")}
            </p>
            <p className="text-xs text-gray-400 mt-1">Baserat på faktiska bokningsdata från systemet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
