import { ArrowLeft, Camera, Check, ImagePlus, LoaderCircle, RefreshCcw, ScanLine } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from 'wouter';
import { getGetHomeSummaryQueryKey, getListObservationsQueryKey, getListObjectsQueryKey, useCreateObservation, useListObjects } from '@workspace/api-client-react';
import { resizeImageFile } from '@/lib/camera';

type ScanStep = 'capture' | 'review' | 'saved';

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { data: objects, isLoading: objectsLoading } = useListObjects();
  const createObservation = useCreateObservation();
  const queryObjectId = new URLSearchParams(search).get('objectId');
  const [step, setStep] = useState<ScanStep>('capture');
  const [image, setImage] = useState('');
  const [objectId, setObjectId] = useState(queryObjectId ?? '');
  const [error, setError] = useState('');
  const chooseFile = async (file?: File) => { if (!file) return; try { setError(''); setImage(await resizeImageFile(file)); setStep('review'); } catch { setError('That image could not be opened. Please try another.'); } };
  const saveObservation = () => {
    if (!objectId) { setError('Choose which object this memory belongs to.'); return; }
    if (!image) { setError('Add a photo before saving.'); return; }
    setError('');
    createObservation.mutate({ data: { objectId: Number(objectId), image, timestamp: new Date().toISOString(), source: 'manual' } }, { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: getListObservationsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getListObjectsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getGetHomeSummaryQueryKey() }); setStep('saved'); }, onError: () => setError('We could not save this memory. Please try again.') });
  };
  if (step === 'saved') return <div className="flex min-h-[76dvh] flex-col items-center justify-center text-center animate-appear"><div className="mb-6 grid h-20 w-20 place-items-center rounded-[1.8rem] bg-primary text-primary-foreground shadow-lift"><Check size={36} /></div><p className="eyebrow mb-3">Memory saved</p><h1 className="page-title">You’ll remember<br />this one.</h1><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Your latest sighting is safely in your pocket for next time.</p><div className="mt-8 flex w-full max-w-xs flex-col gap-3"><Link href={objectId ? `/objects/${objectId}` : '/'} className="primary-button" data-testid="link-saved-object">View memory</Link><Link href="/" className="secondary-button" data-testid="link-saved-home">Back home</Link></div></div>;
  return <div className="animate-appear">
    <header className="mb-8 flex items-center justify-between"><Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-secondary" aria-label="Close scanner" data-testid="link-close-scan"><ArrowLeft size={19} /></Link><div className="text-center"><p className="eyebrow">Visual memory</p><p className="mt-1 text-xs text-muted-foreground">Step {step === 'capture' ? '1' : '2'} of 2</p></div><div className="h-10 w-10" /></header>
    {step === 'capture' && <section><div className="mb-8 text-center"><h1 className="page-title">What are you<br />looking at?</h1><p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Take a photo of a thing where you see it. A clear, simple frame works best.</p></div><div className="card-surface relative mb-6 flex aspect-[4/3] items-center justify-center overflow-hidden border-2 border-dashed border-primary/30 bg-secondary/40">{image ? <img src={image} alt="Selected memory preview" className="absolute inset-0 h-full w-full object-cover" /> : <div className="text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><ScanLine size={30} /></div><p className="font-semibold">Your photo goes here</p><p className="mt-1 text-xs text-muted-foreground">Nothing leaves your device until you save</p></div>}</div><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => cameraRef.current?.click()} className="primary-button" data-testid="button-open-camera"><Camera size={19} />Open camera</button><button type="button" onClick={() => galleryRef.current?.click()} className="secondary-button" data-testid="button-open-gallery"><ImagePlus size={19} />Gallery</button></div><input ref={cameraRef} onChange={(event) => void chooseFile(event.target.files?.[0])} type="file" accept="image/*" capture="environment" className="hidden" data-testid="input-scan-camera" /><input ref={galleryRef} onChange={(event) => void chooseFile(event.target.files?.[0])} type="file" accept="image/*" className="hidden" data-testid="input-scan-gallery" /></section>}
     {step === 'review' && <section><div className="mb-6"><p className="eyebrow mb-2">Image captured</p><h1 className="page-title">What would you<br />like to do?</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">For now, choose the object this photo belongs to. Vision matching arrives in Step 2.</p></div><div className="card-surface mb-5 overflow-hidden"><img src={image} alt="Captured memory" className="h-56 w-full object-cover" /><button type="button" onClick={() => setStep('capture')} className="flex min-h-12 w-full items-center justify-center gap-2 text-sm font-semibold text-primary" data-testid="button-retake"><RefreshCcw size={16} />Retake photo</button></div><label className="mb-2 block text-sm font-semibold" htmlFor="scan-object">This is a photo of…</label><select id="scan-object" value={objectId} onChange={(event) => setObjectId(event.target.value)} className="soft-field" disabled={objectsLoading} data-testid="select-scan-object"><option value="">{objectsLoading ? 'Loading your objects…' : 'Choose an object'}</option>{(objects ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{!objectsLoading && !objects?.length && <p className="mt-3 text-sm text-muted-foreground">You need an object before saving. <Link href="/objects/new" className="font-semibold text-primary" data-testid="link-scan-new-object">Add one now</Link></p>}{error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert" data-testid="status-scan-error">{error}</p>}<button type="button" onClick={saveObservation} disabled={createObservation.isPending || !objects?.length} className="primary-button mt-6 w-full" data-testid="button-save-observation">{createObservation.isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Check size={18} />}{createObservation.isPending ? 'Saving memory…' : 'Save as observation'}</button></section>}
  </div>;
}