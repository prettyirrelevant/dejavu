import { Route } from '@solidjs/router';
import { lazy } from 'solid-js';
import { Toaster } from 'solid-toast';

const Home = lazy(() => import('./routes/index'));
const Room = lazy(() => import('./routes/[code]'));

export default function App() {
  return (
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
          },
        }}
      />
      <Route path="/" component={Home} />
      <Route path="/:code" component={Room} />
    </>
  );
}
