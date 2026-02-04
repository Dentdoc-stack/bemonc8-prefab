import { Task } from '@/types';

/**
 * Generate sample data for testing
 */
export function generateSampleData(numSites = 10, tasksPerSite = 5): Task[] {
  const packages = ['PKG-001', 'PKG-002', 'PKG-003'];
  const packageNames = ['Infrastructure Phase 1', 'Building Construction', 'Water Management'];
  const districts = ['North District', 'South District', 'East District', 'West District'];
  const disciplines = ['Civil', 'Electrical', 'Mechanical', 'Architectural', 'Plumbing'];
  
  const tasks: Task[] = [];
  
  for (let s = 0; s < numSites; s++) {
    const packageIdx = s % packages.length;
    const package_id = packages[packageIdx];
    const package_name = packageNames[packageIdx];
    const district = districts[s % districts.length];
    const site_id = `SITE-${String(s + 1).padStart(3, '0')}`;
    const site_name = `${district} Site ${s + 1}`;
    
    // Random photo URLs for some sites
    const hasPhoto = Math.random() > 0.5;
    const coverPhotoDirectUrl = hasPhoto 
      ? `https://picsum.photos/seed/${s}/400/300` 
      : null;
    
    for (let t = 0; t < tasksPerSite; t++) {
      const discipline = disciplines[t % disciplines.length];
      const task_name = `${discipline} - Task ${t + 1}`;
      
      const baseDate = new Date(2024, 0, 1);
      const dayOffset = s * 30 + t * 7;
      const planned_start = new Date(baseDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const planned_duration_days = 10 + Math.floor(Math.random() * 20);
      const planned_finish = new Date(
        planned_start.getTime() + planned_duration_days * 24 * 60 * 60 * 1000
      );
      
      // Random progress
      const rand = Math.random();
      let progress_pct: number | null;
      let actual_start: Date | null = null;
      let actual_finish: Date | null = null;
      let delay_flag_calc: string;
      
      if (rand < 0.2) {
        // Not started
        progress_pct = null;
        delay_flag_calc = Math.random() > 0.5 ? 'On Track' : 'DELAYED (Not Started)';
      } else if (rand < 0.7) {
        // In progress
        progress_pct = 10 + Math.floor(Math.random() * 80);
        actual_start = new Date(planned_start.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
        delay_flag_calc = Math.random() > 0.6 ? 'On Track' : 'DELAYED (In Progress)';
      } else {
        // Completed
        progress_pct = 100;
        actual_start = new Date(planned_start.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
        actual_finish = new Date(
          actual_start.getTime() + (planned_duration_days + Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000
        );
        delay_flag_calc = 'On Track';
      }
      
      const last_updated = new Date();
      const Variance = progress_pct !== null && actual_start 
        ? Math.floor(Math.random() * 10) - 5 
        : null;
      
      tasks.push({
        package_id,
        package_name,
        district,
        site_id,
        site_name,
        discipline,
        task_name,
        planned_start,
        planned_finish,
        planned_duration_days,
        actual_start,
        actual_finish,
        progress_pct,
        Variance,
        delay_flag_calc,
        last_updated,
        remarks: Math.random() > 0.7 ? 'Sample remark about progress' : null,
        photo_folder_url: hasPhoto ? `https://drive.google.com/folder/${s}` : null,
        cover_photo_share_url: hasPhoto ? `https://drive.google.com/share/${s}` : null,
        cover_photo_direct_url: t === 0 ? coverPhotoDirectUrl : null, // Only first task has photo
      });
    }
  }
  
  return tasks;
}
