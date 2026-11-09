import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  X,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Quotation } from '../types/quotation';
import { exportQuotationToGoogleSheets } from '../services/googleSheets';
import { googleSignIn } from '../services/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
}

export const GoogleSheetsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotation,
  user,
  accessToken,
  onAuthSuccess,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [createdSheet, setCreatedSheet] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setExportError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || 'Error al iniciar sesión con Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleExport = async () => {
    if (!accessToken) {
      setExportError('Se requiere autorización para exportar a Google Sheets.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportQuotationToGoogleSheets(accessToken, quotation);
      setCreatedSheet({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: `COTIZACIÓN ${quotation.correlativeNumber} - MUNICIPALIDAD PROVINCIAL DE PACHITEA`,
      });
    } catch (err: any) {
      console.error('Error al exportar:', err);
      setExportError(
        err.message || 'Ocurrió un error al crear la hoja de cálculo en Google Sheets.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">
                Exportar a Google Sheets
              </h3>
              <p className="text-xs text-slate-400">
                Sincronización directa con Google Workspace
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {createdSheet ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Hoja de Cálculo Creada con Éxito!
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Se ha generado la cotización <span className="font-semibold text-slate-800 dark:text-slate-200">{quotation.correlativeNumber}</span> con todas las fórmulas matemáticas, datos de la Municipalidad de Pachitea y tabla de {quotation.items.length} productos.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                {createdSheet.title}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href={createdSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-emerald-700/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir en Google Sheets
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors border border-transparent dark:border-slate-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Summary of what will be exported */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between items-center text-slate-900 dark:text-white font-medium pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span>Documento a Generar:</span>
                  <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                    {quotation.correlativeNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente Destinatario:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    MUNICIPALIDAD PROVINCIAL DE PACHITEA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>R.U.C. Cliente:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">20183995121</span>
                </div>
                <div className="flex justify-between">
                  <span>N° de Ítems en Tabla:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{quotation.items.length} ítems</span>
                </div>
                <div className="flex justify-between">
                  <span>Suma Total (Sin IGV):</span>
                  <span className="font-bold text-slate-950 dark:text-white">
                    S/.{' '}
                    {quotation.items
                      .reduce((acc, it) => acc + it.subtotal, 0)
                      .toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <span>Fórmulas automáticas:</span>
                  <span>=CANTIDAD * COSTO_PARCIAL y =SUM(...)</span>
                </div>
              </div>

              {exportError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{exportError}</span>
                </div>
              )}

              {/* Authentication state */}
              {!user || !accessToken ? (
                <div className="text-center pt-2 space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Para crear la hoja en tu cuenta de Google, inicia sesión con Google:
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="gsi-material-button w-full sm:w-auto shadow-sm"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            style={{ display: 'block' }}
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            ></path>
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            ></path>
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            ></path>
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            ></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents font-medium">
                          {isSigningIn ? 'Conectando...' : 'Acceder con Google para exportar'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>Conectado como: <strong>{user.email}</strong></span>
                    </div>
                    <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-800 font-semibold">
                      Listo
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-all shadow-sm shadow-emerald-700/20"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generando Hoja de Cálculo...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Crear Hoja en Google Sheets
                        </>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      disabled={isExporting}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
