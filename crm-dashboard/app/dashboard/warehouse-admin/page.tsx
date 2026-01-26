'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Truck, MapPin, Calendar, AlertCircle, CheckCircle2, X, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WarehouseTask {
  id: string;
  booking_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  due_date: string;
  booking_number: string;
  location: string;
  event_date: string;
  assigned_to_name: string;
  assigned_to_user_id?: string;
  assigned_to_user_ids?: string[]; // Array for multiple assignees
  customer_name: string;
  task_type: string;
  delivery_type?: string; // "internal" or "external"
}

interface WarehouseUser {
  id: string;
  full_name: string;
}

interface BookingDetail {
  id: string;
  products_requested: any[];
}

interface BookingNote {
  id: string;
  booking_id: string;
  note: string;
  created_by_name: string;
  created_at: string;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function WarehouseAdminPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<WarehouseTask[]>([]);
  const [warehouseUsers, setWarehouseUsers] = useState<WarehouseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [bookingDetails, setBookingDetails] = useState<Map<string, BookingDetail>>(new Map());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookingNotes, setBookingNotes] = useState<Map<string, BookingNote[]>>(new Map());
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assigned_to_user_id: '',
    due_date: '',
    task_category: 'other' as 'pickup' | 'delivery' | 'custom' | 'other',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch warehouse tasks from booking_tasks
      const { data: tasksData } = await supabase
        .from('booking_tasks')
        .select('id, booking_id, title, description, priority, status, due_date, assigned_to_name, assigned_to_user_id, task_type')
        .in('task_type', ['pickup', 'delivery', 'custom', 'invoice'])
        .order('due_date', { ascending: true, nullsFirst: false });

      // Fetch bookings for pickup/delivery operations
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, booking_number, location, event_date, pickup_date, delivery_date, products_requested, customer_id, delivery_type, status')
        .order('event_date', { ascending: true });

      // Fetch customer names
      const customerIds = bookingsData?.map(b => b.customer_id).filter(Boolean) || [];
      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds);

      const customerMap = new Map(customersData?.map(c => [c.id, c.name]) || []);
      const bookingMap = new Map(bookingsData?.map(b => [b.id, b]) || []);

      // Enrich booking_tasks
      const enrichedTasks = tasksData?.map(t => {
        const booking = bookingMap.get(t.booking_id);
        return {
          ...t,
          booking_number: booking?.booking_number || 'N/A',
          location: booking?.location || 'N/A',
          event_date: booking?.event_date || 'N/A',
          customer_name: customerMap.get(booking?.customer_id) || 'Okänd kund',
          delivery_type: booking?.delivery_type,
        };
      }) || [];

      // Add pickup/delivery operations from bookings
      const bookingPickupDeliveryTasks: WarehouseTask[] = bookingsData?.flatMap(booking => {
        const tasks: WarehouseTask[] = [];

        // Add pickup task if booking has pickup_date
        if (booking.pickup_date) {
          tasks.push({
            id: `${booking.id}-pickup`,
            booking_id: booking.id,
            title: `📦 Upphämtning: ${booking.booking_number}`,
            description: `Upphämtning från ${booking.location || 'N/A'}`,
            priority: 'medium',
            status: booking.status === 'completed' ? 'completed' : 'pending',
            due_date: booking.pickup_date,
            booking_number: booking.booking_number,
            location: booking.location || 'N/A',
            event_date: booking.event_date,
            assigned_to_name: '',
            assigned_to_user_id: undefined,
            customer_name: customerMap.get(booking.customer_id) || 'Okänd kund',
            task_type: 'pickup',
            delivery_type: booking.delivery_type,
          });
        }

        // Add delivery task if booking has delivery_date
        if (booking.delivery_date) {
          tasks.push({
            id: `${booking.id}-delivery`,
            booking_id: booking.id,
            title: `🚚 Leverans: ${booking.booking_number}`,
            description: `Leverans till ${booking.location || 'N/A'}`,
            priority: 'medium',
            status: booking.status === 'completed' ? 'completed' : 'pending',
            due_date: booking.delivery_date,
            booking_number: booking.booking_number,
            location: booking.location || 'N/A',
            event_date: booking.event_date,
            assigned_to_name: '',
            assigned_to_user_id: undefined,
            customer_name: customerMap.get(booking.customer_id) || 'Okänd kund',
            task_type: 'delivery',
            delivery_type: booking.delivery_type,
          });
        }

        return tasks;
      }) || [];

      // Combine all tasks
      const allTasks = [...enrichedTasks, ...bookingPickupDeliveryTasks];
      
      setTasks(allTasks as WarehouseTask[]);
      setBookingDetails(bookingMap);

      // Fetch booking notes for all bookings
      const bookingIds = [...new Set(bookingsData?.map(b => b.id) || [])];
      const { data: notesData } = await supabase
        .from('booking_notes')
        .select('*')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      if (notesData) {
        const notesMap = new Map<string, BookingNote[]>();
        notesData.forEach(note => {
          if (!notesMap.has(note.booking_id)) {
            notesMap.set(note.booking_id, []);
          }
          notesMap.get(note.booking_id)!.push(note);
        });
        setBookingNotes(notesMap);
      }

      // Fetch warehouse users
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'warehouse')
        .order('full_name', { ascending: true });

      if (usersData) {
        setWarehouseUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Kunde inte ladda data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (taskId: string, userIds: string[]) => {
    if (!userIds || userIds.length === 0) {
      setMessage({ type: 'error', text: 'Välj minst en anställd' });
      return;
    }

    try {
      // Get names of selected users
      const selectedUsers = warehouseUsers.filter(u => userIds.includes(u.id));
      const assignedNames = selectedUsers.map(u => u.full_name).join(', ');

      const { error } = await supabase
        .from('booking_tasks')
        .update({
          assigned_to_user_ids: userIds,
          assigned_to_name: assignedNames,
        })
        .eq('id', taskId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Uppgift tilldelad ${selectedUsers.length} anställd${selectedUsers.length > 1 ? 'a' : ''}!` });
      setAssigningTaskId(null);
      setSelectedUserIds(new Set());
      setSelectedUserId('');
      fetchData();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error assigning task:', error);
      setMessage({ type: 'error', text: 'Kunde inte tilldela uppgift' });
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus =
        currentStatus === 'pending'
          ? 'in_progress'
          : currentStatus === 'in_progress'
            ? 'completed'
            : 'pending';

      // Get the task to check its type and booking_id
      const task = tasks.find(t => t.id === taskId);
      
      const { error } = await supabase
        .from('booking_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      // If this is a pickup or delivery task being marked as completed,
      // also update the booking status to "completed" to trigger invoice creation
      if (newStatus === 'completed' && task && (task.task_type === 'pickup' || task.task_type === 'delivery') && task.booking_id) {
        try {
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', task.booking_id);
          
          if (bookingError) {
            console.warn('Warning: Could not update booking status:', bookingError);
          } else {
            console.log('✅ Booking marked as completed, invoice task should be created by trigger');
          }
        } catch (err) {
          console.warn('Error updating booking status:', err);
        }
      }

      setMessage({ type: 'success', text: `Status ändrad till ${newStatus === 'pending' ? 'väntande' : newStatus === 'in_progress' ? 'pågåande' : 'slutförd'}` });
      fetchData();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error toggling task status:', error);
      setMessage({ type: 'error', text: 'Kunde inte uppdatera status' });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskForm.title || !newTaskForm.assigned_to_user_id) {
      setMessage({ type: 'error', text: 'Titel och anställd är obligatoriska' });
      return;
    }

    try {
      const selectedUser = warehouseUsers.find(u => u.id === newTaskForm.assigned_to_user_id);
      
      const { error } = await supabase
        .from('booking_tasks')
        .insert([{
          booking_id: null, // Ingen bokning länkad
          title: newTaskForm.title,
          description: newTaskForm.description,
          priority: newTaskForm.priority,
          status: 'pending',
          task_type: newTaskForm.task_category,
          assigned_to_user_id: newTaskForm.assigned_to_user_id,
          assigned_to_name: selectedUser?.full_name,
          due_date: newTaskForm.due_date || null,
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Uppgift skapad och tilldelad!' });
      setNewTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to_user_id: '',
        due_date: '',
        task_category: 'custom',
      });
      setShowCreateForm(false);
      fetchData();
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      console.error('Error creating task:', error);
      setMessage({ type: 'error', text: 'Kunde inte skapa uppgift' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter tasks based on date range, status, and user assignment
  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    // Filter by assigned user
    if (userFilter !== 'all' && task.assigned_to_user_id !== userFilter) {
      return false;
    }

    // For booking-related tasks (pickup/delivery), use event_date
    const dateToCheck = task.event_date || task.due_date;
    
    if (!dateToCheck) return false; // Skip if no date
    
    const taskDate = new Date(dateToCheck);
    
    // Apply date filters ONLY if they are set
    if (startDate) {
      const start = new Date(startDate);
      if (taskDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (taskDate > end) return false;
    }
    return true;
  });

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleTodayClick = () => {
    const today = getTodayDate();
    setStartDate(today);
    setEndDate(today);
  };

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
              <h1 className="text-3xl font-bold text-gray-900">📦 Lager Administration</h1>
              <p className="text-gray-600 mt-1">Fördela körningar och uppgifter till lagerarbetare</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Create Task Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
          >
            <Plus size={18} />
            {showCreateForm ? 'Avbryt' : 'Lägg till Uppgift'}
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateTask} className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
                  placeholder="T.ex. Rengöring av lager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Beskrivning</label>
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
                  placeholder="Beskrivning av uppgiften (valfritt)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori *</label>
                  <select
                    value={newTaskForm.task_category}
                    onChange={(e) => setNewTaskForm({...newTaskForm, task_category: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pickup">📦 Upphämtning</option>
                    <option value="delivery">🚚 Leverans</option>
                    <option value="custom">📝 Lagerupgift</option>
                    <option value="other">🔧 Övrig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prioritet</label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({...newTaskForm, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">🔵 Låg</option>
                    <option value="medium">🟡 Medel</option>
                    <option value="high">🟠 Hög</option>
                    <option value="urgent">🔴 Brådskande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tilldela till *</label>
                  <select
                    value={newTaskForm.assigned_to_user_id}
                    onChange={(e) => setNewTaskForm({...newTaskForm, assigned_to_user_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Välj anställd --</option>
                    {warehouseUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Förfallodatum</label>
                  <input
                    type="date"
                    value={newTaskForm.due_date}
                    onChange={(e) => setNewTaskForm({...newTaskForm, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
              >
                Skapa Uppgift
              </button>
            </form>
          )}
        </div>

        {/* Date Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Från Datum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Till Datum</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleTodayClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
            >
              📅 Idag
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold flex items-center gap-2 transition"
              >
                <X size={18} />
                Rensa Filter
              </button>
            )}
          </div>
        </div>

        {/* Status & User Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Status Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrera efter Status</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Alla' },
                { value: 'pending', label: '⏳ Väntande' },
                { value: 'in_progress', label: '⚡ Pågåande' },
                { value: 'completed', label: '✅ Slutförda' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Filter */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filtrera efter Anställd</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alla anställda</option>
              <option value="">Ej tilldelade</option>
              {warehouseUsers.map(user => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Totala Uppgifter</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{filteredTasks.length}</p>
            {(startDate || endDate) && <p className="text-xs text-gray-500 mt-1">{tasks.length} totalt</p>}
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Brådskande</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {filteredTasks.filter(t => t.priority === 'urgent').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Lagerarbetare</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{warehouseUsers.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 font-semibold">Ej Tilldelade</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {filteredTasks.filter(t => !t.assigned_to_user_id).length}
            </p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <Truck size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-semibold">
                {tasks.length === 0 ? 'Inga uppgifter' : 'Inga uppgifter för valda datum'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-lg border-2 p-4 transition ${
                  task.priority === 'urgent' ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  {/* Info */}
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{task.title}</h3>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {task.task_type === 'pickup' ? '📦 Upphämtning' :
                         task.task_type === 'delivery' ? (task.delivery_type === 'internal' ? '🏢 Intern leverans' : '🚚 Extern leverans') :
                         task.task_type === 'custom' ? '📝 Uppgift' : task.task_type}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>📌 {task.booking_number}</span>
                      <span>👤 {task.customer_name}</span>
                    </div>
                    
                    {/* Products */}
                    {bookingDetails.get(task.booking_id)?.products_requested && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Produkter:</p>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {(() => {
                            let products: any[] = [];
                            const productsData = bookingDetails.get(task.booking_id)?.products_requested;
                            try {
                              if (typeof productsData === 'string') {
                                products = JSON.parse(productsData);
                              } else if (Array.isArray(productsData)) {
                                products = productsData;
                              }
                            } catch (e) {
                              console.error('Error parsing products:', e);
                            }

                            return (
                              <div>
                                {products.map((p: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span>•</span>
                                    <span>{p.name}</span>
                                    {p.quantity && <span className="text-gray-500">(x{p.quantity})</span>}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand Notes Button */}
                  <div className="md:col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-semibold hover:bg-gray-200"
                    >
                      {expandedTaskId === task.id ? '▼ Anteckningar' : '▶ Anteckningar'}
                    </button>
                  </div>
                </div>

                {/* Expanded Notes Section */}
                {expandedTaskId === task.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">📝 Anteckningar:</p>
                    {bookingNotes.get(task.booking_id)?.length === 0 ? (
                      <p className="text-xs text-gray-500">Inga anteckningar</p>
                    ) : (
                      <div className="space-y-2">
                        {bookingNotes.get(task.booking_id)?.map((note) => (
                          <div key={note.id} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-semibold text-gray-600">{note.created_by_name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleDateString('sv-SE')} kl {new Date(note.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <p className="text-xs text-gray-700 whitespace-pre-wrap">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Location & Date */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mt-4">
                  <div className="md:col-span-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin size={14} />
                      {task.location}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 mt-1">
                      <Calendar size={14} />
                      {new Date(task.event_date).toLocaleDateString('sv-SE')}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="md:col-span-1">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${priorityColors[task.priority]}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <button
                      onClick={() => handleToggleTaskStatus(task.id, task.status)}
                      className={`w-full px-3 py-1 rounded text-xs font-semibold text-white transition ${
                        task.status === 'pending' ? 'bg-red-500 hover:bg-red-600' :
                        task.status === 'in_progress' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {task.status === 'pending' ? '⏳ Väntande' :
                       task.status === 'in_progress' ? '⚡ Pågåande' :
                       '✅ Slutförd'}
                    </button>
                  </div>

                  {/* Assignment */}
                  <div className="md:col-span-1">
                    {assigningTaskId === task.id ? (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Tilldela till (välj flera):</div>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50">
                          {warehouseUsers.map(u => (
                            <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(u.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedUserIds);
                                  if (e.target.checked) {
                                    newSet.add(u.id);
                                  } else {
                                    newSet.delete(u.id);
                                  }
                                  setSelectedUserIds(newSet);
                                }}
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                              />
                              <span className="text-sm">{u.full_name}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleAssignTask(task.id, Array.from(selectedUserIds))}
                            className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
                          >
                            ✓ OK
                          </button>
                          <button
                            onClick={() => {
                              setAssigningTaskId(null);
                              setSelectedUserIds(new Set());
                            }}
                            className="flex-1 px-3 py-1 bg-gray-400 text-white rounded text-sm font-semibold hover:bg-gray-500"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigningTaskId(task.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 w-full"
                      >
                        {task.assigned_to_name || 'Tilldela'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
