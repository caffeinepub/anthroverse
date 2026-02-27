import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

export default function WaitingForApproval() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="pt-8 pb-8 px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-100 dark:bg-amber-950/30 rounded-full">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-3">
            Awaiting Approval
          </h2>

          <p className="text-muted-foreground mb-2 leading-relaxed">
            Your account has been registered and is pending admin approval.
          </p>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            You'll be notified once your account is approved. This usually takes a short time.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
