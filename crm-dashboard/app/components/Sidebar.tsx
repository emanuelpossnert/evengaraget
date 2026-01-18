"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  Package,
  HelpCircle,
  BarChart3,
  UserPlus,
  Truck,
  CheckSquare,
  Printer,
} from "lucide-react";

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchBadgeCounts();
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      const counts: { [key: string]: number } = {};

      // Antal "Att Göra" (pending tasks)
      const { data: tasksData } = await supabase
        .from("booking_tasks")
        .select("id")
        .eq("status", "pending");
      counts.todo = tasksData?.length || 0;

      // Antal "Bokningar" (granska/draft status)
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "pending");
      counts.bookings = bookingsData?.length || 0;

      // Antal "Foliering" (confirmed with wrapping - för printer)
      const { data: printerData } = await supabase
        .from("printer_foiling_orders")
        .select("id");
      counts.printer = printerData?.length || 0;

      // Antal "Bokningar väntande bilder" (för lager)
      const { data: warehouseData } = await supabase
        .from("booking_tasks")
        .select("id")
        .neq("status", "completed");
      counts.warehouse = warehouseData?.length || 0;

      setBadges(counts);
    } catch (error) {
      console.error("Error fetching badge counts:", error);
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: ["admin", "manager"],
    },
    {
      name: "Kunder",
      icon: Users,
      href: "/dashboard/customers",
      roles: ["admin", "manager", "support"],
    },
    {
      name: "Bokningar",
      icon: ShoppingCart,
      href: "/dashboard/bookings",
      roles: ["admin", "manager"],
    },
    {
      name: "Att Göra",
      icon: CheckSquare,
      href: "/dashboard/todo",
      roles: ["admin", "manager"],
    },
    {
      name: "Kalender",
      icon: Calendar,
      href: "/dashboard/calendar",
      roles: ["admin", "manager", "warehouse"],
    },
    {
      name: "Lager",
      icon: Truck,
      href: "/dashboard/warehouse",
      roles: ["warehouse"],
    },
    {
      name: "Lager Admin",
      icon: Truck,
      href: "/dashboard/warehouse-admin",
      roles: ["admin"],
    },
    {
      name: "Tryckeri",
      icon: Printer,
      href: "/dashboard/printer",
      roles: ["admin", "printer"],
    },
    {
      name: "Produkter & Prislista",
      icon: Package,
      href: "/dashboard/products",
      roles: ["admin", "manager"],
    },
    {
      name: "FAQ",
      icon: HelpCircle,
      href: "/dashboard/faq",
      roles: ["admin", "manager"],
    },
    {
      name: "Tillägg",
      icon: Package,
      href: "/dashboard/addons",
      roles: ["admin", "manager"],
    },
    {
      name: "Aktivitetslogg",
      icon: FileText,
      href: "/dashboard/activity-log",
      roles: ["admin"],
    },
    {
      name: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      roles: ["admin"],
    },
    {
      name: "Användare",
      icon: UserPlus,
      href: "/dashboard/users",
      roles: ["admin"],
    },
    {
      name: "Inställningar",
      icon: Settings,
      href: "/dashboard/settings",
      roles: ["admin"],
    },
  ];

  const availableItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="EventGaraget" className="h-18" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {availableItems.map((item) => {
          const Icon = item.icon;
          // Exact match for /dashboard, but startsWith for other items
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          
          // Get badge count based on href
          let badgeCount = 0;
          if (item.href === "/dashboard/todo") badgeCount = badges.todo || 0;
          if (item.href === "/dashboard/bookings") badgeCount = badges.bookings || 0;
          if (item.href === "/dashboard/printer") badgeCount = badges.printer || 0;
          if (item.href === "/dashboard/warehouse") badgeCount = badges.warehouse || 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors justify-between ${
                isActive
                  ? "bg-red-50 text-red-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
              {badgeCount > 0 && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-max">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="px-4 py-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            Rolle: {user.role}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm">Logga ut</span>
        </button>
      </div>
    </aside>
  );
}

