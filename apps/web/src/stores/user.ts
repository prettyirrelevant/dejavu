import { createStore } from 'solid-js/store';
import { getName, getPreferences } from '../lib/storage';

interface UserStore {
  name: string;
  theme: 'system' | 'light' | 'dark';
  defaultMuted: boolean;
}

const prefs = getPreferences();

const [user, setUser] = createStore<UserStore>({
  name: getName() ?? '',
  theme: prefs.theme,
  defaultMuted: prefs.defaultMuted,
});

export { user, setUser };
