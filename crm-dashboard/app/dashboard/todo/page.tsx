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

const statusLabels = {
  pending: 'Väntande',
  in_progress: 'Pågåande',
  completed: 'Slutförd',
  cancelled: 'Avbruten',
  draft: 'Utkast',
};

export default function TODOPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    task_type: 'custom',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('booking_tasks')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role')
        .order('full_name');
      
      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'in_progress' : currentStatus === 'in_progress' ? 'completed' : 'pending';
      
      const { error } = await supabase
        .from('booking_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);
      
      if (error) throw error;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Är du säker?')) return;
    
    try {
      const { error } = await supabase.from('booking_tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('booking_tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
      setEditingTaskId(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTaskForm.title.trim()) {
      setMessage({ type: 'error', text: 'Titel är obligatorisk' });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('booking_tasks')
        .insert([{
          title: newTaskForm.title,
          description: newTaskForm.description,
          priority: newTaskForm.priority,
          task_type: newTaskForm.task_type,
          status: 'pending',
          assigned_to_user_ids: Array.from(selectedUserIds),
        }]);
      
      if (error) throw error;
      
      setShowNewTaskModal(false);
      setNewTaskForm({ title: '', description: '', priority: 'medium', task_type: 'custom' });
      setSelectedUserIds(new Set());
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    
    // Type filter - multi-select
    if (typeFilters.size > 0 && !typeFilters.has(t.task_type)) return false;
    
    return true;
  });
  
  // Count tasks by type for pending status
  const typeCounts: Record<string, number> = {};
  tasks
    .filter((t) => t.status === 'pending')
    .forEach((t) => {
      typeCounts[t.task_type] = (typeCounts[t.task_type] || 0) + 1;
    });
  
  const taskCounts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };
  
  const taskTypes = ['review', 'confirm', 'follow_up', 'response_needed', 'invoice', 'delivery', 'pickup', 'purchase', 'custom'];
  const typeLabels: Record<string, string> = {
    review: 'Granska',
    confirm: 'Bekräfta',
    follow_up: 'Följ upp',
    response_needed: 'Meddelanden',
    invoice: 'Fakturering',
    delivery: 'Leverans',
    pickup: 'Upphämtning',
    purchase: 'Inköp',
    custom: 'Annat',
  };

  if (loading) {
    return <div className="p-8 text-center">Laddar...</div>;
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Att Göra</h1>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Ny Uppgift
          </button>
        </div>

        {showNewTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Ny Uppgift</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <input
                  type="text"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  placeholder="Titel"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Beskrivning"
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <select
                  value={newTaskForm.priority}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="low">Låg</option>
                  <option value="medium">Medel</option>
                  <option value="high">Höh</option>
                  <option value="urgent">Brådskande</option>
                </select>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={newTaskForm.task_type}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, task_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="review">Granska</option>
                    <option value="confirm">Bekräfta</option>
                    <option value="follow_up">Följ upp</option>
                    <option value="response_needed">Meddelanden</option>
                    <option value="invoice">Fakturering</option>
                    <option value="delivery">Leverans</option>
                    <option value="pickup">Upphämtning</option>
                    <option value="purchase">Inköp</option>
                    <option value="custom">Annat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tilldela till anställda</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {users.map((user) => (
                      <label key={user.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={(e) => {
                            const newIds = new Set(selectedUserIds);
                            if (e.target.checked) {
                              newIds.add(user.id);
                            } else {
                              newIds.delete(user.id);
                            }
                            setSelectedUserIds(newIds);
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{user.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">
                  Skapa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTaskModal(false);
                    setSelectedUserIds(new Set());
                  }}
                  className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium"
                >
                  Avbryt
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${statusFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Alla
          </button>
          {['pending', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === status ? 'bg-purple-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {statusLabels[status as keyof typeof statusLabels]} ({taskCounts[status as keyof typeof taskCounts]})
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">Filtrera efter kategori:</p>
          <div className="flex gap-2 flex-wrap">
            {taskTypes.map((type) => {
              const count = typeCounts[type] || 0;
              const isSelected = typeFilters.has(type);
              
              return (
                <button
                  key={type}
                  onClick={() => {
                    const newFilters = new Set(typeFilters);
                    if (isSelected) {
                      newFilters.delete(type);
                    } else {
                      newFilters.add(type);
                    }
                    setTypeFilters(newFilters);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {typeLabels[type]}
                  {count > 0 && (
                    <span className={`${isSelected ? 'bg-purple-400' : 'bg-gray-300'} px-2 py-0.5 rounded-full text-xs font-bold`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Inga uppgifter
            </div>
          ) : (
            filteredTasks.map((task) => {
              const colors = priorityColors[task.priority];
              return (
                <div key={task.id} className={`${colors.bg} border-2 ${colors.border} rounded-lg p-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{task.title}</h3>
                      {task.description && <p className="text-sm text-gray-700 mt-1">{task.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleStatus(task.id, task.status)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        {statusLabels[task.status]}
                      </button>
                      <button
                        onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Redigera
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Ta bort
                      </button>
                    </div>
                  </div>
                  
                  {editingTaskId === task.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <input
                        type="text"
                        defaultValue={task.title}
                        onChange={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                      <select
                        defaultValue={task.priority}
                        onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded text-sm"
                      >
                        <option value="low">Låg</option>
                        <option value="medium">Medel</option>
                        <option value="high">Höh</option>
                        <option value="urgent">Brådskande</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
