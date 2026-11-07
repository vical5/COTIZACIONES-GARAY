export interface QuotationItem {
  id: string;
  itemNumber: number;
  product: string;
  unit: string;
  brand: string;
  quantity: number;
  unitCost: number; // Costo parcial / unitario
  subtotal: number; // subtotal = quantity * unitCost
}

export interface ClientData {
  razonSocial: string;
  ruc: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  areaSolicitante: string;
  atencion: string;
}

export interface CompanyIssuer {
  companyName: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  representative: string;
  bankAccounts: string;
  bancoNacionCCI: string;
}

export interface Quotation {
  id: string;
  correlativeNumber: string;
  correlativeCounter: number;
  date: string;
  time: string;
  validityDays: number;
  deliveryTime: string;
  paymentMethod: string;
  warranty: string;
  currency: 'PEN';
  currencySymbol: 'S/.';
  observations: string;
  client: ClientData;
  issuer: CompanyIssuer;
  items: QuotationItem[];
  createdAt: string;
  updatedAt: string;
}

export const CLIENTE_EXCLUSIVO: ClientData = {
  razonSocial: 'MUNICIPALIDAD PROVINCIAL DE PACHITEA',
  ruc: '20183995121',
  direccion: 'Jr. Espinar N° 121, Panao, Pachitea, Huánuco',
  departamento: 'Huánuco',
  provincia: 'Pachitea',
  distrito: 'Panao',
  areaSolicitante: '',
  atencion: '',
};

export const DEFAULT_ISSUER: CompanyIssuer = {
  companyName: 'GARAY AQUINO WILDER',
  ruc: '10415096556',
  address: 'JR LIMA N°14, PROVINCIA DE PACHITEA, DISTRITO DE PANAO',
  phone: '943 290 410',
  email: 'wildergarayaquino7@gmail.com',
  representative: 'GARAY AQUINO WILDER',
  bankAccounts: 'CCI: 80810521 100000689512 CMAC Huancayo S.A.',
  bancoNacionCCI: 'CCI: 80810521 100000689512 CMAC Huancayo S.A.',
};

export const COMMON_UNITS = [
  'UND',
  'GLN',
  'BLS',
  'KG',
  'MTR',
  'M2',
  'M3',
  'PZA',
  'CAJA',
  'PQTE',
  'ROLLO',
  'JUEGO',
  'SERV',
  'GLOBAL',
];

export const INITIAL_ITEMS: QuotationItem[] = [
  {
    id: 'item-1',
    itemNumber: 1,
    product: 'Cemento Portland Tipo I (Bolsa de 42.5 kg) para obras viales y saneamiento básico',
    unit: 'BLS',
    brand: 'QUISQUEYA / ANDINO',
    quantity: 100,
    unitCost: 28.5,
    subtotal: 2850.0,
  },
  {
    id: 'item-2',
    itemNumber: 2,
    product: 'Varilla de Fierro Corrugado de Construcción 1/2" x 9m Grado 60 ASTM A615 para obras civiles',
    unit: 'VAR',
    brand: 'SIDERPERÚ',
    quantity: 50,
    unitCost: 38.0,
    subtotal: 1900.0,
  },
];

/**
 * Converts a number to words in Spanish (Peruvian Soles standard).
 */
export function numberToWordsInSoles(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'CERO CON 00/100 SOLES';
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  const decimalStr = `${decimalPart.toString().padStart(2, '0')}/100 SOLES`;

  if (integerPart === 0) {
    return `CERO CON ${decimalStr}`;
  }

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertGroup(n: number): string {
    let output = '';
    if (n === 100) return 'CIEN';
    
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) output += hundreds[h] + ' ';

    if (t === 1) {
      output += teens[u] + ' ';
    } else if (t === 2) {
      if (u === 0) output += 'VEINTE ';
      else output += 'VEINTI' + units[u] + ' ';
    } else if (t > 2) {
      output += tens[t];
      if (u > 0) output += ' Y ' + units[u];
      output += ' ';
    } else if (u > 0) {
      output += units[u] + ' ';
    }

    return output.trim();
  }

  let words = '';
  const millions = Math.floor(integerPart / 1000000);
  const thousands = Math.floor((integerPart % 1000000) / 1000);
  const remainder = integerPart % 1000;

  if (millions > 0) {
    if (millions === 1) words += 'UN MILLÓN ';
    else words += `${convertGroup(millions)} MILLONES `;
  }

  if (thousands > 0) {
    if (thousands === 1) words += 'MIL ';
    else words += `${convertGroup(thousands)} MIL `;
  }

  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  return `SON: ${words.trim()} CON ${decimalStr}`;
}
