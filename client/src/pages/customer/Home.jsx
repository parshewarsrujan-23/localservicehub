import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Star, Wrench, Zap, Snowflake, Sparkles, PaintRoller,
  Hammer, Droplets, BadgeCheck, Camera, MessageCircle, CalendarCheck, ArrowRight,
} from 'lucide-react';
import api from '../../api/axios';

const CATEGORIES = [
  { name: 'Plumber', icon: Wrench, tint: 'bg-sky-50 text-sky-600' },
  { name: 'Electrician', icon: Zap, tint: 'bg-amber-50 text-amber-600' },
  { name: 'AC Repair', icon: Snowflake, tint: 'bg-cyan-50 text-cyan-600' },
  { name: 'Cleaning', icon: Sparkles, tint: 'bg-emerald-50 text-emerald-600' },
  { name: 'Painter', icon: PaintRoller, tint: 'bg-rose-50 text-rose-600' },
  { name: 'Carpenter', icon: Hammer, tint: 'bg-orange-50 text-orange-600' },
  { name: 'RO Service', icon: Droplets, tint: 'bg-indigo-50 text-indigo-600' },
];

const STEPS = [
  { icon: Camera, title: 'Send a photo', text: 'Upload a picture of the problem. Our AI suggests the right service.' },
  { icon: MessageCircle, title: 'Chat and get a quote', text: 'Talk to the provider, share more photos and agree on a price.' },
  { icon: CalendarCheck, title: 'Book your slot', text: 'Pick a date and time. Track the job until it is done.' },
];

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const Home = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [area, setArea] = useState('');
  const [debouncedArea, setDebouncedArea] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('rating');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debounce text inputs by 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedArea(area);
    }, 400);
    return () => clearTimeout(t);
  }, [search, area]);

  // Load providers whenever a filter changes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { sort };
        if (category) params.category = category;
        if (debouncedArea) params.area = debouncedArea;
        if (debouncedSearch) params.search = debouncedSearch;
        const { data } = await api.get('/users/providers', { params });
        setProviders(Array.isArray(data) ? data : data.providers || []);
      } catch (err) {
        console.error('Failed to load providers', err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, debouncedSearch, debouncedArea, sort]);

  const field =
    'w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary/25 focus:border-primary';

  return (
    <div>
      {/* Hero */}
      <section
        className="bg-primary text-white"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-24">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-sm font-medium px-3 py-1 rounded-full">
            <BadgeCheck className="w-4 h-4 text-accent" /> Verified providers in Hyderabad
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold leading-tight max-w-2xl">
            Something broken at home? Send a photo, we'll find the right person.
          </h1>
          <p className="mt-4 text-white/80 max-w-xl">
            Plumbers, electricians, AC and RO technicians near you. Chat first, agree on a price, then book.
          </p>
        </div>
      </section>

      {/* Search card overlapping the hero */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative">
        <div className="bg-white rounded-2xl shadow-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-3">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-4" />
            <input
              className={field}
              placeholder="What do you need? e.g. tap leak, AC not cooling"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative md:col-span-2">
            <MapPin className="w-4 h-4 text-muted absolute left-3.5 top-4" />
            <input
              className={field}
              placeholder="Your area, e.g. Shamshabad"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Categories */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink mb-4">What do you need help with?</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {CATEGORIES.map(({ name, icon: Icon, tint }) => {
              const active = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(active ? '' : name)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.97] ${
                    active ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-ink'
                  }`}
                >
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? 'bg-white/20 text-white' : tint}`}>
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="text-xs font-semibold text-center">{name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Providers */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-ink">
              {category ? `${category} near you` : 'Top rated providers'}
            </h2>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/25"
            >
              <option value="rating">Top rated</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-24 bg-slate-200" />
                  <div className="p-5">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/3 mt-3" />
                    <div className="h-3 bg-slate-200 rounded mt-6" />
                    <div className="h-11 bg-slate-200 rounded-xl mt-5" />
                  </div>
                </div>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <p className="font-semibold text-ink">No providers found</p>
              <p className="text-sm text-muted mt-1">Try a different service or area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map((p) => (
                <div
                  key={p._id}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-teal-100 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-teal-900/10 hover:border-primary/40"
                >
                  {/* Gradient header */}
                  <div className="h-24 bg-gradient-to-r from-primary to-teal-500 relative">
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                      }}
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                      <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                      {p.averageRating ? p.averageRating.toFixed(1) : 'New'}
                    </div>
                  </div>

                  <div className="px-5 pb-5 flex flex-col flex-1">
                    {/* Avatar overlapping the header */}
                    <div className="relative z-10 -mt-8 w-16 h-16 rounded-2xl border-4 border-white shadow-md flex items-center justify-center text-primary font-bold text-xl bg-teal-50">
                      {initials(p.name)}
                    </div>

                    <h3 className="mt-4 font-bold text-ink flex items-center gap-1.5">
                      {p.name}
                      <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                    </h3>
                    <p className="text-sm font-semibold text-primary">{p.category}</p>

                    <p className="text-sm text-muted mt-3 line-clamp-2 min-h-[2.5rem]">{p.bio}</p>

                    <div className="flex flex-wrap gap-2 mt-4 mb-5 text-xs font-medium">
                      <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" /> {p.area}
                      </span>
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                        {p.experience} yrs experience
                      </span>
                      {p.totalReviews > 0 && (
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          {p.totalReviews} reviews
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-teal-100">
                      <div>
                        <p className="text-xs text-muted">Starting at</p>
                        <p className="text-xl font-bold text-ink">₹{p.price}</p>
                      </div>
                      <Link
                        to={`/book/${p._id}`}
                        className="inline-flex items-center gap-1.5 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition duration-150 group-hover:bg-primary-dark hover:-translate-y-px active:scale-[0.97]"
                      >
                        Book now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="mt-16 mb-16">
          <h2 className="text-xl font-bold text-ink mb-5">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm font-bold text-muted">Step {i + 1}</span>
                </div>
                <h3 className="font-semibold text-ink mt-4">{title}</h3>
                <p className="text-sm text-muted mt-1">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;