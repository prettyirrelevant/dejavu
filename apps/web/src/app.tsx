import { Route } from '@solidjs/router';
import { lazy } from 'solid-js';

const Home = lazy(() => import('./routes/index'));
const Room = lazy(() => import('./routes/[code]'));

export default function App() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/:code" component={Room} />
    </>
  );
}
