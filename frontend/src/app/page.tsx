"use client";

import React, { useState, useMemo, useRef, useEffect, Component, ErrorInfo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { LiquidGlassCard } from "@/components/LiquidGlassCard";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const ShaderAnimation = dynamic(
  () => import("@/components/ui/shader-animation").then((mod) => mod.ShaderAnimation),
  { ssr: false }
);

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WebGL Canvas Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="absolute inset-0 bg-theme-900 opacity-50 mix-blend-overlay" />;
    }
    return this.props.children;
  }
}

interface SignInPageProps {
  className?: string;
}

function SignInContent({ className }: SignInPageProps) {
  const router = useRouter();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google login success - fetching profile...');
      try {
        const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenResponse.access_token}`, {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
            Accept: 'application/json'
          }
        });
        const userInfo = await userInfoRes.json();
        console.log('Google user info:', userInfo);

        // Save to localStorage
        localStorage.setItem('userProfile', JSON.stringify(userInfo));

        router.push('/dashboard');
      } catch (err) {
        console.error("Failed to fetch user info", err);
        // Fallback to push anyway so they aren't stuck
        router.push('/dashboard');
      }
    },
    onError: (error) => console.log('Google login failed:', error),
  });

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep("code");
    }
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 500);
    }
  }, [step]);

  const handleCodeChange = async (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      setErrorMsg("");

      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }

      const isComplete = newCode.every((digit) => digit.length === 1);
      if (isComplete) {
        setIsSubmitting(true);
        const fullCode = newCode.join("");

        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: fullCode,
          type: 'email',
        });

        setIsSubmitting(false);

        if (error) {
          setErrorMsg(error.message);
        } else {
          setReverseCanvasVisible(true);
          setTimeout(() => {
            setInitialCanvasVisible(false);
          }, 50);
          setTimeout(() => {
            setStep("success");
          }, 2000);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
    setErrorMsg("");
  };

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-theme-900 relative overflow-hidden font-sans", className)}>
      <div className="absolute inset-0 z-0 bg-transparent">
        <div className="absolute inset-0 opacity-80 mix-blend-screen">
          <ShaderAnimation />
        </div>

        {/* Ambient glow effects behind everything (matching dashboard layout) */}
        <div className="absolute top-[-10%] right-[-10%] w-[50rem] h-[50rem] bg-gradient-to-br from-theme-500/20 to-theme-300/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60rem] h-[60rem] bg-gradient-to-tr from-theme-300/20 to-theme-100/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-[30%] left-[20%] w-[40rem] h-[40rem] bg-theme-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_var(--color-theme-900)_150%)] opacity-80" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-[28rem] mt-10">

            {/* Modern Glassmorphic Login Card */}
            <LiquidGlassCard
              className="relative overflow-hidden border border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl p-10 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
              borderRadius="2.5rem"
              blurIntensity="xl"
              glowIntensity="sm"
            >
              {/* Subtle inner highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-[2.5rem]" />

              <div className="w-full flex justify-center mt-[-1rem] mb-8">
                {/* Replicating the NexusBank Dashboard Logo feeling */}
                <div className="flex items-center gap-4">
                  <Image
                    src="/aagam-logo.png"
                    alt="Aagam AI"
                    width={180}
                    height={180}
                    className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-full"
                  />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === "email" ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative z-10 space-y-8 text-center"
                  >
                    <div className="space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm">Welcome Back</h1>
                      <p className="text-slate-400 font-medium">Access your intelligent dashboard</p>
                    </div>

                    <div className="space-y-6">
                      <button type="button" onClick={() => login()} className="w-full relative z-30 flex items-center justify-center gap-3 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 text-white rounded-full py-4 px-4 transition-all duration-300 shadow-sm group">
                        <span className="text-lg bg-white text-slate-900 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs group-hover:scale-110 transition-transform">G</span>
                        <span className="font-medium">Sign in with Google</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="h-px bg-theme-700/50 flex-1" />
                        <span className="text-theme-500 text-sm font-medium">or continue with email</span>
                        <div className="h-px bg-theme-700/50 flex-1" />
                      </div>

                      <form onSubmit={handleEmailSubmit}>
                        <div className="relative group">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-slate-900/50 text-white placeholder:text-slate-500 border border-slate-700/50 rounded-full py-4 px-6 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner focus:bg-slate-800/80 disabled:opacity-50"
                            required
                          />
                          <button
                            type="submit"
                            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square text-white flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                            disabled={!email || isSubmitting}
                          >
                            <span className="relative w-full h-full block overflow-hidden">
                              {isSubmitting ? (
                                <span className="absolute inset-0 flex items-center justify-center">
                                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                              ) : (
                                <>
                                  <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-full">
                                    →
                                  </span>
                                  <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 -translate-x-full group-hover/btn:translate-x-0">
                                    →
                                  </span>
                                </>
                              )}
                            </span>
                          </button>
                        </div>
                        {errorMsg && (
                          <div className="mt-3 text-red-400 text-sm font-medium">{errorMsg}</div>
                        )}
                      </form>
                    </div>

                    <p className="text-xs text-theme-500 pt-4 font-medium">
                      By signing up, you agree to our <Link href="#" className="text-theme-300 hover:text-white transition-colors">Terms</Link> & <Link href="#" className="text-theme-300 hover:text-white transition-colors">Privacy Policy</Link>.
                    </p>
                  </motion.div>
                ) : step === "code" ? (
                  <motion.div
                    key="code-step"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative z-10 space-y-8 text-center"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">Check Email</h1>
                      <p className="text-theme-300 font-medium">We sent a verification code to you</p>
                    </div>

                    <div className="w-full">
                      <div className="relative rounded-full py-4 px-2 border border-theme-700/50 bg-theme-800/60 shadow-inner">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {code.map((digit, i) => (
                            <div key={i} className="flex items-center">
                              <div className="relative">
                                <input
                                  ref={(el) => {
                                    codeInputRefs.current[i] = el;
                                  }}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={1}
                                  value={digit}
                                  onChange={e => handleCodeChange(i, e.target.value)}
                                  onKeyDown={e => handleKeyDown(i, e)}
                                  className="w-8 sm:w-10 text-center text-xl sm:text-2xl font-bold bg-transparent text-theme-300 border-none focus:outline-none focus:ring-0 appearance-none transition-colors"
                                  style={{ caretColor: 'transparent' }}
                                />
                                {!digit && (
                                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                                    <span className="text-xl sm:text-2xl text-theme-500/40">0</span>
                                  </div>
                                )}
                              </div>
                              {i < 5 && <span className="text-theme-700 text-xl font-light">|</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      {errorMsg && (
                        <div className="mb-4 text-red-400 text-sm font-medium">{errorMsg}</div>
                      )}

                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2 text-theme-300">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm">Verifying code...</span>
                        </div>
                      ) : (
                        <motion.button
                          onClick={handleEmailSubmit}
                          disabled={isSubmitting}
                          className="text-slate-400 hover:text-white transition-colors text-sm font-semibold disabled:opacity-50"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          Resend code
                        </motion.button>
                      )}
                    </div>

                    <div className="flex w-full gap-4 pt-4">
                      <motion.button
                        onClick={handleBackClick}
                        className="rounded-full bg-slate-800/40 border border-slate-700/50 text-white font-medium px-6 py-3.5 hover:bg-slate-700/60 transition-all w-[35%]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        Back
                      </motion.button>
                      <motion.button
                        className={`flex-1 rounded-full w-full relative z-30 font-bold py-3.5 transition-all duration-300 ${code.every((d) => d !== "")
                          ? "bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] cursor-pointer"
                          : "bg-slate-800/40 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                          }`}
                        disabled={!code.every((d) => d !== "")}
                      >
                        Continue
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                    className="relative z-10 space-y-8 text-center"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-white">Verified!</h1>
                      <p className="text-slate-400 font-medium">Redirecting to your workspace...</p>
                    </div>

                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
                      className="py-10"
                    >
                      <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      onClick={() => router.push('/dashboard')}
                      className="w-full rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-bold py-4 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all hover:scale-[1.02]"
                    >
                      Go to Dashboard
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </LiquidGlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage({ className }: SignInPageProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "171027725052-tgt7dj6mrtm73326l474ohlrv03retc4.apps.googleusercontent.com"}>
      <SignInContent className={className} />
    </GoogleOAuthProvider>
  );
}
