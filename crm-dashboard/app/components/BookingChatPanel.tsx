'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, MessageCircle, X, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  booking_id: string;
  sender_id?: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export default function BookingChatPanel({ bookingId }: { bookingId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from('booking_comments')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (data) {
          setMessages(data);
          // Count unread (customer messages)
          const unread = data.filter((m) => m.sender_type === 'customer').length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`admin-chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_comments',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_type === 'customer') {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [bookingId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('booking_comments')
        .insert([
          {
            booking_id: bookingId,
            sender_type: 'admin',
            sender_name: 'EventGaraget Admin',
            message: newMessage.trim(),
          },
        ]);

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Kunde inte skicka meddelandet.');
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => {
          setExpanded(true);
          setUnreadCount(0);
        }}
        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold relative"
      >
        <MessageSquare size={18} />
        💬 Chat
        {unreadCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare size={18} />
          Kundenanmärkningar
        </h3>
        <button
          onClick={() => {
            setExpanded(false);
            setUnreadCount(0);
          }}
          className="hover:bg-blue-700 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-gray-500">
              <p className="font-semibold mb-2">Inga meddelanden ännu</p>
              <p className="text-sm">Kunden kan ställa frågor här</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.sender_type === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-xs font-semibold opacity-75 mb-1">
                  {msg.sender_name === 'EventGaraget Admin' ? 'Ni' : msg.sender_name}
                </p>
                <p className="break-words">{msg.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString('sv-SE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="flex gap-2 p-3 border-t bg-white"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv svar..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? '...' : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
