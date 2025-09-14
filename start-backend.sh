#!/bin/bash

echo "Starting Finance Manager Backend..."
cd backend
npm install
echo ""
echo "Backend dependencies installed!"
echo "Starting server on http://localhost:3010"
echo ""
npm run dev
