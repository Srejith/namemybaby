'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, MessageSquare, TrendingUp, Users, Baby, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Name My Baby
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Stop the Suffering,
                </span>
                <br />
                <span className="text-gray-900">Start the Naming</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Congrats, you made a human! Now comes the hard part: <strong>Naming it.</strong>
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
              <p className="text-gray-700 leading-relaxed">
                If you're an immigrant parent, you know the drill. You pick a gorgeous, meaningful name from your language, 
                and then... you watch the cashier/teacher/doctor look at it, panic, and say something that sounds like an 
                <span className="font-semibold text-pink-600"> angry sneeze.</span>
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Ideas generator</h3>
                    <p className="text-gray-600">
                      
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Name Machine</h3>
                    <p className="text-gray-600">
                      Get a percentage that tells you: "How close did they come to not totally butchering your kid's name?" 
                      We're saving your kid from a lifetime of correcting people.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">Pronounce it correctly</h3>
                    <p className="text-gray-600">
                      Whip up a poll, share with friends, and let them vote. Or ignore everyone and pick the name you secretly 
                      loved all along. We're not your boss.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-8">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 shadow-lg">
                      <Baby className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Let's Name Your Baby
                  </h2>
                  <p className="text-gray-600">
                    Get started with Name My Baby. Because your kid deserves a name that sounds 
                    <span className="font-semibold text-purple-600"> awesome</span>, not an apology.
                  </p>
                </div>

                {/* Sign In Button */}
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full group relative overflow-hidden bg-white border-2 border-gray-300 rounded-xl p-4 hover:border-purple-500 transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-purple-600 rounded-full animate-spin"></div>
                      <span className="text-gray-700 font-medium">Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span className="text-gray-700 font-semibold text-lg">Continue with Google</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  )}
                </button>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500">
                  Sign in to save and access your baby name suggestions across all your devices.
                </p>
              </div>

              {/* Decorative Elements */}
              <div className="mt-8 text-center">
                <p className="text-gray-500 italic">
                  What name have you been thinking about that the locals just cannot handle?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}
