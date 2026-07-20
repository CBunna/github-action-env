# MongoDB Environment Variable & Secrets Practice App

This is a brand new, lightweight Node.js Express application connected to MongoDB. It is built specifically to help you practice configuring and using environment variables and secrets in GitHub Actions.

## Project Structure

- `server.js` - Express API server with endpoints for `/health`, `GET /products`, and `POST /products`.
- `db.js` - MongoDB connection setup. It supports reading connection settings dynamically from environment variables.
- `server.test.js` - Integration tests verifying the API against a real database.
- `.github/workflows/ci.yml` - GitHub Actions workflow demonstrating MongoDB service containers, environment variables, and repository secrets.

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
Run the following command in this directory to install Express, MongoDB, Vitest, and Supertest:
```bash
npm install
```

### 2. Configure Local Environment Variables
Create a file named `.env` in this directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/practice-db
```
*(If you are using MongoDB Atlas, replace `MONGODB_URI` with the split variables `MONGODB_USERNAME`, `MONGODB_PASSWORD`, etc.)*

### 3. Run the App
```bash
npm start
```

### 4. Run the Tests
Ensure you have a MongoDB instance running locally, then execute:
```bash
npm test
```

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
3. Create two secrets:
   - `MONGODB_USERNAME`
   - `MONGODB_PASSWORD`
4. The workflow will automatically inject them during the run:
   ```yaml
   env:
     MONGODB_USERNAME: ${{ secrets.MONGODB_USERNAME }}
     MONGODB_PASSWORD: ${{ secrets.MONGODB_PASSWORD }}
   ```
