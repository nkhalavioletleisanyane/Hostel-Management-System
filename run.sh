#!/bin/bash
# ==============================================================================
# Hostel Management System (HMS) - Full-Stack Runner Script
# Runs both Backend (Express - Port 5000) and Frontend (React + Vite - Port 5173)
# Automatically detects and kills any process holding either port before starting.
# ==============================================================================

# Ensure standard Node.js binary paths are available in PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/local/nodejs/bin:$PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=5001
FRONTEND_PORT=5173

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}================================================================${NC}"
echo -e "${BOLD}${CYAN}      🏫 Hostel Management System (HMS) - Service Starter       ${NC}"
echo -e "${BOLD}${CYAN}================================================================${NC}"

# Check for Node.js and npm
if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Node.js is not found in PATH.${NC}"
  echo "Please ensure Node.js is installed."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: npm is not found in PATH.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js version:${NC} $(node -v)"
echo -e "${GREEN}✓ npm version:${NC} $(npm -v)"
echo ""

# Function to kill busy ports
kill_port_if_busy() {
  local PORT=$1
  local SERVICE_NAME=$2

  echo -e "${BLUE}🔍 Checking port ${BOLD}$PORT${NC} ($SERVICE_NAME)..."
  
  # Find PIDs listening on the specified port
  local PIDS
  PIDS=$(lsof -ti :"$PORT" 2>/dev/null)

  if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}⚠️  Port $PORT is currently BUSY (PID(s): $(echo $PIDS | tr '\n' ' ')).${NC}"
    echo -e "${YELLOW}⚡ Killing process to release port $PORT...${NC}"
    
    for PID in $PIDS; do
      kill -9 "$PID" 2>/dev/null || true
    done
    sleep 1
    
    # Double check if killed
    local REMAINING
    REMAINING=$(lsof -ti :"$PORT" 2>/dev/null)
    if [ -z "$REMAINING" ]; then
      echo -e "${GREEN}✓ Port $PORT released successfully.${NC}"
    else
      echo -e "${RED}❌ Warning: Port $PORT still appears occupied by PID $REMAINING.${NC}"
    fi
  else
    echo -e "${GREEN}✓ Port $PORT is free.${NC}"
  fi
}

# 1. Kill busy ports for both services
echo -e "${BOLD}--- [1/3] Port Availability Check ---${NC}"
kill_port_if_busy $BACKEND_PORT "Backend Express API"
kill_port_if_busy $FRONTEND_PORT "Frontend React App"
echo ""

# 2. Check and install dependencies if needed
echo -e "${BOLD}--- [2/3] Verifying Dependencies ---${NC}"

if [ ! -d "$PROJECT_ROOT/hms-backend/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing Backend dependencies...${NC}"
  (cd "$PROJECT_ROOT/hms-backend" && npm install)
fi

if [ ! -d "$PROJECT_ROOT/hms-frontend/node_modules" ]; then
  echo -e "${YELLOW}📦 Installing Frontend dependencies...${NC}"
  (cd "$PROJECT_ROOT/hms-frontend" && npm install)
fi
echo -e "${GREEN}✓ All dependencies are installed.${NC}"
echo ""

# 3. Launch Services
echo -e "${BOLD}--- [3/3] Starting Backend & Frontend Servers ---${NC}"

# Cleanup function on Ctrl+C / exit
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Shutting down HMS services...${NC}"
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  
  # Ensure ports are clean
  lsof -ti :$BACKEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti :$FRONTEND_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  
  echo -e "${GREEN}✓ All services stopped cleanly. Goodbye!${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server
echo -e "${CYAN}🚀 Launching Backend API (Port $BACKEND_PORT)...${NC}"
(cd "$PROJECT_ROOT/hms-backend" && npm start) &
BACKEND_PID=$!

# Give backend a moment to bind
sleep 1.5

# Start Frontend Dev Server
echo -e "${CYAN}🚀 Launching Frontend React App (Port $FRONTEND_PORT)...${NC}"
(cd "$PROJECT_ROOT/hms-frontend" && npm run dev -- --port $FRONTEND_PORT --host) &
FRONTEND_PID=$!

# Display Access Info
sleep 2
echo ""
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}           🎉 ALL HMS SERVICES ARE UP AND RUNNING!              ${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "  ${BOLD}🌐 Frontend Web App:${NC}   ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  ${BOLD}⚙️  Backend REST API:${NC}   ${CYAN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "  ${BOLD}🏥 Health Check:${NC}       ${CYAN}http://localhost:${BACKEND_PORT}/api/health${NC}"
echo ""
echo -e "  ${BOLD}🔑 Demo Credentials:${NC}"
echo -e "     • ${BOLD}Admin Portal:${NC}   Username: ${YELLOW}violet${NC}    | Password: ${YELLOW}violet123${NC}"
echo -e "     • ${BOLD}Student Portal:${NC} Username: ${YELLOW}student${NC}   | Password: ${YELLOW}stu123${NC}"
echo ""
echo -e "  ${BOLD}Press [Ctrl+C] anytime to stop both servers.${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo ""

# Keep running and wait for background processes
wait $BACKEND_PID $FRONTEND_PID
