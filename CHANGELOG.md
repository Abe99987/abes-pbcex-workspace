# Changelog

## 2025-09-05

### feat(exchange): finalize “58” site order flow and prices stream client

- add `src/lib/pricesSSE.ts` aligned to backend stream API (`GET /api/prices/stream?symbols=`)
- update `src/components/trading/TradingChart.tsx` SSE subscription and lifecycle
- CI checks and CodeRabbit review green; branch linearized and reopen-clean verified

### notes

- Local verification on `main`: type-check and production frontend build succeeded
- Staging deploy path pending; prepared local SSE smoke test for client behavior
