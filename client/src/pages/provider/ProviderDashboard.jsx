import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, MessageCircle, Loader2, Inbox, Star,
  Clock3, Wrench, CheckCircle2, ShieldAlert, Play, Check,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

const STATUS_STYLE = {
  Requested: 'bg-slate-100 text-slate-700',
  Accepted: 'bg-teal-100 text-teal-700',
  'In progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const NEXT = {
  Requested: { to: 'Accepted', label: 'Accept', icon: Check },
  Accepted: { to: 'In progress', label: 'Start work', icon: Play },
  'In progress': { to: 'Completed', label: 'Mark completed', icon: CheckCircle2 },
};

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const ProviderDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [tab, setTab] = useState('All');

  const load = async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data.bookings || []);
    } catch (err) {
      addToast('Could not load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const move = async (id, status) => {
    setBusyId(id);
    try {
      await api.put(`/bookings/${id}/status`, { status });
      addToast(`Booking marked ${status}`);
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not update', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const count = (s) => bookings.filter((b) => b.status === s).length;
  const stats = [
    { label: 'New requests', value: count('Requested'), icon: Clock3, tint: 'bg-slate-100 text-slate-600' },
    { label: 'Active jobs', value: count('Accepted') + count('In progress'), icon: Wrench, tint: 'bg-amber-50 text-amber-600' },
    { label: 'Completed', value: count('Completed'), icon: CheckCircle2, tint: 'bg-green-50 text-green-600' },
    {
      label: 'Rating',
      value: user.averageRating ? Number(user.averageRating).toFixed(1) : 'New',
      icon: Star,
      tint: 'bg-teal-50 text-teal-600',
    },
  ];

  const tabs = ['All', 'Requested', 'Accepted', 'In progress', 'Completed', 'Cancelled'];
  const shown = tab === 'All' ? bookings : bookings.filter((b) => b.status === tab);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">Hi, {user.name.split(' ')[0]}</h1>
      <p className="text-sm text-muted mt-1">{user.category} · {user.area}</p>

      {user.isVerified === false && (
        <div className="mt-5 flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-ink">Waiting for admin approval</p>
            <p className="text-sm text-muted">Customers cannot see or book you until an admin verifies your profile.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="bg-white border border-teal-100 rounded-2xl p-4 shadow-sm">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
              <Icon className="w-5 h-5" />
            </span>
            <p className="text-2xl font-bold text-ink mt-3">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-8 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap transition active:scale-[0.97] ${
              tab === t ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-muted hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 bg-white border border-teal-100 rounded-2xl p-12 text-center">
          <Inbox className="w-10 h-10 mx-auto text-muted" />
          <p className="font-semibold text-ink mt-3">No bookings here yet</p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {shown.map((b) => {
            const next = NEXT[b.status];
            const NextIcon = next?.icon;
            return (
              <div key={b._id} className="bg-white border border-teal-100 rounded-2xl shadow-sm p-5 transition duration-200 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{b.customer?.name}</h3>
                    <p className="text-sm text-muted">{b.customer?.phone} · {cap(b.category)}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[b.status] || ''}`}>
                    {b.status}
                  </span>
                </div>

                <p className="text-sm text-ink mt-3">{b.description}</p>

                <div className="flex flex-wrap gap-2 mt-3 text-xs font-medium">
                  <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {b.address}, {b.area}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" /> {new Date(b.scheduledDate).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {b.scheduledTime}
                  </span>
                </div>

                {b.problemImages?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {b.problemImages.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="problem" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                      </a>
                    ))}
                  </div>
                )}

                {b.quote?.status && b.quote.status !== 'None' && (
                  <p className="mt-3 text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Your quote: ₹{b.quote.price} ({b.quote.status})
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-teal-100">
                  {next && (
                    <button
                      disabled={busyId === b._id}
                      onClick={() => move(b._id, next.to)}
                      className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg hover:brightness-95 hover:-translate-y-px active:scale-[0.97] transition disabled:opacity-60"
                    >
                      {busyId === b._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <NextIcon className="w-4 h-4" />}
                      {next.label}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/chat/${b._id}`)}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark hover:-translate-y-px active:scale-[0.97] transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderDashboard;