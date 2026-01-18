'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  Filter,
  Calendar,
  Flag,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Task {
  id: string;
  booking_id: string;
  task_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to_name?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface BookingInfo {
  id: string;
  booking_number: string;
  customer_id: string;
  location?: string;
}

const priorityColors = {
  low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100' },
  urgent: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' },
};

const statusIcons = {
  pending: <Clock size={16} />,
  in_progress: <AlertCircle size={16} />,
  completed: <CheckCircle2 size={16} />,
  cancelled: <X size={16} />,
};

const statusLabels = {
  pending: 'Väntande',
  in_progress: 'Pågåande',
  completed: 'Slutförd',
  cancelled: 'Avbruten',
};

export default function TODOPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bookings, setBookings] = useState<Map<string, BookingInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('booking_tasks')
        .select('*')
        .order('due_date', { ascending: true })
        .order('priority', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch booking info for all tasks
      const bookingIds = Array.from(new Set((tasksData || []).map((t) => t.booking_id)));
      if (bookingIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, booking_number, customer_id, location')
          .in('id', bookingIds);

        const bookingMap = new Map();
        (bookingsData || []).forEach((b) => {
          bookingMap.set(b.id, b);
        });
        setBookings(bookingMap);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === 'pending'
          ? 'in_progress'
          : currentStatus === 'in_progress'
            ? 'completed'
            : 'pending';

      const { error } = await supabase
        .from('booking_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna task?')) return;

    try {
      const { error } = await supabase.from('booking_tasks').delete().eq('id', taskId);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = 
    (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter))
    .filter((t) => taskTypeFilter === 'all' || t.task_type === taskTypeFilter);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    urgent: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length,
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 Att Göra</h1>
              <p className="text-gray-600 mt-1">Hantera alla bokningsrelaterade uppgifter</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={20} />
            Ny Uppgift
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Totalt', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'Väntande', value: stats.pending, color: 'bg-blue-100 text-blue-700' },
            { label: 'Pågåande', value: stats.inProgress, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Slutförda', value: stats.completed, color: 'bg-green-100 text-green-700' },
            { label: 'Brådskande', value: stats.urgent, color: 'bg-red-100 text-red-700' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${stat.color} rounded-lg p-4 text-center border-2 border-opacity-20`}
            >
              <p className="text-sm font-semibold opacity-75">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: '🔍 Alla' },
            { key: 'pending', label: '⏳ Väntande' },
            { key: 'in_progress', label: '⚡ Pågåande' },
            { key: 'completed', label: '✅ Slutförda' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task Type Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-600 w-full">Filtrera efter typ:</p>
          {[
            { key: 'all', label: 'Alla typer' },
            { key: 'review', label: '👀 Granska' },
            { key: 'confirm', label: '✔️ Bekräfta' },
            { key: 'follow_up', label: '📞 Följ upp' },
            { key: 'response_needed', label: '💬 Meddelanden' },
            { key: 'custom', label: '📋 Annat' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => {
                if (taskTypeFilter === f.key) {
                  setTaskTypeFilter('all');
                } else {
                  setTaskTypeFilter(f.key);
                }
              }}
              className={`px-3 py-1 rounded text-sm transition ${
                taskTypeFilter === f.key || (taskTypeFilter === 'all' && f.key === 'all')
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-500 font-semibold">Inga uppgifter i denna kategori</p>
              <p className="text-gray-400 text-sm mt-1">Alla uppgifter är under kontroll! 🎉</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const booking = bookings.get(task.booking_id);
              const colors = priorityColors[task.priority];

              return (
                <div
                  key={task.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4 transition hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Toggle */}
                    <button
                      onClick={() => handleToggleStatus(task.id, task.status)}
                      className="flex-shrink-0 mt-1 p-1 hover:bg-gray-200 hover:bg-opacity-50 rounded"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 size={24} className="text-green-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className={`font-bold text-lg ${
                            task.status === 'completed'
                              ? 'text-gray-500 line-through'
                              : colors.text
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span
                          className={`${colors.badge} ${colors.text} px-2 py-1 rounded text-xs font-semibold flex items-center gap-1`}
                        >
                          <Flag size={12} />
                          {task.priority.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-600 bg-white bg-opacity-60 px-2 py-1 rounded">
                          {statusLabels[task.status]}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-gray-700 text-sm mb-3">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        {booking && (
                          <a
                            href={`/dashboard/bookings/${task.booking_id}`}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                          >
                            📌 {booking.booking_number}
                          </a>
                        )}

                        {task.due_date && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar size={14} />
                            {new Date(task.due_date).toLocaleDateString('sv-SE')}
                          </div>
                        )}

                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <User size={14} />
                            {task.assigned_to_name}
                          </div>
                        )}

                        {task.task_type && (
                          <div className="text-gray-600 bg-white bg-opacity-50 px-2 py-0.5 rounded text-xs">
                            {task.task_type}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
