#!/usr/bin/env bash
set -e
echo "🎮 Setting up Illuvara..."

echo "📦 Installing root dependencies (Express, SQLite, JWT)..."
npm install

echo "📦 Installing client dependencies (React, Vite, Tailwind, Framer Motion)..."
cd client && npm install && cd ..

echo "🌱 Seeding the database..."
npm run seed

echo ""
echo "✅ Setup complete! Run: npm run dev"
echo "   Frontend → http://localhost:5173"
echo "   Backend  → http://localhost:3001"
