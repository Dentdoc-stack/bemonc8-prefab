#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=================================="
echo "  Flood Dashboard Setup Checker  "
echo "=================================="
echo ""

# Check Node.js version
echo -n "Checking Node.js version... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm version
echo -n "Checking npm version... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}!${NC} Dependencies not installed"
    echo "Run: npm install"
    exit 1
fi

# Check if .next build directory exists
echo -n "Checking if app has been built... "
if [ -d ".next" ]; then
    echo -e "${GREEN}✓${NC} Build directory exists"
else
    echo -e "${YELLOW}!${NC} App not built yet (optional)"
fi

# Check key files
echo ""
echo "Checking project files..."

FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.mjs"
    "tailwind.config.ts"
    "src/app/page.tsx"
    "src/components/Dashboard.tsx"
    "src/lib/dataParser.ts"
    "src/types/index.ts"
)

for file in "${FILES[@]}"; do
    echo -n "  $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
    fi
done

# Check if dev server is running
echo ""
echo -n "Checking if dev server is running... "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server is running"
    echo "Visit: http://localhost:3000"
else
    echo -e "${YELLOW}!${NC} Server not running"
    echo "Start with: npm run dev"
fi

echo ""
echo "=================================="
echo -e "${GREEN}Setup check complete!${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. npm run dev    - Start development server"
echo "2. npm run build  - Build for production"
echo "3. npm start      - Run production server"
echo ""
