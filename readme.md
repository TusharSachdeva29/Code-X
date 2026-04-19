# Code-X

<img width="1214" height="843" alt="Code-X-architectrue drawio" src="https://github.com/user-attachments/assets/3dd48462-f8a5-4f43-8c27-2d145b29d3a1" />


A full-stack collaborative code editor designed for real-time developer workflows:
- Multi-user editing and synchronization
- In-browser terminal experience
- Multi-language editing support (Monaco)
- Per-user runtime environments on Kubernetes

## Table of Contents

1. Project Overview
2. Core Features
3. System Architecture
4. Repository Structure
5. Tech Stack
6. Local Development Setup
7. Environment Variables
8. API and Realtime Contracts
9. Deployment and Infrastructure
10. Operational Workflows
11. Troubleshooting
12. What a Perfect README Should Include

## Project Overview

Code-X is a collaborative web IDE platform where users can:
- Authenticate and manage account access
- Browse and edit project files
- Collaborate on code changes in near real-time
- Access an interactive terminal session
- Work inside isolated per-user runtime containers

The platform is split into multiple services:
- front-end: React app
- code: main API service (auth, file APIs, blob/db integration, socket hub)
- backend: runtime/file-system service (PTY, watcher, local FS sync)
- k8s: orchestration service (spawn/delete/proxy per-user containers)

## Core Features

- Real-time collaboration via Socket.IO delta events
- JWT-based authentication and protected APIs
- PostgreSQL user management with Drizzle ORM
- Azure Blob Storage as durable project file storage
- Terminal streaming with node-pty
- Kubernetes-managed per-user runtime environments
- Nginx-based routing for API, sockets, and user container proxying

## System Architecture

High-level layers:

1. Client Layer
- React + Vite SPA
- Monaco editor, Xterm terminal, file explorer, auth screens

2. Backend Services
- Main API service (code)
- Runtime file-system and terminal service (backend)
- Kubernetes orchestrator service (k8s)

3. Realtime Layer
- Socket.IO channels for:
	- editor deltas
	- terminal input/output
	- file watcher events

4. Data and Execution Layer
- PostgreSQL for user/auth records
- Azure Blob for code files and folder structures
- Kubernetes per-user pods for isolated runtime execution

Typical request/event paths:
- Browser -> Nginx -> /api/* -> code service
- Browser -> Nginx -> /socket.io -> code socket hub
- Browser -> Nginx -> /spawn and /delete -> k8s orchestrator
- Browser -> Nginx -> /user/{username}/{port}/* -> per-user service
### Detailed Architecture Responsibilities

1. Client Layer
- Presents the collaborative IDE experience (editor, terminal, file explorer, auth).
- Uses REST calls for CRUD/auth and Socket.IO for collaboration + terminal streaming.

2. Gateway Layer (Nginx + Ingress)
- Single traffic entry for API, sockets, container lifecycle, and per-user routing.
- Routes paths to target services without exposing internal cluster topology to clients.

3. Main API Service (code)
- Owns user authentication, account recovery, and protected endpoints.
- Provides folder/file APIs backed by Azure Blob Storage.
- Handles database operations through Drizzle and PostgreSQL.
- Hosts collaboration socket handlers for editor deltas.

4. Runtime Service (backend)
- Runs shell sessions via node-pty for terminal interactivity.
- Applies editor deltas to local workspace files.
- Watches workspace changes and emits add/update/remove events for sync.

5. Orchestrator Service (k8s)
- Creates and deletes per-user Kubernetes deployments and services.
- Proxies HTTP/WebSocket traffic into user container endpoints.

6. Data Layer
- PostgreSQL stores user identity/auth metadata.
- Azure Blob stores persistent project files and folder structures.
- SMTP provider handles verification and reset email delivery.

7. Execution Layer
- Each user gets an isolated runtime pod.
- Init container hydrates pod workspace from Azure Blob.
- User shell and runtime file changes are proxied back to the browser.

### End-to-End Data Flow (Code Edit)

1. User edits code in Monaco.
2. Frontend emits delta events through sockets.
3. Collaboration socket broadcasts to other clients.
4. Runtime socket applies delta to local file.
5. Save operations persist file content to Azure Blob Storage.

### End-to-End Data Flow (Container Spawn)

1. Frontend requests /spawn with username.
2. Orchestrator creates user deployment + service.
3. Init container pulls baseline project files from Azure Blob.
4. Frontend probes /health via gateway and connects terminal/editor sockets.

## Repository Structure

```text
Code-X/
	front-end/       # React + Vite client
	code/            # Main API service (auth, files, db, blob, sockets)
	backend/         # Runtime service (pty, watcher, local fs)
	k8s/             # Kubernetes orchestration/proxy service
	deployment/      # Kubernetes manifests, ingress, nginx, secrets/config
```

## Tech Stack

Frontend:
- React 19
- TypeScript
- Vite
- TanStack Query
- Monaco Editor
- Socket.IO client
- Xterm.js

Backend and Platform:
- Node.js + TypeScript
- Express
- Socket.IO
- Drizzle ORM
- PostgreSQL (pg)
- Azure Storage Blob SDK
- node-pty
- chokidar
- Kubernetes client for Node.js

## Local Development Setup

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+
- PostgreSQL (or Docker for local DB)
- Access to Azure Blob Storage credentials
- Optional: Kubernetes cluster access for k8s service testing

### 1) Install Dependencies

Run in each service folder:

```bash
cd front-end && npm install
cd ../code && npm install
cd ../backend && npm install
cd ../k8s && npm install
```

### 2) Prepare Database

If using Docker for DB (from code folder):

```bash
cd code
docker compose up -d
```

Ensure your DATABASE_URL points to your running Postgres instance.

### 3) Configure Environment Files

Create .env files in:
- code/.env
- backend/.env
- k8s/.env
- front-end/.env

Use the environment section below as reference.

### 4) Start Services

Start each service in its own terminal:

```bash
# main api
cd code && npm run dev

# runtime service (pty + file watcher)
cd backend && npm run dev

# orchestrator service
cd k8s && npm run dev

# frontend
cd front-end && npm run dev
```

Default ports in this codebase:
- code API: 3001
- backend runtime: 3000
- k8s orchestrator: 3002
- frontend (vite): 5173 (or 5174 if occupied)

## Environment Variables

### code/.env (Main API)

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174

DATABASE_URL=postgres://user:pass@localhost:5432/dbname

JWT_REFRESH_SECRET=your_refresh_secret
JWT_EMAIL_SECRET=your_email_secret

AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email_user
SMTP_PASS=your_email_pass

BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
```

### backend/.env (Runtime + File System)

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174

# Relative or absolute path used by runtime for workspace files
ACTUAL_PATH=./code
INIT_CWD=
```

### k8s/.env (Orchestrator)

```env
PORT=3002
FRONT_END_URL=http://localhost:5173
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174

AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name
```

### front-end/.env

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DOCKER_BACKEND=http://localhost:3000
VITE_WEB_SOCKET_URL=http://localhost:3002
```

Notes:
- In production, requests are usually routed through Nginx/Ingress hostnames.
- Keep secrets in secure secret stores for production, not in plaintext files.

## API and Realtime Contracts

### Main API Routes (code service)

Base path: /api

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/forgot-password
- POST /auth/reset-password
- POST /auth/change-password
- GET /auth/verify-email

Sidebar / file tree (blob-backed):
- GET /sidebar/get-folder-structure/tree
- GET /sidebar/get-folder-structure/list
- POST /sidebar/add-s3-object
- PUT /sidebar/edit-s3-object
- PUT /sidebar/delete-s3-object

Editor:
- POST /editor/load-file
- POST /editor/save-file

### Runtime Routes (backend service)

Base path: /folder-structure

- GET /build
- POST /add-file-folder
- POST /delete-file-folder
- POST /s3-backend-mismatch

### Orchestrator Routes (k8s service)

- POST /spawn
- POST /delete
- /:username/:port/* (dynamic proxy into per-user service)

### Socket Events

Main collaboration socket:
- client -> send-delta
- server -> receive-delta

Runtime socket:
- client -> editor:send-delta
- client -> terminal:write
- server -> terminal:data
- server -> docker:add
- server -> docker:remove
- server -> docker:update

## Deployment and Infrastructure

Kubernetes manifests are provided under deployment/v-code-deployment and k8s/src/k8s.

Key components:
- v-code deployment/service (main API)
- k8s-orchestrator deployment/service
- nginx deployment/service + configmap routing
- ingress + managed certificate resources
- postgres deployment

Nginx handles:
- /api -> main API service
- /socket.io -> main socket hub
- /spawn and /delete -> orchestrator
- /user/{username}/... -> orchestrator -> per-user container

Per-user runtime provisioning:
1. Orchestrator receives /spawn with username
2. Creates Kubernetes Deployment + Service for that user
3. Init container pulls starter files from Azure Blob
4. Frontend polls /health and then connects socket/HTTP through /user path
