# MongoDB Environment Variable & Secrets Practice App

This is a brand new, lightweight Node.js Express application connected to MongoDB. It is built specifically to help you practice configuring and using environment variables and secrets in GitHub Actions.

## Project Structure

```
.
├── backend/                 # Express API server
│   ├── server.js            # Endpoints for /health, GET /products, POST /products
│   ├── db.js                # MongoDB connection setup (reads env vars dynamically)
│   ├── server.test.js       # Integration tests verifying the API against a real database
│   ├── package.json
│   └── .env                 # Local-only env vars (gitignored)
├── frontend/                 # Static frontend served by the backend
│   ├── index.html
│   ├── app.js
│   └── style.css
├── Dockerfile                # Single image: builds backend, copies frontend alongside it
├── docker-compose.yaml       # App + MongoDB service
└── .github/workflows/
    ├── deployment.yml        # Test → build → deploy pipeline (MongoDB Atlas secrets, health check)
    └── matrix.yaml            # Matrix build demo across Node versions/OS
```

The backend serves the frontend as static files: `server.js` resolves `../frontend` relative to its own location (`__dirname`), so this works identically whether you run `npm start` from `backend/` locally or inside the Docker image, where `frontend/` is copied in as a sibling of `backend/`.

---

## Environment Variables Used

This application reads the following variables from `process.env`:

1. **`MONGODB_URI`** - Full database connection string (e.g., `mongodb://localhost:27017/practice-db`). If set, the app will use this directly.
2. **Or split variables (for MongoDB Atlas practice)**:
   - **`MONGODB_USERNAME`** - Database username.
   - **`MONGODB_PASSWORD`** - Database password.
   - **`MONGODB_CLUSTER_ADDRESS`** - Database host/cluster address (e.g., `cluster0.abcde.mongodb.net`).
   - **`MONGODB_DB_NAME`** - Name of the database collection (defaults to `practice-db`).
3. **`PORT`** - Port number for the Express server (defaults to `3000`).
4. **`NODE_ENV`** - Application environment (set to `test` to disable server autostart during test runs).

---

## Local Development Practice

### 1. Install Dependencies
Run the following command in the `backend/` directory to install Express, MongoDB, Vitest, and Supertest:
```bash
cd backend
npm install
```

### 2. Configure Local Environment Variables
Create a file named `.env` in `backend/`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/practice-db
```
*(If you are using MongoDB Atlas, replace `MONGODB_URI` with the split variables `MONGODB_USERNAME`, `MONGODB_PASSWORD`, etc.)*

### 3. Run the App
```bash
cd backend
npm start
```

### 4. Run the Tests
Ensure you have a MongoDB instance running locally, then execute (from `backend/`):
```bash
npm test
```

### 5. Run with Docker
From the repository root (build context needs both `backend/` and `frontend/`):
```bash
docker compose up --build
```
This builds a single image containing the backend and frontend, and starts a MongoDB container alongside it.

---

## GitHub Actions Practice

The workflow file in `.github/workflows/ci.yml` is preconfigured to demonstrate two main database environment variable scenarios:

### Scenario A: Running Integration Tests (using Service Containers)
Since GitHub runners do not have MongoDB pre-installed, we spin up a MongoDB container as a `service`.
We pass the connection URI directly to the test job using the `env` block in the test step:
```yaml
      - name: Run Integration Tests
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://127.0.0.1:27017/practice-db
        run: npm test
```

### Scenario B: Practicing Repository Secrets (e.g., for Production/Atlas)
To simulate connecting to an external database like MongoDB Atlas:
1. Go to your GitHub repository.
2. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
3. Create three secrets:
   - `MONGODB_USERNAME`
   - `MONGODB_PASSWORD`
   - `MONGODB_CLUSTER_ADDRESS`
4. The workflows will automatically inject them during the run:
   ```yaml
   env:
     MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
     MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
     MONGODB_CLUSTER_ADDRESS: ${{ secrets.MONGODB_CLUSTER_ADDRESS }}
   ```

---

## Deployment Health Verification

Inside [.github/workflows/deployment.yml](file:///.github/workflows/deployment.yml), we also run a step to verify the server and database connection health before compiling build artifacts:
```yaml
            - name: Verify Server and DB Health
              working-directory: backend
              run: |
                  node server.js &
                  sleep 5
                  curl --fail http://localhost:3000/health
```
This starts the backend Express server in the background, waits 5 seconds for the database connection (using the Atlas secrets) to establish, and runs a `curl` call against the `/health` check route. If the database cannot connect or the server fails, the workflow immediately halts and fails.
