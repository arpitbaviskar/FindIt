import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from 'wouter';
import {
  getGetHomeSummaryQueryKey,
  getListObjectsQueryKey,
  getListObservationsQueryKey,
  ObjectCategory,
  useCreateObject,
  useCreateObservation,
  useListObjects,
} from '@workspace/api-client-react';
import { AnnotationCanvas } from '@/components/annotation-canvas';
import { MemoryImage } from '@/components/memory-image';
import { CategoryIcon } from '@/components/visual';
import { processImageFile, type ProcessedImage } from '@/lib/camera';

type ScanStep = 'capture' | 'preview' | 'select' | 'annotate' | 'review' | 'saved';

type DraftAnnotation = {
  objectId: number;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
};

const stepCopy: Record<Exclude<ScanStep, 'capture' | 'saved'>, string> = {
  preview: 'Preview',
  select: 'Object',
  annotate: 'Draw',
  review: 'Review',
};

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export default function ScanPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryClient = useQueryClient();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const { data: objects, isLoading: objectsLoading } = useListObjects();
  const createObservation = useCreateObservation();
  const createObject = useCreateObject();
  const queryObjectId = new URLSearchParams(search).get('objectId');
  const [step, setStep] = useState<ScanStep>('capture');
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [objectId, setObjectId] = useState(queryObjectId ?? '');
  const [annotations, setAnnotations] = useState<DraftAnnotation[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newObjectName, setNewObjectName] = useState('');
  const [newObjectCategory, setNewObjectCategory] = useState<string>('Household');
  const [error, setError] = useState('');

  const chooseFile = async (file?: File) => {
    if (!file) return;
    try {
      setError('');
      setImage(await processImageFile(file));
      setAnnotations([]);
      setEditingIndex(null);
      setStep('preview');
    } catch {
      setError('That image could not be opened. Please try another photo.');
    }
  };

  const selectedObject = objects?.find((item) => item.id === Number(objectId));
  const stepNumber = step === 'preview' ? 1 : step === 'select' ? 2 : step === 'annotate' ? 3 : 4;

  const beginAnnotation = () => {
    if (!objectId) {
      setError('Choose the object you want to mark first.');
      return;
    }
    setError('');
    setEditingIndex(null);
    setStep('annotate');
  };

  const confirmAnnotation = (rectangle: { x: number; y: number; width: number; height: number }) => {
    if (!image || !selectedObject) {
      setError('Choose an object before drawing its box.');
      return;
    }
    const next: DraftAnnotation = {
      ...rectangle,
      x: clamp(rectangle.x),
      y: clamp(rectangle.y),
      width: clamp(rectangle.width),
      height: clamp(rectangle.height),
      objectId: selectedObject.id,
      objectName: selectedObject.name,
      imageWidth: image.sourceWidth,
      imageHeight: image.sourceHeight,
    };
    setAnnotations((current) =>
      editingIndex === null
        ? [...current, next]
        : current.map((item, index) => (index === editingIndex ? next : item)),
    );
    setEditingIndex(null);
    setError('');
    setStep('review');
  };

  const createNewObject = () => {
    if (!newObjectName.trim()) {
      setError('Give the new object a name first.');
      return;
    }
    setError('');
    createObject.mutate(
      {
        data: {
          name: newObjectName.trim(),
          category: newObjectCategory as typeof ObjectCategory[keyof typeof ObjectCategory],
        },
      },
      {
        onSuccess: (created) => {
          void queryClient.invalidateQueries({ queryKey: getListObjectsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetHomeSummaryQueryKey() });
          setObjectId(String(created.id));
          setNewObjectName('');
          setStep('annotate');
        },
        onError: () => setError('We could not create that object. Please try again.'),
      },
    );
  };

  const saveObservation = () => {
    if (!image) {
      setError('Add a photo before saving.');
      return;
    }
    if (!annotations.length) {
      setError('Draw at least one box before saving this memory.');
      return;
    }
    const primaryObjectId = annotations[0].objectId;
    setError('');
    createObservation.mutate(
      {
        data: {
          objectId: primaryObjectId,
          image: image.dataUrl,
          timestamp: new Date().toISOString(),
          source: 'manual',
          annotations: annotations.map(({ objectId: annotatedObjectId, x, y, width, height, imageWidth, imageHeight }) => ({
            objectId: annotatedObjectId,
            x,
            y,
            width,
            height,
            imageWidth,
            imageHeight,
          })),
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getListObservationsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getListObjectsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetHomeSummaryQueryKey() });
          setObjectId(String(primaryObjectId));
          setStep('saved');
        },
        onError: () => setError('We could not save this memory. Check your connection and try again.'),
      },
    );
  };

  const draftImageAnnotations = annotations.map((annotation, index) => ({
    id: `draft-${index}`,
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    label: annotation.objectName,
  }));

  if (step === 'saved') {
    return (
      <div className="flex min-h-[76dvh] flex-col items-center justify-center text-center animate-appear">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-[1.8rem] bg-primary text-primary-foreground shadow-lift">
          <Check size={36} />
        </div>
        <p className="eyebrow mb-3">Memory saved</p>
        <h1 className="page-title">You’ll remember<br />this one.</h1>
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
          Your photo and {annotations.length === 1 ? 'annotation are' : `${annotations.length} annotations are`} safely in your pocket for next time.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link href={objectId ? `/objects/${objectId}` : '/'} className="primary-button" data-testid="link-saved-object">View memory</Link>
          <Link href="/" className="secondary-button" data-testid="link-saved-home">Back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-appear">
      <header className="mb-7 flex items-center justify-between">
        <Link href="/" className="grid h-10 w-10 place-items-center rounded-full bg-secondary" aria-label="Close scanner" data-testid="link-close-scan">
          <ArrowLeft size={19} />
        </Link>
        <div className="text-center">
          <p className="eyebrow">Visual memory</p>
          <p className="mt-1 text-xs text-muted-foreground">{step === 'capture' ? 'Ready when you are' : `${stepCopy[step as Exclude<ScanStep, 'capture' | 'saved'>]} · Step ${stepNumber} of 4`}</p>
        </div>
        <div className="h-10 w-10" />
      </header>

      {step === 'capture' && (
        <section>
          <div className="mb-8 text-center">
            <h1 className="page-title">What are you<br />looking at?</h1>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Take a photo of a thing where you see it. You’ll mark it by hand in the next step.</p>
          </div>
          <div className="card-surface relative mb-6 flex aspect-[4/3] items-center justify-center overflow-hidden border-2 border-dashed border-primary/30 bg-secondary/40">
            <div className="text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Camera size={30} /></div>
              <p className="font-semibold">Your photo goes here</p>
              <p className="mt-1 text-xs text-muted-foreground">A clear, simple frame works best.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => cameraRef.current?.click()} className="primary-button" data-testid="button-open-camera"><Camera size={19} />Open camera</button>
            <button type="button" onClick={() => galleryRef.current?.click()} className="secondary-button" data-testid="button-open-gallery"><ImagePlus size={19} />Gallery</button>
          </div>
          <input ref={cameraRef} onChange={(event) => void chooseFile(event.target.files?.[0])} type="file" accept="image/*" capture="environment" className="hidden" data-testid="input-scan-camera" />
          <input ref={galleryRef} onChange={(event) => void chooseFile(event.target.files?.[0])} type="file" accept="image/*" className="hidden" data-testid="input-scan-gallery" />
        </section>
      )}

      {step === 'preview' && image && (
        <section>
          <div className="mb-5">
            <p className="eyebrow mb-2">Image captured</p>
            <h1 className="page-title">That’s the<br />right moment.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Keep it, or take another photo before choosing what to mark.</p>
          </div>
          <div className="card-surface mb-5 overflow-hidden p-2">
            <img src={image.dataUrl} alt="Captured memory preview" className="max-h-[58dvh] w-full rounded-[1.1rem] object-contain" data-testid="image-capture-preview" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setStep('capture')} className="secondary-button"><RotateCcw size={17} />Retake</button>
            <button type="button" onClick={() => setStep('select')} className="primary-button"><ArrowRight size={17} />Continue</button>
          </div>
        </section>
      )}

      {step === 'select' && image && (
        <section>
          <div className="mb-6">
            <p className="eyebrow mb-2">Choose an object</p>
            <h1 className="page-title">What object are<br />you scanning?</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Pick one to draw its memory box. You can add another object after this one.</p>
          </div>
          <div className="space-y-3">
            {(objects ?? []).map((item) => {
              const selected = item.id === Number(objectId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { setObjectId(String(item.id)); setError(''); }}
                  className={`flex min-h-[4.6rem] w-full items-center gap-3 rounded-[1.25rem] border p-3 text-left transition ${selected ? 'border-primary bg-primary/10 shadow-lift' : 'border-border bg-card'}`}
                  data-testid={`button-scan-object-${item.id}`}
                >
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${selected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-primary'}`}><CategoryIcon category={item.category} /></div>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.name}</span><span className="mt-1 block text-xs text-muted-foreground">{item.category} · {item.observationCount} {item.observationCount === 1 ? 'memory' : 'memories'}</span></span>
                  {selected ? <Check size={19} className="text-primary" /> : <ChevronRight size={18} className="text-muted-foreground" />}
                </button>
              );
            })}
          </div>
          {!objectsLoading && !objects?.length && <p className="mt-4 text-sm text-muted-foreground">Create your first object below to start annotating.</p>}
          <div className="card-surface mt-5 p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold"><Plus size={17} className="text-primary" />Create new object</p>
            <div className="space-y-3">
              <input value={newObjectName} onChange={(event) => setNewObjectName(event.target.value)} className="soft-field" placeholder="e.g. My wallet" aria-label="New object name" data-testid="input-scan-new-object-name" />
              <select value={newObjectCategory} onChange={(event) => setNewObjectCategory(event.target.value)} className="soft-field" aria-label="New object category" data-testid="select-scan-new-object-category">
                {ObjectCategory && Object.keys(ObjectCategory).map((key) => <option key={key} value={ObjectCategory[key as keyof typeof ObjectCategory]}>{ObjectCategory[key as keyof typeof ObjectCategory]}</option>)}
              </select>
              <button type="button" onClick={createNewObject} disabled={createObject.isPending} className="secondary-button w-full" data-testid="button-scan-create-object">
                {createObject.isPending ? <LoaderCircle size={17} className="animate-spin" /> : <Plus size={17} />}
                {createObject.isPending ? 'Creating…' : 'Create and annotate'}
              </button>
            </div>
          </div>
          <button type="button" onClick={beginAnnotation} disabled={!objectId || objectsLoading} className="primary-button mt-5 w-full" data-testid="button-continue-to-annotate"><ArrowRight size={18} />Continue to annotation</button>
        </section>
      )}

      {step === 'annotate' && image && selectedObject && (
        <section>
          <div className="mb-5">
            <p className="eyebrow mb-2">{editingIndex === null ? 'Draw a memory box' : 'Redraw annotation'}</p>
            <h1 className="page-title">Mark {selectedObject.name}.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Use one finger to drag from one corner of the object to the other.</p>
          </div>
          <AnnotationCanvas
            imageSrc={image.dataUrl}
            imageWidth={image.width}
            imageHeight={image.height}
            existingRectangle={editingIndex === null ? null : annotations[editingIndex]}
            selectedObjectLabel={selectedObject.name}
            onRectangleChange={() => undefined}
            onConfirm={confirmAnnotation}
            confirmLabel={editingIndex === null ? 'Add this annotation' : 'Update annotation'}
          />
          <button type="button" onClick={() => { setEditingIndex(null); setStep('select'); }} className="secondary-button mt-3 w-full"><ArrowLeft size={17} />Choose a different object</button>
        </section>
      )}

      {step === 'review' && image && (
        <section>
          <div className="mb-5">
            <p className="eyebrow mb-2">Review your memory</p>
            <h1 className="page-title">{annotations.length} {annotations.length === 1 ? 'object' : 'objects'} marked.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Everything looks good? Save this image, or keep adding objects to the same frame.</p>
          </div>
          <MemoryImage imageSrc={image.dataUrl} imageWidth={image.width} imageHeight={image.height} annotations={draftImageAnnotations} alt="Annotated memory preview" className="mb-5" />
          <div className="card-surface mb-5 p-4">
            <div className="mb-3 flex items-center justify-between"><p className="font-semibold">Annotations</p><span className="text-xs text-muted-foreground">{annotations.length} saved here</span></div>
            <div className="space-y-2">
              {annotations.map((annotation, index) => (
                <div key={`${annotation.objectId}-${index}`} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3" data-testid={`row-draft-annotation-${index}`}>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card text-primary"><Check size={16} /></div>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{annotation.objectName}</p>
                  <button type="button" onClick={() => { setObjectId(String(annotation.objectId)); setEditingIndex(index); setStep('annotate'); }} className="grid h-10 w-10 place-items-center rounded-xl bg-card text-primary" aria-label={`Redraw ${annotation.objectName}`} data-testid={`button-redraw-annotation-${index}`}><Pencil size={16} /></button>
                  <button type="button" onClick={() => setAnnotations((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-xl bg-card text-destructive" aria-label={`Delete ${annotation.objectName}`} data-testid={`button-delete-annotation-${index}`}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setObjectId(''); setEditingIndex(null); setStep('select'); }} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-semibold text-primary" data-testid="button-add-another-annotation"><Plus size={17} />Add another object</button>
          </div>
          <details className="mb-5 rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold text-muted-foreground">Details for this annotation</summary>
            <div className="mt-3 space-y-2 font-mono text-xs text-muted-foreground">
              {annotations.map((annotation) => <p key={`${annotation.objectId}-${annotation.x}`}><span className="text-foreground">{annotation.objectName}:</span> x {annotation.x.toFixed(3)} · y {annotation.y.toFixed(3)} · w {annotation.width.toFixed(3)} · h {annotation.height.toFixed(3)}</p>)}
            </div>
          </details>
          <button type="button" onClick={saveObservation} disabled={createObservation.isPending} className="primary-button w-full" data-testid="button-save-annotated-observation">
            {createObservation.isPending ? <LoaderCircle size={18} className="animate-spin" /> : <Check size={18} />}
            {createObservation.isPending ? 'Saving memory…' : 'Save memory'}
          </button>
          <button type="button" onClick={() => { setAnnotations([]); setStep('capture'); }} className="secondary-button mt-3 w-full"><RefreshCcw size={17} />Cancel without saving</button>
        </section>
      )}

      {error && <p className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert" data-testid="status-scan-error">{error}</p>}
    </div>
  );
}