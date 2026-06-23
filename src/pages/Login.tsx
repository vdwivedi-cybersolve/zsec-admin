import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const Login = () => {
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/user";

  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      toast.error("Please enter both Login ID and Password");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(loginId.trim(), password);
      toast.success("Signed in");
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to sign in"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background dark px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-lg"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg font-medium text-foreground">
            IBM Security zSecure Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loginId" className="text-foreground">
              Login ID
            </Label>
            <Input
              id="loginId"
              autoFocus
              placeholder="Enter your Login ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="bg-carbon-field border-border text-foreground"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-carbon-field border-border text-foreground"
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
