import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Waves } from "lucide-react";
import longLogo from "@/assets/branding/logo pendek.png";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { validateEmail, sanitizeInput } from "../../utils/security";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) navigate("/admin/dashboard");
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!validateEmail(formData.email))
      newErrors.email = "Invalid email address";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login({
        email: sanitizeInput(formData.email),
        password: formData.password,
      });
      addToast("Login successful!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      addToast(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — ocean/nature branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(155deg, #0c4a6e 0%, #0d9488 60%, #166534 100%)",
        }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/3 -right-12 w-48 h-48 rounded-full opacity-5 bg-white" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={longLogo} alt="TripXB" className="h-12 w-auto" />
            <span className="text-2xl font-bold tracking-tight">TripXB</span>
          </div>
          <p className="text-teal-100 text-sm">Admin Panel</p>
        </div>

        <div className="relative z-10">
          <Waves className="h-10 w-10 mb-6 text-teal-200 opacity-80" />
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Manage your
            <br />
            travel experiences
          </h2>
          <p className="text-sky-100 text-base leading-relaxed max-w-sm">
            From Lagoi Bay to the mountain peaks — curate, publish, and track
            every journey from one place.
          </p>
        </div>

        <p className="relative z-10 text-xs text-sky-200 opacity-60">
          © {new Date().getFullYear()} TripXB · Exclusive Trip
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-sky-50 p-6">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img src={longLogo} alt="TripXB" className="h-14 w-auto mb-2" />
            <span className="text-xl font-bold text-sky-900">TripXB</span>
            <span className="text-xs text-gray-400 tracking-widest uppercase mt-1">
              Admin Panel
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-sky-900">Welcome back</h1>
              <p className="text-gray-500 text-sm mt-1">
                Sign in to your admin account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      errors.email
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-gray-50 focus:bg-white"
                    }`}
                    placeholder="admin@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-11 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                      errors.password
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-gray-50 focus:bg-white"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-sky-700 to-teal-600 hover:from-sky-800 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-teal-600 transition-colors"
            >
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
