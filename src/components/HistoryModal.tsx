import React from 'react';
import { Quotation } from '../types/quotation';
import { History, X, Calendar, Clock, ArrowRight, Trash2, Copy, FileText, Printer, FileDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: Quotation[];
  currentCorrelative: string;
  onLoadQuotation: (quotation: Quotation) => void;
  onDuplicateQuotation: (quotation: Quotation) => void;
  onDeleteHistoryItem: (correlativeNumber: string) => void;
  onPrintQuotation?: (quotation: Quotation) => void;
  onExportPdfQuotation?: (quotation: Quotation) => void;
}

export const HistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  history,
  currentCorrelative,
  onLoadQuotation,
  onDuplicateQuotation,
  onDeleteHistoryItem,
  onPrintQuotation,
  onExportPdfQuotation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Historial de Cotizaciones
              </h3>
              <p className="text-xs text-slate-400">
                Cotizaciones emitidas a la Municipalidad Provincial de Pachitea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">
                No hay cotizaciones archivadas en el historial aún.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Al pulsar en &quot;Generar Nueva Cotización&quot;, la cotización activa se guardará automáticamente aquí.
              </p>
            </div>
          ) : (
            history.map((q) => {
              const isCurrent = q.correlativeNumber === currentCorrelative;
              const totalAmount = q.items.reduce((acc, it) => acc + it.subtotal, 0);

              return (
                <div
                  key={q.id || q.correlativeNumber}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-blue-500/80 bg-blue-50/50 ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm tracking-tight">
                          {q.correlativeNumber}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                            Activa
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                          ({q.items.length} ítems)
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {q.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {q.time}
                        </span>
                        <span className="font-medium text-slate-700">
                          Total sin IGV: <strong className="text-slate-900">S/. {totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                      {onPrintQuotation && (
                        <button
                          onClick={() => onPrintQuotation(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-2xs"
                          title="Volver a imprimir esta cotización archivada"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      )}
                      {onExportPdfQuotation && (
                        <button
                          onClick={() => onExportPdfQuotation(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors border border-slate-300"
                          title="Descargar PDF de esta cotización"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      )}
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onLoadQuotation(q);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                          title="Cargar y ver en pantalla"
                        >
                          Cargar
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onDuplicateQuotation(q);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                        title="Duplicar como nueva con siguiente correlativo"
                      >
                        <Copy className="w-3 h-3" />
                        Duplicar
                      </button>
                      <button
                        onClick={() => onDeleteHistoryItem(q.correlativeNumber)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-between items-center text-xs text-slate-500">
          <span>Total en archivo: {history.length} cotización(es)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
