import { Quotation, numberToWordsInSoles } from '../types/quotation';
import { LOGO_BASE64 } from '../assets/logoBase64';
import { generateQuotationPdf } from './generatePdf';

/**
 * Generates and triggers clean, high-fidelity printing / Save-to-PDF for the quotation.
 * Works seamlessly in both standard browsers and nested iframes.
 */
export function printQuotationDirectly(quotation: Quotation): void {
  const totalNeto = quotation.items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const totalInWords = numberToWordsInSoles(totalNeto);

  // Generate table rows HTML
  const itemsHtml = quotation.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; font-weight: bold; padding: 8px 6px; border: 1px solid #cbd5e1; background-color: #f8fafc; font-size: 11px;">
        ${idx + 1}
      </td>
      <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 12px; line-height: 1.4; color: #0f172a;">
        <div style="font-weight: 600; white-space: pre-wrap;">${escapeHtml(item.product)}</div>
      </td>
      <td style="text-align: center; width: 95px; padding: 8px 6px; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 600; color: #334155;">
        ${escapeHtml(item.unit)}
      </td>
      <td style="text-align: center; width: 95px; padding: 8px 6px; border: 1px solid #cbd5e1; font-size: 11px; color: #334155;">
        ${escapeHtml(item.brand || '—')}
      </td>
      <td style="text-align: right; padding: 8px 8px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: bold; color: #0f172a; font-family: monospace;">
        ${item.quantity.toLocaleString('es-PE')}
      </td>
      <td style="text-align: right; padding: 8px 8px; border: 1px solid #cbd5e1; font-size: 12px; color: #1e293b; font-family: monospace;">
        S/. ${item.unitCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td style="text-align: right; padding: 8px 8px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: bold; color: #0f172a; font-family: monospace; background-color: #f8fafc;">
        S/. ${item.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>COTIZACION_${quotation.correlativeNumber}_PACHITEA</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 10px;
      font-size: 12px;
      line-height: 1.35;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
    }
    .provider-title {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .provider-ruc {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
      font-family: monospace;
    }
    .provider-desc {
      font-size: 11px;
      color: #475569;
      line-height: 1.3;
    }
    .box-quote {
      border: 2px solid #0f172a;
      border-radius: 8px;
      overflow: hidden;
      width: 250px;
      margin-left: auto;
      text-align: center;
    }
    .box-quote-header {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 2px;
      padding: 5px 8px;
      text-transform: uppercase;
    }
    .box-quote-body {
      padding: 8px 10px;
      background-color: #ffffff;
      font-size: 11px;
      text-align: left;
    }
    .box-quote-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .correlative-badge {
      font-size: 14px;
      font-weight: 900;
      font-family: monospace;
      color: #0f172a;
    }
    .client-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      background-color: #f8fafc;
      margin-bottom: 14px;
    }
    .client-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .client-grid {
      display: table;
      width: 100%;
    }
    .client-grid-row {
      display: table-row;
    }
    .client-grid-cell {
      display: table-cell;
      padding: 2px 6px;
      font-size: 11px;
      vertical-align: top;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .items-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 6px;
      border: 1px solid #0f172a;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .totals-table td {
      vertical-align: top;
    }
    .words-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background-color: #f8fafc;
      font-size: 11px;
      margin-bottom: 6px;
    }
    .total-box {
      border: 2px solid #0f172a;
      border-radius: 8px;
      background-color: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      width: 250px;
      margin-left: auto;
    }
    .conditions-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background-color: #ffffff;
      margin-bottom: 16px;
      font-size: 11px;
    }
    .conditions-grid {
      display: table;
      width: 100%;
      margin-top: 6px;
    }
    .conditions-cell {
      display: table-cell;
      width: 25%;
      padding: 4px;
      border-right: 1px solid #e2e8f0;
    }
    .conditions-cell:last-child {
      border-right: none;
    }
    .signature-area {
      margin-top: 36px;
      text-align: center;
      width: 100%;
    }
    .signature-box {
      border-top: 1.5px solid #0f172a;
      width: 300px;
      margin: 0 auto;
      padding-top: 6px;
    }
    .signature-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .signature-ruc {
      font-size: 12px;
      font-weight: 700;
      font-family: monospace;
      color: #1e293b;
    }
    .footer-line {
      margin-top: 30px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print-btn {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print controls for preview if opened in new tab -->
  <div class="no-print-btn" style="background: #1e293b; color: white; padding: 10px 16px; margin-bottom: 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>Vista de Impresión / Guardar PDF</strong>
      <span style="font-size: 11px; opacity: 0.8; margin-left: 8px;">(Selecciona &quot;Guardar como PDF&quot; en el destino de tu impresora)</span>
    </div>
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 6px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
      🖨️ IMPRIMIR / GUARDAR PDF
    </button>
  </div>

  <!-- Header with Logo on the left of Provider -->
  <table class="header-table">
    <tr>
      <td style="width: 62%; vertical-align: top;">
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="width: 90px; vertical-align: top; padding-right: 12px;">
              <img src="${LOGO_BASE64}" alt="Logo Comercial Garay" style="width: 82px; height: 82px; object-fit: contain; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; padding: 2px;" />
            </td>
            <td style="vertical-align: top;">
              <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 2px;">PROVEEDOR:</div>
              <div class="provider-title">${escapeHtml(quotation.issuer.companyName)}</div>
              <div class="provider-ruc">R.U.C. N° ${escapeHtml(quotation.issuer.ruc)}</div>
              <div class="provider-desc">
                ${escapeHtml(quotation.issuer.address)}<br/>
                Teléfono: ${escapeHtml(quotation.issuer.phone)} &nbsp;|&nbsp; Correo: ${escapeHtml(quotation.issuer.email)}
              </div>
            </td>
          </tr>
        </table>
      </td>
      <td style="width: 38%; text-align: right; vertical-align: top;">
        <div class="box-quote">
          <div class="box-quote-header">COTIZACIÓN</div>
          <div class="box-quote-body">
            <div class="box-quote-row" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="color: #64748b; font-weight: 700;">N°:</span>
              <span class="correlative-badge">${escapeHtml(quotation.correlativeNumber)}</span>
            </div>
            <div class="box-quote-row">
              <span style="color: #64748b;">Fecha de Emisión:</span>
              <span style="font-weight: 700;">${escapeHtml(quotation.date)}</span>
            </div>
            <div class="box-quote-row">
              <span style="color: #64748b;">Hora de Emisión:</span>
              <span style="font-weight: 700;">${escapeHtml(quotation.time)}</span>
            </div>
            <div class="box-quote-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #047857; font-weight: 800;">
              <span>Condición:</span>
              <span>SIN IGV</span>
            </div>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Client Box (Exclusively Municipalidad Provincial de Pachitea) -->
  <div class="client-box">
    <div class="client-title">DATOS DEL CLIENTE / ENTIDAD CONVOCANTE</div>
    <div class="client-grid">
      <div class="client-grid-row">
        <div class="client-grid-cell" style="width: 65%;">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">SEÑOR(ES) / RAZÓN SOCIAL:</strong><br/>
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">${escapeHtml(quotation.client.razonSocial)}</span>
        </div>
        <div class="client-grid-cell" style="width: 35%;">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">R.U.C. CLIENTE:</strong><br/>
          <span style="font-size: 13px; font-weight: 800; font-family: monospace; color: #0f172a;">${escapeHtml(quotation.client.ruc)}</span>
        </div>
      </div>
      <div class="client-grid-row" style="margin-top: 6px;">
        <div class="client-grid-cell">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">DIRECCIÓN INSTITUCIONAL:</strong><br/>
          <span style="font-weight: 700; color: #0f172a;">${escapeHtml(quotation.client.direccion || 'Jr. Espinar N° 121, Panao, Pachitea, Huánuco')}</span>
        </div>
        <div class="client-grid-cell">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase;">UBICACIÓN / JURISDICCIÓN:</strong><br/>
          <span>${escapeHtml(quotation.client.distrito)} - ${escapeHtml(quotation.client.provincia)} (${escapeHtml(quotation.client.departamento)})</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Items Table (UNIDAD y MARCA con la misma anchura: 95px cada una) -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 45px; text-align: center;">N° ITEM</th>
        <th style="text-align: left; width: 34%;">PRODUCTO / DESCRIPCIÓN</th>
        <th style="width: 95px; text-align: center;">UNIDAD</th>
        <th style="width: 95px; text-align: center;">MARCA / FABRICANTE</th>
        <th style="width: 65px; text-align: right;">CANTIDAD</th>
        <th style="width: 95px; text-align: right;">COSTO PARCIAL</th>
        <th style="width: 100px; text-align: right;">SUB TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <table class="totals-table">
    <tr>
      <td style="width: 62%; padding-right: 14px;">
        <div class="words-box">
          <strong style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block;">MONTO EN LETRAS:</strong>
          <span style="font-weight: 700; color: #0f172a;">${escapeHtml(totalInWords)}</span>
        </div>
        <div style="font-size: 11px; color: #0f172a; font-weight: 900; padding: 7px 12px; background-color: #f1f5f9; border: 2px solid #0f172a; border-radius: 6px; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
          LOS PRECIOS NO INCLUYEN IGV.
        </div>
      </td>
      <td style="width: 38%;">
        <div class="total-box">
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px; opacity: 0.9;">
            <span>SUBTOTAL NETO:</span>
            <span style="font-family: monospace;">S/. ${totalNeto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 900; color: #ffffff; border-top: 1px solid #475569; padding-top: 6px;">
            <div>
              <span>SUMA TOTAL</span><br/>
              <span style="font-size: 10px; font-weight: 800; border: 1px solid #64748b; padding: 1px 4px; border-radius: 3px;">SIN IGV</span>
            </div>
            <span style="font-size: 18px; font-family: monospace; color: #ffffff;">
              S/. ${totalNeto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </td>
    </tr>
  </table>

  <!-- Commercial Terms in a Single Column -->
  <div class="conditions-box" style="border: 2px solid #0f172a; border-radius: 8px; padding: 10px 14px; background-color: #ffffff; margin-bottom: 16px; font-size: 11px;">
    <div style="font-weight: 900; font-size: 11px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-bottom: 6px;">
      CONDICIONES COMERCIALES Y DE SERVICIO
    </div>
    <div style="display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 800; color: #334155; text-transform: uppercase;">• Plazo de Entrega:</span>
        <span style="font-weight: 900; color: #0f172a;">${escapeHtml(quotation.deliveryTime || '01 día calendario')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 800; color: #334155; text-transform: uppercase;">• Validez de la Oferta:</span>
        <span style="font-weight: 900; color: #0f172a;">${quotation.validityDays || 30} días calendario</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 800; color: #334155; text-transform: uppercase;">• Forma de Pago:</span>
        <span style="font-weight: 600; color: #0f172a;">${escapeHtml(quotation.paymentMethod)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-weight: 800; color: #334155; text-transform: uppercase;">• Cuenta Interbancaria del Proveedor:</span>
        <span style="font-family: monospace; font-weight: 800; color: #0f172a;">${escapeHtml(quotation.issuer.bankAccounts || 'CCI: 80810521 100000689512 CMAC Huancayo S.A.')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0;">
        <span style="font-weight: 800; color: #334155; text-transform: uppercase;">• Observaciones Generales:</span>
        <span style="font-weight: 600; color: #0f172a;">${escapeHtml(quotation.observations || 'Precios sin IGV, puestos en almacén de la Municipalidad.')}</span>
      </div>
    </div>
  </div>

  <!-- ONLY SUPPLIER DATA IN BOTTOM SIGNATURE SECTION PER USER SPECIFICATION: GARAY AQUINO WILDER; RUC: 10415096556 -->
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-name">${escapeHtml(quotation.issuer.companyName)}</div>
      <div class="signature-ruc">R.U.C. N° ${escapeHtml(quotation.issuer.ruc)}</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">PROVEEDOR / REPRESENTANTE LEGAL</div>
    </div>
  </div>

  <!-- FOOTER LINE: SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY -->
  <div class="footer-line">
    <span>SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY</span>
    <span>COTIZACIÓN N° ${escapeHtml(quotation.correlativeNumber)} &nbsp;|&nbsp; EMISIÓN: ${escapeHtml(quotation.date)} ${escapeHtml(quotation.time)}</span>
  </div>

  <script>
    // Auto-trigger print when loaded in iframe/window
    window.onload = function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Window print blocked');
        }
      }, 250);
    };
  </script>
</body>
</html>
  `;

  // Multi-method print execution to ensure it works in all environments:
  try {
    // 1. Try invisible iframe print first
    const existingIframe = document.getElementById('quotation-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'quotation-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-999';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print restricted by sandbox, generating PDF directly:', e);
          fallbackPrint();
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Print frame initialization error:', err);
  }

  // Fallback if iframe fails:
  fallbackPrint();

  function fallbackPrint() {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn('Sandbox blocked window.print, generating vector PDF as robust guaranteed print fallback:', e);
      // Guarantee print via direct vector PDF download
      generateQuotationPdf(quotation);
    }
  }
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
