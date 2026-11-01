export type AppCurrency = 'CDF' | 'USD';

const CURRENCY_META: Record<AppCurrency, { label: string; symbol: string; locale: string }> = {
  CDF: { label: 'Franc Congolais (FC)', symbol: 'FC', locale: 'fr-CD' },
  USD: { label: 'Dollar Américain (USD)', symbol: 'USD', locale: 'en-US' },
};

let currentDevise: AppCurrency = 'CDF';

export function isAppCurrency(value: string | null | undefined): value is AppCurrency {
  return value === 'CDF' || value === 'USD';
}

export function setAppCurrency(devise: AppCurrency) {
  currentDevise = devise;
}

export function getAppCurrency(): AppCurrency {
  return currentDevise;
}

export function currencyLabel(devise: AppCurrency = currentDevise): string {
  return CURRENCY_META[devise].label;
}

export function currencySymbol(devise: AppCurrency = currentDevise): string {
  return CURRENCY_META[devise].symbol;
}

export function formatMoney(amount: number, devise: AppCurrency = currentDevise): string {
  const meta = CURRENCY_META[devise];
  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: devise === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  return devise === 'USD' ? `${formatted} ${meta.symbol}` : `${formatted} ${meta.symbol}`;
}

export const SUPPORTED_CURRENCIES: AppCurrency[] = ['CDF', 'USD'];
