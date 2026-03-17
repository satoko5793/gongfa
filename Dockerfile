FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm --prefix backend install --omit=dev

COPY backend ./backend
COPY frontend ./frontend
COPY xyzw_web_helper/public ./xyzw_web_helper/public

ENV NODE_ENV=production
ENV PORT=8090

EXPOSE 8090

CMD ["node", "backend/src/server.js"]
