'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, MessageCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  booking_id: string;
  sender_id?: string;
  sender_type: 'customer' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export default function BookingChat({ bookingId, customerEmail }: { bookingId: string; customerEmail: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch and subscribe to messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_comments')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`chat:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_comments',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
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
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);

      const { error } = await supabase
        .from('booking_comments')
        .insert([
          {
            booking_id: bookingId,
            sender_type: 'customer',
            sender_name: customerEmail,
            message: newMessage.trim(),
          },
        ]);

      if (error) throw error;

      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Kunde inte skicka meddelandet. Försök igen senare.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-1">
          <MessageCircle className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-900">💬 Frågor & Svar</h3>
        </div>
        <p className="text-sm text-gray-600">
          Ställ frågor om din bokning - vi svarar så snart som möjligt
        </p>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 font-semibold mb-2">Inga meddelanden ännu</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Ställ en fråga här så svarar vi snarast. Vi är här för att hjälpa!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isCustomer = msg.sender_type === 'customer';
              return (
                <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-4 py-3 rounded-xl ${
                      isCustomer
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-75 mb-1">
                      {isCustomer ? 'Du' : 'EventGaraget'}
                    </p>
                    <p className="break-words text-sm leading-relaxed">{msg.message}</p>
                    <p className={`text-xs mt-2 ${isCustomer ? 'opacity-70' : 'opacity-60'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 bg-gray-50 p-4 flex gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv din fråga här..."
          className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          disabled={sending}
          maxLength={500}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2 font-semibold"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="hidden sm:inline">Skickar...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span className="hidden sm:inline">Skicka</span>
            </>
          )}
        </button>
      </form>

      {/* Character Counter */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-right">
        <span className="text-xs text-gray-500">{newMessage.length}/500</span>
      </div>
    </div>
  );
}
