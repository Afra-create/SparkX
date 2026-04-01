import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Calendar, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [showMeetupForm, setShowMeetupForm] = useState(false);
  const [meetupForm, setMeetupForm] = useState({ date: '', time: '', location: 'Main Entrance' });
  const [sendingMeetup, setSendingMeetup] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket Connection
  useEffect(() => {
    if (!user) {
      toast.error('Please login to view chats');
      navigate('/');
      return;
    }
    
    fetchChats();

    const socket = io(SOCKET_URL, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setSocketStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
       console.error('Socket error:', err);
       setSocketStatus('disconnected');
    });

    socket.on('receiveMessage', (msg) => {
      // Functional state update safely reads the latest messages array
      setMessages(prev => {
        // Only append if this message belongs to the currently active conversation
        const path = window.location.pathname;
        if (path.includes(msg.senderId) || path.includes(msg.receiverId)) {
           return [...prev, msg];
        }
        return prev;
      });
      // Optionally show a toast if they receive a message from someone else
      const path = window.location.pathname;
      if (msg.senderId !== user.id && !path.includes(msg.senderId)) {
        toast('New message received!', { icon: '💬' });
      }
    });

    return () => { socket.disconnect(); };
  }, [user]);

  // Helper: get display name from a user object
  function displayName(u: any): string {
    if (!u) return 'Unknown';
    if (u.name && u.name !== 'User') return u.name;
    // Fall back to email prefix
    if (u.email) return u.email.split('@')[0];
    return 'Campus User';
  }

  // Handle URL change to load a specific user chat
  useEffect(() => {
    if (!user) return;
    setLoading(false);
    if (!chatId) {
       if (chats.length > 0) navigate(`/chat/${chats[0].id}`);
       return;
    }
    
    const existingChat = chats.find(c => c.id === chatId);
    if (existingChat) {
      setActiveChat(existingChat);
      fetchMessages(existingChat.id);
    } else {
      // User they haven't chatted with yet — fetch their profile
      fetch(`${API_URL}/users/${chatId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(newUser => {
           setActiveChat(newUser);
           setChats(prev => prev.find(c => c.id === newUser.id) ? prev : [newUser, ...prev]);
           fetchMessages(newUser.id);
        })
        .catch(() => {
           toast.error('User not found');
           navigate('/chat');
        });
    }
  }, [chatId, chats]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Read Chat List from Backend
  async function fetchChats() {
    try {
      const res = await fetch(`${API_URL}/messages/chat/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChats(data || []);
    } catch {
      toast.error('Failed to load chats');
    }
  }

  // Load Message History
  async function fetchMessages(contactId: string) {
    try {
      const res = await fetch(`${API_URL}/messages/${contactId}`, {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data || []);
    } catch (error: any) {
       console.error('Fetch messages error:', error);
       toast.error(`Error loading messages: ${error.message || 'Check connection'}`);
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
       const msgPayload = {
         receiverId: activeChat.id,
         content: newMessage
       };
       setNewMessage('');
       
       socketRef.current?.emit('sendMessage', msgPayload);
       
       // Fallback logic incase Socket IO takes over
       // Alternatively, HTTP POST provides durable inserts if socket misses
       const res = await fetch(`${API_URL}/messages`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
         body: JSON.stringify(msgPayload)
       });
       if (!res.ok) throw new Error(`HTTP ${res.status}`);
       
       // Note: Both sender and receiver will receive the `receiveMessage` event organically
       // if we emit it, so we rely on that to populate our log.
    } catch (err: any) {
       toast.error(`Failed to send message: ${err.message || 'Check server status'}`);
    }
  };

  const sendMeetupProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !meetupForm.date || !meetupForm.time) return;
    setSendingMeetup(true);
    const content = `📅 MEETUP PROPOSAL\n📍 Location: ${meetupForm.location}\n🗓 Date: ${new Date(meetupForm.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n⏰ Time: ${meetupForm.time}\n\nPlease reply to confirm!`;
    try {
      const msgPayload = { receiverId: activeChat.id, content };
      socketRef.current?.emit('sendMessage', msgPayload);
      const res = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(msgPayload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success('Meetup proposal sent!');
      setShowMeetupForm(false);
      setMeetupForm({ date: '', time: '', location: 'Main Entrance' });
    } catch (err: any) {
      toast.error(`Meetup proposal failed: ${err.message || 'Server error'}`);
    } finally {
      setSendingMeetup(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-rise flex-1 py-12 px-6 flex justify-center">
      <div className="w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 overflow-hidden flex h-[calc(100vh-200px)]">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-background/5 backdrop-blur-md">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Messages</h2>
            <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : socketStatus === 'connecting' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
               <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{socketStatus}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
             {chats.length === 0 ? (
               <div className="p-6 text-muted-foreground text-sm text-center">No active chats</div>
             ) : (
               chats.map(chat => (
                 <button 
                   key={chat.id} 
                   onClick={() => navigate(`/chat/${chat.id}`)}
                   className={`w-full text-left p-4 flex gap-4 transition-colors cursor-pointer border-b border-white/5 ${activeChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                 >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {chat.avatar ? (
                         <img src={chat.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-sm font-semibold text-muted-foreground uppercase">{displayName(chat).charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center overflow-hidden">
                      <h4 className="text-foreground text-sm font-medium line-clamp-1">{displayName(chat)}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">Tap to open chat</p>
                    </div>
                 </button>
               ))
             )}
          </div>
        </div>

        {/* Chat Area */}
        {activeChat ? (
          <div className="w-2/3 flex flex-col bg-background/10 backdrop-blur-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center">
                  {activeChat.avatar
                    ? <img src={activeChat.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-xs font-semibold text-muted-foreground uppercase">{displayName(activeChat).charAt(0)}</span>
                  }
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground">{displayName(activeChat)}</h3>
                  {activeChat.email && <p className="text-xs text-muted-foreground">{activeChat.email}</p>}
                </div>
              </div>
              <button
                onClick={() => setShowMeetupForm(v => !v)}
                title="Schedule a meetup"
                className={`flex items-center gap-2 text-sm rounded-full px-4 py-1.5 border transition-all cursor-pointer ${
                  showMeetupForm ? 'bg-violet-500/20 border-violet-400/40 text-violet-300' : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" /> Meetup
              </button>
            </div>

            {/* Meetup Scheduler Panel */}
            {showMeetupForm && (
              <form onSubmit={sendMeetupProposal} className="border-b border-white/10 bg-violet-500/5 p-4 flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Date</label>
                  <input required type="date" min={new Date().toISOString().split('T')[0]} value={meetupForm.date} onChange={e => setMeetupForm({...meetupForm, date: e.target.value})} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/40" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Time</label>
                  <input required type="time" value={meetupForm.time} onChange={e => setMeetupForm({...meetupForm, time: e.target.value})} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/40" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Campus Location</label>
                  <select value={meetupForm.location} onChange={e => setMeetupForm({...meetupForm, location: e.target.value})} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:border-foreground/40">
                    <option className="bg-black">Main Entrance</option>
                    <option className="bg-black">Library</option>
                    <option className="bg-black">Block A Canteen</option>
                    <option className="bg-black">Sports Complex</option>
                  </select>
                </div>
                <button type="submit" disabled={sendingMeetup} className="flex items-center gap-2 rounded-lg bg-violet-500 text-white px-4 py-2 text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-50 cursor-pointer">
                  <Calendar className="w-4 h-4" /> {sendingMeetup ? 'Sending...' : 'Send Proposal'}
                </button>
                <button type="button" onClick={() => setShowMeetupForm(false)} className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
               {messages.map(msg => {
                 const isMe = msg.senderId === user.id;
                 const isMeetup = msg.content?.startsWith('📅 MEETUP PROPOSAL');
                 return (
                   <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm whitespace-pre-wrap ${
                        isMeetup
                          ? 'bg-violet-500/20 border border-violet-400/30 text-foreground rounded-2xl'
                          : isMe ? 'bg-foreground text-background rounded-tr-sm' : 'bg-white/10 text-foreground rounded-tl-sm'
                      }`}>
                         {msg.content}
                      </div>
                   </div>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5">
              <div className="relative flex items-center">
                 <input 
                   type="text" 
                   value={newMessage}
                   onChange={e => setNewMessage(e.target.value)}
                   placeholder="Type a message..." 
                   className="w-full rounded-full bg-white/5 border border-white/10 py-3 pl-6 pr-14 text-sm text-foreground focus:outline-none focus:border-foreground/40"
                 />
                 <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 p-2 bg-foreground text-background rounded-full transition-transform hover:scale-105 disabled:opacity-50 cursor-pointer">
                    <Send className="w-4 h-4" />
                 </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="w-2/3 flex items-center justify-center text-muted-foreground">
             Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
