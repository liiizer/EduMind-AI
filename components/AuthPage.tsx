import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Grade, StudentProfile } from '../types';
import { dbService } from '../services/db';

interface Props {
  onLogin: (profile: StudentProfile) => void;
}

export const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(Grade.PRIMARY);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Basic Field Validation
      if (!email.trim() || !password.trim()) {
        throw new Error('Please fill in all required fields.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // 2. Database Operations
      if (isLogin) {
        // --- Login Logic ---
        
        // Special case for demo user: Seed it if it doesn't exist
        if (email === 'student@edumind.ai') {
           const demoUser = await dbService.getUser(email);
           if (!demoUser) {
             await dbService.createUser({
                name: 'Demo Student',
                age: 13,
                grade: Grade.MIDDLE,
                masteryLevel: 'Intermediate',
                email: email,
                password: 'password123'
             });
           }
        }

        const user = await dbService.getUser(email);
        
        if (!user) {
          throw new Error('Account not found. Please register first.');
        }

        if (user.password !== password) {
          throw new Error('Incorrect password.');
        }

        // Success
        setTimeout(() => {
          setIsLoading(false);
          onLogin(user);
        }, 800);

      } else {
        // --- Registration Logic ---
        if (!name.trim()) {
          throw new Error('Please enter your full name for registration.');
        }

        const existingUser = await dbService.getUser(email);
        if (existingUser) {
          throw new Error('This email is already registered.');
        }

        const newProfile: StudentProfile = {
          name: name,
          age: grade === Grade.PRIMARY ? 10 : 14,
          grade: isLogin ? Grade.PRIMARY : grade, // isLogin false
          masteryLevel: 'Novice',
          email: email,
          password: password // Saving plain text for demo only.
        };

        await dbService.createUser(newProfile);

        // Success
        setTimeout(() => {
          setIsLoading(false);
          onLogin(newProfile);
        }, 800);
      }

    } catch (err: any) {
      setTimeout(() => {
        setIsLoading(false);
        setError(err.message || 'An unexpected error occurred.');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-center gap-3 text-blue-600 font-bold text-3xl mb-2">
          <GraduationCap className="w-10 h-10" />
          <span>EduMind AI</span>
        </div>
        <p className="text-gray-500 text-sm">Adaptive Vertical LLM for K-12 Education</p>
      </div>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header Toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${isLogin ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Log In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${!isLogin ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            {isLogin ? 'Enter your credentials to access your learning dashboard.' : 'Start your personalized learning journey today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative group">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                  />
                </div>
                
                <div className="relative group">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as Grade)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600 appearance-none transition-all"
                  >
                    {Object.values(Grade).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
              <p className="text-xs text-blue-800 font-semibold mb-1">Demo Credentials:</p>
              <div className="text-xs text-blue-600 font-mono space-y-1">
                <p>Email: student@edumind.ai</p>
                <p>Pass: password123</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; 2024 EduMind Research Group. All rights reserved.
      </div>
    </div>
  );
};