import { CalendarDays, MapPin, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useListObservations } from '@workspace/api-client-react';
import { EmptyState, ErrorState, formatRelativeDate, LoadingState, ObjectImage } from '@/components/visual';

export default function HistoryPage() {
  const [filter, setFilter] = useState('All');
  const { data: observations, isLoading, isError, refetch } = useListObservations();
  const objectNames = useMemo(() => ['All', ...Array.from(new Set((observations ?? []).map((item) => item.objectName)))], [observations]);
  const filtered = (observations ?? []).filter((item) => filter === 'All' || item.objectName === filter);
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => { const key = new Date(item.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); (acc[key] ??= []).push(item); return acc; }, {});
  return <div className="animate-appear"><header className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">A gentle paper trail</p><h1 className="page-title">History</h1></div><div className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><CalendarDays size={20} /></div></header>
    {isLoading && <LoadingState rows={4} />}{isError && <ErrorState retry={() => void refetch()} />}
     {!isLoading && !isError && !observations?.length && <EmptyState icon={CalendarDays} title="No visual memories yet" copy="Scan your surroundings to start building your visual memory." />}
    {!!observations?.length && <><div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1"><SlidersHorizontal size={16} className="shrink-0 text-muted-foreground" />{objectNames.map((name) => <button key={name} type="button" onClick={() => setFilter(name)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`} data-testid={`button-history-filter-${name.toLowerCase().replaceAll(' ', '-')}`}>{name}</button>)}</div>{Object.entries(grouped).map(([day, items]) => <section key={day} className="mb-7"><h2 className="mb-3 text-sm font-bold text-muted-foreground">{day}</h2><div className="space-y-3">{items.map((item) => <div key={item.id} className="card-surface flex gap-3 p-3" data-testid={`card-history-${item.id}`}><ObjectImage observation={item} className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="font-semibold">{item.objectName}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(item.timestamp)}</p>{(item.locationName || item.latitude) && <p className="mt-2 flex items-center gap-1 text-xs text-primary"><MapPin size={12} />{item.locationName ?? 'Saved location'}</p>}</div></div>)}</div></section>)}</>}
  </div>;
}