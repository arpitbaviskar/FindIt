import { ArrowRight, Camera, LibraryBig, MapPin, Plus, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { getGetHomeSummaryQueryKey, getListObjectsQueryKey, getListObservationsQueryKey, useGetHomeSummary, useLoadDemoData } from '@workspace/api-client-react';
import { EmptyState, ErrorState, formatRelativeDate, LoadingState, ObjectImage } from '@/components/visual';

export default function Home() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading, isError, refetch } = useGetHomeSummary();
  const demo = useLoadDemoData();
  const recent = summary?.recentObservations ?? [];
  const isEmpty = !isLoading && !isError && (summary?.objectCount ?? 0) === 0;
  const loadDemo = () => demo.mutate(undefined, { onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: getGetHomeSummaryQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListObjectsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getListObservationsQueryKey() });
  }});

  return (
    <div className="animate-appear">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <p className="eyebrow mb-2">FindIt · Your visual memory</p>
          <h1 className="page-title">Your things,<br />easy to find.</h1>
          <p className="mt-3 max-w-[16rem] text-[.94rem] leading-6 text-muted-foreground">Remember where you last saw your things.</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><Sparkles size={20} /></div>
      </header>
      {isLoading && <LoadingState rows={2} />}
      {isError && <ErrorState retry={() => void refetch()} />}
      {isEmpty && <EmptyState icon={LibraryBig} title="Nothing to remember yet" copy="Start with one everyday thing. A photo now makes finding it later feel easy." action={<div className="flex flex-col gap-3 sm:flex-row"><Link href="/scan" className="primary-button" data-testid="link-empty-scan"><Camera size={18} />Scan a memory</Link><Link href="/objects" className="secondary-button" data-testid="link-empty-objects"><LibraryBig size={18} />My objects</Link><Link href="/history" className="secondary-button" data-testid="link-empty-history">History</Link><button onClick={loadDemo} disabled={demo.isPending} className="secondary-button" data-testid="button-load-demo">{demo.isPending ? 'Preparing…' : 'See an example'}</button></div>} />}
      {!isLoading && !isError && !isEmpty && (
        <>
          <section className="card-surface mb-6 overflow-hidden border-0 bg-primary p-5 text-primary-foreground shadow-lift">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-sm opacity-80">A little confidence goes a long way.</p><p className="mt-3 font-serif text-4xl tracking-tight">{summary?.objectCount ?? 0}</p><p className="mt-1 text-sm opacity-80">things in your pocket memory</p></div>
              <Link href="/scan" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-foreground transition-transform active:scale-95" data-testid="link-home-scan"><Camera size={24} /></Link>
            </div>
          </section>
          <div className="mb-8 grid grid-cols-2 gap-3">
            <Link href="/objects" className="card-surface flex min-h-28 flex-col justify-between p-4 transition-transform active:scale-[.98]" data-testid="link-home-objects"><LibraryBig size={20} className="text-primary" /><span><strong className="block font-serif text-2xl">{summary?.objectCount ?? 0}</strong><span className="text-xs text-muted-foreground">My objects</span></span></Link>
            <Link href="/history" className="card-surface flex min-h-28 flex-col justify-between p-4 transition-transform active:scale-[.98]" data-testid="link-home-history"><MapPin size={20} className="text-accent" /><span><strong className="block font-serif text-2xl">{summary?.observationCount ?? 0}</strong><span className="text-xs text-muted-foreground">Saved sightings</span></span></Link>
          </div>
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="section-title">Recently seen</h2><Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-primary" data-testid="link-home-see-all">See all <ArrowRight size={15} /></Link></div>
            {recent.length ? <div className="space-y-3">{recent.slice(0, 4).map((observation) => <Link key={observation.id} href={`/objects/${observation.objectId}`} className="card-surface flex items-center gap-4 p-3 transition-transform active:scale-[.99]" data-testid={`link-recent-${observation.id}`}><ObjectImage observation={observation} className="h-16 w-16 shrink-0 rounded-xl" /><div className="min-w-0"><p className="truncate font-semibold">{observation.objectName}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(observation.timestamp)}</p></div><ArrowRight size={17} className="ml-auto shrink-0 text-muted-foreground" /></Link>)}</div> : <div className="rounded-2xl bg-secondary/60 px-5 py-7 text-center text-sm text-muted-foreground"><Plus className="mx-auto mb-2 text-primary" size={20} />Your saved sightings will land here.</div>}
          </section>
        </>
      )}
    </div>
  );
}