# ── Dockerfile إنتاجي للـ API (monorepo pnpm + Prisma) ──
# يُبنى من جذر المستودع: docker build -f apps/api/Dockerfile -t edham-api .

# 1) Builder — يثبّت كل الاعتماديات ويبني shared-types + Prisma + Nest
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# manifests أولاً للاستفادة من طبقات الكاش
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile

# الكود الكامل
COPY packages/ packages/
COPY apps/api/ apps/api/

RUN pnpm --filter @edham/shared-types build
RUN pnpm --filter @edham/api exec prisma generate
RUN pnpm --filter @edham/api build

# 2) Runner — صورة أنحف تشغّل المبنى
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/ /app/

EXPOSE 3001
# يطبّق الـ migrations ثم يشغّل الخادم
CMD ["sh", "-c", "pnpm --filter @edham/api exec prisma migrate deploy && node apps/api/dist/main.js"]
