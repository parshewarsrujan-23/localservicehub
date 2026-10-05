import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  UploadCloud, X, Sparkles, BadgeCheck, MapPin, Calendar, Clock,
  ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';

const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const STEP_NAMES = ['Problem', 'Details', 'Confirm'];

const Booking = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const fileInput = useRef(null);

  const [provider, setProvider] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [step, setStep] = useState(1);

  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const [form, setForm] = useState({
    description: '',
    address: '',
    area: user?.area || '',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Load provider
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/users/providers/${providerId}`);
        setProvider(data.provider || data);
      } catch (err) {
        addToast('Provider not found', 'error');
        navigate('/');
      } finally {
        setLoadingProvider(false);
      }
    };
    load();
    // eslint-disable-next-line
  }, [providerId]);

  // Ask Gemini to read a photo
  const analyze = async (file) => {
    setAnalyzing(true);
    setSuggestion(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/ai/suggest-category', fd);
      setSuggestion(data.suggestion || data);
    } catch (err) {
      setSuggestion(null);
      addToast('Could not analyse the photo. You can continue anyway.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const addFiles = (list) => {
    const images = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;

    const tooBig = images.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      addToast('Each photo must be under 5 MB', 'error');
      return;
    }

    const wasEmpty = files.length === 0;
    const merged = [...files, ...images].slice(0, 3);
    setFiles(merged);
    if (wasEmpty) analyze(merged[0]);
  };

  const removeFile = (index) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (next.length === 0) setSuggestion(null);
    else if (index === 0) analyze(next[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const detailsValid =
    form.description.trim() && form.address.trim() && form.area.trim() &&
    form.scheduledDate && form.scheduledTime;

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('provider', providerId);
      fd.append('category', provider.category);
      fd.append('description', form.description);
      fd.append('address', form.address);
      fd.append('area', form.area);
      fd.append('scheduledDate', form.scheduledDate);
      fd.append('scheduledTime', form.scheduledTime);
      files.forEach((f) => fd.append('images', f));

      await api.post('/bookings', fd);
      addToast('Booking sent! The provider will respond soon.');
      navigate('/customer/bookings');
    } catch (err) {
      addToast(err.response?.data?.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProvider) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!provider) return null;

  const mismatch =
    suggestion &&
    suggestion.category &&
    suggestion.category !== 'Unknown' &&
    suggestion.category.toLowerCase() !== provider.category.toLowerCase();

  const field =
    'w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none transition focus:ring-2 focus:ring-primary/25 focus:border-primary';

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      {/* Provider strip */}
      <div className="flex items-center gap-3 bg-white border border-teal-100 rounded-2xl p-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-primary font-bold flex items-center justify-center">
          {provider.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink flex items-center gap-1.5">
            {provider.name} <BadgeCheck className="w-4 h-4 text-primary" />
          </p>
          <p className="text-sm text-muted">{provider.category} · {provider.area}</p>
        </div>
        <p className="font-bold text-ink">From ₹{provider.price}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center mt-8 mb-6">
        {STEP_NAMES.map((name, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <React.Fragment key={name}>
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    done ? 'bg-primary text-white' : active ? 'bg-accent text-white' : 'bg-slate-200 text-muted'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : n}
                </span>
                <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-ink' : 'text-muted'}`}>
                  {name}
                </span>
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 mx-3 ${step > n ? 'bg-primary' : 'bg-slate-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="bg-white border border-teal-100 rounded-2xl shadow-sm p-6">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-ink">Show us the problem</h2>
            <p className="text-sm text-muted mt-1">
              Add up to 3 photos. Our AI will check which service you need.
            </p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => files.length < 3 && fileInput.current.click()}
              className={`mt-5 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                dragging ? 'border-primary bg-teal-50' : 'border-slate-300 hover:border-primary hover:bg-teal-50/50'
              }`}
            >
              <UploadCloud className="w-10 h-10 mx-auto text-primary" />
              <p className="mt-3 font-semibold text-ink">Drag photos here or click to browse</p>
              <p className="text-xs text-muted mt-1">JPG or PNG, up to 5 MB each</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {files.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                    <img src={URL.createObjectURL(f)} alt="problem" className="w-full h-full object-cover" />
                    {i === 0 && analyzing && (
                      <>
                        <div className="absolute inset-0 bg-primary/30" />
                        <div className="scan-line" />
                      </>
                    )}
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1 hover:bg-white shadow"
                    >
                      <X className="w-3.5 h-3.5 text-ink" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {analyzing && (
              <p className="mt-4 text-sm font-medium text-primary flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Analysing your photo...
              </p>
            )}

            {suggestion && !analyzing && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  {suggestion.category === 'Unknown' ? (
                    <>
                      <p className="font-bold text-ink">We could not spot a clear problem</p>
                      <p className="text-sm text-muted mt-0.5">
                        Try a closer photo, or describe it in the next step.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-ink">
                        Looks like a job for: {suggestion.category}
                        <span className="ml-2 text-xs font-semibold bg-white text-amber-700 px-2 py-0.5 rounded-full">
                          {Math.round((suggestion.confidence || 0) * 100)}% sure
                        </span>
                      </p>
                      {suggestion.reason && (
                        <p className="text-sm text-muted mt-0.5">{suggestion.reason}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {mismatch && (
              <div className="mt-3 flex gap-2 items-start text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  This provider is a {provider.category}, but the photo looks like a {suggestion.category} job.
                  You can go back and pick a {suggestion.category} instead.
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">Job details</h2>

            <div>
              <label className="text-sm font-medium text-ink">What is the problem?</label>
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={setField}
                placeholder="e.g. Kitchen tap is leaking under the sink"
                className={`${field} mt-1.5`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Full address</label>
              <input
                name="address"
                value={form.address}
                onChange={setField}
                placeholder="House no, street, landmark"
                className={`${field} mt-1.5`}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-ink">Area</label>
              <input name="area" value={form.area} onChange={setField} className={`${field} mt-1.5`} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" /> Date
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  min={today}
                  value={form.scheduledDate}
                  onChange={setField}
                  className={`${field} mt-1.5`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Time
                </label>
                <select
                  name="scheduledTime"
                  value={form.scheduledTime}
                  onChange={setField}
                  className={`${field} mt-1.5`}
                >
                  <option value="">Choose a time</option>
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-ink">Check and confirm</h2>

            <div className="mt-4 space-y-3 text-sm">
              <Row label="Service" value={`${provider.category} · ${provider.name}`} />
              <Row label="Problem" value={form.description} />
              <Row label="Address" value={`${form.address}, ${form.area}`} icon={MapPin} />
              <Row label="When" value={`${form.scheduledDate} at ${form.scheduledTime}`} icon={Calendar} />
              <Row label="Starting price" value={`₹${provider.price}`} />
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-5">
                {files.map((f, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(f)}
                    alt="problem"
                    className="aspect-square object-cover rounded-xl border border-slate-200"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-muted mt-5">
              The provider can send you a final quote in chat. You only accept it if you agree.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
          <button
            onClick={() => (step === 1 ? navigate('/') : setStep(step - 1))}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink transition"
          >
            <ArrowLeft className="w-4 h-4" /> {step === 1 ? 'Back to providers' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && analyzing) || (step === 2 && !detailsValid)}
              className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition duration-150 hover:bg-primary-dark hover:-translate-y-px active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-accent text-white text-sm font-bold px-6 py-2.5 rounded-xl transition duration-150 hover:brightness-95 hover:-translate-y-px active:scale-[0.97] disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Send booking request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, icon: Icon }) => (
  <div className="flex gap-3 bg-slate-50 rounded-xl p-3">
    <span className="w-28 shrink-0 text-muted font-medium flex items-center gap-1.5">
      {Icon && <Icon className="w-4 h-4" />} {label}
    </span>
    <span className="text-ink font-medium">{value}</span>
  </div>
);

export default Booking;