'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Task, UserProfile } from '@/lib/types';
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
  User as UserIcon,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    task_type: 'custom',
    start_date: '',
    end_date: '',
    assigned_to_user_id: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskForm.title.trim()) {
      setMessage({ type: 'error', text: 'Titel är obligatorisk' });
      return;
    }

    try {
      const selectedUser = newTaskForm.assigned_to_user_id 
        ? users.find(u => u.id === newTaskForm.assigned_to_user_id)
        : null;

      const { error } = await supabase
        .from('booking_tasks')
        .insert([{
          booking_id: null,
          title: newTaskForm.title,
          description: newTaskForm.description,
          priority: newTaskForm.priority,
          status: 'pending',
          task_type: newTaskForm.task_type,
          due_date: newTaskForm.start_date || null,
          start_date: newTaskForm.start_date || null,
          end_date: newTaskForm.end_date || newTaskForm.start_date || null,
          assigned_to_user_id: newTaskForm.assigned_to_user_id || null,
          assigned_to_name: selectedUser?.full_name || null,
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Uppgift skapad!' });
      setShowNewTaskModal(false);
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        task_type: 'custom',
        start_date: '',
        end_date: '',
        assigned_to_user_id: '',
      });
      fetchTasks();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setMessage({ type: 'error', text: 'Kunde inte skapa uppgift' });
    }
  };

  const filteredTasks = 
    (filter === 'all' ? tasks : tasks.filter((t) => t.status === filter))
    .filter((t) => taskTypeFilter === 'all' || t.task_type === taskTypeFilter)
    .filter((t) => {
      // Filter by date range
      if (!startDate && !endDate) return true;
      
      const taskDate = t.due_date || t.start_date;
      if (!taskDate) return false;
      
      if (startDate && new Date(taskDate) < new Date(startDate)) return false;
      if (endDate && new Date(taskDate) > new Date(endDate)) return false;
      
      return true;
    });

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
      {/* Message Alert */}
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ny Uppgift</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  placeholder="Vad ska göras?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivning</label>
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  placeholder="Mer information (valfritt)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                <select
                  value={newTaskForm.task_type}
                  onChange={(e) => setNewTaskForm({...newTaskForm, task_type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="custom">📋 Uppgift</option>
                  <option value="internal">🏢 Internal</option>
                  <option value="foliering">✨ Foliering</option>
                  <option value="external_shipping">📮 Extern Frakt</option>
                  <option value="customer_pickup">👤 Customer Pickup</option>
                  <option value="booked">✅ Bokat</option>
                  <option value="inquiry">❓ Förfrågan</option>
                  <option value="review">👀 Granska</option>
                  <option value="confirm">✔️ Bekräfta</option>
                  <option value="follow_up">📞 Följ upp</option>
                  <option value="response_needed">💬 Meddelande</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioritet</label>
                <select
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value as any})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="low">🔵 Låg</option>
                  <option value="medium">🟡 Medel</option>
                  <option value="high">🟠 Hög</option>
                  <option value="urgent">🔴 Brådskande</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start-datum</label>
                <input
                  type="date"
                  value={newTaskForm.start_date}
                  onChange={(e) => setNewTaskForm({...newTaskForm, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slut-datum (valfritt)</label>
                <input
                  type="date"
                  value={newTaskForm.end_date}
                  onChange={(e) => setNewTaskForm({...newTaskForm, end_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tilldela till (valfritt)</label>
                <select
                  value={newTaskForm.assigned_to_user_id}
                  onChange={(e) => setNewTaskForm({...newTaskForm, assigned_to_user_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Ingen tilldelning --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  Skapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        {/* Date Filter */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Från Datum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Till Datum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition"
                >
                  Rensa Datumfilter
                </button>
              </div>
            )}
          </div>
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
