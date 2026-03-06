import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import longLogo from "@/assets/branding/logo pendek.png";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { validateEmail, sanitizeInput } from "../../utils/security";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await login({
        email: sanitizeInput(formData.email),
        password: formData.password,
      });
      addToast("Login successful!", "success");
      navigate("/admin/dashboard");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.";
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #11111b 0%, #181825 50%, #1e1e2e 100%)",
      }}
    >
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={longLogo}
            alt="Bintan Batam Exclusive Trip"
            className="mx-auto mb-4 h-16 w-auto select-none"
          />
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#585b70" }}
          >
            Admin Panel
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "#181825",
            border: "1px solid #313244",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
          }}
        >
          <h2 className="text-xl font-bold mb-6" style={{ color: "#cdd6f4" }}>
            Masuk
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "#a6adc8" }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#585b70" }}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#11111b",
                    border: errors.email
                      ? "1.5px solid #f38ba8"
                      : "1.5px solid #313244",
                    color: "#cdd6f4",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#89b4fa";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.email
                      ? "#f38ba8"
                      : "#313244";
                  }}
                  placeholder="admin@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs" style={{ color: "#f38ba8" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: "#a6adc8" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#585b70" }}
                />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "#11111b",
                    border: errors.password
                      ? "1.5px solid #f38ba8"
                      : "1.5px solid #313244",
                    color: "#cdd6f4",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#89b4fa";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.password
                      ? "#f38ba8"
                      : "#313244";
                  }}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs" style={{ color: "#f38ba8" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all mt-2 flex items-center justify-center gap-2"
              style={{
                background: isLoading
                  ? "#45475a"
                  : "linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)",
                color: "#1e1e2e",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Masuk..." : "Masuk"}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm transition-colors"
            style={{ color: "#45475a" }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#89b4fa";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#45475a";
            }}
          >
            ← Kembali ke situs
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
