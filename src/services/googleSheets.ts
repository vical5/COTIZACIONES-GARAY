import { Quotation, QuotationItem } from '../types/quotation';

export interface CreateSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a formatted Google Spreadsheet with the quotation data.
 */
export async function exportQuotationToGoogleSheets(
  accessToken: string,
  quotation: Quotation
): Promise<CreateSheetResponse> {
  // 1. Create a new Spreadsheet
  const title = `COTIZACIÓN ${quotation.correlativeNumber} - MUNICIPALIDAD PROVINCIAL DE PACHITEA`;
  
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Cotización',
            gridProperties: {
              rowCount: Math.max(50, quotation.items.length + 30),
              columnCount: 10,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Error al crear la hoja de cálculo: ${errorText}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data
  const rows: (string | number)[][] = [
    // Header
    ['COTIZACIÓN INSTITUCIONAL', '', '', '', '', '', ''],
    ['NÚMERO CORRELATIVO:', quotation.correlativeNumber, '', '', 'FECHA DE EMISIÓN:', quotation.date, ''],
    ['ESTADO:', 'EMITIDA', '', '', 'HORA DE EMISIÓN:', quotation.time, ''],
    ['', '', '', '', '', '', ''],
    // Client section
    ['DATOS DEL CLIENTE (EXCLUSIVO):', '', '', '', '', '', ''],
    ['RAZÓN SOCIAL:', quotation.client.razonSocial, '', '', 'R.U.C.:', quotation.client.ruc, ''],
    ['DIRECCIÓN:', quotation.client.direccion, '', '', 'DEPARTAMENTO / PROV.:', `${quotation.client.departamento} / ${quotation.client.provincia}`, ''],
    ['ÁREA SOLICITANTE:', quotation.client.areaSolicitante || 'LOGÍSTICA Y CONTRATACIONES', '', '', 'CONDICIÓN:', 'SIN IGV', ''],
    ['', '', '', '', '', '', ''],
    // Supplier info
    ['DATOS DEL PROVEEDOR / EMISOR:', '', '', '', '', '', ''],
    ['PROVEEDOR:', quotation.issuer.companyName, '', '', 'R.U.C. PROVEEDOR:', quotation.issuer.ruc, ''],
    ['CONTACTO / TELÉFONO:', quotation.issuer.phone, '', '', 'CORREO:', quotation.issuer.email, ''],
    ['BANCO / CTA / CCI:', quotation.issuer.bankAccounts, '', '', 'VALIDEZ DE OFERTA:', `${quotation.validityDays || 30} días calendario`, ''],
    ['', '', '', '', '', '', ''],
    // Items table header
    ['N° ITEM', 'PRODUCTO / DESCRIPCIÓN', 'UNIDAD', 'MARCA', 'CANTIDAD', 'COSTO PARCIAL (S/.)', 'SUB TOTAL (S/.)'],
  ];

  const tableStartRow = rows.length + 1; // 1-indexed

  // Add items
  quotation.items.forEach((item, index) => {
    const rowNum = tableStartRow + index;
    rows.push([
      item.itemNumber || index + 1,
      item.product,
      item.unit,
      item.brand,
      item.quantity,
      item.unitCost,
      `=E${rowNum}*F${rowNum}`, // Excel / Sheets Formula: Cantidad * Costo Parcial
    ]);
  });

  const tableEndRow = tableStartRow + quotation.items.length - 1;
  const totalRow = tableEndRow + 1;

  // Add Summary row (Suma Total Sin IGV)
  rows.push([
    '',
    'SUMA TOTAL (SIN IGV)',
    '',
    '',
    '',
    '',
    quotation.items.length > 0 ? `=SUM(G${tableStartRow}:G${tableEndRow})` : 0,
  ]);

  rows.push(['', '', '', '', '', '', '']);
  rows.push(['NOTA:', 'LOS PRECIOS NO INCLUYEN IGV.', '', '', '', '', '']);
  rows.push(['OBSERVACIONES:', quotation.observations, '', '', '', '', '']);
  rows.push(['PLAZO DE ENTREGA:', quotation.deliveryTime || 'Entre 04 horas y 02 días', '', '', '', '', '']);
  rows.push(['VALIDEZ DE LA OFERTA:', `${quotation.validityDays || 30} días calendario`, '', '', '', '', '']);
  rows.push(['FORMA DE PAGO:', quotation.paymentMethod, '', '', '', '', '']);
  rows.push(['GARANTÍA:', quotation.warranty, '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '']);
  rows.push(['DATOS DEL PROVEEDOR:', 'GARAY AQUINO WILDER', '', '', 'R.U.C.:', '10415096556', '']);
  rows.push(['PIE DE PÁGINA:', 'SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY', '', '', '', '', '']);

  // 3. Write data to sheet
  const updateValuesResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Cotización!A1:G${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!updateValuesResponse.ok) {
    console.warn('Advertencia al escribir valores:', await updateValuesResponse.text());
  }

  // 4. Format the sheet with professional styles via batchUpdate
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Set column widths
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
              properties: { pixelSize: 75 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
              properties: { pixelSize: 320 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
              properties: { pixelSize: 90 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 },
              properties: { pixelSize: 130 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 },
              properties: { pixelSize: 95 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 },
              properties: { pixelSize: 140 },
              fields: 'pixelSize',
            },
          },
          {
            updateDimensionProperties: {
              range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 },
              properties: { pixelSize: 150 },
              fields: 'pixelSize',
            },
          },
          // Format item table header row
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: tableStartRow - 1,
                endRowIndex: tableStartRow,
                startColumnIndex: 0,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.12, green: 0.16, blue: 0.22 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          // Format Total Row
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: totalRow - 1,
                endRowIndex: totalRow,
                startColumnIndex: 0,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.94, green: 0.96, blue: 0.98 },
                  textFormat: { bold: true, fontSize: 11 },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          // Number formatting for currencies (Columns F and G)
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: tableStartRow - 1,
                endRowIndex: totalRow,
                startColumnIndex: 5,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '"S/." #,##0.00',
                  },
                },
              },
              fields: 'userEnteredFormat.numberFormat',
            },
          },
        ],
      }),
    });
  } catch (styleErr) {
    console.warn('Nota sobre estilos en batchUpdate:', styleErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}
