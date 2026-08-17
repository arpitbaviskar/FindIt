import { Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useListObjects } from '@workspace/api-client-react';
import { CategoryIcon, EmptyState, ErrorState, formatRelativeDate, LoadingState, ObjectImage } from '@/components/visual';

export default function ObjectsPage() {
  const [search, setSearch] = useState('');
  const { data: objects, isLoading, isError, refetch } = useListObjects();
  const filtered = useMemo(() => (objects ?? []).filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [objects, search]);
  return <div className="animate-appear">
    <header className="mb-6 flex items-end justify-between gap-4"><div><p className="eyebrow mb-2">Your collection</p><h1 className="page-title">My objects</h1></div><Link href="/objects/new" className="primary-button h-12 min-h-0 w-12 rounded-2xl p-0" aria-label="Add object" data-testid="link-add-object"><Plus size={22} /></Link></header>
    <label className="relative mb-6 block"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="soft-field pl-11" placeholder="Search your things" type="search" data-testid="input-search-objects" /></label>
    {isLoading && <LoadingState />}
    {isError && <ErrorState retry={() => void refetch()} />}
    {!isLoading && !isError && !filtered.length && !search && <EmptyState title="Your shelf is waiting" copy="Add a few everyday essentials and FindIt will remember them with you." action={<Link href="/objects/new" className="primary-button" data-testid="link-empty-add"><Plus size={18} />Add an object</Link>} />}
    {!isLoading && !isError && !filtered.length && search && <EmptyState title="No match yet" copy={`Nothing in your collection is called “${search}”.`} />}
     {!!filtered.length && <div className="space-y-3">{filtered.map((item) => <Link key={item.id} href={`/objects/${item.id}`} className="card-surface flex items-center gap-4 p-3 transition-transform active:scale-[.99]" data-testid={`link-object-${item.id}`}><ObjectImage item={item} className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><CategoryIcon category={item.category} size={13} />{item.category}</p><p className="mt-2 text-xs text-muted-foreground">{item.observationCount} {item.observationCount === 1 ? 'memory' : 'memories'} · Added {formatRelativeDate(item.createdAt)}</p></div><span className="text-lg text-muted-foreground">›</span></Link>)}</div>}
  </div>;
}