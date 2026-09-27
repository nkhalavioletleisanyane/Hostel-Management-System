#!/bin/bash
# ==============================================================================
# Hostel Management System (HMS) - One-Click Installer Script
# Automatically verifies environment, installs backend & frontend dependencies,
# creates necessary configuration files, and grants execution permissions.
# ==============================================================================

# Ensure standard Node.js binary paths are in PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/local/nodejs/bin:$PATH"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}================================================================${NC}"
echo -e "${BOLD}${CYAN}     🛠️  Hostel Management System (HMS) - Setup & Installer     ${NC}"
echo -e "${BOLD}${CYAN}================================================================${NC}"
echo -e "${CYAN}Project Directory:${NC} $PROJECT_ROOT"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Verify System Prerequisites (Node.js & npm)
# ------------------------------------------------------------------------------
echo -e "${BOLD}${BLUE}--- [Step 1/4] Checking System Prerequisites ---${NC}"

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: Node.js is not found in your system PATH.${NC}"
  echo -e "${YELLOW}Please install Node.js (version 18 or higher) before running this script.${NC}"
  echo "  • Download directly: https://nodejs.org"
  echo "  • On macOS (Homebrew): brew install node"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}❌ Error: npm is not found in your system PATH.${NC}"
  echo -e "${YELLOW}Please install npm alongside Node.js.${NC}"
  exit 1
fi

NODE_VER=$(node -v)
NPM_VER=$(npm -v)

echo -e " ${GREEN}✓ Node.js detected:${NC} ${BOLD}${NODE_VER}${NC}"
echo -e " ${GREEN}✓ npm detected:${NC}     ${BOLD}v${NPM_VER}${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 2: Configure & Install Backend Dependencies (hms-backend)
# ------------------------------------------------------------------------------
echo -e "${BOLD}${BLUE}--- [Step 2/4] Setting up Backend Service (Node.js / Express) ---${NC}"

if [ ! -d "$PROJECT_ROOT/hms-backend" ]; then
  echo -e "${RED}❌ Error: hms-backend folder not found at $PROJECT_ROOT/hms-backend${NC}"
  exit 1
fi

# Ensure .env exists for backend
if [ ! -f "$PROJECT_ROOT/hms-backend/.env" ]; then
  if [ -f "$PROJECT_ROOT/hms-backend/.env.example" ]; then
    echo -e " ${YELLOW}⚙️  Creating hms-backend/.env from .env.example...${NC}"
    cp "$PROJECT_ROOT/hms-backend/.env.example" "$PROJECT_ROOT/hms-backend/.env"
    echo -e " ${GREEN}✓ Backend .env file generated.${NC}"
  else
    echo -e " ${YELLOW}⚙️  Generating default hms-backend/.env...${NC}"
    cat <<EOF > "$PROJECT_ROOT/hms-backend/.env"
PORT=5000
NODE_ENV=development
JWT_SECRET=hms_super_secret_jwt_key_2024
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostel_db
DB_USER=postgres
DB_PASSWORD=postgres
EOF
    echo -e " ${GREEN}✓ Backend .env file generated.${NC}"
  fi
else
  echo -e " ${GREEN}✓ Backend .env configuration exists.${NC}"
fi

echo -e " ${CYAN}📦 Installing backend packages (npm install)...${NC}"
(cd "$PROJECT_ROOT/hms-backend" && npm install)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Backend dependency installation encountered an issue.${NC}"
  exit 1
fi
echo -e " ${GREEN}✓ Backend dependencies installed successfully.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 3: Configure & Install Frontend Dependencies (hms-frontend)
# ------------------------------------------------------------------------------
echo -e "${BOLD}${BLUE}--- [Step 3/4] Setting up Frontend Service (React + Vite) ---${NC}"

if [ ! -d "$PROJECT_ROOT/hms-frontend" ]; then
  echo -e "${RED}❌ Error: hms-frontend folder not found at $PROJECT_ROOT/hms-frontend${NC}"
  exit 1
fi

echo -e " ${CYAN}📦 Installing frontend packages (npm install)...${NC}"
(cd "$PROJECT_ROOT/hms-frontend" && npm install)

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Frontend dependency installation encountered an issue.${NC}"
  exit 1
fi
echo -e " ${GREEN}✓ Frontend dependencies installed successfully.${NC}"
echo ""

# ------------------------------------------------------------------------------
# STEP 4: Set Script Execution Permissions
# ------------------------------------------------------------------------------
echo -e "${BOLD}${BLUE}--- [Step 4/4] Setting Execution Permissions ---${NC}"

chmod +x "$PROJECT_ROOT/run.sh" 2>/dev/null || true
chmod +x "$PROJECT_ROOT/install.sh" 2>/dev/null || true

echo -e " ${GREEN}✓ Granted executable permissions to run.sh and install.sh.${NC}"
echo ""

# ------------------------------------------------------------------------------
# SETUP COMPLETE
# ------------------------------------------------------------------------------
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo -e "${BOLD}${GREEN}       🎉 HMS PROJECT INSTALLATION COMPLETED SUCCESSFULLY!      ${NC}"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo ""
echo -e " ${BOLD}How to Run the Project:${NC}"
echo -e "   1. Simply execute in your terminal:"
echo -e "      ${CYAN}${BOLD}./run.sh${NC}"
echo -e "      or double-click ${BOLD}run.sh${NC} in Finder."
echo ""
echo -e "   2. Once running, open your browser at:"
echo -e "      ${BOLD}Frontend:${NC}  ${CYAN}http://localhost:5173${NC}"
echo -e "      ${BOLD}Backend:${NC}   ${CYAN}http://localhost:5000${NC}"
echo ""
echo -e "   3. Demo Accounts:"
echo -e "      • ${BOLD}Admin Portal:${NC}   admin   /  admin123"
echo -e "      • ${BOLD}Student Portal:${NC} student /  stu123"
echo -e "${BOLD}${GREEN}================================================================${NC}"
echo ""

# Optional: Prompt to start now if running in an interactive terminal
if [ -t 0 ]; then
  read -r -p "Would you like to start the project now? [Y/n] " response
  response=$(echo "$response" | tr '[:upper:]' '[:lower:]')
  if [[ "$response" =~ ^(yes|y|"")$ ]] || [ -z "$response" ]; then
    echo ""
    echo -e "${CYAN}🚀 Launching ./run.sh...${NC}"
    exec "$PROJECT_ROOT/run.sh"
  fi
fi
