# PostgreSQL Setup Guide

## Current Issue
PostgreSQL is installed but requires password authentication. Here's how to fix it:

## Option 1: Set up PostgreSQL with password (Recommended)

1. **Set a password for your user:**
   ```bash
   psql -h localhost -p 5432 -U deekshithhu -d postgres
   ```
   Then in the PostgreSQL prompt:
   ```sql
   ALTER USER deekshithhu PASSWORD 'your_password';
   \q
   ```

2. **Update the .env file:**
   ```bash
   echo "DATABASE_URL=postgresql://deekshithhu:your_password@localhost:5432/findmyhelper" > .env
   ```

3. **Create the database:**
   ```bash
   createdb -h localhost -U deekshithhu findmyhelper
   ```

## Option 2: Use PostgreSQL without authentication (Development only)

1. **Edit PostgreSQL configuration:**
   ```bash
   sudo nano /opt/homebrew/var/postgresql@14/postgresql.conf
   ```
   Add this line:
   ```
   listen_addresses = 'localhost'
   ```

2. **Edit pg_hba.conf:**
   ```bash
   sudo nano /opt/homebrew/var/postgresql@14/pg_hba.conf
   ```
   Change the line:
   ```
   local   all             all                                     peer
   ```
   To:
   ```
   local   all             all                                     trust
   ```

3. **Restart PostgreSQL:**
   ```bash
   brew services restart postgresql@14
   ```

4. **Create database:**
   ```bash
   createdb findmyhelper
   ```

## Option 3: Use Docker PostgreSQL (Easiest)

1. **Run PostgreSQL in Docker:**
   ```bash
   docker run --name findmyhelper-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=findmyhelper -p 5432:5432 -d postgres:14
   ```

2. **Update .env file:**
   ```bash
   echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/findmyhelper" > .env
   ```

## Test the connection

After setting up any option, test with:
```bash
psql -h localhost -p 5432 -d findmyhelper -c "SELECT version();"
```

## For now, the app will work with in-memory storage

The email notification system will work perfectly with in-memory storage while you set up PostgreSQL. 