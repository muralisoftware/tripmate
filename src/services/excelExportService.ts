import { Share } from 'react-native';
import { GeneratePdfOptions } from './pdfReportService';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

function getFileSystemModule(): any {
  try {
    return require('expo-file-system/legacy');
  } catch {
    return null;
  }
}

function getSharingModule(): any {
  try {
    return require('expo-sharing');
  } catch {
    return null;
  }
}

export function buildGroupExpenseCsv({
  trip,
  members,
  foodExpenses,
  groupExpenses,
  advances,
  summary,
}: GeneratePdfOptions): string {
  const currency = trip.currency || 'INR';
  const lines: string[] = [];

  const addRow = (...cells: any[]) => {
    lines.push(cells.map(escapeCsvCell).join(','));
  };

  const addEmpty = () => lines.push('');

  // 1. Title Block
  addRow('TRIPMATE GROUP EXPENSES REPORT');
  addRow('Trip Title', trip.title);
  addRow('Destination', trip.destination);
  addRow('Dates', `${trip.startDate} to ${trip.endDate}`);
  addRow('Currency', currency);
  addRow('Total Members', members.length);
  addRow('Generated On', new Date().toISOString());
  addEmpty();

  // 2. High-Level Summary
  addRow('--- OVERALL TRIP EXPENSE SUMMARY ---');
  addRow('Total Trip Expenses', summary.totalExpenses);
  addRow('Total Food Expenses', summary.totalFoodExpenses);
  addRow('Total Hotel Expenses', summary.totalHotelExpenses);
  addRow('Total Transport Expenses', summary.totalTransportExpenses);
  addRow('Total Shopping Expenses', summary.totalShoppingExpenses);
  addRow('Total Tickets Expenses', summary.totalTicketsExpenses);
  addRow('Total Other Expenses', summary.totalOtherExpenses);
  addRow('Total Advances Paid', summary.totalAdvancePaid);
  addRow('Total Pending Balance', summary.totalPendingBalance);
  addEmpty();

  // 3. Member Balances & Advances
  addRow('--- MEMBER BALANCES & ADVANCES ---');
  addRow(
    'Member Name',
    'Phone',
    'Food Total',
    'Hotel Share',
    'Transport Share',
    'Shopping Share',
    'Tickets Share',
    'Other Share',
    'Total Expense',
    'Advance Paid',
    'Balance (Expense - Advance)',
    'Net Settlement (Receives/Owes)'
  );
  for (const m of summary.memberSummaries) {
    addRow(
      m.member.name,
      m.member.phone || '-',
      m.foodTotal,
      m.hotelTotal,
      m.transportTotal,
      m.shoppingTotal,
      m.ticketsTotal,
      m.otherTotal,
      m.totalExpense,
      m.advancePaid,
      m.balance,
      m.netBalance
    );
  }
  addEmpty();

  // 4. Final Settlement (Who Pays Whom)
  addRow('--- FINAL SETTLEMENT PLAN (WHO PAYS WHOM) ---');
  addRow('From (Debtor)', 'To (Creditor)', 'Amount', 'Status');
  for (const s of summary.settlements) {
    addRow(s.fromMemberName, s.toMemberName, s.amount, s.settled ? 'SETTLED' : 'PENDING');
  }
  addEmpty();

  // 5. Individual Food Expenses Log
  addRow('--- INDIVIDUAL FOOD EXPENSES LOG ---');
  addRow('Date', 'Member Name', 'Meal Type', 'Description', 'Notes', 'Amount');
  for (const f of foodExpenses) {
    addRow(f.date, f.memberName, f.mealType, f.description || '-', f.notes || '-', f.amount);
  }
  addEmpty();

  // 6. Group Expenses Log
  addRow('--- ITEMIZED GROUP EXPENSES LOG ---');
  addRow('Date', 'Title', 'Category', 'Paid By', 'Split Type', 'Total Amount', 'Split Details');
  for (const g of groupExpenses) {
    const splits = g.splits || [];
    const details = splits.map((s) => `${s.memberName}: ${s.amount}`).join('; ');
    addRow(g.date, g.title, g.category, g.paidByMemberName, g.splitType, g.amount, details);
  }
  addEmpty();

  // 7. Advance Payments Log
  addRow('--- ADVANCE PAYMENTS LOG ---');
  addRow('Date', 'Member Name', 'Payment Method', 'Notes', 'Amount');
  for (const a of advances) {
    addRow(a.date, a.memberName, a.paymentMethod || 'Cash', a.notes || '-', a.amount);
  }

  // Prepend UTF-8 BOM so Excel opens UTF-8 files correctly
  return '\uFEFF' + lines.join('\r\n');
}

export async function exportGroupExpenseExcel(options: GeneratePdfOptions): Promise<void> {
  const FileSystem = getFileSystemModule();
  const Sharing = getSharingModule();
  const csvContent = buildGroupExpenseCsv(options);

  if (FileSystem && Sharing && typeof FileSystem.writeAsStringAsync === 'function' && typeof Sharing.shareAsync === 'function') {
    try {
      const sanitizedTitle = options.trip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `TripMate_${sanitizedTitle}_Expenses.csv`;
      const fileUri = `${FileSystem.cacheDirectory || ''}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: `TripMate Excel Export - ${options.trip.title}`,
          UTI: 'public.comma-separated-values-text',
        });
        return;
      }
    } catch (err) {
      console.warn('Native CSV file export failed, falling back to text share:', err);
    }
  }

  // Fallback: Share CSV content directly
  await Share.share({
    title: `TripMate CSV - ${options.trip.title}`,
    message: csvContent,
  });
}
