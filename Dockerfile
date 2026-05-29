# Always-on host for the live, presenter-synced deck (Render / Railway / Fly / any container host).
# Native Slidev sync needs a running server (the static Pages build cannot sync).
FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

EXPOSE 3030
# Provide VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY as runtime env on the host
# so the quiz/leaderboard work. --remote binds 0.0.0.0 and enables cross-client sync.
# Honor the host-provided $PORT (Render/Koyeb/Fly set this); fall back to 3030 locally.
CMD ["sh", "-c", "npx slidev --port ${PORT:-3030} --remote"]
