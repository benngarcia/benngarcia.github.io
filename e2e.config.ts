import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';

// The site is a static GitHub Pages root, so the "app" is the repo directory
// served as-is. Python's http.server keeps the footprint to zero extra deps.
export default {
  targets: [{
    engine: web(),
    app: {
      url: 'http://127.0.0.1:4115',
      command: {
        executable: 'python3',
        args: ['-m', 'http.server', '4115', '--bind', '127.0.0.1'],
        log: '.e2e/logs/app.log',
      },
    },
  }],
} satisfies E2EConfig;
