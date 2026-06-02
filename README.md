# jpca-practice

A web app for practicing JPCA exam questions. Framework-agnostic scaffold, GitHub-hostable, with room to grow into a full server-backed deployment.

## Structure

```
jpca-practice/
├── src/                  # Source code
│   ├── index.html        # Entry page
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side scripts
│   └── assets/           # Images, fonts, media
├── public/               # Static files served as-is (favicon, robots.txt)
├── server/               # Optional backend (Node, swap for any stack)
│   └── index.js
├── docs/                 # Documentation
├── .github/workflows/    # CI/CD (GitHub Actions)
├── .gitignore
├── package.json
├── Dockerfile            # Container deployment
└── README.md
```

## Deployment Options

| Target            | How                                                                         |
|-------------------|-----------------------------------------------------------------------------|
| GitHub Pages      | Push to `main`; workflow publishes `src/`                                   |
| Netlify / Vercel  | Connect repo; publish dir = `src`                                           |
| Static server     | Serve `src/` with nginx / Apache                                            |
| Node server       | `npm start` runs `server/index.js`                                          |
| Docker            | `docker build -t jpca-practice . && docker run -p 8080:8080 jpca-practice`  |

## Local Development

```bash
# Pure static (no backend)
npx serve src

# With Node backend
npm install
npm start
```

## License

MIT
