import { ImagePlus, LoaderCircle, Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getGetHomeSummaryQueryKey, getListObjectsQueryKey, ObjectCategory, useCreateObject } from '@workspace/api-client-react';
import { PageHeader } from '@/components/app-shell';
import { categoryLabels } from '@/components/visual';
import { resizeImageFile } from '@/lib/camera';

export default function NewObjectPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createObject = useCreateObject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Household');
  const [description, setDescription] = useState('');
  const [referenceImage, setReferenceImage] = useState('');
  const [error, setError] = useState('');
  const handleFile = async (file?: File) => { if (!file) return; try { setReferenceImage(await resizeImageFile(file)); } catch { setError('We could not use that photo. Try another one.'); } };
  const submit = () => {
    if (!name.trim()) { setError('Give this object a name first.'); return; }
    setError('');
    createObject.mutate({ data: { name: name.trim(), category: category as typeof ObjectCategory[keyof typeof ObjectCategory], description: description.trim() || undefined, referenceImage: referenceImage || undefined } }, { onSuccess: (item) => { void queryClient.invalidateQueries({ queryKey: getListObjectsQueryKey() }); void queryClient.invalidateQueries({ queryKey: getGetHomeSummaryQueryKey() }); setLocation(`/objects/${item.id}`); }, onError: () => setError('We could not save that object. Please try again.') });
  };
  return <div className="animate-appear"><PageHeader back="/objects" eyebrow="New memory" title="Add an object" subtitle="A name and a quick reference photo are all you need to begin." /><div className="space-y-5">
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="object-name">What should we call it?</label><input id="object-name" value={name} onChange={(event) => setName(event.target.value)} className="soft-field" placeholder="e.g. Apartment keys" data-testid="input-object-name" /></div>
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="object-category">Category</label><select id="object-category" value={category} onChange={(event) => setCategory(event.target.value)} className="soft-field" data-testid="select-object-category">{categoryLabels.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    <div><label className="mb-2 block text-sm font-semibold" htmlFor="object-description">A detail you’ll recognize <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="object-description" value={description} onChange={(event) => setDescription(event.target.value)} className="soft-field min-h-28 resize-none" placeholder="The blue lanyard, silver ring…" data-testid="textarea-object-description" /></div>
    <div><p className="mb-2 text-sm font-semibold">Reference photo <span className="font-normal text-muted-foreground">(optional)</span></p><button type="button" onClick={() => fileRef.current?.click()} className="card-surface relative flex min-h-44 w-full items-center justify-center overflow-hidden border-dashed" data-testid="button-reference-photo">{referenceImage ? <img src={referenceImage} alt="Reference preview" className="absolute inset-0 h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="text-primary" size={28} />Add a clear photo</span>}</button><input ref={fileRef} onChange={(event) => void handleFile(event.target.files?.[0])} type="file" accept="image/*" className="hidden" data-testid="input-reference-photo" /></div>
    {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert" data-testid="status-new-object-error">{error}</p>}
    <button type="button" onClick={submit} disabled={createObject.isPending} className="primary-button w-full" data-testid="button-save-object">{createObject.isPending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{createObject.isPending ? 'Saving…' : 'Save object'}</button>
  </div></div>;
}