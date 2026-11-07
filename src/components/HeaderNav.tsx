import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  PlusCircle,
  History,
  Clock,
  Calendar,
  Eye,
  Edit3,
  RefreshCw,
  Building,
  Check,
  Download,
  FileDown,
  Save,
} from 'lucide-react';
import { Quotation } from '../types/quotation';
import { getCurrentDateFormatted, getCurrentTimeFormatted } from '../utils/quotationStorage';

interface Props {
  quotation: Quotation;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  onGenerateNew: () => void;
  onRefreshDateTime: () => void;
  onOpenGoogleSheets: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onExportPdf: () => void;
  onPrint: () => void;
  onExportCsv: () => void;
  onSaveQuotation?: () => void;
}

export const HeaderNav: React.FC<Props> = ({
  quotation,
  editMode,
  setEditMode,
  onGenerateNew,
  onRefreshDateTime,
  onOpenGoogleSheets,
  onOpenHistory,
  historyCount,
  onExportPdf,
  onPrint,
  onExportCsv,
  onSaveQuotation,
}) => {
  // Live ticking clock
  const [liveTime, setLiveTime] = useState<string>(getCurrentTimeFormatted());
  const [liveDate, setLiveDate] = useState<string>(getCurrentDateFormatted());
  const [timeRefreshedBadge, setTimeRefreshedBadge] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentTimeFormatted());
      setLiveDate(getCurrentDateFormatted());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncDateTime = () => {
    onRefreshDateTime();
    setTimeRefreshedBadge(true);
    setTimeout(() => setTimeRefreshedBadge(false), 2500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs no-print transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with institutional client info and live clock */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 text-xs">
          {/* Client target & Provider */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-900 border border-slate-300 font-bold tracking-tight">
              <Building className="w-3.5 h-3.5 text-slate-800 shrink-0" />
              CLIENTE:
            </span>
            <span className="font-extrabold text-slate-950 tracking-tight">
              MUNICIPALIDAD PROVINCIAL DE PACHITEA
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 font-mono font-bold text-slate-800 text-[11px]">
              RUC: 20183995121
            </span>
            <span className="text-slate-400 hidden lg:inline">|</span>
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300 font-bold text-[11px]">
              PROVEEDOR: GARAY AQUINO WILDER (RUC: 10415096556)
            </span>
          </div>

          {/* Automatic live clock indicator */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-mono cursor-pointer hover:bg-slate-200 transition-colors"
              title="Hora y fecha del sistema actualizadas en tiempo real. Clic para sincronizar a la cotización."
              onClick={handleSyncDateTime}
            >
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              <span>{liveDate}</span>
              <Clock className="w-3.5 h-3.5 text-slate-600 ml-1" />
              <span className="font-bold text-slate-950">{liveTime}</span>
            </div>

            <button
              onClick={handleSyncDateTime}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                timeRefreshedBadge
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
              title="Actualiza la fecha y hora de emisión del documento a la hora exacta de ahora"
            >
              {timeRefreshedBadge ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Actualizado a las {quotation.time}!</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Actualizar Hora/Fecha</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary toolbar */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Correlative & State */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xs border border-slate-800">
              <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">
                N°
              </span>
              <span className="font-mono font-bold text-sm text-slate-100 tracking-wider">
                {quotation.correlativeNumber}
              </span>
            </div>

            <div className="hidden sm:flex flex-col text-[11px] text-slate-600 leading-tight">
              <span>
                Emisión:{' '}
                <strong className="text-slate-900 font-mono">{quotation.date}</strong> -{' '}
                <strong className="text-slate-900 font-mono">{quotation.time}</strong>
              </span>
              <span className="text-slate-900 font-bold">
                Cálculos automáticos sin IGV
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Edit / Preview */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setEditMode(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  editMode
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Modo interactivo para editar productos y datos"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Editar</span>
              </button>
              <button
                onClick={() => setEditMode(false)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  !editMode
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
                title="Vista previa del documento oficial"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Vista Documento</span>
              </button>
            </div>

            {/* Generar Nueva Cotización (+1 Correlativo) */}
            <button
              onClick={onGenerateNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-all border border-slate-800"
              title="Genera automáticamente un nuevo número correlativo y archiva la anterior"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Cotización</span>
            </button>

            {/* Guardar Cotización */}
            {onSaveQuotation && (
              <button
                onClick={onSaveQuotation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-all border border-slate-600"
                title="Guarda la cotización actual con su número correlativo en el historial"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>
            )}

            {/* DIRECT VECTOR PDF EXPORT BUTTON */}
            <button
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-black shadow-xs transition-all border border-slate-700"
              title="Descarga el archivo PDF optimizado para impresión en escala de grises"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            {/* Export to Google Sheets */}
            <button
              onClick={onOpenGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
              title="Crea una hoja de cálculo con fórmulas automáticas en Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheets</span>
            </button>

            {/* Print Dialog */}
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-all border border-slate-300"
              title="Abrir diálogo de impresión del navegador"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* CSV Download */}
            <button
              onClick={onExportCsv}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200"
              title="Descargar tabla en formato CSV / Excel"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* History */}
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200"
              title="Ver historial de cotizaciones previas"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Historial</span>
              <span className="px-1.5 py-0.2 bg-slate-200 rounded-full text-[10px] font-bold text-slate-700">
                {historyCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
