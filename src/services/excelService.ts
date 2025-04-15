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
  
  // Style for headers - blue with white text (matching example)
  const headerStyle = {
    font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } } as ExcelJS.FillPattern,
    border: {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    },
    alignment: { horizontal: 'center', vertical: 'middle' }
  };
  
  // Style for data cells
  const dataCellStyle = {
    border: {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    },
    alignment: { vertical: 'middle' }
  };
  
  // Title style - light blue background (matching example)
  const titleStyle = {
    font: { bold: true, size: 16, color: { argb: '000000' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E1F2' } } as ExcelJS.FillPattern,
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    }
  };
  
  // Money style - currency format
  const moneyStyle = {
    numFmt: '$#,##0.00',
    border: {
      top: { style: 'thin', color: { argb: 'D0D0D0' } },
      left: { style: 'thin', color: { argb: 'D0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'D0D0D0' } },
      right: { style: 'thin', color: { argb: 'D0D0D0' } }
    }
  };
  
  // Highlight styles - green for positive, red for negative values
  const positiveMoneyStyle = {
    ...moneyStyle,
    font: { color: { argb: '107C41' } }, // Green
  };
  
  const negativeMoneyStyle = {
    ...moneyStyle,
    font: { color: { argb: 'C00000' } }, // Red
  };
  
  // Travel Info Section
  infoSheet.mergeCells('A1:B1');
  const titleCell = infoSheet.getCell('A1');
  titleCell.value = `Travel Details: ${travel.name}`;
  Object.assign(titleCell, titleStyle);
  
  infoSheet.getColumn('A').width = 20;
  infoSheet.getColumn('B').width = 30;
  
  const infoRows = [
    ['Travel Name', travel.name],
    ['Start Date', format(new Date(travel.startDate), 'MMMM d, yyyy')],
    ['End Date', format(new Date(travel.endDate), 'MMMM d, yyyy')],
    ['Description', travel.description || 'N/A'],
    ['Currency', travel.currency || 'USD'],
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
    
    // Apply money format to Total Expenses
    if (row[0] === 'Total Expenses') {
      valueCell.numFmt = '$#,##0.00';
    }
    
    Object.assign(keyCell, dataCellStyle);
    Object.assign(valueCell, dataCellStyle);
  });
  
  // Add participants worksheet
  const participantsSheet = workbook.addWorksheet('Participants');
  
  // Add headers
  const participantsHeaders = ['Name', 'Email', 'Start Date', 'End Date', 'Days'];
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
      days.toString()
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
  
  // Add title row (matching example image)
  expensesSheet.mergeCells('A1:F1');
  const expensesTitleCell = expensesSheet.getCell('A1');
  expensesTitleCell.value = 'Expenses List';
  Object.assign(expensesTitleCell, titleStyle);
  expensesTitleCell.font = { bold: true, size: 16 };
  
  // Add headers
  const expensesHeaders = ['Date', 'Type', 'Amount', 'Paid By', 'Shared With', 'Comment'];
  const expensesHeaderRow = expensesSheet.addRow(expensesHeaders);
  
  // Apply header style
  expensesHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  expenses.forEach(expense => {
    const paidBy = expense.paidFromFund ? 'Travel Fund' : 
      expense.paidBy.map(p => {
        const name = participants.find(part => part.id === p.participantId)?.name || 'Unknown';
        return `${name} (${p.amount})`;
      }).join(', ');
    
    const sharedWith = expense.sharedAmong
      .filter(s => s.included)
      .map(s => {
        const name = participants.find(p => p.id === s.participantId)?.name || 'Unknown';
        return s.weight !== 1 ? `${name} (${s.weight}x)` : name;
      }).join(', ');
    
    const row = expensesSheet.addRow([
      format(new Date(expense.date), 'MMM d, yyyy'),
      expense.type + (expense.customType ? ` (${expense.customType})` : ''),
      expense.amount,
      paidBy,
      sharedWith,
      expense.comment || ''
    ]);
    
    // Apply data style
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, dataCellStyle);
      // Format amount column
      if (colNumber === 3) {
        cell.numFmt = '$#,##0.00';
      }
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
  
  // Add title row (matching example image)
  contributionsSheet.mergeCells('A1:D1');
  const contribTitleCell = contributionsSheet.getCell('A1');
  contribTitleCell.value = 'Contributions to Travel Fund';
  Object.assign(contribTitleCell, titleStyle);
  
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
      contribution.amount,
      contribution.comment || 'N/A'
    ]);
    
    // Apply data style
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, dataCellStyle);
      // Format amount column
      if (colNumber === 3) {
        cell.numFmt = '$#,##0.00';
      }
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
  
  // Add title row (matching example image)
  settlementsSheet.mergeCells('A1:G1');
  const settlementsTitleCell = settlementsSheet.getCell('A1');
  settlementsTitleCell.value = 'Final Settlements';
  Object.assign(settlementsTitleCell, titleStyle);
  
  // Add headers
  const settlementsHeaders = ['Participant', 'Advance Paid', 'Personally Paid', 'Expense Share', 'Due Amount', 'Refund Amount', 'Donated'];
  const settlementsHeaderRow = settlementsSheet.addRow(settlementsHeaders);
  
  // Apply header style
  settlementsHeaderRow.eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  
  // Add data rows
  settlements.forEach(settlement => {
    const row = settlementsSheet.addRow([
      settlement.name,
      settlement.advancePaid,
      settlement.personallyPaid,
      settlement.expenseShare,
      settlement.dueAmount,
      settlement.refundAmount,
      settlement.donated ? 'Yes' : 'No'
    ]);
    
    // Apply data style and special formatting
    row.eachCell((cell, colNumber) => {
      Object.assign(cell, dataCellStyle);
      
      // Apply money format to relevant columns
      if (colNumber >= 2 && colNumber <= 6) {
        if (colNumber === 5 && (settlement.dueAmount || 0) > 0) {
          // Due amount - negative
          Object.assign(cell, negativeMoneyStyle);
        } else if (colNumber === 6 && (settlement.refundAmount || 0) > 0) {
          // Refund amount - positive
          Object.assign(cell, positiveMoneyStyle);
        } else {
          // Other money columns - neutral
          Object.assign(cell, moneyStyle);
        }
      }
    });
  });
  
  // Add a totals row (matching example)
  const totalRow = settlementsSheet.addRow([
    'TOTAL',
    settlements.reduce((sum, s) => sum + (s.advancePaid || 0), 0),
    settlements.reduce((sum, s) => sum + (s.personallyPaid || 0), 0),
    settlements.reduce((sum, s) => sum + (s.expenseShare || 0), 0),
    settlements.reduce((sum, s) => sum + (s.dueAmount || 0), 0),
    settlements.reduce((sum, s) => sum + (s.refundAmount || 0), 0),
    ''
  ]);
  
  // Style the totals row
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    Object.assign(cell, dataCellStyle);
    
    // Format amount columns
    if (colNumber >= 2 && colNumber <= 6) {
      cell.numFmt = '$#,##0.00';
    }
  });
  
  // Auto-fit columns
  settlementsSheet.columns.forEach(column => {
    const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
    const maxLength = Math.max(...(lengths || [0]), 10);
    column.width = maxLength + 2;
  });
  
  // Add alternating row colors for better readability
  [participantsSheet, expensesSheet, contributionsSheet, settlementsSheet].forEach(sheet => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2 && rowNumber % 2 === 0) { // Skip header rows
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F6FC' } // Light blue to match example
          } as ExcelJS.FillPattern;
        });
      }
    });
  });
  
  // Set print options for all sheets
  [infoSheet, participantsSheet, expensesSheet, contributionsSheet, settlementsSheet].forEach(sheet => {
    sheet.pageSetup.paperSize = 9; // A4
    sheet.pageSetup.orientation = 'landscape';
    sheet.pageSetup.fitToPage = true;
  });
  
  // Write to file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${travel.name.replace(/\s+/g, '_')}_export.xlsx`);
};
