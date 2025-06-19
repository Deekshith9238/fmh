#!/bin/bash

echo "🔧 PostgreSQL Setup Script for FindMyHelper"
echo "============================================="

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL status..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo "Starting PostgreSQL..."
    brew services start postgresql@14
    sleep 3
fi

# Try to connect and set up the database
echo "🔐 Setting up database connection..."

# Try to connect without password first
if psql -h localhost -p 5432 -U deekshithhu -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Connected without password"
    
    # Create database
    echo "🗄️ Creating database..."
    createdb -h localhost -U deekshithhu findmyhelper 2>/dev/null || echo "Database might already exist"
    
    echo "✅ Database setup complete!"
    echo "📝 Update your .env file with:"
    echo "DATABASE_URL=postgresql://deekshithhu@localhost:5432/findmyhelper"
    
elif psql -h localhost -p 5432 -U deekshithhu -d postgres -c "SELECT 1;" 2>&1 | grep -q "password authentication failed"; then
    echo "🔑 Password authentication required"
    echo ""
    echo "To set up PostgreSQL with password:"
    echo "1. Connect to PostgreSQL:"
    echo "   psql -h localhost -p 5432 -U deekshithhu -d postgres"
    echo ""
    echo "2. Set a password for your user:"
    echo "   ALTER USER deekshithhu PASSWORD 'your_password';"
    echo "   \\q"
    echo ""
    echo "3. Create the database:"
    echo "   createdb -h localhost -U deekshithhu findmyhelper"
    echo ""
    echo "4. Update your .env file with:"
    echo "   DATABASE_URL=postgresql://deekshithhu:your_password@localhost:5432/findmyhelper"
    
else
    echo "❌ Cannot connect to PostgreSQL"
    echo ""
    echo "Alternative setup options:"
    echo ""
    echo "Option 1: Use Docker PostgreSQL (Recommended)"
    echo "docker run --name findmyhelper-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=findmyhelper -p 5432:5432 -d postgres:14"
    echo "Then update .env with: DATABASE_URL=postgresql://postgres:password@localhost:5432/findmyhelper"
    echo ""
    echo "Option 2: Configure PostgreSQL for development"
    echo "Edit /opt/homebrew/var/postgresql@14/pg_hba.conf and change 'peer' to 'trust' for local connections"
    echo "Then restart: brew services restart postgresql@14"
fi

echo ""
echo "🚀 For now, the app will work with in-memory storage while you set up PostgreSQL!"
echo "The email notification system is fully functional with in-memory storage." 