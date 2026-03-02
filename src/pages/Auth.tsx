import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Shield, User, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, "Name is required").max(100),
});

type Mode = "login" | "signup";
type LoginType = "customer" | "admin";

const Auth = () => {
  const { user, role, loading: authLoading } = useAuth();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loginType, setLoginType] = useState<LoginType>("customer");
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (!authLoading && user) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === "signup" ? signupSchema : loginSchema;
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    if (mode === "signup") {
      const { error } = await signUp(form.email, form.password, form.fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! You're now logged in.");
      }
    } else {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  const inputClass = (field: string) =>
    `w-full bg-muted text-foreground rounded-lg px-4 py-3 text-sm outline-none border transition-shadow ${
      errors[field] ? "border-destructive" : "border-border focus:ring-2 focus:ring-ring"
    }`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <a href="/" className="font-heading text-3xl font-bold text-foreground">
            Starline Builder's<span className="text-gold"> Ltd.</span>
          </a>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "login" ? "Welcome back! Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-lg">
          {/* Login type toggle (only on login) */}
          {mode === "login" && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setLoginType("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginType === "customer"
                    ? "bg-gold-gradient text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <User size={16} />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setLoginType("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  loginType === "admin"
                    ? "bg-gold-gradient text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield size={16} />
                Admin
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className={inputClass("fullName")}
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName}</p>}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={inputClass("email")}
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className={inputClass("password")}
              />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-gradient text-accent-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === "login" ? (
                <LogIn size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {mode === "login" ? `Sign In as ${loginType === "admin" ? "Admin" : "Customer"}` : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); }}
                className="text-gold font-medium hover:underline"
              >
                {mode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
