import { Box, Camera, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import type { Observation, Object as FindObject } from '@workspace/api-client-react';
import type { ReactNode } from 'react';

export const categoryLabels = ['Electronics', 'Accessories', 'Documents', 'Clothing', 'Household', 'Other'] as const;

export function ObjectImage({ item, observation, className = '' }: { item?: FindObject; observation?: Observation; className?: string }) {
  const src = observation?.image ?? item?.referenceImage;
  return (
    <div className={`image-placeholder overflow-hidden ${className}`}>
      {src ? <img src={src} alt={observation?.objectName ?? item?.name ?? 'Saved memory'} className="h-full w-full object-cover" /> : <Box size={26} strokeWidth={1.4} />}
    </div>
  );
}

export function CategoryIcon({ category, size = 19 }: { category?: string; size?: number }) {
  const Icon = category === 'Electronics' ? Camera : category === 'Documents' ? ImageIcon : category === 'Household' ? Sparkles : Box;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function ObservationMeta({ observation }: { observation: Observation }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>{formatRelativeDate(observation.timestamp)}</span>
      {observation.locationName && <span className="inline-flex items-center gap-1"><MapPin size={12} />{observation.locationName}</span>}
    </div>
  );
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'Recently';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

export function EmptyState({ icon: Icon = Box, title, copy, action }: { icon?: typeof Box; title: string; copy: string; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <div className="animate-breathe mb-5 grid h-16 w-16 place-items-center rounded-[1.35rem] bg-secondary text-primary"><Icon size={28} strokeWidth={1.5} /></div>
      <h2 className="section-title">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{copy}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3" aria-label="Loading">
    {Array.from({ length: rows }).map((_, index) => <div key={index} className="card-surface flex h-24 animate-pulse items-center gap-4 p-4"><div className="h-16 w-16 rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded-full bg-muted" /><div className="h-3 w-1/2 rounded-full bg-muted" /></div></div>)}
  </div>;
}

export function ErrorState({ retry }: { retry: () => void }) {
  return <div className="card-surface px-6 py-10 text-center"><p className="font-semibold">That memory is taking a moment.</p><p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p><button onClick={retry} className="secondary-button mt-5" data-testid="button-retry">Try again</button></div>;
}