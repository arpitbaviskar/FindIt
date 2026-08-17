import { Camera, Clock3, Home, LibraryBig } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/objects', label: 'Objects', icon: LibraryBig },
  { href: '/scan', label: 'Scan', icon: Camera, scan: true },
  { href: '/history', label: 'History', icon: Clock3 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div className="app-shell">
      <main className="app-content safe-top">{children}</main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        <div className="mx-auto flex max-w-md items-end justify-around gap-1">
          {navItems.map(({ href, label, icon: Icon, scan }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${scan ? 'nav-scan' : ''} ${active ? 'active' : ''}`}
                data-testid={`link-nav-${label.toLowerCase()}`}
              >
                <Icon size={scan ? 22 : 19} strokeWidth={active ? 2.3 : 1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, back }: { eyebrow?: string; title: string; subtitle?: string; back?: string }) {
  return (
    <header className="mb-7 flex items-start gap-3">
      {back && (
        <Link href={back} className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-foreground" aria-label="Go back" data-testid="link-back">
          <span className="text-xl leading-none">←</span>
        </Link>
      )}
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-3 max-w-md text-[.94rem] leading-6 text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}