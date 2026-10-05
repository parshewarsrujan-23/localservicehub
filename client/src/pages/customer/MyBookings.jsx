import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, MessageCircle, Star, X, Loader2, IndianRupee, Inbox,
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../components/common/Toast';

const STATUS_STYLE = {
  Requested: 'bg-slate-100 text-slate-700',
  Accepted: 'bg-teal-100 text-teal-700',
  'In progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const MyBookings = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reviewFor, setReviewFor] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

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

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setBusyId(id);
    try {
      await api.put(`/bookings/${id}/cancel`);
      addToast('Booking cancelled');
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not cancel', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (id, action) => {
    setBusyId(id);
    try {
      await api.put(`/bookings/${id}/quote/respond`, { action });
      addToast(action === 'accept' ? 'Quote accepted' : 'Quote rejected');
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not respond', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const submitReview = async () => {
    setBusyId(reviewFor);
    try {
      await api.post('/reviews', { booking: reviewFor, rating, comment });
      addToast('Thanks for your review!');
      setReviewFor(null);
      setRating(5);
      setComment('');
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Could not submit review', 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">My bookings</h1>
      <p className="text-sm text-muted mt-1">Track your jobs, chat with providers and handle quotes.</p>

      {bookings.length === 0 ? (
        <div className="mt-8 bg-white border border-teal-100 rounded-2xl p-12 text-center">
          <Inbox className="w-10 h-10 mx-auto text-muted" />
          <p className="font-semibold text-ink mt-3">No bookings yet</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition"
          >
            Find a provider
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {bookings.map((b) => {
            const canCancel = ['Requested', 'Accepted'].includes(b.status);
            const quoteSent = b.quote?.status === 'Sent';
            return (
              <div
                key={b._id}
                className="bg-white border border-teal-100 rounded-2xl shadow-sm p-5 transition duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">
                      {cap(b.category)} · {b.provider?.name}
                    </h3>
                    <p className="text-sm text-muted mt-0.5">{b.provider?.phone}</p>
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

                {/* Quote */}
                {b.quote?.status && b.quote.status !== 'None' && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-ink flex items-center gap-1">
                      Quote from provider: <IndianRupee className="w-4 h-4" />{b.quote.price}
                      <span className="ml-2 text-xs font-semibold bg-white text-amber-700 px-2 py-0.5 rounded-full">
                        {b.quote.status}
                      </span>
                    </p>
                    {b.quote.note && <p className="text-sm text-muted mt-1">{b.quote.note}</p>}
                    {quoteSent && b.status !== 'Cancelled' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          disabled={busyId === b._id}
                          onClick={() => respond(b._id, 'accept')}
                          className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark active:scale-[0.97] transition disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          disabled={busyId === b._id}
                          onClick={() => respond(b._id, 'reject')}
                          className="bg-white border border-slate-200 text-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 active:scale-[0.97] transition disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed border-teal-100">
                  <button
                    onClick={() => navigate(`/chat/${b._id}`)}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark hover:-translate-y-px active:scale-[0.97] transition"
                  >
                    <MessageCircle className="w-4 h-4" /> Chat
                  </button>
                  {canCancel && (
                    <button
                      disabled={busyId === b._id}
                      onClick={() => cancel(b._id)}
                      className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-50 active:scale-[0.97] transition disabled:opacity-60"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  )}
                  {b.status === 'Completed' && !b.isReviewed && (
                    <button
                      onClick={() => setReviewFor(b._id)}
                      className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-bold px-4 py-2 rounded-lg hover:brightness-95 active:scale-[0.97] transition"
                    >
                      <Star className="w-4 h-4" /> Leave a review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review popup */}
      {reviewFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-ink">Rate this service</h3>
            <div className="flex gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`w-8 h-8 ${n <= rating ? 'fill-accent text-accent' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the work?"
              className="w-full mt-4 px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setReviewFor(null)}
                className="text-sm font-semibold text-muted px-4 py-2 hover:text-ink"
              >
                Close
              </button>
              <button
                onClick={submitReview}
                disabled={busyId === reviewFor}
                className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;