# Deployment Guide

## 1. GitHub Pages (zero-config)
Push to `main`; the workflow in `.github/workflows/pages.yml` publishes `src/`.
Enable Pages in repo Settings → Pages → Source: GitHub Actions.

## 2. Static Host (Netlify / Vercel / Cloudflare Pages)
- Build command: *(none — pure static)*
- Publish directory: `src`

## 3. Self-hosted nginx
```nginx
server {
  listen 80;
  root /var/www/jpca-practice/src;
  index index.html;
  try_files $uri $uri/ =404;
}
```

## 4. Node server
```bash
npm install
PORT=8080 npm start
```
Use a reverse proxy (nginx/Caddy) + a process manager (pm2/systemd) in production.

## 5. Docker
```bash
docker build -t jpca-practice .
docker run -d -p 8080:8080 --name jpca-practice jpca-practice
```

## Migrating to a Framework
The `src/` layout maps cleanly onto React/Vue/Svelte:
- Move `index.html` → framework entry
- Replace `src/js/main.js` with framework bootstrap
- Keep `public/` and `assets/` as-is
- Add build step; point Dockerfile / Pages workflow at the build output (`dist/`)
