
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Travel, Participant, Expense, Settlement, AdvanceContribution } from '@/types/models';
import { format } from 'date-fns';

export interface ExportData {
  travel: Travel;
  participants: Participant[];
  expenses: Expense[];
  settlements: Settlement[];
  contributions: AdvanceContribution[];
}

export const exportToExcel = async (data: ExportData) => {
  const { travel, participants, expenses, settlements, contributions } = data;
  
  // Create a new workbook and add worksheets
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Travel Splitter';
  workbook.lastModifiedBy = 'Travel Splitter';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Add travel info worksheet
  const infoSheet = workbook.addWorksheet('Travel Info');
  
  // Style for headers
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '9B87F5' } } as ExcelJS.FillPattern,
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  // Style for data cells
  const dataCellStyle = {
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  // Travel Info Section
  infoSheet.mergeCells('A1:B1');
  const titleCell = infoSheet.getCell('A1');
  titleCell.value = `Travel Details: ${travel.name}`;
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };
  
  infoSheet.getColumn('A').width = 20;
  infoSheet.getColumn('B').width = 30;
  
  const infoRows = [
    ['Travel Name', travel.name],
    ['Start Date', format(new Date(travel.startDate), 'MMMM d, yyyy')],
    ['End Date', format(new Date(travel.endDate), 'MMMM d, yyyy')],
    ['Description', travel.description || 'N/A'],
    ['Currency', travel.currency],
    ['Participants', participants.length],
    ['Total Expenses', expenses.reduce((sum, exp) => sum + exp.amount, 0)],
    ['Created Date', format(new Date(travel.created), 'MMMM d, yyyy')]
  ];
  
  infoRows.forEach((row, index) => {
    const rowNum = index + 3;
    infoSheet.addRow(row);
    
    // Style cells
    const keyCell = infoSheet.getCell(`A${rowNum}`);
    const valueCell = infoSheet.getCell(`B${rowNum}`);
    
    keyCell.font = { bold: true };
    
    Object.assign(keyCell, dataCellStyle);
    Object.assign(valueCell, dataCellStyle);
  });
  
  // Add participants worksheet
  const participantsSheet = workbook.addWorksheet('Participants');
  
  // Add headers
  const participantsHeaders = ['Name', 'Email', 'Start Date', 'End Date', 'Days', 'Created'];
  const participantsHeaderRow = participantsSheet.addRow(participantsHeaders);
  
  // Apply header style
  participantsHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  participants.forEach(participant => {
    const startDate = participant.participationPeriods[0]?.startDate || travel.startDate;
    const endDate = participant.participationPeriods[0]?.endDate || travel.endDate;
    
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const row = participantsSheet.addRow([
      participant.name,
      participant.email || 'N/A',
      format(new Date(startDate), 'MMM d, yyyy'),
      format(new Date(endDate), 'MMM d, yyyy'),
      days.toString(),
      format(new Date(participant.created), 'MMM d, yyyy HH:mm')
    ]);
    
    // Apply data style
    row.eachCell((cell) => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Auto-fit columns
  participantsSheet.columns.forEach(column => {
    const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
    const maxLength = Math.max(...(lengths || [0]), 10);
    column.width = maxLength + 2;
  });
  
  // Add expenses worksheet
  const expensesSheet = workbook.addWorksheet('Expenses');
  
  // Add headers
  const expensesHeaders = ['Date', 'Description', 'Amount', 'Paid By', 'Category', 'Shared With'];
  const expensesHeaderRow = expensesSheet.addRow(expensesHeaders);
  
  // Apply header style
  expensesHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  expenses.forEach(expense => {
    const paidBy = participants.find(p => p.id === expense.paidById)?.name || 'Unknown';
    const sharedWith = expense.splitMode === 'all' 
      ? 'All Participants' 
      : expense.splitIds?.map(id => participants.find(p => p.id === id)?.name).join(', ') || 'Unknown';
    
    const row = expensesSheet.addRow([
      format(new Date(expense.date), 'MMM d, yyyy'),
      expense.description,
      expense.amount.toString(),
      paidBy,
      expense.category || 'Other',
      sharedWith
    ]);
    
    // Apply data style
    row.eachCell((cell) => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Auto-fit columns
  expensesSheet.columns.forEach(column => {
    const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
    const maxLength = Math.max(...(lengths || [0]), 10);
    column.width = maxLength + 2;
  });
  
  // Add contributions worksheet
  const contributionsSheet = workbook.addWorksheet('Contributions');
  
  // Add headers
  const contributionsHeaders = ['Date', 'Participant', 'Amount', 'Comment'];
  const contributionsHeaderRow = contributionsSheet.addRow(contributionsHeaders);
  
  // Apply header style
  contributionsHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  contributions.forEach(contribution => {
    const participantName = participants.find(p => p.id === contribution.participantId)?.name || 'Unknown';
    
    const row = contributionsSheet.addRow([
      format(new Date(contribution.date), 'MMM d, yyyy'),
      participantName,
      contribution.amount.toString(),
      contribution.comment || 'N/A'
    ]);
    
    // Apply data style
    row.eachCell((cell) => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Auto-fit columns
  contributionsSheet.columns.forEach(column => {
    const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
    const maxLength = Math.max(...(lengths || [0]), 10);
    column.width = maxLength + 2;
  });
  
  // Add settlements worksheet
  const settlementsSheet = workbook.addWorksheet('Settlements');
  
  // Add headers
  const settlementsHeaders = ['From', 'To', 'Amount', 'Status'];
  const settlementsHeaderRow = settlementsSheet.addRow(settlementsHeaders);
  
  // Apply header style
  settlementsHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  settlements.forEach(settlement => {
    const fromName = participants.find(p => p.id === settlement.fromParticipantId)?.name || 'Unknown';
    const toName = participants.find(p => p.id === settlement.toParticipantId)?.name || 'Unknown';
    
    const row = settlementsSheet.addRow([
      fromName,
      toName,
      settlement.amount.toString(),
      settlement.status || 'Pending'
    ]);
    
    // Apply data style
    row.eachCell((cell) => {
      Object.assign(cell, dataCellStyle);
    });
  });
  
  // Auto-fit columns
  settlementsSheet.columns.forEach(column => {
    const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
    const maxLength = Math.max(...(lengths || [0]), 10);
    column.width = maxLength + 2;
  });
  
  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${travel.name.replace(/\s+/g, '_')}_export.xlsx`);
};
