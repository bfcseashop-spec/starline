import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import starlineLogo from "@/assets/starline-logo.png";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(128),
});

const Auth = () => {
  const { user, role, loading: authLoading, signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
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
    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    // On success, useAuth resolves the role and the redirect above handles routing.
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
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img src={starlineLogo} alt="Starline Builder's Ltd." className="w-24 h-24 rounded-2xl object-contain shadow-lg" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Starline Builder's<span className="text-gold"> Ltd.</span>
            </h1>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
              Invest Smart. Live Better
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-foreground text-center mb-2">Sign In</h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            We'll take you to the right portal based on your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              Sign In
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
