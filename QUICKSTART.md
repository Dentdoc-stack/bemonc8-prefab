# 🚀 Quick Start Guide

## Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Build for Production
```bash
npm run build
npm start
```

## Using the Application

### Option 1: Upload Your Excel File
1. Click or drag your .xlsx file to the upload area
2. File must have a "Data_Entry" sheet (or will use first sheet)
3. Wait for parsing (usually instant for files under 5000 rows)
4. Explore your dashboard with filters and charts

### Option 2: Test with Sample Data
1. Click "Load Sample Data" button
2. Generates 90 tasks across 15 sites
3. Fully interactive dashboard for testing

## File Structure Overview

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main upload/dashboard page
│   └── globals.css         # Tailwind styles
├── components/
│   ├── Dashboard.tsx       # Main dashboard container
│   ├── FileUpload.tsx      # Drag & drop upload
│   ├── KPICards.tsx        # KPI metrics display
│   ├── Filters.tsx         # Multi-select filters
│   ├── Charts.tsx          # Recharts visualizations
│   └── SiteTable.tsx       # Expandable site/task table
├── lib/
│   ├── dataParser.ts       # Excel parsing logic
│   ├── dataProcessor.ts    # Data aggregation
│   ├── sampleData.ts       # Test data generator
│   └── utils.ts            # Helper functions
└── types/
    └── index.ts            # TypeScript types & Zod schemas
```

## Customization Quick Reference

### Add New KPI
1. Edit `src/types/index.ts` - add to `DashboardKPIs` interface
2. Edit `src/lib/dataProcessor.ts` - compute in `computeKPIs()`
3. Edit `src/components/KPICards.tsx` - add card display

### Add New Chart
1. Edit `src/components/Charts.tsx`
2. Add useMemo hook to compute data
3. Add ResponsiveContainer with Recharts component

### Modify Filters
1. Edit `src/types/index.ts` - add to `FilterState` interface
2. Edit `src/lib/dataProcessor.ts` - update `applyFilters()`
3. Edit `src/components/Filters.tsx` - add UI control

### Change Colors/Theme
- Edit `src/app/globals.css` for global theme
- Modify Tailwind classes in components
- Update chart colors in `src/components/Charts.tsx`

## Deploy to Vercel

### Method 1: GitHub Integration
1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Auto-deploys on every push

### Method 2: Vercel CLI
```bash
npm install -g vercel
vercel
```

## Troubleshooting

**"Module not found" error**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

**Charts not showing**
- Check browser console for errors
- Verify data is not empty
- Try sample data first

**Excel upload fails**
- Check console for specific error
- Verify sheet name is "Data_Entry"
- Check column names match expected format

## Performance Tips

For files with 10,000+ rows:
1. Use Chrome/Edge (better JS performance)
2. Consider pagination in `SiteTable.tsx`
3. Implement virtualization with `@tanstack/react-virtual`
4. Use Web Workers for parsing (see README)

## Next Steps

✅ Test with sample data  
✅ Upload your own Excel file  
✅ Customize KPIs for your needs  
✅ Add new charts/visualizations  
✅ Deploy to Vercel  
✅ Add authentication (NextAuth.js)  
✅ Add database (if needed)  

Enjoy your dashboard! 🎉
