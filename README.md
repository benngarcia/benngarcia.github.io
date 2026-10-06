# bensbonkjuice.com

A single static page (`index.html`) served by GitHub Pages. `_config.yml` keeps
the test tooling out of the published site.

## Tests

End-to-end tests use e2e; read `.agents/skills/e2e/SKILL.md` before writing or running one.

```sh
npm install
npm run test:e2e   # serves this directory on 127.0.0.1:4115 with python3 and runs tests/
```

Needs Node 24.8+ (or 22.22.3+) and `python3`.
