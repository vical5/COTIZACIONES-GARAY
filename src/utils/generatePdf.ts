import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, numberToWordsInSoles } from '../types/quotation';
import { LOGO_BASE64 } from '../assets/logoBase64';

/**
 * Generates and downloads a real, clean vector PDF file directly in the browser.
 * Completely immune to iframe sandboxing and popup blockers.
 */
export function generateQuotationPdf(quotation: Quotation): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  // 1. HEADER: Logo on the left side of PROVEEDOR, then Provider Info
  try {
    const logoSize = 26; // 26mm x 26mm
    doc.addImage(LOGO_BASE64, 'PNG', margin, y, logoSize, logoSize);
  } catch (err) {
    console.warn('Could not embed logo image in PDF:', err);
  }

  const providerX = margin + 29; // Start provider details immediately to the right of logo

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PROVEEDOR:', providerX, y + 4);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GARAY AQUINO WILDER', providerX, y + 9);

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`R.U.C. N° ${quotation.issuer.ruc}`, providerX, y + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    quotation.issuer.address || 'JR LIMA N°14, PROVINCIA DE PACHITEA, DISTRITO DE PANAO',
    providerX,
    y + 17.5
  );
  doc.text(
    `Tel: ${quotation.issuer.phone || '943 290 410'}   |   Email: ${quotation.issuer.email || 'wildergarayaquino7@gmail.com'}`,
    providerX,
    y + 21.5
  );

  // Top right Official "COTIZACIÓN" Box - MUCH LARGER HEADING
  const boxWidth = 64;
  const boxHeight = 28;
  const boxX = pageWidth - margin - boxWidth;
  const boxY = y;

  // Box border
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.7);
  doc.rect(boxX, boxY, boxWidth, boxHeight);

  // Box header title - MUCH LARGER
  doc.setFillColor(15, 23, 42);
  doc.rect(boxX, boxY, boxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13); // Significantly bigger
  doc.text('COTIZACIÓN', boxX + boxWidth / 2, boxY + 6, { align: 'center' });

  // Correlative number
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(quotation.correlativeNumber, boxX + boxWidth / 2, boxY + 14, { align: 'center' });

  // Date & Time
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${quotation.date}`, boxX + 4, boxY + 18.5);
  doc.text(`Hora: ${quotation.time}`, boxX + 4, boxY + 22.5);

  // Simply: SIN IGV - Pure high contrast grayscale
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // Black
  doc.text('SIN IGV', boxX + boxWidth / 2, boxY + 26.5, { align: 'center' });

  y += 32;

  // 2. CLIENT SECTION (MUNICIPALIDAD PROVINCIAL DE PACHITEA)
  // Grayscale optimized card
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  // Client title banner (NO EXCLUSIVO)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('DATOS DEL CLIENTE:', margin + 3.5, y + 4.5);

  // Client Name - Ligeramente más grande y en negrita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.client.razonSocial, margin + 3.5, y + 10);

  // Client RUC - Ligeramente más grande y en negrita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`R.U.C.: ${quotation.client.ruc}`, margin + 115, y + 10);

  // Client Address (Dynamic & editable, defaults to Jr. Espinar N° 121, Panao, Pachitea, Huánuco)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Dirección: ${quotation.client.direccion || 'Jr. Espinar N° 121, Panao, Pachitea, Huánuco'}`, margin + 3.5, y + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ubicación: ${quotation.client.distrito} - ${quotation.client.provincia} (${quotation.client.departamento})`, margin + 115, y + 15.5);

  y += 24;

  // 3. TABLE OF ITEMS: Grayscale optimized with clear bold numbers
  // Columns: N° ITEM, PRODUCTO / DESCRIPCIÓN, UNIDAD, MARCA, CANTIDAD, COSTO PARCIAL, SUB TOTAL
  // UNIDAD y MARCA tienen EXACTAMENTE LA MISMA ANCHURA (26mm cada una)
  const tableRows = quotation.items.map((item, index) => [
    (index + 1).toString(),
    item.product,
    item.unit,
    item.brand || '—',
    item.quantity.toLocaleString('es-PE'),
    `S/. ${item.unitCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `S/. ${item.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        'N° ITEM',
        'PRODUCTO / DESCRIPCIÓN DETALLADA',
        'UNIDAD',
        'MARCA',
        'CANTIDAD',
        'COSTO PARCIAL',
        'SUB TOTAL',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [180, 185, 195],
      lineWidth: 0.25,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      cellPadding: 2.8,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 56, halign: 'left', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' }, // UNIDAD: 26mm (Exactamente igual que MARCA)
      3: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }, // MARCA: 26mm (Exactamente igual que UNIDAD)
      4: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold', fillColor: [245, 247, 250] },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate final Y after table
  const finalY = (doc as any).lastAutoTable.finalY + 4;
  y = finalY;

  // Check if we need page break for summary & terms
  if (y > 210) {
    doc.addPage();
    y = margin;
  }

  // 4. SUMMARY & TOTALS WITHOUT IGV - High Contrast Monochrome
  const totalNeto = quotation.items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
  const totalInWords = numberToWordsInSoles(totalNeto);

  // Left box: Amount in words & Note
  const wordsBoxWidth = 114;
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(200, 205, 215);
  doc.roundedRect(margin, y, wordsBoxWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('MONTO EN LETRAS:', margin + 3.5, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const splitWords = doc.splitTextToSize(totalInWords, wordsBoxWidth - 7);
  doc.text(splitWords, margin + 3.5, y + 8.5);

  // REQUIREMENT: UNICAMENTE DEBE DECIR: LOS PRECIOS NO INCLUYEN IGV.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('LOS PRECIOS NO INCLUYEN IGV.', margin + 3.5, y + 17);

  // Right box: Suma Total Box - High Contrast Pure Black & Crisp White
  const totalBoxWidth = 64;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(totalBoxX, y, totalBoxWidth, 20, 2, 2, 'F');

  doc.setTextColor(220, 225, 230);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('SUBTOTAL NETO:', totalBoxX + 4, y + 5);
  doc.text(`S/. ${totalNeto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalBoxX + totalBoxWidth - 4, y + 5, { align: 'right' });

  doc.setDrawColor(70, 80, 95);
  doc.setLineWidth(0.3);
  doc.line(totalBoxX + 3, y + 8, totalBoxX + totalBoxWidth - 3, y + 8);

  doc.setTextColor(255, 255, 255); // Pure crisp white for grayscale clarity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SUMA TOTAL (SIN IGV):', totalBoxX + 4, y + 13);
  doc.setFontSize(12.5);
  doc.text(
    `S/. ${totalNeto.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalBoxX + totalBoxWidth - 4,
    y + 17.5,
    { align: 'right' }
  );

  y += 24;

  // 5. COMMERCIAL CONDITIONS IN A SINGLE COLUMN PER USER REQUIREMENT
  // "LAS CONDICIONES COMERCIALES DEBEN ESCRIBIRSE EN UNA SOLA COLUMNA"
  // Delivery time: Entre 04 horas y 02 días | Validity: 30 días calendario
  // NO WARRANTIES MENTIONED
  const conditionsBoxHeight = 24;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, conditionsBoxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CONDICIONES COMERCIALES Y DE SERVICIO', margin + 3.5, y + 4.5);

  // Line 1: Plazo de Entrega
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('• Plazo de Entrega:', margin + 3.5, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.deliveryTime || '01 día calendario', margin + 35, y + 8.5);

  // Line 2: Validez de la Oferta
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('• Validez de la Oferta:', margin + 3.5, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${quotation.validityDays || 30} días calendario`, margin + 35, y + 12);

  // Line 3: Forma de Pago
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('• Forma de Pago:', margin + 3.5, y + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.paymentMethod || 'Transferencia Bancaria CCI / Depósito según normativa SIAF-SP', margin + 35, y + 15.5);

  // Line 4: Cuenta Interbancaria del Proveedor
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('• Cuenta Interbancaria:', margin + 3.5, y + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(
    quotation.issuer.bankAccounts || 'CCI: 80810521 100000689512 CMAC Huancayo S.A.',
    margin + 35,
    y + 19
  );

  // Line 5: Observaciones Generales
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('• Observaciones:', margin + 3.5, y + 22.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(
    quotation.observations || 'Precios sin IGV, puestos en almacén de la Municipalidad.',
    margin + 35,
    y + 22.5
  );

  // 6. SIGNATURE: SEVERAL SPACES BELOW, NEAR THE BOTTOM OF THE PAGE PER USER REQUIREMENT
  // "EN LA PARTE FINAL PARA QUE FIRME EL PROVEEDOR DEBE UBICARCE VARIOS ESPACIOS MAS ABAJO, CASI SIEMPRE AL FINAL DE LA PAGINA"
  const sigY = pageHeight - 34; // Placed nicely near the bottom of the page
  const sigLineWidth = 75;
  const sigX = pageWidth / 2 - sigLineWidth / 2;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(sigX, sigY, sigX + sigLineWidth, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('GARAY AQUINO WILDER', pageWidth / 2, sigY + 4, { align: 'center' });

  doc.setFontSize(8);
  doc.text('RUC: 10415096556', pageWidth / 2, sigY + 7.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PROVEEDOR', pageWidth / 2, sigY + 11, { align: 'center' });

  // 7. FOOTER PER USER EXPLICIT REQUIREMENT
  // "EN LA PARTE INFERIOR DEBE DECIR EN PIE DE PAGIMNA: SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY',
    margin,
    pageHeight - 8
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    `COTIZACIÓN N° ${quotation.correlativeNumber}   |   ${quotation.date} ${quotation.time}`,
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  // SAVE AND DOWNLOAD PDF AUTOMATICALLY
  const filename = `Cotizacion_${quotation.correlativeNumber}_Municipalidad_Pachitea.pdf`;
  doc.save(filename);
}
