'use client';

import { useActionState, useState } from 'react';
import { login } from './actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Shield, Eye, EyeOff, Hexagon } from 'lucide-react';

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
          Authenticating...
        </span>
      ) : 'Sign in'}
    </button>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState(async (_prevState: unknown, formData: FormData) => {
    const res = await login(formData);
    if (res?.error) {
      return { error: res.error };
    }
    return { error: null };
  }, { error: null });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Branding Panel */}
      <div className="hidden md:flex flex-1 flex-col bg-primary text-primary-foreground relative overflow-hidden">
        {/* Subtle grid pattern for enterprise/traceability feel */}
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
              Pharmaceutical Traceability Platform
            </h2>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6 font-light">
              QR • SSCC • Product Traceability
            </p>
            <p className="text-primary-foreground/80 text-base leading-relaxed font-light">
              Generate SSCC identifiers and maintain pharmaceutical product traceability. 
              Maintain protected audit records for traceability and accountability.
            </p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[360px] space-y-8">
          
          <div className="md:hidden flex items-center gap-2 mb-8">
            <Hexagon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">PharmaTrace</h1>
          </div>

          <div>
            <h2 className="text-xl font-medium text-foreground tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              to your PharmaTrace account.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" action={formAction}>
            {state?.error && (
              <div className="bg-error-bg border border-error-border p-3 rounded text-sm text-error flex items-start gap-2.5">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{state.error}</p>
              </div>
            )}
            
            <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
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
            </div>

            <div className="pt-2">
              <SubmitButton />
            </div>
          </form>
          
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
