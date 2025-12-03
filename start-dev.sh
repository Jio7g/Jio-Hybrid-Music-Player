#!/bin/bash

echo "========================================="
echo "  Starting Hybrid Music Player"
echo "========================================="
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo ""
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    echo ""
fi

# Start backend in background
echo "Starting backend server..."
(cd backend && npm start) &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo "  Both servers are running!"
echo "========================================="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo "========================================="
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
