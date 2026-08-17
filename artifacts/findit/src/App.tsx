import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import Home from '@/pages/home';
import ScanPage from '@/pages/scan';
import ObjectsPage from '@/pages/objects';
import NewObjectPage from '@/pages/new-object';
import ObjectDetailPage from '@/pages/object-detail';
import HistoryPage from '@/pages/history';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return <RoutedErrorBoundary><AppShell><Switch>
    <Route path="/" component={Home} />
    <Route path="/scan" component={ScanPage} />
    <Route path="/objects" component={ObjectsPage} />
    <Route path="/objects/new" component={NewObjectPage} />
    <Route path="/objects/:id" component={ObjectDetailPage} />
    <Route path="/history" component={HistoryPage} />
    <Route component={NotFound} />
  </Switch></AppShell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
