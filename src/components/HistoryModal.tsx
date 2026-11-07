import React, { useState } from 'react';
import { Quotation } from '../types/quotation';
import {
  History,
  X,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  Copy,
  FileText,
  Printer,
  FileDown,
  Database,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

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
  const [showSupabaseGuide, setShowSupabaseGuide] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  if (!isOpen) return null;

  const isSupaActive = isSupabaseConfigured();

  const supabaseSqlScript = `-- ==========================================
-- SCRIPT SQL PARA SUPABASE (https://supabase.com)
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ==========================================

-- 1. Crear la tabla de cotizaciones
create table if not exists public.quotations (
  id text primary key,
  correlative_number text not null unique,
  correlative_counter integer not null,
  date text not null,
  time text not null,
  validity_days integer default 30,
  delivery_time text default '01 día calendario',
  payment_method text,
  warranty text,
  currency text default 'PEN',
  currency_symbol text default 'S/.',
  observations text,
  client jsonb not null,
  issuer jsonb not null,
  items jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Habilitar seguridad a nivel de filas (RLS)
alter table public.quotations enable row level security;

-- 3. Crear política para permitir lectura y guardado con la clave anon
create policy "Permitir lectura publica de cotizaciones"
on public.quotations for select
using (true);

create policy "Permitir insercion y actualizacion de cotizaciones"
on public.quotations for all
using (true)
with check (true);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                <span>Historial de Cotizaciones</span>
              </h3>
              <p className="text-xs text-slate-400">
                Municipalidad Provincial de Pachitea • Almacenamiento en Base de Datos
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

        {/* Supabase Status & Integration Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700">Base de Datos:</span>
            {isSupaActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Supabase Conectado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                Cloud Database Activa (Híbrido)
              </span>
            )}
          </div>

          <button
            onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 hover:underline text-xs"
          >
            <span>{showSupabaseGuide ? 'Ocultar Guía Supabase' : 'Pasos para vincular Supabase'}</span>
            {showSupabaseGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Supabase Step-by-Step Instructions Panel */}
        {showSupabaseGuide && (
          <div className="p-5 bg-slate-900 text-slate-200 border-b border-slate-700 max-h-[50vh] overflow-y-auto text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Instrucciones Paso a Paso para Supabase (https://supabase.com)
              </span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
              >
                Abrir Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="list-decimal pl-5 space-y-2 text-slate-300 leading-relaxed">
              <li>
                <strong className="text-white">Crear cuenta o Iniciar Sesión:</strong> Ingresa a{' '}
                <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">
                  supabase.com
                </a>{' '}
                y haz clic en <em>&quot;Start your project&quot;</em>.
              </li>
              <li>
                <strong className="text-white">Crear Nuevo Proyecto:</strong> Haz clic en <em>&quot;New Project&quot;</em>, asigna un nombre (ej. <code>ComercialGaray</code>) y una contraseña de base de datos segura.
              </li>
              <li>
                <strong className="text-white">Crear la tabla `quotations`:</strong> En el menú lateral izquierdo de Supabase, entra a <strong>SQL Editor</strong>, pega el siguiente script y pulsa <strong>Run</strong>:
              </li>
            </ol>

            <div className="relative mt-2">
              <pre className="p-3 bg-black/80 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40 border border-slate-700">
                {supabaseSqlScript}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
              >
                {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? '¡Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </div>

            <ol start={4} className="list-decimal pl-5 space-y-2 text-slate-300 leading-relaxed pt-1">
              <li>
                <strong className="text-white">Obtener URL y Clave Anon:</strong> En el menú lateral izquierdo de tu proyecto Supabase, ve a <strong>Project Settings &gt; API</strong> (o <strong>API Keys</strong>) y copia:
                <ul className="list-disc pl-5 mt-1 text-slate-400 space-y-0.5">
                  <li><strong>Project URL</strong> (ej. <code>https://xyzcompany.supabase.co</code>)</li>
                  <li><strong>Project API Key (anon / public)</strong> (clave pública que comienza con <code>eyJ...</code>)</li>
                </ul>
              </li>
              <li>
                <strong className="text-white">Configurar en las Variables de Entorno:</strong> En el archivo <code>.env</code> de tu aplicación o en la configuración de la app, añade:
                <pre className="mt-1 p-2 bg-black/60 rounded text-[10.5px] font-mono text-blue-300">
VITE_SUPABASE_URL=&quot;https://tu-proyecto.supabase.co&quot;{'\n'}
VITE_SUPABASE_ANON_KEY=&quot;tu-anon-public-key&quot;
                </pre>
              </li>
            </ol>

            <div className="pt-2 text-slate-400 text-[11px] italic">
              💡 Una vez configuradas las variables, la sincronización se activará automáticamente con estado verde &quot;Supabase Conectado&quot;.
            </div>
          </div>
        )}

        {/* List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto stroke-[1.5] text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">
                No hay cotizaciones archivadas en el historial aún.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Al pulsar en &quot;Guardar Cotización en Historial&quot; o &quot;Generar Nueva Cotización&quot;, los registros se guardarán automáticamente aquí.
              </p>
            </div>
          ) : (
            history.map((q) => {
              const isCurrent = q.correlativeNumber === currentCorrelative;
              const totalAmount = q.items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

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
          <span>Base de Datos sincronizada • Total en archivo: {history.length} cotización(es)</span>
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
