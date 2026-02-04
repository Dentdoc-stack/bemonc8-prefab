# 🧪 Testing Cascading Filters

## Quick Test Guide

### Test 1: Basic Cascading Behavior

1. **Load Sample Data**
   - Click "Load Sample Data" button
   - Dashboard loads with data

2. **Observe Initial State**
   - Look at District filter
   - Should show all districts (no filter applied)
   - Note the districts available

3. **Select a Package**
   - In Package filter, check one package (e.g., "Infrastructure Phase 1")
   - Observe District filter
   - ✅ District options should reduce to only those in selected package
   - ✅ Label should show "(filtered by package)" indicator

4. **Select Multiple Packages**
   - Add another package to selection
   - Observe District filter
   - ✅ District options should be union of both packages
   - ✅ More districts should appear

5. **Deselect All Packages**
   - Uncheck all packages
   - Observe District filter
   - ✅ All districts should be available again
   - ✅ "(filtered by package)" indicator should disappear

---

### Test 2: Auto-Clear Invalid Selections

1. **Setup**
   - Select Package A (e.g., "Infrastructure Phase 1")
   - Select a district that exists in Package A (e.g., "North District")
   - Verify results show in table

2. **Change Package Selection**
   - Uncheck Package A
   - Select Package B (e.g., "Building Construction")
   - If "North District" doesn't exist in Package B:
     - ✅ "North District" should automatically deselect
     - ✅ District count should update to (0 selected)

3. **Verify No Errors**
   - ✅ No console errors
   - ✅ Dashboard still shows data
   - ✅ User can select new valid districts

---

### Test 3: Empty State

1. **Create Empty Scenario** (if possible with your data)
   - Select a package that has no districts
   - OR manipulate test data to create this scenario

2. **Observe Empty State**
   - District filter should show:
     ```
     District (0 selected) [filtered by package]
     No districts available for selected package(s)
     ```
   - ✅ Message is clear and helpful
   - ✅ No broken UI

---

### Test 4: Performance with Large Data

1. **Load Sample Data** with many rows (if using custom generator)
   ```typescript
   // In src/lib/sampleData.ts
   generateSampleData(100, 10) // 1000 tasks
   ```

2. **Test Responsiveness**
   - Select/deselect packages rapidly
   - ✅ District filter updates instantly (< 100ms)
   - ✅ No lag or freezing
   - ✅ No console warnings about performance

---

### Test 5: Multi-Select Logic

1. **Test OR Logic Within Packages**
   - Select Package A and Package B
   - Districts shown should be: `Districts_in_A ∪ Districts_in_B`
   - ✅ Union (OR) logic works correctly

2. **Test AND Logic Across Filters**
   - Select Package A
   - Select District X (that exists in Package A)
   - Results should be: `Tasks in Package A AND District X`
   - ✅ AND logic between different filter types works

---

### Test 6: User Experience Flow

**Scenario: User exploring project data**

1. User loads data
2. User selects "Infrastructure Phase 1" package
3. User sees 3 districts available (North, South, East)
4. User selects "North District"
5. User sees filtered results
6. User wants to see "Building Construction" instead
7. User unchecks "Infrastructure Phase 1"
8. User checks "Building Construction"
9. ✅ "North District" auto-clears (doesn't exist in Building)
10. ✅ User sees new districts (South, West)
11. ✅ User can select valid districts
12. ✅ No confusion or errors

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| No packages selected | All districts shown |
| 1 package selected | Only districts in that package |
| 2+ packages selected | Union of districts from all selected packages |
| Change packages | Auto-clear invalid district selections |
| No districts available | Show empty state message |
| Package filter active | Show "(filtered by package)" label |

---

## Console Checks

Open browser DevTools (F12) → Console

### Should NOT see:
❌ React errors or warnings  
❌ "Cannot read property" errors  
❌ Infinite loop warnings  
❌ Performance warnings  

### Should see (optional):
✅ Clean console output  
✅ Normal Next.js Fast Refresh messages  

---

## Visual Checklist

- [ ] District label shows "(filtered by package)" when packages selected
- [ ] District count updates correctly (X selected)
- [ ] Checkboxes are properly checked/unchecked
- [ ] Empty state message is centered and readable
- [ ] Filter section doesn't jump or resize awkwardly
- [ ] Smooth transitions when options change

---

## Edge Cases to Test

### Edge Case 1: All Districts in Common
- Select packages that all share the same districts
- ✅ District filter should show common districts
- ✅ No duplicates in list

### Edge Case 2: No Districts in Common
- Select packages with completely different districts
- ✅ District filter should show all unique districts (union)

### Edge Case 3: Rapid Filter Changes
- Quickly select/deselect multiple packages
- ✅ UI remains responsive
- ✅ No race conditions or stale data

### Edge Case 4: Browser Back/Forward
- Make filter selections
- Navigate away (if multi-page)
- Use browser back button
- ✅ Filter state should reset or maintain correctly

---

## Automated Test Ideas

For future integration tests:

```typescript
describe('Cascading Filters', () => {
  it('should filter districts by selected packages', () => {
    // Select package A
    // Verify district options match package A districts
  });

  it('should auto-clear invalid district selections', () => {
    // Select package A and district X
    // Switch to package B (without district X)
    // Verify district X is deselected
  });

  it('should show empty state when no districts available', () => {
    // Select package with no districts
    // Verify empty state message appears
  });

  it('should perform union of districts for multiple packages', () => {
    // Select package A and B
    // Verify districts = union(A districts, B districts)
  });
});
```

---

## Troubleshooting Test Failures

### Districts Not Filtering
**Check:** Is `allTasks` prop passed to Filters component?  
**Fix:** Verify Dashboard.tsx has `allTasks={tasks}`

### Auto-Clear Not Working
**Check:** Is `useMemo` dependency array correct?  
**Fix:** Ensure `[availableDistricts, filters, setFilters]` dependencies

### Performance Issues
**Check:** Is `useMemo` being used?  
**Fix:** Verify both `availableDistricts` and auto-clear logic use `useMemo`

### Empty State Not Showing
**Check:** Is `availableDistricts.length === 0` condition correct?  
**Fix:** Verify conditional rendering in Filters.tsx

---

## Success Criteria

✅ **All Tests Pass** - No errors or unexpected behavior  
✅ **Smooth UX** - Instant filter updates, no lag  
✅ **Clear Feedback** - Visual indicators and labels  
✅ **Data Integrity** - Filters always produce valid results  
✅ **No Bugs** - No console errors, no UI glitches  

---

**Test Status**: Ready for QA

Run through these tests after any changes to filter logic to ensure cascading behavior remains correct.
