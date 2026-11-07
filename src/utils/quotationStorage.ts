import {
  Quotation,
  CLIENTE_EXCLUSIVO,
  DEFAULT_ISSUER,
  INITIAL_ITEMS,
} from '../types/quotation';

const STORAGE_KEY_COUNTER = 'pachitea_quotation_counter';
const STORAGE_KEY_COUNTER_YEAR = 'pachitea_quotation_counter_year';
const STORAGE_KEY_HISTORY = 'pachitea_quotations_history';
const STORAGE_KEY_CURRENT = 'pachitea_current_quotation';

export function getCurrentDateFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getCurrentTimeFormatted(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatCorrelative(counter: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  return `COT-${currentYear}-${String(counter).padStart(4, '0')}`;
}

/**
 * Returns the next correlative counter.
 * Automatically checks the calendar year:
 * "al llegar a fin de año, para comenzar el año nuevo, desde cada 1 de enero en el calendario,
 * el correlavito de la cotizacion debe volver a 1, pero con el año actualizado, eso debe suceder todos los años."
 */
export function getNextCorrelativeCounter(): number {
  const currentYear = new Date().getFullYear();
  const savedYearStr = localStorage.getItem(STORAGE_KEY_COUNTER_YEAR);
  const savedYear = savedYearStr ? parseInt(savedYearStr, 10) : null;

  // Si comenzó un año nuevo (desde cada 1 de enero), reinicia correlativo a 1
  if (!savedYear || savedYear < currentYear) {
    localStorage.setItem(STORAGE_KEY_COUNTER_YEAR, currentYear.toString());
    localStorage.setItem(STORAGE_KEY_COUNTER, '1');
    return 1;
  }

  const saved = localStorage.getItem(STORAGE_KEY_COUNTER);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY_COUNTER, '1');
    return 1;
  }
  const counter = parseInt(saved, 10);
  return isNaN(counter) || counter < 1 ? 1 : counter;
}

export function saveCorrelativeCounter(counter: number, year?: number): void {
  const currentYear = year || new Date().getFullYear();
  localStorage.setItem(STORAGE_KEY_COUNTER_YEAR, currentYear.toString());
  localStorage.setItem(STORAGE_KEY_COUNTER, counter.toString());
}

export function createNewQuotation(counter?: number, cloneItemsFrom?: Quotation): Quotation {
  const currentYear = new Date().getFullYear();
  const currentCounter = counter || getNextCorrelativeCounter();
  const correlative = formatCorrelative(currentCounter, currentYear);
  const nowIso = new Date().toISOString();

  // Save the counter and current year
  saveCorrelativeCounter(currentCounter, currentYear);

  const quotation: Quotation = {
    id: `quot-${Date.now()}`,
    correlativeNumber: correlative,
    correlativeCounter: currentCounter,
    date: getCurrentDateFormatted(),
    time: getCurrentTimeFormatted(),
    validityDays: 30, // 30 días solicitados por el usuario
    deliveryTime: '01 día calendario', // 1 día calendario solicitado
    paymentMethod: 'Transferencia Bancaria CCI / Depósito según normativa SIAF-SP',
    warranty: 'Calidad garantizada conforme a especificaciones',
    currency: 'PEN',
    currencySymbol: 'S/.',
    observations: 'Precios sin IGV, puestos en almacén de la Municipalidad.',
    client: { ...CLIENTE_EXCLUSIVO },
    issuer: { ...DEFAULT_ISSUER }, // SIEMPRE: GARAY AQUINO WILDER - RUC: 10415096556
    items: cloneItemsFrom
      ? cloneItemsFrom.items.map((it, idx) => ({ ...it, id: `item-${Date.now()}-${idx}` }))
      : [...INITIAL_ITEMS],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return quotation;
}

/**
 * Loads current quotation or creates one.
 * Always refreshes the date and time automatically on initial load per user request:
 * "cuando abro el archivo cada vez, debe actualizarxe hora y fecha utomaticamente."
 * And resets correlative to 1 if a new year has begun on January 1st.
 */
export function loadInitialQuotation(): Quotation {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    const currentYear = new Date().getFullYear();

    if (saved) {
      const parsed: Quotation = JSON.parse(saved);

      // Verify if year has rolled over (new calendar year starting Jan 1st):
      const savedYearStr = localStorage.getItem(STORAGE_KEY_COUNTER_YEAR);
      const savedYear = savedYearStr ? parseInt(savedYearStr, 10) : null;
      if (!savedYear || savedYear < currentYear) {
        // Reiniciar correlativo a 1 para el nuevo año
        parsed.correlativeCounter = 1;
        parsed.correlativeNumber = formatCorrelative(1, currentYear);
        saveCorrelativeCounter(1, currentYear);
      }

      // Ensure client has provided default options, but all editable
      parsed.client = {
        razonSocial: parsed.client?.razonSocial || CLIENTE_EXCLUSIVO.razonSocial,
        ruc: parsed.client?.ruc || CLIENTE_EXCLUSIVO.ruc,
        direccion: parsed.client?.direccion || CLIENTE_EXCLUSIVO.direccion,
        departamento: parsed.client?.departamento || CLIENTE_EXCLUSIVO.departamento,
        provincia: parsed.client?.provincia || CLIENTE_EXCLUSIVO.provincia,
        distrito: parsed.client?.distrito || CLIENTE_EXCLUSIVO.distrito,
        areaSolicitante: '',
        atencion: '',
      };
      
      // Enforce provider requirement: SIEMPRE GARAY AQUINO WILDER, RUC 10415096556
      parsed.issuer = {
        ...DEFAULT_ISSUER,
        companyName: 'GARAY AQUINO WILDER',
        ruc: '10415096556',
        address: 'JR LIMA N°14, PROVINCIA DE PACHITEA, DISTRITO DE PANAO',
        phone: '943 290 410',
        email: 'wildergarayaquino7@gmail.com',
        representative: 'GARAY AQUINO WILDER',
        bankAccounts: 'CCI: 80810521 100000689512 CMAC Huancayo S.A.',
        bancoNacionCCI: 'CCI: 80810521 100000689512 CMAC Huancayo S.A.',
      };

      // Enforce validity and delivery defaults
      if (!parsed.validityDays || parsed.validityDays === 15) {
        parsed.validityDays = 30;
      }
      if (!parsed.deliveryTime || parsed.deliveryTime.includes('04 horas') || parsed.deliveryTime.includes('05 a 07')) {
        parsed.deliveryTime = '01 día calendario';
      }

      // Enforce requested default observations
      if (
        !parsed.observations ||
        parsed.observations.includes('Precios netos sin incluir IGV') ||
        parsed.observations.includes('conforme al requerimiento')
      ) {
        parsed.observations = 'Precios sin IGV, puestos en almacén de la Municipalidad.';
      }

      // Ensure strictly 2 sample products by default per user specification
      if (
        Array.isArray(parsed.items) &&
        parsed.items.length === 5 &&
        parsed.items[0]?.product?.includes('Cemento Portland') &&
        parsed.items[4]?.product?.includes('Computadora')
      ) {
        parsed.items = [...INITIAL_ITEMS];
      }

      // Automatically update date and time every time file is opened
      parsed.date = getCurrentDateFormatted();
      parsed.time = getCurrentTimeFormatted();
      parsed.updatedAt = new Date().toISOString();

      return parsed;
    }
  } catch (err) {
    console.error('Error cargando cotización guardada:', err);
  }

  const initial = createNewQuotation(1);
  saveCurrentQuotation(initial);
  return initial;
}

export function saveCurrentQuotation(quotation: Quotation): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(quotation));
  } catch (err) {
    console.error('Error guardando cotización:', err);
  }
}

export function getQuotationHistory(): Quotation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Error obteniendo historial:', err);
  }
  return [];
}

export function archiveQuotationToHistory(quotation: Quotation): void {
  try {
    const history = getQuotationHistory();
    // Prepend or replace
    const index = history.findIndex((q) => q.correlativeNumber === quotation.correlativeNumber);
    if (index >= 0) {
      history[index] = quotation;
    } else {
      history.unshift(quotation);
    }
    // Keep last 30
    const trimmed = history.slice(0, 30);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
  } catch (err) {
    console.error('Error guardando en historial:', err);
  }
}
