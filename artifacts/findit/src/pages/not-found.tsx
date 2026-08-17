import { Link } from 'wouter';

export default function NotFound() {
  return <div className="flex min-h-[78dvh] flex-col items-center justify-center text-center"><p className="eyebrow mb-3">A quiet corner</p><h1 className="page-title">This memory<br />isn’t here.</h1><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Let’s take you back to the things you do remember.</p><Link href="/" className="primary-button mt-7" data-testid="link-not-found-home">Back home</Link></div>;
}