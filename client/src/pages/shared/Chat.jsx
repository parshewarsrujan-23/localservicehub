import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Send, ImagePlus, ArrowLeft, Loader2, MapPin, Calendar, IndianRupee,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const Chat = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const myId = user._id || user.id;

  const [booking, setBooking] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteNote, setQuoteNote] = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);

  const loadBooking = async () => {
    const { data } = await api.get(`/bookings/${bookingId}`);
    setBooking(data.booking || data);
  };

  // Load booking and old messages
  useEffect(() => {
    const load = async () => {
      try {
        await loadBooking();
        const { data } = await api.get(`/chat/${bookingId}`);
        setMessages(data.messages || data || []);
      } catch (err) {
        addToast('Could not open this chat', 'error');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, [bookingId]);

  // Connect socket
  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('joinBooking', bookingId));
    socket.on('newMessage', (msg) => setMessages((prev) => [...prev, msg]));
    socket.on('typing', () => setTyping(true));
    socket.on('stopTyping', () => setTyping(false));
    socket.on('error', (e) => addToast(e.message || 'Chat error', 'error'));
    socket.on('connect_error', (e) => console.error('Socket error:', e.message));

    return () => socket.disconnect();
    // eslint-disable-next-line
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (payload) => {
    socketRef.current?.emit('sendMessage', { bookingId, ...payload });
  };

  const sendText = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    send({ text: text.trim(), type: 'text' });
    socketRef.current?.emit('stopTyping', bookingId);
    setText('');
  };

  const onType = (e) => {
    setText(e.target.value);
    socketRef.current?.emit('typing', bookingId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socketRef.current?.emit('stopTyping', bookingId),
      1200
    );
  };

  const sendImage = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return addToast('Photo must be under 5 MB', 'error');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/chat/upload', fd);
      const url = data.url || data.imageUrl || data.image;
      send({ image: url, type: 'image' });
    } catch (err) {
      addToast('Photo upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Provider sends quote
  const sendQuote = async () => {
    if (!quotePrice || Number(quotePrice) <= 0) return addToast('Enter a valid price', 'error');
    try {
      await api.put(`/bookings/${bookingId}/quote`, { price: Number(quotePrice), note: quoteNote });
      send({ text: `Quote sent: ₹${quotePrice}${quoteNote ? ` (${quoteNote})` : ''}`, type: 'quote' });
      setQuotePrice('');
      setQuoteNote('');
      await loadBooking();
      addToast('Quote sent');
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not send quote', 'error');
    }
  };

  // Customer responds to quote
  const respond = async (action) => {
    try {
      await api.put(`/bookings/${bookingId}/quote/respond`, { action });
      send({ text: action === 'accept' ? 'I accept the quote.' : 'I reject the quote.', type: 'text' });
      await loadBooking();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not respond', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!booking) return null;

  const other = user.role === 'customer' ? booking.provider : booking.customer;
  const q = booking.quote || {};
  const isProvider = user.role === 'provider';
  const closed = ['Completed', 'Cancelled'].includes(booking.status);

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-primary font-bold flex items-center justify-center">
            {(other?.name || '?').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink truncate">{other?.name}</p>
            <p className="text-xs text-muted">{cap(booking.category)} · {booking.status}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3 text-xs font-medium">
          <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
            <MapPin className="w-3 h-3" /> {booking.address}, {booking.area}
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            <Calendar className="w-3 h-3" /> {new Date(booking.scheduledDate).toLocaleDateString()} {booking.scheduledTime}
          </span>
        </div>
        <p className="text-sm text-ink mt-2">{booking.description}</p>
        {booking.problemImages?.length > 0 && (
          <div className="flex gap-2 mt-2">
            {booking.problemImages.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="problem" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quote panel */}
      {q.status && q.status !== 'None' && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-ink flex items-center gap-1">
            Quote: <IndianRupee className="w-4 h-4" />{q.price}
            <span className="ml-2 text-xs font-semibold bg-white text-amber-700 px-2 py-0.5 rounded-full">{q.status}</span>
          </p>
          {q.note && <p className="text-sm text-muted mt-1">{q.note}</p>}
          {!isProvider && q.status === 'Sent' && !closed && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => respond('accept')} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark active:scale-[0.97] transition">Accept</button>
              <button onClick={() => respond('reject')} className="bg-white border border-slate-200 text-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 active:scale-[0.97] transition">Reject</button>
            </div>
          )}
        </div>
      )}

      {isProvider && !closed && q.status !== 'Accepted' && (
        <div className="mt-3 rounded-2xl border border-teal-100 bg-white p-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-ink">Send a quote</span>
          <input type="number" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="₹ price"
            className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          <input value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} placeholder="Note (optional)"
            className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/25" />
          <button onClick={sendQuote} className="bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg hover:brightness-95 active:scale-[0.97] transition">Send</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mt-3 bg-white/60 border border-teal-100 rounded-2xl p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted mt-8">No messages yet. Say hello and share more details.</p>
        )}
        {messages.map((m, i) => {
          const mine = (m.sender?._id || m.sender) === myId;
          return (
            <div key={m._id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                m.type === 'quote'
                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                  : mine ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-ink border border-slate-100 rounded-bl-sm'
              }`}>
                {m.image && (
                  <a href={m.image} target="_blank" rel="noreferrer">
                    <img src={m.image} alt="shared" className="rounded-lg max-h-56 mb-1" />
                  </a>
                )}
                {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                <p className={`text-[10px] mt-1 ${mine && m.type !== 'quote' ? 'text-white/70' : 'text-muted'}`}>
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          );
        })}
        {typing && <p className="text-xs text-muted italic">{other?.name} is typing...</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendText} className="mt-3 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { sendImage(e.target.files[0]); e.target.value = ''; }} />
        <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
          className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-[0.97] transition disabled:opacity-60">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5 text-primary" />}
        </button>
        <input value={text} onChange={onType} placeholder="Type a message"
          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
        <button type="submit" className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark active:scale-[0.97] transition">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default Chat;