import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Wrench } from 'lucide-react';
import Button from '../common/Button';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl text-ink tracking-tight">LocalServiceHub</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
                  {user.role === 'customer' && (
                    <>
                      <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                      <Link to="/customer/bookings" className="hover:text-primary transition-colors">My Bookings</Link>
                    </>
                  )}
                  {user.role === 'provider' && (
                    <Link to="/provider" className="hover:text-primary transition-colors">Dashboard</Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="hover:text-primary transition-colors">Admin Panel</Link>
                  )}
                </div>

                <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                  <span className="text-sm font-medium text-ink hidden sm:block">
                    Hi, {user.name.split(' ')[0]}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="secondary">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;