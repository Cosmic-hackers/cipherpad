# CipherPad 🔒

> **Your thoughts. Your encryption. Your privacy.**

CipherPad is a privacy-focused encrypted notepad. Notes are encrypted in your browser using **AES-256-GCM** before being stored. Your password never leaves your device.

[![Java](https://img.shields.io/badge/Java-21-orange)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4-green)](https://spring.io/projects/spring-boot)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

- 🔐 **AES-256-GCM** browser-side encryption
- 🔑 **PBKDF2-HMAC-SHA-256** key derivation (310,000 iterations)
- 🔗 **Shareable encrypted links** — share with anyone, only your password decrypts
- 💾 **Autosave** every 2 seconds
- 🔒 **Lock / Unlock** notes without page refresh
- 📋 **Copy link** and **Copy text** in one click
- 🗑️ **Delete** notes permanently
- 📱 **Responsive** — works on mobile, tablet, and desktop
- 🌐 **No login required** — anonymous notes with access tokens

---

## 🏗 Architecture

```
Browser (JavaScript)              Server (Spring Boot)
─────────────────────             ──────────────────────
  Web Crypto API                    Controller layer
    └─ AES-256-GCM                  Service layer
    └─ PBKDF2 (310k iter)           Repository (JPA)
  Encrypted payload ──────────────► H2 / PostgreSQL
  Password (NEVER sent) ─✕──────►
```

**Zero-knowledge design:**
- Plaintext notes never reach the server
- Passwords are never transmitted
- Server stores only: `ciphertext`, `salt`, `iv`, `accessTokenHash`

---

## 🚀 Local Development

### Prerequisites

- Java 21+
- Maven 3.9+
- Git

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/cipherpad.git
cd cipherpad

# 2. Run with local profile (H2 database)
mvn spring-boot:run -Dspring-boot.run.profiles=local

# 3. Open in browser
open http://localhost:8080
```

The H2 database stores notes in `./data/cipherpad.mv.db` — notes survive application restarts.

**H2 Console** (local only): http://localhost:8080/h2-console  
JDBC URL: `jdbc:h2:file:./data/cipherpad`  Username: `sa`  Password: *(empty)*

---

## 🏭 Production Deployment

### Environment Variables

```env
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://HOST/DBNAME?sslmode=require
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
PORT=8080
```

### Neon PostgreSQL Setup

1. Go to [neon.tech](https://neon.tech) and create a free database
2. Copy the connection string (use `?sslmode=require`)
3. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` as environment variables

### Docker

```bash
# Build image
docker build -t cipherpad .

# Run with PostgreSQL
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL="jdbc:postgresql://HOST/DBNAME?sslmode=require" \
  -e DB_USERNAME="your_username" \
  -e DB_PASSWORD="your_password" \
  cipherpad
```

### Render Deployment

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repository
4. Render detects `render.yaml` automatically
5. Add environment variables in Render dashboard:
   - `DB_URL`
   - `DB_USERNAME`
   - `DB_PASSWORD`
6. Deploy!

The app uses the `PORT` environment variable automatically (Render sets this to 10000).

---

## 📡 API Reference

All endpoints under `/api`.

| Method | Endpoint           | Auth Header         | Description              |
|--------|--------------------|---------------------|--------------------------|
| GET    | `/api/health`      | —                   | Health check             |
| POST   | `/api/pads`        | —                   | Create encrypted note    |
| GET    | `/api/pads/{id}`   | `X-Access-Token`    | Retrieve encrypted note  |
| PUT    | `/api/pads/{id}`   | `X-Access-Token`    | Update encrypted note    |
| DELETE | `/api/pads/{id}`   | `X-Access-Token`    | Delete note              |

**Security model:**
- Access tokens are 256-bit random values
- Only the SHA-256 hash is stored in the database
- Token is returned **once** at creation; store it in the URL fragment
- Token in `X-Access-Token` header authorizes read/write/delete
- Token alone cannot decrypt — the encryption password is still required

---

## 🔐 Encryption Details

```
Password + Salt ──PBKDF2(SHA-256, 310k iter)──► 256-bit AES-GCM Key
                                                         │
                   Random 12-byte IV ──────────────────► AES-GCM Encrypt
                                                         │
                                                   Ciphertext (Base64)
```

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **KDF:** PBKDF2-HMAC-SHA-256
- **Iterations:** 310,000
- **Salt:** 16 bytes (random, unique per note)
- **IV:** 12 bytes (random, fresh for every save)
- **Title:** encrypted separately with the same salt + fresh IV
- **Implementation:** Web Crypto API (native browser)

---

## 🗂 Project Structure

```
src/main/java/com/cipherpad/
├── CipherPadApplication.java
├── controller/
│   └── PadController.java       # REST endpoints
├── service/
│   └── PadService.java          # Business logic, token hashing
├── repository/
│   └── PadRepository.java       # JPA repository
├── entity/
│   └── Pad.java                 # Database entity
├── dto/
│   ├── CreatePadRequest.java
│   ├── CreatePadResponse.java
│   ├── UpdatePadRequest.java
│   └── PadResponse.java
├── config/
│   └── WebConfig.java           # Static resource config
└── exception/
    ├── GlobalExceptionHandler.java
    ├── PadNotFoundException.java
    └── UnauthorizedException.java

src/main/resources/
├── application.properties       # Common config
├── application-local.properties # H2 local config
├── application-prod.properties  # PostgreSQL prod config
└── static/
    ├── index.html               # Landing page
    ├── create.html              # Create note page
    ├── editor.html              # Editor page
    ├── open.html                # Unlock/open page
    ├── css/style.css            # Design system
    └── js/
        ├── crypto.js            # AES-256-GCM encryption
        ├── api.js               # Backend API client
        ├── app.js               # Shared utilities
        ├── create.js            # Create page logic
        ├── editor.js            # Editor page logic
        └── open.js              # Open page logic
```

---

## 🛡 Security Notes

> This application implements strong client-side encryption. However, please be aware:
>
> - **Loss of password = loss of note**: There is no password recovery mechanism by design.
> - **Access token security**: The access token in the URL fragment controls *access to the encrypted data*. The encryption password is still required to *decrypt* it. Never share the token and password together.
> - **Independent review**: This has not undergone a formal security audit. For high-stakes sensitive data, consult a security professional.
> - **Browser trust**: Security depends on the integrity of the browser and the application code served. Use HTTPS in production.

---

## 📄 License

MIT © 2024 CipherPad
