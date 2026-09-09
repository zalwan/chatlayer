# PRD — ChatLayer

> **Tagline:** The open-source layer for AI chatbots.

> **Status:** Draft — Final Product Direction

> **Version:** 0.1

> **License:** TBD — Recommendation: Apache License 2.0

---

# 1. Overview

**ChatLayer** adalah open-source, provider-agnostic **Chat UI SDK** untuk membangun antarmuka percakapan AI modern.

ChatLayer menyediakan infrastructure yang biasanya harus dibangun berulang kali oleh developer:

- chat state management
- streaming response
- message lifecycle
- transport abstraction
- chat protocol
- abort generation
- retry
- regenerate
- ready-to-use chatbot widget
- headless chat API
- extensible event system

ChatLayer **bukan AI provider** dan tidak menjalankan model AI secara langsung.

Developer tetap menggunakan backend dan model pilihannya sendiri:

- OpenAI
- Anthropic
- Google Gemini
- Ollama
- OpenRouter
- Azure OpenAI
- local models
- self-hosted models
- custom AI backends

Prinsip utama:

> **Bring your own AI. We handle the chat.**

---

# 2. Problem Statement

Membangun chatbot AI terlihat sederhana:

```text
User
  ↓
API
  ↓
AI Model
  ↓
Response
```

Namun implementasi production membutuhkan banyak behavior tambahan:

- streaming response
- message state
- loading state
- abort generation
- retry
- regenerate
- auto-scroll
- markdown rendering
- code block
- error handling
- conversation state
- tool execution status
- attachments
- citations
- custom rendering

Akibatnya, developer sering membangun logic chat yang sama berulang kali.

UI component library juga tidak menyelesaikan masalah tersebut.

Library seperti:

```text
Button
Input
Dialog
Card
Avatar
```

menyediakan building blocks visual, tetapi tidak menyediakan **chat behavior**.

ChatLayer mengisi gap tersebut.

---

# 3. Product Vision

ChatLayer bertujuan menjadi **reliable conversation interface layer** untuk aplikasi AI.

ChatLayer memisahkan:

```text
Chat UI
    ↓
Chat Protocol
    ↓
Application Backend
    ↓
AI Provider / Model
```

Sehingga UI tidak perlu mengetahui apakah backend menggunakan:

```text
OpenAI
Anthropic
Gemini
Ollama
Local Model
Custom Model
```

Target architecture:

```text
                    ChatLayer

        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Svelte         React       Web Component
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                 Chat Protocol
                       ↓
                 Any Backend
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       OpenAI       Anthropic     Ollama
```

Visi jangka panjang:

> Membuat pembangunan AI chat interface menjadi sederhana, portable, dan tidak bergantung pada provider tertentu.

ChatLayer **tidak bertujuan menjadi AI platform**.

---

# 4. Goals

## 4.1 Primary Goals

### G1 — Simple Integration

Developer dapat membuat chatbot dengan konfigurasi minimal.

Contoh:

```svelte
<ChatWidget endpoint="/api/chat" />
```

Target:

> Developer dapat memiliki chatbot yang bekerja dalam waktu kurang dari 5 menit.

---

### G2 — Provider Agnostic

Frontend tidak mengetahui atau bergantung pada AI provider tertentu.

Provider dan model merupakan tanggung jawab backend.

---

### G3 — Streaming First

Streaming response merupakan behavior default.

ChatLayer memperlakukan AI response sebagai event stream, bukan hanya sebagai HTTP response biasa.

---

### G4 — Headless Support

Developer dapat menggunakan chat state dan protocol tanpa menggunakan UI bawaan.

Contoh:

```typescript
const chat = createChat({
  transport,
});
```

Developer kemudian bebas membuat UI sendiri.

---

### G5 — Extensible Protocol

Protocol harus dapat berkembang untuk mendukung:

- tools
- citations
- attachments
- multimodal content
- custom UI events
- future transport mechanisms

tanpa merusak API dasar.

---

### G6 — Open Source Friendly

Core harus:

- mudah dipahami
- mudah dites
- mudah di-fork
- memiliki dependency minimal
- tidak bergantung pada proprietary backend
- tidak mengirim telemetry secara default

---

# 5. Non-Goals

ChatLayer tidak akan menjadi:

- AI model provider
- AI training framework
- RAG framework
- vector database
- agent framework
- prompt management platform
- analytics platform
- billing system
- authentication system
- SaaS platform
- AI observability platform

Fitur tersebut dapat digunakan melalui application backend atau third-party integrations.

---

# 6. Target Users

## Primary Users

### 1. Full-stack Developers

Developer yang sudah memiliki backend AI tetapi membutuhkan chat interface.

Contoh:

```text
Laravel + OpenAI
Django + Gemini
Go + Ollama
Node + Anthropic
SvelteKit + custom AI
```

---

### 2. Frontend Developers

Developer yang ingin membuat AI chat tanpa membangun:

- conversation state
- streaming state
- message lifecycle
- retry
- abort
- error handling

dari awal.

---

### 3. Indie Hackers

Developer yang ingin menambahkan AI assistant ke produk mereka dengan cepat.

---

### 4. Open-source Developers

Developer yang membutuhkan chat UI yang:

- self-hosted
- provider agnostic
- customizable
- framework friendly

---

# 7. Core Product Principles

## Principle 1 — Provider Agnostic

Jangan membuat:

```text
OpenAIChatWidget
```

Gunakan:

```text
ChatWidget
```

Provider berada di backend.

---

## Principle 2 — Protocol First

UI bukan fondasi utama.

Protocol merupakan kontrak komunikasi antara application backend dan ChatLayer.

```text
Backend
   ↓
Chat Protocol
   ↓
ChatLayer
   ↓
UI
```

---

## Principle 3 — Headless First

UI bawaan adalah convenience layer.

Core harus tetap usable tanpa UI.

```typescript
const chat = createChat({
  transport,
});
```

---

## Principle 4 — Sensible Defaults

Developer baru harus mendapatkan pengalaman yang baik tanpa konfigurasi kompleks.

---

## Principle 5 — Extensible, Not Bloated

ChatLayer menyediakan extension points tanpa memasukkan seluruh AI ecosystem ke dalam core.

---

## Principle 6 — Backend Owns AI Policy

Model configuration, system instructions, persona, guardrails, tools, memory, dan business logic berada di backend.

Frontend tidak boleh menjadi sumber kebenaran untuk AI policy.

---

# 8. High-Level Architecture

```text
┌─────────────────────────────────────┐
│             ChatLayer               │
│                                     │
│ Widget / Components / Headless      │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Chat Protocol              │
│                                     │
│ messages / events / errors          │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│        Application Backend          │
│                                     │
│ persona / instructions              │
│ guardrails / context / memory       │
│ model / tools / business logic      │
└──────────────────┬──────────────────┘
                   │
                   ▼
       ┌───────────┼────────────┐
       ↓           ↓            ↓
    OpenAI      Anthropic     Ollama
```

---

# 9. Responsibility Boundary

ChatLayer bertanggung jawab terhadap:

```text
UI
State
Messages
Streaming
Events
Transport
Protocol
Interaction behavior
```

Application backend bertanggung jawab terhadap:

```text
Authentication
Authorization
Model
API Keys
System Prompt
Persona
Guardrails
RAG
Memory
Tools
Business Logic
Persistence
Rate Limiting
```

Boundary ini merupakan prinsip arsitektur utama ChatLayer.

---

# 10. Package Architecture

Target package architecture:

```text
@chatlayer/core
@chatlayer/svelte
```

Future:

```text
@chatlayer/react
@chatlayer/vue
@chatlayer/web
```

Repository:

```text
packages/
├── core/
└── svelte/
```

Untuk MVP, package structure boleh disederhanakan menjadi satu package jika hal tersebut mempercepat development.

Framework adapter baru dibuat setelah Core API stabil.

---

# 11. Core API

## 11.1 `createChat()`

```typescript
const chat = createChat({
  transport,
});
```

Public state:

```typescript
chat.messages;
chat.status;
chat.error;
```

Public actions:

```typescript
chat.send();
chat.stop();
chat.retry();
chat.regenerate();
chat.clear();
```

---

# 12. Chat Status

```typescript
type ChatStatus = "idle" | "submitted" | "streaming" | "error";
```

Status digunakan UI untuk menentukan:

- loading
- stop button
- retry button
- disabled input
- error display

Status machine harus memiliki behavior yang predictable.

---

# 13. Message Model

Role:

```typescript
type ChatRole = "user" | "assistant" | "system";
```

Message:

```typescript
interface ChatMessage {
  id: string;
  role: ChatRole;
  content: ChatContent[];
  createdAt?: string;
}
```

Content menggunakan discriminated union.

MVP:

```typescript
interface TextContent {
  type: "text";
  text: string;
}
```

Future content:

```text
image
file
tool
citation
custom
```

### Security Note

`system` message dapat digunakan sebagai internal message representation.

Namun client-supplied system messages **tidak boleh dianggap trusted**.

Backend tetap menjadi authority untuk:

- system instructions
- persona
- policies
- guardrails
- model configuration

---

# 14. Chat Request

```typescript
interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
  metadata?: Record<string, unknown>;
}
```

Client request tidak boleh menjadi sumber kebenaran untuk AI policy.

Backend harus melakukan validation dan filtering terhadap data yang diterima.

---

# 15. Chat Transport

Transport bertanggung jawab terhadap mekanisme komunikasi.

```typescript
interface ChatTransport {
  send(request: ChatRequest, options?: ChatRequestOptions): AsyncIterable<ChatEvent>;
}
```

Transport tidak mengetahui:

- model provider
- API key
- system prompt
- persona
- guardrails
- RAG implementation

---

# 16. Protocol vs Transport

Protocol dan transport merupakan dua konsep berbeda.

### Protocol

Menentukan **apa yang dikirim**.

```text
message.start
message.delta
message.end
error
```

### Transport

Menentukan **bagaimana event dikirim**.

Contoh:

```text
HTTP streaming
SSE
WebSocket
custom transport
```

Architecture:

```text
Chat Protocol
      │
      ▼
Transport
      │
 ┌────┼─────────┐
 ↓    ↓         ↓
SSE  HTTP      WebSocket
```

Dengan pemisahan ini, transport dapat berkembang tanpa mengubah semantic protocol.

---

# 17. Chat Protocol

ChatLayer menggunakan event-based streaming protocol.

MVP events:

```typescript
type ChatEvent = MessageStartEvent | MessageDeltaEvent | MessageEndEvent | ErrorEvent;
```

---

## 17.1 Message Start

```typescript
{
  type: "message.start",
  messageId: "msg_123",
  role: "assistant"
}
```

---

## 17.2 Message Delta

```typescript
{
  type: "message.delta",
  messageId: "msg_123",
  text: "Hello"
}
```

Multiple delta events dapat diterima selama satu message berlangsung.

---

## 17.3 Message End

```typescript
{
  type: "message.end",
  messageId: "msg_123"
}
```

---

## 17.4 Error

```typescript
{
  type: "error",
  code: "MODEL_ERROR",
  message: "Model temporarily unavailable"
}
```

Error event harus memiliki struktur yang stabil sehingga UI dapat menampilkan error secara konsisten.

---

# 18. Future Protocol Events

Protocol v0.1 hanya membutuhkan event dasar.

Future extension dapat mencakup:

```text
message.start
message.delta
message.end

tool.start
tool.delta
tool.end

citation
attachment
status
custom

error
```

Contoh:

```typescript
{
  type: "tool.start",
  toolCallId: "call_123",
  name: "search_products"
}
```

UI dapat menampilkan:

```text
🔍 Searching products...
```

Protocol tidak peduli apakah tool tersebut menggunakan:

- MCP
- REST
- function calling
- database
- custom backend

ChatLayer hanya merepresentasikan lifecycle event kepada UI.

---

# 19. AI Configuration Boundary

AI configuration berada di backend.

Contoh:

```typescript
const assistant = {
  model: "...",

  persona: {
    name: "Sinta",
    role: "Customer Support",
    tone: "friendly",
  },

  instructions: "...",

  guardrails: [...],

  tools: [...],
};
```

Frontend hanya menerima hasil dan event yang telah diproses backend.

API key dan provider credentials **tidak boleh dikirim ke browser**.

---

# 20. Persona

Persona bukan bagian dari ChatLayer Core.

Persona diimplementasikan oleh backend/runtime.

Contoh:

```text
Name:
Sinta

Role:
Customer Support Assistant

Tone:
Friendly and concise

Language:
Indonesian
```

ChatLayer hanya merender output dari persona tersebut.

---

# 21. Guardrails

Guardrails berada di backend.

Conceptual architecture:

```text
User Input
    ↓
Input Guardrails
    ↓
Model
    ↓
Output Guardrails
    ↓
Chat Protocol
    ↓
ChatLayer
    ↓
UI
```

Core tidak memaksakan implementation guardrails tertentu.

Future extension dapat menyediakan interface:

```typescript
interface Guardrail {
  check(context: GuardrailContext): Promise<GuardrailResult>;
}
```

Guardrails bukan mandatory feature pada MVP.

---

# 22. UI Components

MVP menyediakan:

```text
ChatWidget
MessageList
Message
Composer
LoadingIndicator
ErrorMessage
```

---

## ChatWidget

```svelte
<ChatWidget endpoint="/api/chat" />
```

Default behavior:

- open/close
- message list
- input
- streaming
- markdown
- code block
- retry
- stop generation
- error state

Widget harus memiliki sensible defaults tetapi tetap dapat dikustomisasi.

---

# 23. Headless API

Developer dapat menggunakan Core tanpa UI.

```typescript
const chat = createChat({
  transport,
});

await chat.send("Hello");
```

Developer kemudian bebas membuat UI sendiri:

```svelte
{#each chat.messages as message}
  <CustomMessage {message} />
{/each}
```

Headless architecture merupakan salah satu differentiator utama ChatLayer.

---

# 24. Embeddable Mode

Future goal:

```html
<script src="chatlayer.js"></script>

<script>
  ChatLayer.mount({
    endpoint: "/api/chat",
  });
</script>
```

Target environment:

- Svelte
- React
- Vue
- vanilla JavaScript
- Laravel Blade
- Django
- Rails
- PHP
- static HTML
- WordPress

Embeddable mode tidak termasuk v0.1.

---

# 25. Theming

MVP menyediakan basic theming:

```text
light
dark
system
```

Contoh:

```typescript
{
  theme: "dark";
}
```

Future:

```typescript
{
  theme: {
    primary: "...",
    radius: "...",
    font: "..."
  }
}
```

UI tidak boleh terlalu opinionated sehingga sulit diintegrasikan dengan existing design system.

---

# 26. MVP v0.1

MVP harus tetap kecil.

## Core

Must have:

- `createChat()`
- `ChatMessage`
- `ChatEvent`
- `ChatTransport`
- HTTP transport
- streaming
- abort
- message state
- error handling

---

## UI

Must have:

- `ChatWidget`
- `MessageList`
- `Message`
- `Composer`
- streaming indicator
- markdown rendering
- code blocks
- retry
- stop generation
- error state

---

## Documentation

Must have:

- installation
- quick start
- custom backend
- transport API
- headless usage
- protocol specification

---

# 27. Explicitly Out of MVP

Tidak termasuk v0.1:

- authentication
- database
- long-term memory
- RAG
- vector database
- model adapters
- billing
- analytics
- MCP
- attachments
- voice
- image generation
- multimodal input
- agent framework
- prompt management
- advanced theming
- advanced tool execution

Fitur tersebut hanya ditambahkan berdasarkan kebutuhan nyata dan feedback pengguna.

---

# 28. Example User Flow

Developer:

```bash
npm install @chatlayer/svelte
```

Frontend:

```svelte
<ChatWidget endpoint="/api/chat" />
```

Backend:

```text
POST /api/chat

       ↓

validate request

       ↓

load conversation

       ↓

apply system instructions

       ↓

apply persona

       ↓

apply guardrails

       ↓

call selected model

       ↓

convert response → Chat Protocol

       ↓

stream to browser
```

Browser menerima:

```text
message.start
      ↓
message.delta
      ↓
message.delta
      ↓
message.delta
      ↓
message.end
```

UI:

```text
User
 │
 │ Hello
 ↓
AI
 │
 │ Hello! How can I help?
 ↓
```

---

# 29. Example Backend

Pseudo implementation:

```typescript
export async function POST({ request }) {
  const body = await request.json();

  const result = await myAI.generate({
    messages: body.messages,
    system: SYSTEM_PROMPT,
  });

  return streamChatEvents(result);
}
```

ChatLayer tidak perlu mengetahui apakah:

```text
myAI = OpenAI
myAI = Anthropic
myAI = Gemini
myAI = Ollama
myAI = custom model
```

---

# 30. Success Metrics

Untuk project OSS, success tidak hanya diukur dari revenue.

## Initial Success

Target 3 bulan:

- npm package published
- usable documentation
- 3+ working examples
- 10+ external users
- 3+ external issues/feedback
- minimal 1 external contributor

## Medium Term

Target aspirasi:

- 100+ GitHub stars
- 1–3 external contributors
- community integrations
- framework adapters
- real-world production usage

Metrics ini merupakan target aspirasi, bukan KPI yang harus dipaksakan.

---

# 31. Contributor Strategy

Ideal contributors:

### Frontend Developer

Membantu:

- UI components
- accessibility
- theming
- framework adapters

### Backend Developer

Membantu:

- transport
- protocol implementations
- examples

### AI Developer

Membantu:

- tool events
- integrations
- guardrail integrations

### Documentation Contributor

Membantu:

- tutorials
- examples
- recipes
- documentation improvements

---

# 32. Roadmap

## Phase 0 — Specification

Define:

```text
ChatMessage
ChatRequest
ChatEvent
ChatTransport
ChatStatus
```

Deliverable:

```text
PROTOCOL.md
```

---

## Phase 1 — Core

Implement:

```text
createChat()
HTTP transport
streaming
abort
state management
error handling
```

---

## Phase 2 — Svelte UI

Implement:

```text
ChatWidget
MessageList
Message
Composer
Markdown
Code blocks
Basic theme
```

---

## Phase 3 — Developer Experience

Implement:

```text
documentation
examples
tests
npm package
release automation
```

---

## Phase 4 — Extensions

Potential:

```text
tool events
citations
attachments
custom content
additional transports
```

Extensions hanya dibuat ketika terdapat demand nyata.

---

## Phase 5 — Ecosystem

Potential packages:

```text
@chatlayer/react
@chatlayer/vue
@chatlayer/web
@chatlayer/mcp
```

Framework adapter tidak dibuat hanya demi jumlah package.

Prioritas ditentukan berdasarkan community demand.

---

# 33. Repository Structure

Recommended:

```text
chatlayer/

├── packages/
│   ├── core/
│   └── svelte/
│
├── examples/
│   ├── sveltekit/
│   ├── vanilla/
│   └── custom-backend/
│
├── docs/
│
├── tests/
│
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── package.json
└── pnpm-workspace.yaml
```

Untuk tahap awal, repository boleh dimulai dengan struktur yang lebih sederhana.

---

# 34. Testing Strategy

Core harus memiliki unit test untuk:

- message state
- streaming events
- abort
- retry
- error handling
- protocol parsing
- state transitions

UI harus memiliki integration test untuk:

- sending message
- streaming
- stop generation
- retry
- rendering markdown
- error state

Protocol fixtures:

```text
fixtures/

├── basic-chat.jsonl
├── streaming.jsonl
├── error.jsonl
└── tool-events.jsonl
```

---

# 35. Security Principles

ChatLayer tidak boleh:

- menerima API key model di client
- mengharuskan provider credentials diekspos ke browser
- mengirim telemetry secara default
- membuat hidden network requests
- menyimpan conversation tanpa explicit application control

Default:

> **No tracking. No vendor lock-in. No hidden network requests.**

Backend tetap bertanggung jawab atas:

- authentication
- authorization
- rate limiting
- API key management
- input validation
- system instructions
- guardrails

---

# 36. Privacy

Core package tidak menyimpan data user secara default.

Conversation persistence merupakan tanggung jawab application.

Developer bebas menggunakan:

```text
SQLite
PostgreSQL
Redis
localStorage
IndexedDB
custom database
```

atau tidak menyimpan conversation sama sekali.

ChatLayer tidak membutuhkan mandatory hosted backend.

---

# 37. Licensing

Rekomendasi awal:

## Apache License 2.0

Alasan:

- permissive
- cocok untuk ecosystem library
- memungkinkan commercial usage
- memiliki explicit patent grant
- friendly terhadap perusahaan
- tidak menghambat adoption

MIT juga valid jika prioritas utama adalah adoption semaksimal mungkin.

AGPL tidak direkomendasikan untuk Core Library karena dapat meningkatkan friction bagi developer dan perusahaan yang ingin mengintegrasikan package.

Final license ditentukan sebelum public release.

---

# 38. Differentiation

ChatLayer tidak bersaing dengan:

> "Kami memiliki chatbot paling cantik."

Differentiation utama:

### 1. Provider Agnostic

```text
Any AI backend.
```

### 2. Protocol First

```text
Backend
   ↓
Protocol
   ↓
ChatLayer
   ↓
UI
```

### 3. Headless

```text
Use our UI

or

build your own.
```

### 4. Streaming First

AI interaction diperlakukan sebagai event stream.

### 5. Extensible

Tools, citations, attachments, dan custom content dapat ditambahkan tanpa mengubah fundamental Core API.

### 6. Self-hosted Friendly

Tidak ada mandatory SaaS backend.

### 7. Small by Design

ChatLayer tidak mencoba menjadi seluruh AI ecosystem.

---

# 39. Competitive Positioning

ChatLayer tidak bertujuan menggantikan:

- AI SDK
- LangChain
- LangGraph
- MCP
- OpenAI SDK
- Anthropic SDK
- UI component libraries

Positioning:

```text
AI / Model SDK
       ↓
AI Application Backend
       ↓
Chat Protocol
       ↓
ChatLayer
       ↓
Chat UI
```

AI SDK:

```text
Model / AI application layer
```

ChatLayer:

```text
Conversation interface layer
```

UI component library:

```text
Button
Input
Dialog
Card
```

ChatLayer:

```text
Conversation
Streaming
State
Protocol
Interaction
```

ChatLayer bukan competitor langsung terhadap AI framework.

Ia berada di boundary antara **AI backend dan user interface**.

---

# 40. Long-Term Vision

Jika ecosystem berkembang, ChatLayer dapat menjadi reliable interface layer yang digunakan oleh berbagai jenis AI application:

```text
                    AI Application

                          │

                    ┌─────▼─────┐
                    │ ChatLayer │
                    │           │
                    │ UI        │
                    │ State     │
                    │ Protocol  │
                    └─────┬─────┘
                          │
          ┌───────────────┼────────────────┐
          ↓               ↓                ↓
       Web UI          Mobile UI       Custom UI
          │               │                │
          └───────────────┼────────────────┘
                          ↓
                    AI Backend
                          │
             ┌────────────┼─────────────┐
             ↓            ↓             ↓
          OpenAI       Anthropic      Local AI
```

Long-term objective:

> **Menjadi layer kecil, reliable, dan terbuka yang membuat pembangunan AI chat interface jauh lebih mudah.**

ChatLayer tidak perlu menjadi platform AI terbesar.

Kekuatan project justru berasal dari kesederhanaannya.

---

# 41. Product Philosophy

Project harus selalu kembali pada pertanyaan berikut.

### Apakah developer bisa menggunakannya dalam 5 menit?

Jika tidak, sederhanakan.

### Apakah developer tetap memiliki kontrol terhadap backend dan model?

Jika tidak, abstraction terlalu jauh.

### Apakah fitur ini menyelesaikan masalah chat interface?

Jika tidak, jangan masukkan ke Core.

### Apakah fitur ini membuat ChatLayer berubah menjadi AI platform?

Jika iya, pertimbangkan untuk tidak memasukkannya.

### Apakah fitur ini dibutuhkan pengguna nyata?

Jika belum ada demand, jangan terburu-buru menambahkannya.

---

# 42. Naming & Brand

Official project name:

> **ChatLayer**

Package namespace:

```text
@chatlayer/core
@chatlayer/svelte
```

Potential future packages:

```text
@chatlayer/react
@chatlayer/vue
@chatlayer/web
```

Primary tagline:

> **The open-source layer for AI chatbots.**

Developer-facing promise:

> **Bring your own AI. We handle the chat.**

One-line description:

> **An open-source, provider-agnostic SDK for building modern AI chat interfaces.**

---

# 43. One-line Definition

> **ChatLayer is an open-source, provider-agnostic SDK for building modern AI chat interfaces with streaming, headless state management, and an extensible chat protocol.**

---

# 44. Initial README Promise

README harus menjelaskan project dalam kurang dari 30 detik:

```text
ChatLayer

Build AI chat interfaces
without building chat infrastructure.

✓ Provider agnostic
✓ Streaming-first
✓ Headless
✓ TypeScript
✓ Self-hosted
✓ Open protocol

Bring your own AI.

We handle the chat.
```

Quick start:

```bash
npm install @chatlayer/svelte
```

```svelte
<ChatWidget endpoint="/api/chat" />
```

Backend tetap milik developer.

Model tetap milik developer.

Data tetap milik developer.

**ChatLayer hanya menangani chat.**

---

# 45. Definition of Done — v0.1

ChatLayer v0.1 dianggap selesai ketika:

### Core

- [ ] `createChat()` tersedia
- [ ] message state bekerja
- [ ] streaming bekerja
- [ ] abort bekerja
- [ ] retry bekerja
- [ ] error state bekerja
- [ ] HTTP transport tersedia

### Protocol

- [ ] `ChatRequest` didefinisikan
- [ ] `ChatMessage` didefinisikan
- [ ] `ChatEvent` didefinisikan
- [ ] event lifecycle terdokumentasi
- [ ] error format terdokumentasi
- [ ] protocol versioning strategy tersedia

### Svelte

- [ ] `ChatWidget`
- [ ] `MessageList`
- [ ] `Message`
- [ ] `Composer`
- [ ] streaming indicator
- [ ] markdown
- [ ] code blocks
- [ ] retry
- [ ] stop generation
- [ ] error state

### Developer Experience

- [ ] npm package published
- [ ] README tersedia
- [ ] Quick Start tersedia
- [ ] SvelteKit example tersedia
- [ ] custom backend example tersedia
- [ ] protocol documentation tersedia
- [ ] automated tests tersedia
- [ ] CI berjalan

### Security

- [ ] Tidak ada API key di client
- [ ] Tidak ada telemetry default
- [ ] Tidak ada hidden network requests
- [ ] Security policy tersedia

---

# 46. Final Product Statement

**ChatLayer bukan AI.**

**ChatLayer bukan model provider.**

**ChatLayer bukan agent framework.**

**ChatLayer bukan RAG platform.**

ChatLayer adalah lapisan yang berada di antara AI backend dan user interface.

```text
                    YOUR APPLICATION

                          │
                          ▼

                    ┌───────────┐
                    │ ChatLayer │
                    └─────┬─────┘
                          │
                     Chat Protocol
                          │
                          ▼

                    YOUR BACKEND
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           OpenAI      Anthropic    Local AI
```

> **You bring the AI. ChatLayer handles the conversation.**
