import React from 'react';
import {
  Quotation,
  QuotationItem,
  COMMON_UNITS,
  numberToWordsInSoles,
} from '../types/quotation';
import {
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  RefreshCw,
  Layers,
  FileDown,
  Save,
} from 'lucide-react';

interface Props {
  quotation: Quotation;
  editMode: boolean;
  onUpdateQuotation: (updated: Quotation) => void;
  onAddItem: () => void;
  onUpdateItem: (index: number, updatedItem: QuotationItem) => void;
  onDeleteItem: (index: number) => void;
  onDuplicateItem: (index: number) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onAddCatalogTemplate: (category: 'obras' | 'computo' | 'oficina' | 'combustible') => void;
  onRefreshDateTime: () => void;
  onExportPdf?: () => void;
  onSaveQuotation?: () => void;
}

export const QuotationDocument: React.FC<Props> = ({
  quotation,
  editMode,
  onUpdateQuotation,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onMoveItem,
  onAddCatalogTemplate,
  onRefreshDateTime,
  onExportPdf,
  onSaveQuotation,
}) => {
  // Calculate total without IGV
  const totalNetoSinIgv = quotation.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  const totalInWords = numberToWordsInSoles(totalNetoSinIgv);

  const handleClientChange = (field: keyof typeof quotation.client, value: string) => {
    onUpdateQuotation({
      ...quotation,
      client: {
        ...quotation.client,
        [field]: value,
      },
    });
  };

  const handleIssuerChange = (field: keyof typeof quotation.issuer, value: string) => {
    onUpdateQuotation({
      ...quotation,
      issuer: {
        ...quotation.issuer,
        [field]: value,
      },
    });
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    const item = quotation.items[index];
    let updated: QuotationItem = { ...item, [field]: value };

    if (field === 'quantity' || field === 'unitCost') {
      const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
      const c = field === 'unitCost' ? Number(value) || 0 : item.unitCost;
      updated.subtotal = Math.round(q * c * 100) / 100;
    }

    onUpdateItem(index, updated);
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 sm:px-6">
      {/* Catalog Quick-Add Presets bar (in edit mode only) */}
      {editMode && (
        <div className="mb-4 bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs no-print flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Plantillas rápidas para la Municipalidad de Pachitea:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onAddCatalogTemplate('obras')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              + Obras y Construcción
            </button>
            <button
              onClick={() => onAddCatalogTemplate('computo')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              + Equipos Informáticos
            </button>
            <button
              onClick={() => onAddCatalogTemplate('combustible')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              + Combustibles / Maquinaria
            </button>
            <button
              onClick={() => onAddCatalogTemplate('oficina')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              + Materiales de Oficina
            </button>
          </div>
        </div>
      )}

      {/* Main Quotation Sheet (Official A4 proportioned paper) */}
      <div className="print-page bg-white rounded-2xl shadow-md border border-slate-200/90 p-8 sm:p-12 transition-all">
        {/* ============================================================ */}
        {/* HEADER SECTION: Fixed Supplier Info & Official COTIZACIÓN Box */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-slate-900">
          {/* Supplier details with LOGO on the left side */}
          <div className="flex-1 flex flex-col sm:flex-row items-start gap-4">
            {/* Logo Comercial Garay on the left side of PROVEEDOR */}
            <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center border border-slate-200 shadow-2xs">
              <img
                src="/logo-comercial-garay.png"
                alt="Logo Comercial Garay"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                <span className="text-[11px] tracking-wider uppercase font-extrabold text-slate-700">
                  PROVEEDOR:
                </span>
              </div>

              <div className="space-y-0.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  GARAY AQUINO WILDER
                </h1>
                <p className="text-sm font-mono font-bold text-slate-900">
                  R.U.C. N° 10415096556
                </p>
                
                {editMode ? (
                  <div className="space-y-1 pt-1 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400">Dirección del Proveedor:</label>
                      <input
                        type="text"
                        value={quotation.issuer.address}
                        onChange={(e) => handleIssuerChange('address', e.target.value)}
                        className="w-full text-xs text-slate-700 border-b border-slate-200 py-0.5 focus:border-blue-600 focus:outline-hidden"
                        placeholder="JR LIMA N°14, PROVINCIA DE PACHITEA, DISTRITO DE PANAO"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400">Teléfono / Celular:</label>
                        <input
                          type="text"
                          value={quotation.issuer.phone}
                          onChange={(e) => handleIssuerChange('phone', e.target.value)}
                          className="w-full text-slate-700 border-b border-slate-200 py-0.5 focus:border-blue-600 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">Correo Electrónico:</label>
                        <input
                          type="email"
                          value={quotation.issuer.email}
                          onChange={(e) => handleIssuerChange('email', e.target.value)}
                          className="w-full text-xs text-slate-700 border-b border-slate-200 py-0.5 focus:border-blue-600 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>{quotation.issuer.address || 'JR LIMA N°14, PROVINCIA DE PACHITEA, DISTRITO DE PANAO'}</p>
                    <p className="text-slate-500">
                      Teléfono: {quotation.issuer.phone || '943 290 410'} &nbsp;|&nbsp; Correo: {quotation.issuer.email || 'wildergarayaquino7@gmail.com'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Official "COTIZACIÓN" Box - MUCH LARGER HEADING PER USER REQUIREMENT */}
          <div className="w-full md:w-84 border-2 border-slate-900 rounded-xl overflow-hidden shadow-xs bg-slate-50/50">
            <div className="bg-slate-900 text-white text-center py-3.5 px-4">
              <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase">
                COTIZACIÓN
              </h2>
            </div>

            <div className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600 uppercase text-[11px]">
                  N° CORRELATIVO:
                </span>
                <span className="font-mono font-black text-lg text-slate-950 tracking-tight">
                  {quotation.correlativeNumber}
                </span>
              </div>

              {/* Automatic Date and Time */}
              <div className="flex items-center justify-between text-slate-700">
                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Emisión:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {quotation.date}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Hora de Emisión:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">
                    {quotation.time}
                  </span>
                  <button
                    onClick={onRefreshDateTime}
                    className="no-print p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900 transition-colors"
                    title="Sincronizar a la hora y fecha actual exacta"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500 font-medium">Condición:</span>
                <span className="font-mono font-black text-slate-950 bg-slate-200 px-3 py-0.5 rounded border border-slate-400 text-xs tracking-wider">
                  SIN IGV
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CLIENT SECTION: MUNICIPALIDAD PROVINCIAL DE PACHITEA */}
        {/* Without "EXCLUSIVO", without "Área Solicitante", larger bold name & RUC */}
        {/* Default: Jr. Espinar N° 121, Panao, Pachitea, Huánuco */}
        {/* ALL CLIENT FIELDS FULLY EDITABLE PER USER REQUIREMENT */}
        {/* ============================================================ */}
        <div className="my-6 p-5 rounded-xl border-2 border-slate-800 bg-slate-50/90 relative">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-300">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-900" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                DATOS DEL CLIENTE
              </span>
            </div>
            {editMode && (
              <span className="text-[10px] text-slate-500 font-medium no-print bg-slate-200 px-2 py-0.5 rounded border border-slate-300">
                ✏️ Datos editables
              </span>
            )}
          </div>

          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-600 uppercase font-bold block mb-1">
                  SEÑOR(ES) / RAZÓN SOCIAL DEL CLIENTE:
                </label>
                <input
                  type="text"
                  value={quotation.client.razonSocial}
                  onChange={(e) => handleClientChange('razonSocial', e.target.value)}
                  className="w-full font-black text-slate-950 text-base border-2 border-slate-300 focus:border-slate-950 rounded-lg p-2 bg-white"
                  placeholder="MUNICIPALIDAD PROVINCIAL DE PACHITEA"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 uppercase font-bold block mb-1">
                  R.U.C. DEL CLIENTE:
                </label>
                <input
                  type="text"
                  value={quotation.client.ruc}
                  onChange={(e) => handleClientChange('ruc', e.target.value)}
                  className="w-full font-mono font-black text-slate-950 text-base border-2 border-slate-300 focus:border-slate-950 rounded-lg p-2 bg-white"
                  placeholder="20183995121"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-600 uppercase font-bold block mb-1">
                  DIRECCIÓN INSTITUCIONAL:
                </label>
                <input
                  type="text"
                  value={quotation.client.direccion}
                  onChange={(e) => handleClientChange('direccion', e.target.value)}
                  className="w-full font-bold text-slate-900 text-xs sm:text-sm border-2 border-slate-300 focus:border-slate-950 rounded-lg p-2 bg-white"
                  placeholder="Jr. Espinar N° 121, Panao, Pachitea, Huánuco"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 uppercase font-bold block mb-1">
                  DISTRITO / PROVINCIA:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={quotation.client.distrito}
                    onChange={(e) => handleClientChange('distrito', e.target.value)}
                    className="w-full font-semibold text-slate-800 text-xs border-2 border-slate-300 focus:border-slate-950 rounded-lg p-1.5 bg-white"
                    placeholder="Panao"
                  />
                  <input
                    type="text"
                    value={quotation.client.provincia}
                    onChange={(e) => handleClientChange('provincia', e.target.value)}
                    className="w-full font-semibold text-slate-800 text-xs border-2 border-slate-300 focus:border-slate-950 rounded-lg p-1.5 bg-white"
                    placeholder="Pachitea"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  SEÑOR(ES) / RAZÓN SOCIAL:
                </span>
                <p className="font-black text-slate-950 text-base sm:text-lg mt-0.5 tracking-tight">
                  {quotation.client.razonSocial}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  R.U.C. DEL CLIENTE:
                </span>
                <p className="font-mono font-black text-slate-950 text-base sm:text-lg mt-0.5 tracking-tight">
                  {quotation.client.ruc}
                </p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  DIRECCIÓN INSTITUCIONAL:
                </span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {quotation.client.direccion || 'Jr. Espinar N° 121, Panao, Pachitea, Huánuco'}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  UBICACIÓN / JURISDICCIÓN:
                </span>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">
                  {quotation.client.distrito} - {quotation.client.provincia} ({quotation.client.departamento})
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TABLE SECTION: ORGANIZED ACCORDING TO USER SPECIFICATION */}
        {/* Columns: N° ITEM, PRODUCTO, UNIDAD, MARCA, CANTIDAD, COSTO PARCIAL, SUB TOTAL */}
        {/* ============================================================ */}
        <div className="mt-6 mb-4">
          <div className="overflow-x-auto rounded-xl border-2 border-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-white font-black uppercase text-[11px] tracking-wider border-b-2 border-slate-900">
                  <th className="py-3.5 px-3 w-14 text-center border-r border-slate-800">N° ITEM</th>
                  <th className="py-3.5 px-3 min-w-[200px] border-r border-slate-800">PRODUCTO / DESCRIPCIÓN</th>
                  <th className="py-3.5 px-3 w-36 min-w-[135px] text-center border-r border-slate-800">UNIDAD</th>
                  <th className="py-3.5 px-3 w-36 min-w-[135px] text-center border-r border-slate-800">MARCA / FABRICANTE</th>
                  <th className="py-3.5 px-3 w-24 text-right border-r border-slate-800">CANTIDAD</th>
                  <th className="py-3.5 px-3 w-36 min-w-[135px] text-right border-r border-slate-800">COSTO PARCIAL</th>
                  <th className="py-3.5 px-3 w-32 text-right">SUB TOTAL</th>
                  <th className="py-3.5 px-2 w-12 text-center no-print border-l border-slate-800" title="Eliminar ítem">
                    <Trash2 className="w-3.5 h-3.5 mx-auto text-slate-400" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 bg-white">
                {quotation.items.map((item, index) => {
                  const itemNumber = index + 1;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* 1. N° ITEM (Correlativo corregido automáticamente) */}
                      <td className="py-3 px-3 text-center font-black text-slate-900 bg-slate-100/60 align-top border-r border-slate-200">
                        {itemNumber}
                      </td>

                      {/* 2. PRODUCTO / DESCRIPCIÓN */}
                      <td className="py-3 px-3 align-top border-r border-slate-200 min-w-[200px]">
                        {editMode ? (
                          <div>
                            <textarea
                              rows={2}
                              value={item.product}
                              onChange={(e) =>
                                handleItemFieldChange(index, 'product', e.target.value)
                              }
                              className="w-full p-2 text-xs sm:text-sm text-slate-950 border-2 border-slate-300 rounded-lg focus:border-slate-950 focus:ring-1 focus:ring-slate-950 focus:outline-hidden font-medium leading-relaxed resize-y bg-slate-50/40"
                              placeholder="Escribe el nombre del producto o especificaciones..."
                            />
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm font-semibold text-slate-950 leading-relaxed whitespace-pre-wrap py-1">
                            {item.product}
                          </div>
                        )}
                      </td>

                      {/* 3. UNIDAD (IGUAL EN ANCHURA A MARCA) */}
                      <td className="py-3 px-2 text-center align-top border-r border-slate-200 w-36 min-w-[135px]">
                        {editMode ? (
                          <input
                            type="text"
                            list="units-list"
                            value={item.unit}
                            onChange={(e) =>
                              handleItemFieldChange(index, 'unit', e.target.value.toUpperCase())
                            }
                            className="w-full text-center font-bold text-xs text-slate-900 border-2 border-slate-300 rounded-lg py-2 focus:border-slate-950 focus:outline-hidden uppercase"
                          />
                        ) : (
                          <span className="font-mono text-slate-900 bg-slate-100 border border-slate-300 px-2 py-1 rounded text-xs font-bold inline-block mt-1">
                            {item.unit}
                          </span>
                        )}
                      </td>

                      {/* 4. MARCA (IGUAL EN ANCHURA A UNIDAD) */}
                      <td className="py-3 px-2 text-center align-top border-r border-slate-200 w-36 min-w-[135px]">
                        {editMode ? (
                          <input
                            type="text"
                            value={item.brand}
                            onChange={(e) =>
                              handleItemFieldChange(index, 'brand', e.target.value)
                            }
                            className="w-full text-center text-xs sm:text-sm text-slate-950 font-bold border-2 border-slate-300 rounded-lg py-2 px-3 focus:border-slate-950 focus:outline-hidden bg-slate-50/30"
                            placeholder="Marca o Modelo"
                          />
                        ) : (
                          <span className="text-slate-900 font-bold text-xs sm:text-sm inline-block mt-1">
                            {item.brand || '—'}
                          </span>
                        )}
                      </td>

                      {/* 5. CANTIDAD */}
                      <td className="py-3 px-3 text-right align-top border-r border-slate-200 w-24">
                        {editMode ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemFieldChange(
                                index,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full text-right font-mono font-black text-sm text-slate-950 border-2 border-slate-300 rounded-lg py-2 px-2 focus:border-slate-950 focus:outline-hidden"
                          />
                        ) : (
                          <span className="font-mono font-bold text-sm text-slate-950 inline-block mt-1.5">
                            {item.quantity.toLocaleString('es-PE')}
                          </span>
                        )}
                      </td>

                      {/* 6. COSTO PARCIAL (Editable en cuadro amplio con autocalculo) */}
                      <td className="py-3 px-3 text-right align-top border-r border-slate-200 bg-slate-50/30 w-36 min-w-[135px]">
                        {editMode ? (
                          <div className="relative inline-block w-full">
                            <span className="absolute left-2.5 top-2.5 text-xs text-slate-500 font-mono font-bold select-none pointer-events-none">
                              S/.
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitCost}
                              onChange={(e) =>
                                handleItemFieldChange(
                                  index,
                                  'unitCost',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full text-right font-mono font-black text-sm sm:text-base text-slate-950 bg-white border-2 border-slate-400 hover:border-slate-600 focus:border-slate-950 focus:ring-2 focus:ring-slate-950 rounded-lg py-2 pl-8 pr-2 shadow-xs transition-all"
                              title="Costo parcial unitario sin IGV (editable con cálculo automático)"
                            />
                          </div>
                        ) : (
                          <div className="inline-block bg-slate-100 border border-slate-300 rounded-lg py-1.5 px-2.5">
                            <span className="font-mono text-slate-950 text-sm font-bold">
                              S/. {item.unitCost.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 7. SUB TOTAL (Calculado automáticamente) */}
                      <td className="py-3 px-3 text-right bg-slate-100/70 align-top w-32">
                        <span className="font-mono font-black text-slate-950 text-sm sm:text-base inline-block mt-1.5">
                          S/. {item.subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* 8. ICONO PEQUEÑO DE TACHO EN LA PARTE DERECHA PARA ELIMINAR RÁPIDAMENTE */}
                      {/* "ASI MISMO EN LA PARTE DERECHA DEBE HABER UN ICONO PEQUEÑO DE TACHO, */}
                      {/* PARA ELIMINAR RAPIDAMENTE ALGUNA DE ELLAS, Y AL ELIMINARSE LOS CORRELATIVOS */}
                      {/* DEBEN CORREGIRSE AUTOMATICAMENTE" */}
                      <td className="py-3 px-1 text-center align-top no-print border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => onDeleteItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 mt-1 inline-flex items-center justify-center"
                          title={`Eliminar ítem N° ${itemNumber} (reordena correlativos automáticamente)`}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600 transition-colors" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty State */}
                {quotation.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 font-medium">
                      No hay productos agregados en la cotización. Haz clic en "Agregar Nuevo Ítem" para añadir productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Datalist for common units */}
            <datalist id="units-list">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          {/* Add Item Button: Unlimited Items Allowed */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-bold shadow-xs transition-all hover:scale-[1.01] border border-slate-750"
              title="Agregar un nuevo ítem correlativo a la cotización (ilimitado)"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Agregar Nuevo Ítem / Producto (Ilimitado)</span>
            </button>

            <span className="text-xs text-slate-600 font-medium">
              Total de productos: <strong className="text-slate-950 font-mono font-bold">{quotation.items.length}</strong>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TOTALS & SUMMARY SECTION: SUMA TOTAL SIN IGV & MONTO EN LETRAS */}
        {/* ============================================================ */}
        <div className="mt-6 pt-4 border-t-2 border-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            {/* Amount in words & legal notice */}
            <div className="flex-1 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  VALOR EN LETRAS:
                </span>
                <p className="font-bold text-slate-950 text-xs sm:text-sm tracking-tight mt-0.5">
                  {totalInWords}
                </p>
              </div>

              {/* Requirement: UNICAMENTE DEBE DECIR: LOS PRECIOS NO INCLUYEN IGV. */}
              <div className="p-3.5 bg-slate-100 rounded-xl border-2 border-slate-900 text-xs font-black tracking-widest text-slate-950 uppercase flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 inline-block shrink-0"></span>
                <span>LOS PRECIOS NO INCLUYEN IGV.</span>
              </div>
            </div>

            {/* Total box - Grayscale Optimized */}
            <div className="w-full md:w-84 bg-slate-950 text-white p-4.5 rounded-xl shadow-xs space-y-2.5 border-2 border-slate-900">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span className="font-bold tracking-wide">SUBTOTAL NETO:</span>
                <span className="font-mono font-bold text-slate-100 text-sm">
                  S/. {totalNetoSinIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block">
                    SUMA TOTAL
                  </span>
                  <span className="text-[10px] text-slate-200 font-mono font-black tracking-wider uppercase border border-slate-700 px-1.5 py-0.5 rounded bg-slate-900">
                    SIN IGV
                  </span>
                </div>
                <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                  S/. {totalNetoSinIgv.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {onExportPdf && (
                <div className="pt-2 no-print border-t border-slate-800">
                  <button
                    onClick={onExportPdf}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white border border-slate-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.01]"
                    title="Genera y descarga inmediatamente el archivo PDF oficial"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Descargar Cotización en PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONDICIONES COMERCIALES EN UNA SOLA COLUMNA */}
        {/* "LAS CONDICIONES COMERCIALES DEBEN ESCRIBIRSE EN UNA SOLA COLUMNA" */}
        {/* Plazos de entrega: Entre 4 horas y 2 días | Validez: 30 días */}
        {/* NO MENCIONAR GARANTÍAS (REMOVED) */}
        {/* ============================================================ */}
        <div className="mt-8 pt-6 border-t-2 border-slate-900">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-4 bg-slate-900"></div>
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">
              CONDICIONES COMERCIALES Y DE SERVICIO
            </h3>
          </div>

          <div className="flex flex-col border-2 border-slate-900 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white shadow-xs">
            {/* 1. Plazo de Entrega */}
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block shrink-0"></span>
                Plazo de Entrega:
              </span>
              {editMode ? (
                <input
                  type="text"
                  value={quotation.deliveryTime}
                  onChange={(e) =>
                    onUpdateQuotation({
                      ...quotation,
                      deliveryTime: e.target.value,
                    })
                  }
                  className="font-bold text-slate-950 text-xs sm:text-sm border-b-2 border-slate-400 focus:border-slate-950 py-0.5 px-1 bg-transparent w-full sm:w-80 text-left sm:text-right"
                  placeholder="01 día calendario"
                />
              ) : (
                <span className="font-black text-slate-950 text-xs sm:text-sm">
                  {quotation.deliveryTime || '01 día calendario'}
                </span>
              )}
            </div>

            {/* 2. Validez de la Oferta */}
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block shrink-0"></span>
                Validez de la Oferta:
              </span>
              {editMode ? (
                <div className="flex items-center gap-1.5 justify-start sm:justify-end">
                  <input
                    type="number"
                    value={quotation.validityDays}
                    onChange={(e) =>
                      onUpdateQuotation({
                        ...quotation,
                        validityDays: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-20 font-bold text-slate-950 text-xs sm:text-sm border-b-2 border-slate-400 focus:border-slate-950 py-0.5 px-1 text-right"
                  />
                  <span className="font-bold text-slate-900 text-xs">días calendario</span>
                </div>
              ) : (
                <span className="font-black text-slate-950 text-xs sm:text-sm">
                  {quotation.validityDays || 30} días calendario
                </span>
              )}
            </div>

            {/* 3. Forma de Pago */}
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block shrink-0"></span>
                Forma de Pago:
              </span>
              {editMode ? (
                <input
                  type="text"
                  value={quotation.paymentMethod}
                  onChange={(e) =>
                    onUpdateQuotation({
                      ...quotation,
                      paymentMethod: e.target.value,
                    })
                  }
                  className="font-bold text-slate-950 text-xs sm:text-sm border-b-2 border-slate-400 focus:border-slate-950 py-0.5 px-1 bg-transparent w-full sm:w-96 text-left sm:text-right"
                />
              ) : (
                <span className="font-bold text-slate-950 text-xs sm:text-sm text-left sm:text-right">
                  {quotation.paymentMethod}
                </span>
              )}
            </div>

            {/* 4. Cuentas Bancarias del Proveedor */}
            {/* 4. Cuenta Interbancaria del Proveedor */}
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block shrink-0"></span>
                Cuenta Interbancaria del Proveedor:
              </span>
              {editMode ? (
                <input
                  type="text"
                  value={quotation.issuer.bankAccounts}
                  onChange={(e) => handleIssuerChange('bankAccounts', e.target.value)}
                  className="font-mono font-bold text-slate-950 text-xs sm:text-sm border-b-2 border-slate-400 focus:border-slate-950 py-0.5 px-1 bg-transparent w-full sm:w-96 text-left sm:text-right"
                  placeholder="CCI: 80810521 100000689512 CMAC Huancayo S.A."
                />
              ) : (
                <span className="font-mono font-black text-slate-950 text-xs sm:text-sm text-left sm:text-right">
                  {quotation.issuer.bankAccounts || 'CCI: 80810521 100000689512 CMAC Huancayo S.A.'}
                </span>
              )}
            </div>

            {/* 5. Observaciones Generales */}
            <div className="p-3.5 flex flex-col gap-1.5 hover:bg-slate-50 transition-colors">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900 inline-block shrink-0"></span>
                Observaciones Generales:
              </span>
              {editMode ? (
                <textarea
                  rows={2}
                  value={quotation.observations}
                  onChange={(e) =>
                    onUpdateQuotation({
                      ...quotation,
                      observations: e.target.value,
                    })
                  }
                  className="w-full p-2 text-slate-950 font-medium border-2 border-slate-300 rounded-lg text-xs sm:text-sm bg-slate-50/50 focus:border-slate-950 focus:outline-hidden"
                  placeholder="Precios sin IGV, puestos en almacén de la Municipalidad."
                />
              ) : (
                <p className="text-slate-900 text-xs sm:text-sm font-semibold pl-4">
                  {quotation.observations || 'Precios sin IGV, puestos en almacén de la Municipalidad.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SIGNATURE SECTION: SEVERAL SPACES BELOW NEAR THE BOTTOM OF THE PAGE */}
        {/* "EN LA PARTE FINAL PARA QUE FIRME EL PROVEEDOR DEBE UBICARCE */}
        {/* VARIOS ESPACIOS MAS ABAJO, CASI SIEMPRE AL FINAL DE LA PAGINA" */}
        {/* ============================================================ */}
        <div className="mt-36 sm:mt-48 pt-10 text-center">
          <div className="border-t-2 border-slate-900 w-72 sm:w-80 mx-auto pt-2.5">
            <p className="font-black text-sm text-slate-900 uppercase tracking-tight">
              GARAY AQUINO WILDER
            </p>
            <p className="font-bold font-mono text-xs text-slate-800 mt-0.5">
              RUC: 10415096556
            </p>
            <p className="text-slate-500 text-[11px] uppercase tracking-wider mt-0.5 font-medium">
              PROVEEDOR / REPRESENTANTE LEGAL
            </p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTÓN GUARDAR AL FINAL DEL DOCUMENTO PER USER REQUIREMENT: */}
        {/* "AL FINAL TAMBIEN DEBE APARECER UN BOTON GUARDAR, PARA QUE CADA */}
        {/* COTIZACION REALIZADA SE GUARDE SIEMPRE EN EL HISTORIL." */}
        {/* ============================================================ */}
        {onSaveQuotation && (
          <div className="mt-12 pt-6 border-t-2 border-slate-900 no-print flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-100 p-4 sm:p-5 rounded-2xl border-2 border-slate-900">
            <div className="text-xs text-slate-800">
              <strong className="text-slate-950 text-sm block font-black">¿Deseas guardar esta cotización?</strong>
              <p className="text-slate-600 mt-0.5">
                Al hacer clic en Guardar, los datos y su número correlativo se almacenarán permanentemente en el historial.
              </p>
            </div>
            <button
              onClick={onSaveQuotation}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 active:bg-black text-white rounded-xl text-sm font-black shadow-md shadow-slate-900/20 transition-all hover:scale-[1.02] border border-slate-700"
              title="Guardar cotización actual en el historial de cotizaciones"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cotización en Historial</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* FOOTER LINE: SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY */}
        {/* ============================================================ */}
        <div className="mt-10 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
          <span>SISTEMA DE AUTOMATIZACION DE COTIZACIONES - COMERCIAL GARAY</span>
          <span className="font-mono font-medium text-slate-500">
            N° {quotation.correlativeNumber} • Emisión: {quotation.date} {quotation.time}
          </span>
        </div>
      </div>
    </div>
  );
};
