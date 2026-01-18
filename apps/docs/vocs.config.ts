import { defineConfig } from 'vocs'

export default defineConfig({
  basePath: '/dejavu',
  title: 'DEJAVU',
  description: 'A social deduction party game where players find the real witness among imposters',
  ogImageUrl: 'https://vocs.dev/api/og?logo=%logo&title=%title&description=%description',
  font: {
    google: 'Space Grotesk',
  },
  topNav: [
    { text: 'Play Now', link: 'https://dejavu.enio.la' },
  ],
  sidebar: [
    {
      text: 'Introduction',
      link: '/',
    },
    {
      text: 'How to Play',
      link: '/how-to-play',
    },
    {
      text: 'Architecture',
      collapsed: false,
      items: [
        { text: 'Overview', link: '/architecture/overview' },
        { text: 'Tech Stack', link: '/architecture/tech-stack' },
        { text: 'Game State', link: '/architecture/game-state' },
        { text: 'WebSocket Protocol', link: '/architecture/protocol' },
      ],
    },
    {
      text: 'Features',
      collapsed: false,
      items: [
        { text: 'AI Scenarios', link: '/features/ai-scenarios' },
        { text: 'Voice Chat', link: '/features/voice-chat' },
        { text: 'Reconnection', link: '/features/reconnection' },
      ],
    },
    {
      text: 'Deployment',
      link: '/deployment',
    },
  ],
  socials: [
    {
      icon: 'github',
      link: 'https://github.com/prettyirrelevant/dejavu',
    },
    {
      icon: 'x',
      link: 'https://x.com/eniola.wtf',
    },
  ],
  theme: {
    accentColor: {
      light: '#d97706',
      dark: '#f59e0b',
    },
  },
})
