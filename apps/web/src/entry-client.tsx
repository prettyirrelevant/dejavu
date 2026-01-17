import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import * as Sentry from '@sentry/solid';
import App from './app';
import './app.css';

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
      <Router>
        <App />
      </Router>
    ),
    root
  );
}
