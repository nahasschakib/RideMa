"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, Send } from "lucide-react";

interface Message {
  _id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

interface Conversation {
  userId: string;
  user: { name: string; email: string; mobileNumber?: string } | null;
  lastMessage: string;
  lastSender: string;
  lastAt: string;
  unread: number;
}

export default function SupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/support/${userId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Poll toutes les 5s
    pollRef.current = setInterval(fetchConversations, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetchMessages(selected.userId);
    const interval = setInterval(() => fetchMessages(selected.userId), 3000);
    return () => clearInterval(interval);
  }, [selected]);

  const handleSelect = (conv: Conversation) => {
    setSelected(conv);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!text.trim() || !selected || sending) return;
    try {
      setSending(true);
      const res = await fetch(`/api/admin/support/${selected.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, data]);
        setText('');
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Navbar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b z-40">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo1.png" alt="logo" width={50} height={50} priority />
            <span className="font-bold text-lg">MaRide Admin</span>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black text-white">
            <MessageCircle size={14} />
            Support Chat
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">

          {/* Liste conversations */}
          <div className="col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-800 text-gray-900">Conversations</h2>
              <p className="text-xs text-gray-400 mt-0.5">{conversations.length} utilisateur(s)</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageCircle className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">Aucune conversation</p>
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelect(conv)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.userId === conv.userId ? 'bg-orange-50 border-l-2 border-l-orange-400' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 font-700 text-sm">
                        {conv.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-700 text-sm text-gray-900 truncate">
                          {conv.user?.name ?? 'Utilisateur'}
                        </span>
                        {conv.unread > 0 && (
                          <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {conv.lastSender === 'admin' ? '✓ ' : ''}{conv.lastMessage}
                      </p>
                      <p className="text-xs text-gray-300 mt-0.5">{formatTime(conv.lastAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Zone messages */}
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="mx-auto mb-3 opacity-30" size={48} />
                  <p>Sélectionnez une conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header conversation */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-700">
                      {selected.user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-800 text-gray-900">{selected.user?.name}</div>
                    <div className="text-xs text-gray-400">{selected.user?.email} — {selected.user?.mobileNumber ?? '—'}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 text-sm">Aucun message</div>
                  ) : messages.map(msg => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isAdmin ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isAdmin ? 'text-orange-200' : 'text-gray-400'} text-right`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 flex gap-3">
                  <input
                    type="text"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Votre réponse..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="bg-orange-500 text-white px-5 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors flex items-center gap-2"
                  >
                    <Send size={16} />
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}