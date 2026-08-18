import { Camera, ChevronRight, Clock3, ScanLine } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { useGetObject, useListObservations } from '@workspace/api-client-react';
import { PageHeader } from '@/components/app-shell';
import { CategoryIcon, ErrorState, formatRelativeDate, LoadingState, ObjectImage, ObservationMeta } from '@/components/visual';
import { MemoryImage } from '@/components/memory-image';

export default function ObjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const objectQuery = useGetObject(id);
  const observationsQuery = useListObservations();
  const item = objectQuery.data;
  const observations = (observationsQuery.data ?? []).filter((observation) => observation.objectId === id);
  if (objectQuery.isLoading) return <LoadingState rows={3} />;
  if (objectQuery.isError || !item) return <ErrorState retry={() => void objectQuery.refetch()} />;
   return <div className="animate-appear"><PageHeader back="/objects" eyebrow={item.category} title={item.name} subtitle={item.description ?? 'A little visual note to help you find it again.'} /><div className="mb-3 overflow-hidden rounded-[1.5rem] bg-secondary"><ObjectImage item={item} className="h-56 w-full sm:h-72" /></div><p className="mb-6 text-sm text-muted-foreground">Created {formatRelativeDate(item.createdAt)}</p>
    <div className="mb-8"><Link href={`/scan?objectId=${item.id}`} className="primary-button w-full" data-testid="link-detail-scan"><ScanLine size={18} />Scan this object</Link></div>
    <div className="card-surface mb-7 flex items-center justify-between p-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><CategoryIcon category={item.category} /></div><div><p className="text-xs text-muted-foreground">Saved memories</p><p className="font-semibold">{item.observationCount}</p></div></div><div className="text-right"><p className="text-xs text-muted-foreground">Last seen</p><p className="font-semibold">{observations[0] ? formatRelativeDate(observations[0].timestamp) : 'Not yet'}</p></div></div>
    <section><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Memory trail</h2><span className="text-xs text-muted-foreground">{observations.length} saved</span></div>
      {observationsQuery.isLoading && <LoadingState rows={2} />}
      {!observationsQuery.isLoading && !observations.length && <div className="rounded-2xl bg-secondary/60 px-5 py-8 text-center"><Camera size={24} className="mx-auto mb-2 text-primary" /><p className="font-semibold">No sightings yet</p><p className="mt-1 text-sm text-muted-foreground">Scan when you see it, and this trail will grow.</p></div>}
       <div className="space-y-4">{observations.map((observation) => <div key={observation.id} className="card-surface p-3" data-testid={`card-detail-observation-${observation.id}`}>
         {observation.image ? <MemoryImage imageSrc={observation.image} imageWidth={observation.annotations[0]?.imageWidth ?? 4} imageHeight={observation.annotations[0]?.imageHeight ?? 3} annotations={observation.annotations.map((annotation) => ({ id: annotation.id, x: annotation.x, y: annotation.y, width: annotation.width, height: annotation.height, label: annotation.objectName }))} alt={`${item.name} visual memory`} className="mb-3" /> : <ObjectImage observation={observation} className="mb-3 h-40 rounded-xl" />}
         <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="font-semibold">{formatRelativeDate(observation.timestamp)}</p><div className="mt-1"><ObservationMeta observation={observation} /></div>{observation.source && <p className="mt-2 inline-flex items-center gap-1 text-xs text-primary"><Clock3 size={12} />{observation.source === 'manual' ? 'Added by you' : observation.source}</p>}</div><ChevronRight size={16} className="mt-1 text-muted-foreground" /></div>
       </div>)}</div>
    </section>
  </div>;
}