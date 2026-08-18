import { CalendarDays, MapPin, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useListObservations } from '@workspace/api-client-react';
import { EmptyState, ErrorState, formatRelativeDate, LoadingState, ObjectImage } from '@/components/visual';
import { MemoryImage } from '@/components/memory-image';

export default function HistoryPage() {
  const [filter, setFilter] = useState('All');
  const { data: observations, isLoading, isError, refetch } = useListObservations();
  const objectNames = useMemo(() => ['All', ...Array.from(new Set((observations ?? []).map((item) => item.objectName)))], [observations]);
  const filtered = (observations ?? []).filter((item) => filter === 'All' || item.objectName === filter);
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => { const key = new Date(item.timestamp).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); (acc[key] ??= []).push(item); return acc; }, {});
  return <div className="animate-appear"><header className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">A gentle paper trail</p><h1 className="page-title">History</h1></div><div className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><CalendarDays size={20} /></div></header>
    {isLoading && <LoadingState rows={4} />}{isError && <ErrorState retry={() => void refetch()} />}
     {!isLoading && !isError && !observations?.length && <EmptyState icon={CalendarDays} title="No visual memories yet" copy="Scan your surroundings to start building your visual memory." />}
       {!!observations?.length && <><div className="mb-7 flex items-center gap-2 overflow-x-auto pb-1"><SlidersHorizontal size={16} className="shrink-0 text-muted-foreground" />{objectNames.map((name) => <button key={name} type="button" onClick={() => setFilter(name)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${filter === name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`} data-testid={`button-history-filter-${name.toLowerCase().replaceAll(' ', '-')}`}>{name}</button>)}</div>{Object.entries(grouped).map(([day, items]) => <section key={day} className="mb-7"><h2 className="mb-3 text-sm font-bold text-muted-foreground">{day}</h2><div className="space-y-4">{items.map((item) => <div key={item.id} className="card-surface p-3" data-testid={`card-history-${item.id}`}>
         {item.image ? <MemoryImage imageSrc={item.image} imageWidth={item.annotations[0]?.imageWidth ?? 4} imageHeight={item.annotations[0]?.imageHeight ?? 3} annotations={item.annotations.map((annotation) => ({ id: annotation.id, x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height, label: annotation.objectName }))} alt={`${item.objectName} visual memory`} className="mb-3" /> : <ObjectImage observation={item} className="mb-3 h-40 rounded-xl" />}
         <div className="min-w-0"><p className="font-semibold">{item.objectName}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(item.timestamp)}</p>{(item.locationName || item.latitude) && <p className="mt-2 flex items-center gap-1 text-xs text-primary"><MapPin size={12} />{item.locationName ?? 'Saved location'}</p>}</div>
       </div>)}</div></section>)}</>}
  </div>;
}