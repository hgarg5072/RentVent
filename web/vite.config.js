import { defineConfig } from 'vite';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Local dev middleware: clicking "🔄 Refresh" in the browser runs live Magicbricks fetch from your Mac's IP
// and writes the refreshed JSON shard to web/public/data/areas/bangalore/<slug>.json.
function localAreaRefreshPlugin() {
  return {
    name: 'rentvent-local-area-refresh',
    configureServer(server) {
      server.middlewares.use('/api/fetch-area', (req, res) => {
        const u = new URL(req.url, 'http://localhost');
        const slug = (u.searchParams.get('slug') || '').toLowerCase().trim();
        const city = (u.searchParams.get('city') || 'bangalore').toLowerCase().trim();
        const refresh = u.searchParams.get('refresh') === '1';
        if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(city)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid slug' }));
          return;
        }
        const shardPath = path.resolve(process.cwd(), 'public', 'data', 'areas', city, `${slug}.json`);
        if (!refresh && fs.existsSync(shardPath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(shardPath, 'utf8'));
          return;
        }
        const py = `import sys, json, datetime; sys.path.insert(0, '../pipeline'); import mb_areas; socs, n = mb_areas.fetch_slug(${JSON.stringify(slug)}); out = {'slug': ${JSON.stringify(slug)}, 'fetched': datetime.date.today().isoformat(), 'raw_count': n, 'source': 'live', 'societies': socs}; mb_areas.WEB_AREAS.mkdir(parents=True, exist_ok=True); (mb_areas.WEB_AREAS / (${JSON.stringify(slug)} + '.json')).write_text(json.dumps(out, separators=(',', ':'))); print(json.dumps(out))`;
        execFile('python3', ['-c', py], { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
          res.setHeader('Content-Type', 'application/json');
          if (!err && stdout.trim()) {
            res.end(stdout.trim());
          } else if (fs.existsSync(shardPath)) {
            res.end(fs.readFileSync(shardPath, 'utf8'));
          } else {
            res.end(JSON.stringify({ slug, societies: [], raw_count: 0, error: err?.message || 'fetch failed' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [localAreaRefreshPlugin()],
});
