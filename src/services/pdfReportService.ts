import { Share } from 'react-native';
import { Trip } from '../types/trip';
import {
  TripMember,
  FoodExpenseEntry,
  GroupExpense,
  AdvancePayment,
  GroupSummary,
} from '../types/groupExpense';
import { formatCurrency } from '../utils/currency';
import { formatDateRange } from '../utils/date';

export interface GeneratePdfOptions {
  trip: Trip;
  members: TripMember[];
  foodExpenses: FoodExpenseEntry[];
  groupExpenses: GroupExpense[];
  advances: AdvancePayment[];
  summary: GroupSummary;
}

function getPrintModule(): any {
  try {
    return require('expo-print');
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

export function buildGroupExpenseTextSummary({
  trip,
  members,
  foodExpenses,
  groupExpenses,
  advances,
  summary,
}: GeneratePdfOptions): string {
  const currency = trip.currency || 'INR';
  const dateRangeStr = formatDateRange(trip.startDate, trip.endDate);

  const lines: string[] = [];
  lines.push(`🌴 *${trip.title.toUpperCase()} - GROUP EXPENSES REPORT*`);
  lines.push(`📍 ${trip.destination} | 📅 ${dateRangeStr}`);
  lines.push(`👥 ${members.length} Members | Generated via TripMate`);
  lines.push('');
  lines.push(`💰 *OVERALL SUMMARY*`);
  lines.push(`• Total Expenses: ${formatCurrency(summary.totalExpenses, currency)}`);
  lines.push(`• Total Food: ${formatCurrency(summary.totalFoodExpenses, currency)}`);
  lines.push(`• Total Advances: ${formatCurrency(summary.totalAdvancePaid, currency)}`);
  lines.push(`• Pending Balance: ${formatCurrency(summary.totalPendingBalance, currency)}`);
  lines.push('');
  lines.push(`👤 *MEMBER BALANCES & ADVANCES*`);
  for (const m of summary.memberSummaries) {
    const status = m.netBalance > 0.01
      ? `(Receives +${formatCurrency(m.netBalance, currency)})`
      : m.netBalance < -0.01
      ? `(Owes -${formatCurrency(Math.abs(m.netBalance), currency)})`
      : `(Settled)`;
    lines.push(`• ${m.member.name}: Spent ${formatCurrency(m.totalExpense, currency)} (Food: ${formatCurrency(m.foodTotal, currency)}) | Adv: ${formatCurrency(m.advancePaid, currency)} | Bal: ${formatCurrency(m.balance, currency)} ${status}`);
  }
  lines.push('');
  lines.push(`🤝 *FINAL SETTLEMENT PLAN (WHO PAYS WHOM)*`);
  if (summary.settlements.length === 0) {
    lines.push(`All expenses are completely balanced and settled! ✅`);
  } else {
    for (const s of summary.settlements) {
      lines.push(`• ${s.fromMemberName} ➡️ ${s.toMemberName}: ${formatCurrency(s.amount, currency)} ${s.settled ? '[PAID ✅]' : '[PENDING ⏳]'}`);
    }
  }

  if (foodExpenses.length > 0) {
    lines.push('');
    lines.push(`🍲 *INDIVIDUAL FOOD LOGS*`);
    for (const f of foodExpenses.slice(0, 8)) {
      lines.push(`• ${f.memberName} (${f.mealType}): ${formatCurrency(f.amount, currency)} - ${f.description || f.date}`);
    }
    if (foodExpenses.length > 8) {
      lines.push(`...and ${foodExpenses.length - 8} more food entries.`);
    }
  }

  return lines.join('\n');
}

export function buildGroupExpenseHtml({
  trip,
  members,
  foodExpenses,
  groupExpenses,
  advances,
  summary,
}: GeneratePdfOptions): string {
  const currency = trip.currency || 'INR';
  const dateRangeStr = formatDateRange(trip.startDate, trip.endDate);
  const generatedAt = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Individual Balances Table Rows
  const balanceRows = summary.memberSummaries
    .map((m, index) => {
      const balanceClass = m.balance > 0 ? 'color: #D97706; font-weight: bold;' : 'color: #16834A; font-weight: bold;';
      const netText =
        m.netBalance > 0.01
          ? `<span style="color: #16834A; font-weight: 600;">+${formatCurrency(m.netBalance, currency)} (Receives)</span>`
          : m.netBalance < -0.01
          ? `<span style="color: #DC2626; font-weight: 600;">-${formatCurrency(Math.abs(m.netBalance), currency)} (Owes)</span>`
          : `<span style="color: #6B7280;">Settled</span>`;

      return `
        <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FBFA'};">
          <td style="padding: 10px 14px; font-weight: 600; color: #172B21; border-bottom: 1px solid #E5E7EB;">
            ${m.member.name}
            ${m.member.phone ? `<br><small style="color: #6B7280; font-weight: normal;">${m.member.phone}</small>` : ''}
          </td>
          <td style="padding: 10px 14px; text-align: right; color: #172B21; border-bottom: 1px solid #E5E7EB;">${formatCurrency(m.foodTotal, currency)}</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #172B21; border-bottom: 1px solid #E5E7EB;">${formatCurrency(m.totalExpense, currency)}</td>
          <td style="padding: 10px 14px; text-align: right; color: #16834A; border-bottom: 1px solid #E5E7EB;">${formatCurrency(m.advancePaid, currency)}</td>
          <td style="padding: 10px 14px; text-align: right; ${balanceClass} border-bottom: 1px solid #E5E7EB;">${formatCurrency(m.balance, currency)}</td>
          <td style="padding: 10px 14px; text-align: right; border-bottom: 1px solid #E5E7EB;">${netText}</td>
        </tr>
      `;
    })
    .join('');

  // Food Expenses Itemized Table Rows
  const foodRows = foodExpenses.length === 0
    ? `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6B7280;">No individual food expenses recorded.</td></tr>`
    : foodExpenses
        .map((f, index) => {
          return `
            <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FBFA'};">
              <td style="padding: 9px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${f.date}</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #172B21; border-bottom: 1px solid #E5E7EB;">${f.memberName}</td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #E5E7EB;">
                <span style="background-color: #E6F5EC; color: #116638; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${f.mealType}</span>
                ${f.description ? ` <span style="color: #4B5563; font-size: 12px;">(${f.description})</span>` : ''}
              </td>
              <td style="padding: 9px 12px; color: #6B7280; font-size: 12px; border-bottom: 1px solid #E5E7EB;">${f.notes || '-'}</td>
              <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #172B21; border-bottom: 1px solid #E5E7EB;">${formatCurrency(f.amount, currency)}</td>
            </tr>
          `;
        })
        .join('');

  // Group Expenses Table Rows
  const groupRows = groupExpenses.length === 0
    ? `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6B7280;">No group expenses recorded.</td></tr>`
    : groupExpenses
        .map((g, index) => {
          const splits = g.splits || [];
          const splitDetails = splits.map((s) => `${s.memberName}: ${formatCurrency(s.amount, currency)}`).join(', ');
          return `
            <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FBFA'};">
              <td style="padding: 9px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${g.date}</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #172B21; border-bottom: 1px solid #E5E7EB;">
                ${g.title}
                <br><small style="color: #6B7280; font-weight: normal;">Paid by: <b>${g.paidByMemberName}</b> · ${(g.splitType || 'EQUAL').toUpperCase()} split</small>
              </td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #E5E7EB;">
                <span style="background-color: #F3F4F6; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${g.category}</span>
              </td>
              <td style="padding: 9px 12px; color: #4B5563; font-size: 11px; border-bottom: 1px solid #E5E7EB;">${splitDetails}</td>
              <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #172B21; border-bottom: 1px solid #E5E7EB;">${formatCurrency(g.amount, currency)}</td>
            </tr>
          `;
        })
        .join('');

  // Advance Payments Rows
  const advanceRows = advances.length === 0
    ? `<tr><td colspan="5" style="padding: 12px; text-align: center; color: #6B7280;">No advance payments recorded.</td></tr>`
    : advances
        .map((a, index) => {
          return `
            <tr style="background-color: ${index % 2 === 0 ? '#FFFFFF' : '#F9FBFA'};">
              <td style="padding: 9px 12px; color: #4B5563; border-bottom: 1px solid #E5E7EB;">${a.date}</td>
              <td style="padding: 9px 12px; font-weight: 600; color: #172B21; border-bottom: 1px solid #E5E7EB;">${a.memberName}</td>
              <td style="padding: 9px 12px; border-bottom: 1px solid #E5E7EB;">
                <span style="background-color: #EFF6FF; color: #1D4ED8; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">${a.paymentMethod || 'Cash'}</span>
              </td>
              <td style="padding: 9px 12px; color: #6B7280; font-size: 12px; border-bottom: 1px solid #E5E7EB;">${a.notes || '-'}</td>
              <td style="padding: 9px 12px; text-align: right; font-weight: 700; color: #16834A; border-bottom: 1px solid #E5E7EB;">${formatCurrency(a.amount, currency)}</td>
            </tr>
          `;
        })
        .join('');

  // Settlement Steps
  const settlementCards = summary.settlements.length === 0
    ? `<div style="padding: 16px; background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; text-align: center; color: #065F46; font-weight: 600;">All group expenses are completely balanced and settled!</div>`
    : summary.settlements
        .map((s) => {
          const statusBadge = s.settled
            ? `<span style="background-color: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">SETTLED</span>`
            : `<span style="background-color: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">PENDING</span>`;

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-left: 4px solid #16834A; border-radius: 8px; margin-bottom: 8px;">
              <div>
                <span style="font-weight: 700; color: #1F2937;">${s.fromMemberName}</span>
                <span style="color: #6B7280; margin: 0 6px;">pays</span>
                <span style="font-weight: 700; color: #116638;">${s.toMemberName}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 16px; font-weight: 800; color: #16834A;">${formatCurrency(s.amount, currency)}</span>
                ${statusBadge}
              </div>
            </div>
          `;
        })
        .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>TripMate Expense Report - ${trip.title}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #172B21;
          margin: 0;
          padding: 24px;
          background-color: #FFFFFF;
          font-size: 13px;
          line-height: 1.5;
        }
        .header-bar {
          background: linear-gradient(135deg, #16834A 0%, #0E5A31 100%);
          color: #FFFFFF;
          padding: 24px;
          border-radius: 14px;
          margin-bottom: 24px;
        }
        .brand {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          opacity: 0.9;
          font-weight: 700;
        }
        .trip-title {
          font-size: 24px;
          font-weight: 800;
          margin: 4px 0 6px 0;
        }
        .trip-meta {
          font-size: 13px;
          opacity: 0.95;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .metric-box {
          background-color: #F7FAF8;
          border: 1px solid #E4ECE6;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .metric-label {
          font-size: 11px;
          color: #718078;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .metric-val {
          font-size: 18px;
          font-weight: 800;
          color: #172B21;
          margin-top: 4px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 800;
          color: #172B21;
          border-left: 4px solid #16834A;
          padding-left: 10px;
          margin: 28px 0 12px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          overflow: hidden;
        }
        th {
          background-color: #F3F4F6;
          color: #374151;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          padding: 10px 14px;
          border-bottom: 1px solid #E5E7EB;
        }
        .footer {
          margin-top: 36px;
          padding-top: 16px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          color: #9CA3AF;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header-bar">
        <div class="brand">TripMate · Group Expense & Settlement Report</div>
        <div class="trip-title">${trip.title}</div>
        <div class="trip-meta">
          📍 ${trip.destination} &nbsp;·&nbsp; 📅 ${dateRangeStr} &nbsp;·&nbsp; 👥 ${members.length} Members
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-label">Total Expenses</div>
          <div class="metric-val">${formatCurrency(summary.totalExpenses, currency)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Food Total</div>
          <div class="metric-val" style="color: #D97706;">${formatCurrency(summary.totalFoodExpenses, currency)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Total Advances</div>
          <div class="metric-val" style="color: #16834A;">${formatCurrency(summary.totalAdvancePaid, currency)}</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Pending Balances</div>
          <div class="metric-val" style="color: #DC2626;">${formatCurrency(summary.totalPendingBalance, currency)}</div>
        </div>
      </div>

      <!-- 1. Member Balances & Advances Table -->
      <div class="section-title">1. Member Balances & Advance Deductions</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Member</th>
            <th style="text-align: right;">Food Total</th>
            <th style="text-align: right;">Total Expense</th>
            <th style="text-align: right;">Advance Paid</th>
            <th style="text-align: right;">Balance</th>
            <th style="text-align: right;">Net Settlement</th>
          </tr>
        </thead>
        <tbody>
          ${balanceRows}
        </tbody>
      </table>

      <!-- 2. Final Settlements -->
      <div class="section-title">2. Final Settlement Plan (Who Pays Whom)</div>
      <div style="margin-bottom: 24px;">
        ${settlementCards}
      </div>

      <!-- 3. Category Breakdown -->
      <div class="section-title">3. Category Expense Breakdown</div>
      <table style="max-width: 500px;">
        <thead>
          <tr>
            <th style="text-align: left;">Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">🍲 Food & Dining</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Food, currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">🏨 Hotel & Stay</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Hotel, currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">🚕 Transport & Fuel</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Transport, currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">🛍️ Shopping</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Shopping, currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">🎟️ Tickets & Activities</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Tickets, currency)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #E5E7EB;">📦 Other Expenses</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; border-bottom: 1px solid #E5E7EB;">${formatCurrency(summary.categoryTotals.Other, currency)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 4. Individual Food Expenses Log -->
      <div class="section-title">4. Individual Food Expenses Log</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Person</th>
            <th style="text-align: left;">Meal & Description</th>
            <th style="text-align: left;">Notes</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${foodRows}
        </tbody>
      </table>

      <!-- 5. Group Expenses Log -->
      <div class="section-title">5. Itemized Group Expenses Log</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Expense Title</th>
            <th style="text-align: left;">Category</th>
            <th style="text-align: left;">Split Breakdown</th>
            <th style="text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${groupRows}
        </tbody>
      </table>

      <!-- 6. Advance Payments History -->
      <div class="section-title">6. Advance Payments Log</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Member</th>
            <th style="text-align: left;">Method</th>
            <th style="text-align: left;">Notes</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${advanceRows}
        </tbody>
      </table>

      <!-- Footer -->
      <div class="footer">
        Generated on ${generatedAt} via <b>TripMate</b> · Offline-First Group Travel Organizer
      </div>
    </body>
    </html>
  `;
}

export async function exportGroupExpensePdf(options: GeneratePdfOptions): Promise<void> {
  const Print = getPrintModule();
  const Sharing = getSharingModule();

  // If expo-print and expo-sharing are available in the native binary:
  if (Print && typeof Print.printToFileAsync === 'function' && Sharing && typeof Sharing.shareAsync === 'function') {
    try {
      const html = buildGroupExpenseHtml(options);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `TripMate Report - ${options.trip.title}`,
        });
        return;
      }
    } catch (err) {
      console.warn('Native PDF print failed, falling back to text share:', err);
    }
  }

  // Resilient Fallback: Share full formatted text report via React Native's built-in Share API
  const message = buildGroupExpenseTextSummary(options);
  await Share.share({
    title: `TripMate Report - ${options.trip.title}`,
    message,
  });
}
