'use client';

import { useActionState, useState } from 'react';
import { register } from './actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Shield, Eye, EyeOff, Hexagon, CheckCircle2 } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded bg-primary text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-colors shadow-sm"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Registering...
        </span>
      ) : 'Sign up'}
    </button>
  );
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const res = await register(formData);
    if (res?.error) {
      return { error: res.error, success: false, autoActivated: false };
    }
    return { error: null, success: true, autoActivated: res?.autoActivated };
  }, { error: null, success: false, autoActivated: false });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Branding Panel */}
      <div className="hidden md:flex flex-1 flex-col bg-primary text-primary-foreground relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        
        <div className="flex-1 flex flex-col justify-center px-12 lg:px-24 xl:px-32 relative z-10">
          <div className="flex items-center gap-2 mb-10">
            <Hexagon className="h-6 w-6 text-white opacity-90" />
            <h1 className="text-2xl font-semibold tracking-tight">PharmaTrace</h1>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-medium tracking-tight mb-4">
              Join PharmaTrace
            </h2>
            <p className="text-primary-foreground/80 text-base leading-relaxed font-light">
              Register for an account to access the pharmaceutical traceability platform. All new accounts require administrator verification before access is granted.
            </p>
          </div>
        </div>
      </div>

      {/* Right Register Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[360px] space-y-8">
          
          <div className="md:hidden flex items-center gap-2 mb-8">
            <Hexagon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">PharmaTrace</h1>
          </div>

          <div>
            <h2 className="text-xl font-medium text-foreground tracking-tight">Create an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your details to register.
            </p>
          </div>
          
          {state?.success ? (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 border border-green-200 p-4 rounded-md text-sm text-green-800 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-base mb-1">Registration Successful!</p>
                  {state.autoActivated ? (
                    <p>Your admin account has been created and activated automatically since you are the first administrator. You can now log in.</p>
                  ) : (
                    <p>Your account has been created and is currently pending administrator verification. You will be able to log in once your account is activated.</p>
                  )}
                </div>
              </div>
              <div className="pt-2">
                <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-input rounded bg-surface text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" action={formAction}>
              {state?.error && (
                <div className="bg-error-bg border border-error-border p-3 rounded text-sm text-error flex items-start gap-2.5">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{state.error}</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-input rounded bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-input rounded bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="appearance-none block w-full px-3 py-2 border border-input rounded bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm transition-colors pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="roleId" className="block text-sm font-medium text-foreground">
                    Role Requested
                  </label>
                  <select
                    id="roleId"
                    name="roleId"
                    required
                    defaultValue="WORKER"
                    className="appearance-none block w-full px-3 py-2 border border-input rounded bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm transition-colors"
                  >
                    <option value="WORKER">Worker</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <SubmitButton />
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          )}
          
          <div className="pt-6 text-center">
             <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
               Authorized organizational access only
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
