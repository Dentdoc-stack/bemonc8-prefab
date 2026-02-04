# 📊 Flood Dashboard - Excel to Dashboard Web App

A production-ready web application that transforms Excel progress tracking files into interactive, real-time dashboards with KPIs, charts, and detailed analytics.

## Features

✅ **Excel File Upload** - Drag & drop or click to upload .xlsx files  
✅ **Automatic Data Parsing** - Intelligent parsing of "Data_Entry" sheet  
✅ **Smart Data Validation** - Type-safe parsing with Zod schemas  
✅ **Real-time KPIs** - Track sites, tasks, progress, and delays  
✅ **Interactive Filters** - Multi-select filters for packages, districts, disciplines  
✅ **Cascading Filters** - District options dynamically filter based on selected packages  
✅ **Beautiful Charts** - Progress distribution, district analysis, status breakdown  
✅ **Expandable Tables** - Site-grouped view with task details  
✅ **Photo Support** - Display cover photos and link to photo folders  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Sample Data Generator** - Test without uploading files  

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

### Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## 📋 Excel File Format

### Expected Sheet Structure

**Sheet Name:** `Data_Entry` (falls back to first sheet if not found)

### Required Columns

| Column Name | Type | Description |
|-------------|------|-------------|
| package_id | String/Number | Unique package identifier |
| package_name | String | Human-readable package name |
| district | String | District/region name |
| site_id | String/Number | Unique site identifier |
| site_name | String | Human-readable site name |
| discipline | String | Task discipline (Civil, Electrical, etc.) |
| task_name | String | Task description |
| planned_start | Date | Planned start date |
| planned_finish | Date | Planned finish date |
| planned_duration_days | Number | Planned duration in days |
| actual_start | Date (optional) | Actual start date |
| actual_finish | Date (optional) | Actual finish date |
| progress_pct | Number (0-100, optional) | Current progress percentage |
| Variance | Number (optional) | Schedule variance in days |
| delay_flag_calc | String (optional) | Delay status category |
| last_updated | Date (optional) | Last update timestamp |
| remarks | Text (optional) | Additional notes |
| photo_folder_url | URL (optional) | Link to photo folder |
| cover_photo_share_url | URL (optional) | Share link for cover photo |
| cover_photo_direct_url | URL (optional) | Direct image URL for thumbnail |

### Data Processing Rules

1. **Date Handling**
   - Excel serial dates automatically converted to JavaScript Date objects
   - String dates parsed using standard date formats
   - Invalid dates treated as null

2. **Progress Calculation**
   - Task weight = `planned_duration_days` (defaults to 1 if missing)
   - Site progress = weighted average of task progress
   - Overall progress = weighted average across all tasks

3. **Status Classification**
   - **Completed**: `progress_pct >= 100` OR `actual_finish` exists
   - **In Progress**: `0 < progress_pct < 100` OR (`actual_start` exists AND `actual_finish` missing)
   - **Not Started**: (`progress_pct` null or 0) AND `actual_start` missing
   - **Delayed**: `delay_flag_calc` contains "DELAY" (case-insensitive)

4. **Site Grouping**
   - Sites identified by unique combination of `package_id` + `site_id`
   - Multiple tasks can belong to same site
   - Site-level metrics aggregated from task data

## 🎨 Customization Guide

### Modifying KPIs

Edit `src/lib/dataProcessor.ts`:

```typescript
export function computeKPIs(tasks: TaskWithStatus[]): DashboardKPIs {
  // Add your custom KPI calculations here
  const customMetric = tasks.filter(t => /* your logic */).length;
  
  return {
    totalSites: uniqueSites.size,
    totalTasks: tasks.length,
    // ... add customMetric
  };
}
```

Update `src/types/index.ts` to add the new KPI to the interface.

### Adding New Charts

Edit `src/components/Charts.tsx`:

```typescript
// 1. Add useMemo hook to compute chart data
const myCustomChart = useMemo(() => {
  // Process tasks into chart data
  return tasks.map(t => ({
    name: t.task_name,
    value: t.progress_pct ?? 0,
  }));
}, [tasks]);

// 2. Add chart component in the grid
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">My Custom Chart</h3>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={myCustomChart}>
      {/* Configure chart */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Customizing Filters

Edit `src/components/Filters.tsx` - Add new filter field to `FilterState` type in `src/types/index.ts`, then implement in the Filters component.

### Changing Theme Colors

Edit `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Change primary color */
  --secondary: 210 40% 96.1%;
  /* ... other colors */
}
```

## 🏗️ Architecture

### Project Structure

```
/src
  /app
    layout.tsx          # Root layout with metadata
    page.tsx            # Main page with upload/dashboard logic
    globals.css         # Global styles and CSS variables
  /components
    Dashboard.tsx       # Main dashboard container
    FileUpload.tsx      # Drag & drop file upload
    KPICards.tsx        # KPI metric cards
    Filters.tsx         # Filter controls
    Charts.tsx          # Recharts visualizations
    SiteTable.tsx       # Expandable site/task table
  /lib
    dataParser.ts       # Excel parsing and date conversion
    dataProcessor.ts    # Data aggregation and filtering
    sampleData.ts       # Sample data generator
    utils.ts            # Utility functions
  /types
    index.ts            # TypeScript types and Zod schemas
```

### Key Technologies

- **Next.js 14** (App Router) - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Recharts** - Chart library
- **SheetJS (xlsx)** - Excel file parsing
- **Zod** - Runtime validation
- **Lucide React** - Icon library

### Data Flow

1. User uploads Excel file → `parseXLSXFile()`
2. Rows validated with Zod → `taskSchema.parse()`
3. Status computed for each task → `computeTaskStatus()`
4. Tasks filtered based on user selections → `applyFilters()`
5. Data aggregated by site → `groupTasksBySite()`
6. KPIs computed → `computeKPIs()`
7. Components render with useMemo hooks for performance

## 📊 Performance Optimization

### Current Optimizations

- **Client-side parsing** - No server uploads needed
- **Memoized computations** - `useMemo` prevents unnecessary recalculations
- **Efficient filtering** - Filters applied in single pass
- **Lazy rendering** - Tables expand on demand

### Handling Large Files (50k+ rows)

If you encounter performance issues with very large files, implement:

1. **Web Worker Parsing** - Offload parsing to background thread
2. **Virtualized Tables** - Use `react-window` or `@tanstack/react-virtual`
3. **Pagination** - Implement server-side or client-side pagination
4. **Database Integration** - Store parsed data in SQLite/PostgreSQL

## 🧪 Testing

### Manual Testing with Sample Data

Click "Load Sample Data" button on home page to generate 90 tasks across 15 sites.

### Custom Test Data

Edit `src/lib/sampleData.ts`:

```typescript
// Generate more/fewer sites
const sampleTasks = generateSampleData(
  50,  // number of sites
  10   // tasks per site
);
```

## 🐛 Troubleshooting

### File Upload Not Working

- Check console for errors
- Verify file is .xlsx or .xls format
- Ensure sheet name is "Data_Entry" or exists in workbook

### Charts Not Displaying

- Verify Recharts is installed: `npm list recharts`
- Check browser console for errors
- Ensure data arrays are not empty

### Images Not Loading

- Verify `cover_photo_direct_url` contains valid image URL
- Check CORS policy if images are on different domain
- Add domains to `next.config.mjs` if needed

## 📝 License

MIT License - feel free to use in commercial projects.

---

Built with ❤️ using Next.js, TypeScript, and TailwindCSS