interface WaitingForApprovalProps {
  onLogout: () => void;
}

export default function WaitingForApproval({ onLogout }: WaitingForApprovalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-4">
        <img
          src="/assets/generated/logo-mark.dim_256x256.png"
          alt="AnthroVerse"
          className="w-20 h-20 rounded-xl mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-foreground mb-2">Pending Approval</h2>
        <p className="text-muted-foreground mb-6">
          Your account is awaiting approval from an administrator. You'll be notified once your
          account has been approved.
        </p>
        <button
          onClick={onLogout}
          className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
