# Nexus E-Commerce

Nexus E-Commerce is a full-stack online store with product search, user accounts, an admin dashboard, real-time updates and test-mode online payments. A single Node.js server runs the Express API and serves the React frontend, so there is only one process to start.

## Features

- Product catalog with search
- Sign-up and login with Firebase authentication, with roles (customer and admin) stored in the database
- Admin dashboard for managing the store
- Test payment integration with Razorpay
- Real-time updates over Socket.IO
- Image and file uploads with Multer
- Request logging to the database, with suspicious requests flagged
- Health-check endpoint at `/api/health`
- Smooth UI animations with Framer Motion

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7, Framer Motion, Lucide icons, React Hot Toast |
| Backend | Node.js, Express 4, Socket.IO, CORS, dotenv |
| Database | MySQL with Sequelize ORM (`mysql2`) |
| Auth | Firebase Auth and Firebase Admin, JSON Web Tokens, bcryptjs |
| Payments | Razorpay |
| Other | Google Gemini SDK (`@google/genai`), Google APIs, Multer |

## Project Structure

```
e-commerce/
├── backend/           Express server, models, auth, payment and API routes
├── middleware/        Shared middleware
├── public/            Static assets
├── src/               React frontend
├── index.html
├── metadata.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A running MySQL server
- A Firebase project (with a service account)
- A Razorpay account in test mode
- A Gemini API key (only if you use the Gemini features)

### 1. Clone and install

```bash
git clone https://github.com/irfanstl/e-commerce.git
cd e-commerce
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root. Never commit it.

```env
PORT=3000
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
GEMINI_API_KEY=your-gemini-key
```

Also add your MySQL connection details, Razorpay keys, JWT secret and the Firebase web config used by the frontend. The variable names are read in the files under `backend/` (for example `db.js` and `payment.js`), so check those for the exact names.

### 3. Run in development

```bash
npm run dev
```

This starts the Express server, which also runs Vite in middleware mode. Open `http://localhost:3000`.

### 4. Build and run for production

```bash
npm run build
NODE_ENV=production node backend/server.js
```

In production the server serves the built files from `dist/`.

## Available Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the server with the Vite dev middleware |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run clean` | Remove the `dist/` folder |

## API Overview

| Route | Access | Purpose |
| --- | --- | --- |
| `/api/health` | Public | Server health check |
| `/api/auth` | Public | Authentication |
| `/api/products` | Public | Product listing and search |
| `/api/razorpay` | Signed-in users | Payment creation and verification |
| `/api/*` | Signed-in users | Other app routes (orders, admin and more) |

Protected routes expect a Firebase ID token in the header: `Authorization: Bearer <token>`.

## Notes

- Every request is checked against the database connection, and the API returns `503` if the database is down.
- Payments run in Razorpay test mode. Use test keys only.

## Contributing

Pull requests are welcome. For larger changes, open an issue first to discuss what you would like to change.

## License

No license has been specified yet. Add a `LICENSE` file (for example MIT) to state how others may use this code.
