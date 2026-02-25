import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRequestApproval } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

export default function WaitingApprovalPage() {
  const { clear } = useInternetIdentity();
  const requestApproval = useRequestApproval();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['isCallerApproved'] });
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-card rounded-3xl card-shadow border border-border p-10">
          <div className="w-20 h-20 rounded-full bg-warning/15 border-2 border-warning/30 flex items-center justify-center mx-auto mb-6 animate-pulse-ring">
            <Clock className="w-9 h-9 text-warning" />
          </div>

          <h1 className="font-poppins font-bold text-2xl text-foreground mb-3">
            Awaiting Approval
          </h1>
          <p className="text-muted-foreground font-inter text-sm leading-relaxed mb-8">
            Your account has been created and is pending review by an administrator. You'll be
            notified once your account is approved.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => requestApproval.mutate()}
              disabled={requestApproval.isPending || requestApproval.isSuccess}
              variant="outline"
              className="w-full h-11 rounded-xl font-poppins font-medium"
            >
              {requestApproval.isPending ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Sending request...
                </span>
              ) : requestApproval.isSuccess ? (
                'Request Sent ✓'
              ) : (
                'Request Approval'
              )}
            </Button>

            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="w-full h-11 rounded-xl font-poppins font-medium text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full h-11 rounded-xl font-poppins font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
