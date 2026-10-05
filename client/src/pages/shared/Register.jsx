import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    area: '',
    role: 'customer',
    // Provider specific
    category: 'Plumber',
    price: '',
    experience: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'provider') navigate('/provider');
      else navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await register(formData);
    setIsLoading(false);

    if (result.success) {
      if (formData.role === 'provider') {
        addToast('Account created! Your profile is pending admin approval.');
      } else {
        addToast('Account created successfully!');
      }
    }
  };

  // Shared classes for custom inputs (Select/Textarea) to match Input.jsx
  const inputClasses = "px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-colors duration-150 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400";

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink">Create an account</h1>
          <p className="text-sm text-muted mt-2">Join LocalServiceHub today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">I want to...</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`border rounded-lg p-3 cursor-pointer text-center transition-colors ${formData.role === 'customer' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="role" value="customer" checked={formData.role === 'customer'} onChange={handleChange} className="hidden" />
                <span className="font-medium">Book Services</span>
              </label>
              <label className={`border rounded-lg p-3 cursor-pointer text-center transition-colors ${formData.role === 'provider' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="role" value="provider" checked={formData.role === 'provider'} onChange={handleChange} className="hidden" />
                <span className="font-medium">Provide Services</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
            <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} minLength={6} required />
            <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
            <Input label="Area in Hyderabad" name="area" value={formData.area} onChange={handleChange} placeholder="e.g. Madhapur, Kukatpally" required />
          </div>

          {/* Provider Specific Fields */}
          {formData.role === 'provider' && (
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h2 className="font-semibold text-ink">Professional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Service Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={inputClasses} required>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="AC Repair">AC Repair</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Painter">Painter</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="RO Service">RO Service</option>
                  </select>
                </div>

                <Input label="Base Price (₹)" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="e.g. 500" required={formData.role === 'provider'} />
                <Input label="Years of Experience" type="number" name="experience" value={formData.experience} onChange={handleChange} required={formData.role === 'provider'} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Brief Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" className={inputClasses} placeholder="Tell customers about your skills and experience..." required={formData.role === 'provider'}></textarea>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;