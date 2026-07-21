import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, ArrowRight, Activity } from 'lucide-react';

export default function UserLogin({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.token, res.data.user);
      } else {
        await axios.post('http://localhost:5000/api/auth/register', formData);
        // Auto login after register
        const res = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('userToken', res.data.token);
        localStorage.setItem('userData', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-10 max-w-md w-full relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-8 -mt-8 w-32 h-32 bg-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 mb-6">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isLogin ? 'Enter your details to access your health portal' : 'Sign up to start managing your health journey'}
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-sm"
                required
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-sm"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-sm"
              required
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-xs font-semibold text-teal-600 hover:text-teal-700">Forgot Password?</button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-200/50 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="relative z-10 mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({name:'', email:'', password:''}); }}
            className="font-bold text-teal-600 hover:text-teal-700"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
