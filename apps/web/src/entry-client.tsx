import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import App from './app';
import './app.css';

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
