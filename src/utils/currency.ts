import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/config';

export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  const found = CURRENCIES.find((c) => c.code.toUpperCase() === currencyCode.toUpperCase());
  return found ? found.symbol : currencyCode;
}

export function formatCurrency(amount: number = 0, currencyCode: string = DEFAULT_CURRENCY): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedNumber = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formattedNumber}`;
}
