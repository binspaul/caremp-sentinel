import React, { useState } from "react";
import { loginUser } from "./api";
import { AlertCircle, Loader2 } from "lucide-react";
import FullLogo from "./assets/Full_Logo.png";

export interface LoginProps {
  onLoginSuccess?: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("sadmin@caremp.ai");
  const [password, setPassword] = useState("sadmin@123#");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail("sadmin@caremp.ai");
    setPassword("sadmin@123#");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        "Login failed. Please check your credentials or API connection.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-full overflow-y-auto bg-[linear-gradient(127deg,_#F7F5FC_5.71%,_#E8E1F4_40%,_#BDAADD_77.14%)] text-[#1c192d] flex flex-col items-center justify-center p-4 selection:bg-purple-200">
      {/* Centered Login Card */}
      <div className="w-full max-w-[360px] sm:max-w-[420px] bg-white/30 rounded-[24px] sm:rounded-[28px] border border-slate-200/60 shadow-xs p-6 sm:p-8 text-left my-auto">
        <img src={FullLogo} className="w-50 h-16 -mt-4" />

        {/* Title & Subtitle */}
        <h1 className="text-xl font-bold tracking-tight text-[#16122B] mt-2">
          Welcome back.
        </h1>
        {/* <p className="text-xs sm:text-sm text-slate-500 font-normal mt-2 leading-relaxed">
          A little check-in. A clearer picture of you.
          <br />
          Log in to your careMP Sentinel account.
        </p> */}

        <p className="text-xs text-slate-500 font-normal mt-2 leading-relaxed">
          Log in to your careMP Sentinel account.
        </p>

        {/* Error Alert if any */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200/70 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#18142b] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 transition-all"
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#18142b] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200/90 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 transition-all"
            />

            {/* Forgot Password Link */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() =>
                  alert("Password reset link will be sent to your email.")
                }
                className="text-xs font-medium text-[#6C56CE] hover:text-[#5842be] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#231D3C] hover:bg-[#2D264C] active:scale-[0.99] text-white text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>
        </form>

        {/* Auto-fill shortcut */}
        {/* <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">Demo Resident Account:</span>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer underline"
          >
            Auto-fill Demo
          </button>
        </div> */}

        {/* Footer Link */}
        {/* <div className="text-center mt-6 text-xs text-slate-500 font-normal">
          New to careMP Sentinel?{" "}
          <button
            type="button"
            onClick={() => alert("Registration will be available soon.")}
            className="font-semibold text-[#6C56CE] hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </div> */}
      </div>

      {/* Under-Card Subtitle */}
      <p className="text-xs text-slate-400 font-normal text-center mt-6 select-none">
        Your health, a little more understood.
      </p>
    </div>
  );
}

export default Login;
