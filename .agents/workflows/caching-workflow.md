---
description: Configuring and executing the multi-tier Caching Layer system
---

This workflow describes the data flow and optimization pipeline for handling client queries using multi-layer caching before querying the main database.

## System Workflow Steps

1. **Browser Cache on Device**
   * **Speed**: Instant (0-1ms)
   * **Action**: Serves requests locally directly from client-side sessionStorage, localStorage, or in-memory React query caches. Extremely high-speed read bounce for identical consecutive parameters.

2. **CDN / Edge Cache**
   * **Speed**: Fast (5-20ms)
   * **Action**: Requests that bypass client-side cache hit CDN edges (e.g. Cloudflare, Vercel, Neon Edge proxies). Reads bounce quickly back to user without touching the primary compute region.

3. **Redis Server Cache**
   * **Speed**: Quick (1-5ms server-side lookup)
   * **Action**: Application server checks Redis cache keys before querying data models. Provides quick retrieval, serving as a transaction "bonus" to avoid expensive SQL execution.

4. **Database**
   * **Speed**: Deep query (10-100ms)
   * **Action**: Cold hit. Executes standard PostgreSQL / Neon query matching requested data, then write back through cache layers.
