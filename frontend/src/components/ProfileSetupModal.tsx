import React, { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRegisterUser } from "../hooks/useQueries";
import { ROOT_ADMIN_EMAIL, isRootAdminEmail } from "../lib/utils";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const registerUser = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await registerUser.mutateAsync({ name: name.trim(), email: email.trim() });
      if (isRootAdminEmail(email)) {
        toast.success("Welcome, Root Admin! You have full system access.");
      } else {
        toast.success("Profile created! Waiting for admin approval.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create profile");
    }
  };

  const isRootAdmin = isRootAdminEmail(email);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/PSX_20260227_075738(1).jpg')" }}
      />
      <div className="absolute inset-0 auth-overlay" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-poppins text-2xl font-bold text-primary-700">Set Up Your Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">Welcome to AnthroVerse</p>
          </div>

          {isRootAdmin && (
            <div className="mb-4 p-3 rounded-xl bg-gold-50 border border-gold text-sm text-center font-poppins font-semibold text-primary-700">
              🌟 Root Admin Account Detected
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1 font-poppins">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1 font-poppins">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-inter text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={registerUser.isPending}
              className="w-full gradient-primary text-white font-poppins font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {registerUser.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating Profile…</>
              ) : (
                "Create Profile"
              )}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4 font-inter">
            Principal: {identity?.getPrincipal().toString().slice(0, 20)}…
          </p>
        </div>
      </div>
    </div>
  );
}
