import React from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useRequestApproval } from "../hooks/useQueries";
import { Clock, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function WaitingForApproval() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const requestApproval = useRequestApproval();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync();
      toast.success("Approval request sent! An admin will review your account.");
    } catch {
      toast.error("Failed to send approval request");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/PSX_20260227_075738(1).jpg')" }}
      />
      <div className="absolute inset-0 auth-overlay" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-poppins text-2xl font-bold text-primary-700 mb-2">Pending Approval</h2>
          <p className="text-muted-foreground font-inter text-sm mb-6 leading-relaxed">
            Your account is awaiting approval from an administrator. You'll be notified once approved.
          </p>

          <button
            onClick={handleRequestApproval}
            disabled={requestApproval.isPending}
            className="w-full gradient-primary text-white font-poppins font-semibold py-3 rounded-xl mb-3 transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {requestApproval.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              "Request Approval"
            )}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground font-inter text-sm py-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
