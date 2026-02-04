# ✅ Installation & Verification Checklist

## Pre-Installation

- [ ] Node.js 18+ installed (`node -v`)
- [ ] npm or yarn installed (`npm -v`)
- [ ] Git installed (optional, for version control)

## Installation Steps

### 1. Dependencies Installation
```bash
npm install
```

**Expected output**: 
- `added 433 packages` (or similar)
- No critical errors
- Warnings about deprecated packages are normal

**Verify**: Check that `node_modules/` directory exists

### 2. Start Development Server
```bash
npm run dev
```

**Expected output**:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
✓ Ready in 1685ms
```

**Verify**: Server starts without errors

### 3. Test Application
Open http://localhost:3000 in browser

**Verify**:
- [ ] Upload page loads with title "Project Progress Dashboard"
- [ ] Drag & drop area is visible
- [ ] "Load Sample Data" button is visible

### 4. Test Sample Data
Click "Load Sample Data" button

**Verify**:
- [ ] Dashboard loads within 1-2 seconds
- [ ] 7 KPI cards display with numbers
- [ ] Filters section shows multiple options
- [ ] 4 charts render correctly
- [ ] Site table shows multiple rows
- [ ] Can expand site rows to see tasks

### 5. Test Filters
In the Filters section:
- [ ] Can search for site names
- [ ] Can select/deselect package names
- [ ] Can select districts
- [ ] "Show only delayed" toggle works
- [ ] "Clear all" button resets filters

### 6. Test Upload (Optional)
If you have an Excel file:
- [ ] Can drag & drop .xlsx file
- [ ] File uploads and parses
- [ ] Dashboard updates with your data

## Production Build (Optional)

```bash
npm run build
```

**Expected output**:
```
Route (app)              Size     First Load JS
┌ ○ /                   XXX B         XXX kB
└ ○ /_not-found         XXX B         XXX kB
```

**Verify**: Build completes without errors

## File Verification

Run the setup checker:
```bash
./check-setup.sh
```

Or manually verify these files exist:

### Core Files
- [ ] `package.json` - Dependencies
- [ ] `tsconfig.json` - TypeScript config
- [ ] `next.config.mjs` - Next.js config
- [ ] `tailwind.config.ts` - Tailwind config

### Source Files
- [ ] `src/app/page.tsx` - Main page
- [ ] `src/app/layout.tsx` - Root layout
- [ ] `src/app/globals.css` - Styles

### Components (6 files)
- [ ] `src/components/Dashboard.tsx`
- [ ] `src/components/FileUpload.tsx`
- [ ] `src/components/KPICards.tsx`
- [ ] `src/components/Filters.tsx`
- [ ] `src/components/Charts.tsx`
- [ ] `src/components/SiteTable.tsx`

### Libraries (4 files)
- [ ] `src/lib/dataParser.ts`
- [ ] `src/lib/dataProcessor.ts`
- [ ] `src/lib/sampleData.ts`
- [ ] `src/lib/utils.ts`

### Types
- [ ] `src/types/index.ts`

### Documentation (5 files)
- [ ] `README.md`
- [ ] `QUICKSTART.md`
- [ ] `DEPLOYMENT.md`
- [ ] `FILE_STRUCTURE.md`
- [ ] `PROJECT_SUMMARY.md`

## Common Issues & Solutions

### Issue: "Cannot find module 'react'"
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use
**Solution**:
```bash
npm run dev -- -p 3001
```

### Issue: Charts not displaying
**Solution**: 
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)
- Test with sample data first

### Issue: TypeScript errors in IDE
**Solution**:
- Wait for TypeScript server to fully load
- Restart VS Code
- Run `npm install` again

### Issue: Build fails with memory error
**Solution**:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## Browser Compatibility Check

Test in these browsers (if available):
- [ ] Chrome/Edge 90+ ✓
- [ ] Firefox 88+ ✓
- [ ] Safari 14+ ✓

## Performance Check

With sample data loaded:
- [ ] Dashboard loads in < 2 seconds
- [ ] Filters respond instantly
- [ ] Charts animate smoothly
- [ ] Table expands without lag

## Mobile Responsiveness (Optional)

Test on mobile or use browser DevTools:
- [ ] Layout adjusts for mobile screens
- [ ] All features accessible
- [ ] No horizontal scrolling

## Final Verification

Run all checks:
```bash
# Check if server is running
curl http://localhost:3000

# Verify build works
npm run build

# Check for security issues
npm audit
```

## Success Criteria

✅ **Installation Successful** if:
1. Server starts without errors
2. Sample data loads and displays
3. All charts render correctly
4. Filters work properly
5. Table is interactive (expand/collapse)

## Next Steps After Verification

1. **Customize**: Edit components to match your needs
2. **Test with real data**: Upload your Excel file
3. **Deploy**: Follow DEPLOYMENT.md guide
4. **Share**: Send URL to team members

---

**Congratulations!** 🎉 

If all checks pass, your Excel→Dashboard application is fully functional and ready to use!

For issues, check the Troubleshooting section in README.md
