import { ReactNode } from 'react';
import { UnlockCard } from './UnlockCard';

interface LockedPanelProps {
  locked: boolean;
  tabName: string;
  otherTabs: string[];
  routeId: string;
  availableSlots: number;
  onRedeem: () => Promise<boolean>;
  children: ReactNode;
}

export const LockedPanel = ({ locked, tabName, otherTabs, routeId, availableSlots, onRedeem, children }: LockedPanelProps) => {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[5px] max-h-[620px] overflow-hidden" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surfacebase/60 to-surfacebase" />
      <div className="absolute inset-x-0 bottom-0 flex justify-center px-2 pb-2">
        <UnlockCard
          tabName={tabName}
          otherTabs={otherTabs}
          routeId={routeId}
          availableSlots={availableSlots}
          onRedeem={onRedeem}
        />
      </div>
    </div>
  );
};
