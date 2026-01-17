import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';
import { lazy } from 'solid-js';
import { Toaster } from 'solid-toast';
import * as Sentry from '@sentry/solid';
import './app.css';

const Home = lazy(() => import('./routes/index'));
const Room = lazy(() => import('./routes/[code]'));

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const root = document.getElementById('app');
if (root) {
  render(
    () => (
      <>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FAF9F4',
              color: '#1a1a1a',
              border: '1px solid #d4d4d4',
              'border-radius': '0',
              'font-family': "'Space Grotesk', system-ui, sans-serif",
              'font-size': '0.875rem',
              'padding': '12px 16px',
              'box-shadow': 'none',
            },
            iconTheme: {
              primary: '#1a1a1a',
              secondary: '#FAF9F4',
            },
          }}
        />
        <Router>
          <Route path="/" component={Home} />
          <Route path="/:code" component={Room} />
        </Router>
      </>
    ),
    root
  );
}
