import React, { useState } from 'react';
import { useListApprovals, useStartNewTenure } from '../../hooks/useQueries';
import { ApprovalStatus } from '../../backend';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCw, Loader2, Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { dateToNanoseconds } from '../../utils/time';
import { Principal } from '@icp-sdk/core/principal';

export default function TenureManagement() {
  const { data: approvals = [] } = useListApprovals();
  const startNewTenure = useStartNewTenure();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [president, setPresident] = useState('');
  const [vicePresident, setVicePresident] = useState('');
  const [secretaryTreasurer, setSecretaryTreasurer] = useState('');
  const [tenurePeriod, setTenurePeriod] = useState<'apr-sep' | 'oct-mar'>('apr-sep');

  const approvedUsers = approvals.filter(a => a.status === ApprovalStatus.approved);

  const getTenureDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    if (tenurePeriod === 'apr-sep') {
      return {
        start: new Date(year, 3, 1),
        end: new Date(year, 8, 30),
      };
    } else {
      return {
        start: new Date(year, 9, 1),
        end: new Date(year + 1, 2, 31),
      };
    }
  };

  const handleStartTenure = async () => {
    if (!president || !vicePresident || !secretaryTreasurer) {
      toast.error('Please select all three officers');
      return;
    }

    const { start, end } = getTenureDates();

    try {
      await startNewTenure.mutateAsync({
        president: Principal.fromText(president),
        vicePresident: Principal.fromText(vicePresident),
        secretaryTreasurer: Principal.fromText(secretaryTreasurer),
        startDate: dateToNanoseconds(start),
        endDate: dateToNanoseconds(end),
      });
      toast.success('New tenure started successfully!');
      setOpen(false);
      setStep(1);
      setPresident('');
      setVicePresident('');
      setSecretaryTreasurer('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start new tenure';
      toast.error(msg);
    }
  };

  const handleClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep(1);
      setPresident('');
      setVicePresident('');
      setSecretaryTreasurer('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
          <RefreshCw size={15} />
          Start New Tenure
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl flex items-center gap-2">
            <Crown size={20} className="text-amber-500" />
            Start New Tenure
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-semibold mb-1">Warning: Role Reset</p>
                <p className="text-xs opacity-80">
                  Starting a new tenure will revoke all elevated roles and reset everyone to Member.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Tenure Period</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['apr-sep', 'oct-mar'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setTenurePeriod(period)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      tenurePeriod === period
                        ? 'border-accent bg-accent/10 text-foreground'
                        : 'border-border text-muted-foreground hover:border-accent/50'
                    }`}
                  >
                    {period === 'apr-sep' ? 'Apr 1 – Sep 30' : 'Oct 1 – Mar 31'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl gold-gradient text-cosmic-deep border-0 font-semibold hover:opacity-90"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the new officers for this tenure period.
            </p>

            {[
              { label: 'President', value: president, setter: setPresident },
              { label: 'Vice President', value: vicePresident, setter: setVicePresident },
              { label: 'Secretary Treasurer', value: secretaryTreasurer, setter: setSecretaryTreasurer },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <Select value={value} onValueChange={setter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder={`Select ${label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedUsers.map(user => (
                      <SelectItem
                        key={user.principal.toString()}
                        value={user.principal.toString()}
                        className="text-xs"
                      >
                        {user.principal.toString().slice(0, 28)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">
                Back
              </Button>
              <Button
                onClick={handleStartTenure}
                disabled={startNewTenure.isPending || !president || !vicePresident || !secretaryTreasurer}
                className="flex-1 rounded-xl gold-gradient text-cosmic-deep border-0 font-semibold hover:opacity-90"
              >
                {startNewTenure.isPending ? (
                  <><Loader2 size={14} className="animate-spin mr-1.5" />Starting...</>
                ) : (
                  'Start Tenure'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
