
import { Travel, Participant, ParticipationPeriod } from '@/types/models';
import { saveAs } from 'file-saver';

// Export travel data to JSON file
export const exportTravelToJSON = (travel: Travel) => {
  const fileName = `${travel.name.replace(/\s+/g, '_')}_backup_${new Date().toISOString().split('T')[0]}.json`;
  const data = JSON.stringify(travel, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  saveAs(blob, fileName);
};

// Import travel data from JSON file
export const importTravelFromJSON = (file: File): Promise<Travel> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const travel = JSON.parse(result) as Travel;
          
          // Validate the imported data
          if (!travel.id || !travel.name || !travel.startDate || !travel.endDate) {
            reject(new Error('Invalid travel data format'));
            return;
          }
          
          // Convert string dates to Date objects
          travel.startDate = new Date(travel.startDate);
          travel.endDate = new Date(travel.endDate);
          travel.created = new Date(travel.created);
          travel.updated = new Date(travel.updated);
          
          travel.participants = travel.participants.map(p => ({
            ...p,
            participationPeriods: p.participationPeriods.map(period => ({
              ...period,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
            })) as ParticipationPeriod[]
          }));
          
          travel.expenses = travel.expenses.map(e => ({
            ...e,
            date: new Date(e.date),
            created: new Date(e.created),
            updated: new Date(e.updated)
          }));
          
          travel.advanceContributions = travel.advanceContributions.map(c => ({
            ...c,
            date: new Date(c.date),
            created: new Date(c.created),
          }));
          
          resolve(travel);
        } else {
          reject(new Error('Failed to read file'));
        }
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};
