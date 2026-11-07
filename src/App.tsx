import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Quotation, QuotationItem } from './types/quotation';
import {
  loadInitialQuotation,
  saveCurrentQuotation,
  createNewQuotation,
  getNextCorrelativeCounter,
  saveCorrelativeCounter,
  getQuotationHistory,
  archiveQuotationToHistory,
  getCurrentDateFormatted,
  getCurrentTimeFormatted,
} from './utils/quotationStorage';
import {
  saveQuotationToDatabase,
  getAllQuotationsFromDatabase,
  deleteQuotationFromDatabase,
} from './utils/databaseStorage';
import { initAuth } from './services/auth';
import { HeaderNav } from './components/HeaderNav';
import { QuotationDocument } from './components/QuotationDocument';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { HistoryModal } from './components/HistoryModal';
import { printQuotationDirectly } from './utils/printQuotation';
import { generateQuotationPdf } from './utils/generatePdf';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function App() {
  const [quotation, setQuotation] = useState<Quotation>(() => loadInitialQuotation());
  const [editMode, setEditMode] = useState<boolean>(true);
  const [history, setHistory] = useState<Quotation[]>(() => getQuotationHistory());

  // Firebase Auth state for Google Workspace / Sheets
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Notification toast
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load persistent history from IndexedDB on start
  useEffect(() => {
    getAllQuotationsFromDatabase()
      .then((dbQuotations) => {
        if (dbQuotations && dbQuotations.length > 0) {
          setHistory(dbQuotations);
        }
      })
      .catch((err) => console.warn('Could not load database quotations on init:', err));
  }, []);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Sync quotation to storage whenever it changes
  useEffect(() => {
    saveCurrentQuotation(quotation);
  }, [quotation]);

  // Generates new quotation with next correlative number
  const handleGenerateNew = async () => {
    // 1. Archive current quotation into history and persistent database
    archiveQuotationToHistory(quotation);
    await saveQuotationToDatabase(quotation);
    const updatedHistory = await getAllQuotationsFromDatabase();
    setHistory(updatedHistory);

    // 2. Increment correlative counter
    const nextCounter = getNextCorrelativeCounter() + 1;
    saveCorrelativeCounter(nextCounter);

    // 3. Create fresh quotation with next correlative and current date/time
    const newQuotation = createNewQuotation(nextCounter);
    setQuotation(newQuotation);

    showToast(
      `Nueva cotización generada: ${newQuotation.correlativeNumber}. Correlativo actualizado.`,
      'success'
    );
  };

  // Explicitly saves the current quotation to persistent database history and updates correlatives
  const handleSaveQuotation = useCallback(async () => {
    archiveQuotationToHistory(quotation);
    saveCurrentQuotation(quotation);
    saveCorrelativeCounter(quotation.correlativeCounter);
    await saveQuotationToDatabase(quotation);
    const updated = await getAllQuotationsFromDatabase();
    setHistory(updated.length > 0 ? updated : getQuotationHistory());
    showToast(
      `¡Cotización ${quotation.correlativeNumber} guardada exitosamente en la base de datos e historial!`,
      'success'
    );
  }, [quotation]);

  // Refreshes the date and time to the exact current moment
  const handleRefreshDateTime = () => {
    const updated = {
      ...quotation,
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
      updatedAt: new Date().toISOString(),
    };
    setQuotation(updated);
    showToast(`Fecha y hora actualizadas: ${updated.date} ${updated.time}`, 'info');
  };

  // Add Item
  const handleAddItem = () => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${quotation.items.length + 1}`,
      itemNumber: quotation.items.length + 1,
      product: '',
      unit: 'UND',
      brand: '',
      quantity: 1,
      unitCost: 0,
      subtotal: 0,
    };
    setQuotation({
      ...quotation,
      items: [...quotation.items, newItem],
    });
    showToast(`Ítem N° ${newItem.itemNumber} agregado a la cotización`, 'success');
  };

  // Update Item
  const handleUpdateItem = (index: number, updatedItem: QuotationItem) => {
    const newItems = [...quotation.items];
    newItems[index] = updatedItem;
    setQuotation({
      ...quotation,
      items: newItems,
    });
  };

  // Delete Item - Automatically re-indexes correlatives
  const handleDeleteItem = (index: number) => {
    const filtered = quotation.items.filter((_, idx) => idx !== index);
    // Re-index item numbers automatically: 1, 2, 3...
    const reindexed = filtered.map((item, idx) => ({
      ...item,
      itemNumber: idx + 1,
    }));
    setQuotation({
      ...quotation,
      items: reindexed,
    });
    showToast('Ítem eliminado y correlativos corregidos automáticamente', 'info');
  };

  // Duplicate Item
  const handleDuplicateItem = (index: number) => {
    const itemToClone = quotation.items[index];
    const cloned: QuotationItem = {
      ...itemToClone,
      id: `item-${Date.now()}-clone`,
      product: `${itemToClone.product} (Copia)`,
    };
    const newItems = [...quotation.items];
    newItems.splice(index + 1, 0, cloned);
    const reindexed = newItems.map((item, idx) => ({
      ...item,
      itemNumber: idx + 1,
    }));
    setQuotation({
      ...quotation,
      items: reindexed,
    });
    showToast('Ítem duplicado con éxito', 'success');
  };

  // Move Item up or down
  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= quotation.items.length) return;
    const newItems = [...quotation.items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    const reindexed = newItems.map((item, idx) => ({
      ...item,
      itemNumber: idx + 1,
    }));
    setQuotation({
      ...quotation,
      items: reindexed,
    });
  };

  // Catalog templates for Municipalidad Provincial de Pachitea
  const handleAddCatalogTemplate = (category: 'obras' | 'computo' | 'oficina' | 'combustible') => {
    let templateItems: Partial<QuotationItem>[] = [];

    if (category === 'obras') {
      templateItems = [
        { product: 'Arena Gruesa lavada para mezcla de concreto en pavimentación', unit: 'M3', brand: 'CANTERA LOCAL', quantity: 25, unitCost: 65.0 },
        { product: 'Piedra Chancada de 1/2" para obras de infraestructura vial', unit: 'M3', brand: 'CANTERA LOCAL', quantity: 20, unitCost: 75.0 },
        { product: 'Tubo de Alcantarillado Corrugado HDPE 24" x 6m para drenaje pluvial', unit: 'TUB', brand: 'TIGRE ADS', quantity: 12, unitCost: 850.0 },
      ];
    } else if (category === 'computo') {
      templateItems = [
        { product: 'Impresora Multifuncional Tanque de Tinta Continua WiFi / Red', unit: 'UND', brand: 'EPSON ECOTANK', quantity: 3, unitCost: 980.0 },
        { product: 'Switch Administrable Gigabit Ethernet 24 Puertos PoE+', unit: 'UND', brand: 'CISCO', quantity: 1, unitCost: 1450.0 },
        { product: 'UPS Sistema de Respaldo Ininterrumpido 1500VA para Servidores', unit: 'UND', brand: 'APC', quantity: 2, unitCost: 790.0 },
      ];
    } else if (category === 'combustible') {
      templateItems = [
        { product: 'Gasolina Regular de 90 Octanos para camionetas de serenazgo', unit: 'GLN', brand: 'PETROPERÚ', quantity: 200, unitCost: 16.8 },
        { product: 'Aceite de Motor Diésel Multigrado 15W-40 Balde de 5 Galones', unit: 'BLD', brand: 'MOBIL DELVAC', quantity: 6, unitCost: 320.0 },
      ];
    } else {
      templateItems = [
        { product: 'Papel Fotocopia Bond A4 75g (Caja por 5 millares / 10 paquetes)', unit: 'CAJA', brand: 'CHAMEX / REPORT', quantity: 15, unitCost: 145.0 },
        { product: 'Archivador de Palanca Lomo Ancho Plastificado Tamaño Oficio', unit: 'DOC', brand: 'STANDFORD', quantity: 10, unitCost: 78.0 },
        { product: 'Tóner Láser Negro de Alto Rendimiento para impresora municipal', unit: 'UND', brand: 'HP ORIGINAL', quantity: 4, unitCost: 340.0 },
      ];
    }

    const currentCount = quotation.items.length;
    const newItemsToAdd: QuotationItem[] = templateItems.map((tmpl, idx) => {
      const q = tmpl.quantity || 1;
      const c = tmpl.unitCost || 0;
      return {
        id: `tmpl-${Date.now()}-${idx}`,
        itemNumber: currentCount + idx + 1,
        product: tmpl.product || '',
        unit: tmpl.unit || 'UND',
        brand: tmpl.brand || '',
        quantity: q,
        unitCost: c,
        subtotal: Math.round(q * c * 100) / 100,
      };
    });

    setQuotation({
      ...quotation,
      items: [...quotation.items, ...newItemsToAdd],
    });
    showToast(`Se agregaron ${newItemsToAdd.length} ítems de la categoría seleccionada`, 'success');
  };

  // Load from history
  const handleLoadQuotation = (selected: Quotation) => {
    // Preserve currently active quotation into history first
    archiveQuotationToHistory(quotation);
    setQuotation({
      ...selected,
      // Auto-update date and time when opening
      date: getCurrentDateFormatted(),
      time: getCurrentTimeFormatted(),
    });
    setHistory(getQuotationHistory());
    showToast(`Cotización ${selected.correlativeNumber} cargada y actualizada a fecha de hoy`, 'info');
  };

  // Duplicate from history
  const handleDuplicateQuotation = (source: Quotation) => {
    const nextCounter = getNextCorrelativeCounter() + 1;
    saveCorrelativeCounter(nextCounter);
    const duplicated = createNewQuotation(nextCounter, source);
    setQuotation(duplicated);
    setHistory(getQuotationHistory());
    showToast(`Cotización duplicada con nuevo correlativo: ${duplicated.correlativeNumber}`, 'success');
  };

  // Delete from history and database
  const handleDeleteHistoryItem = async (correlativeNumber: string) => {
    await deleteQuotationFromDatabase(correlativeNumber);
    const updated = await getAllQuotationsFromDatabase();
    setHistory(updated);
    showToast(`Cotización ${correlativeNumber} eliminada del archivo y base de datos`, 'info');
  };

  // Direct re-print of a specific archived quotation from history
  const handlePrintSpecificQuotation = (targetQuotation: Quotation) => {
    showToast(`Imprimiendo cotización archivada ${targetQuotation.correlativeNumber}...`, 'info');
    printQuotationDirectly(targetQuotation);
  };

  // Direct PDF download of a specific archived quotation from history
  const handleExportPdfSpecificQuotation = (targetQuotation: Quotation) => {
    showToast(`Generando PDF oficial para cotización ${targetQuotation.correlativeNumber}...`, 'info');
    generateQuotationPdf(targetQuotation);
  };

  // Export CSV / Excel format
  const handleExportCsv = () => {
    const headers = [
      'N° ITEM',
      'PRODUCTO / DESCRIPCIÓN',
      'UNIDAD',
      'MARCA',
      'CANTIDAD',
      'COSTO PARCIAL (S/.)',
      'SUB TOTAL (S/.)',
    ];

    const rows = quotation.items.map((it) => [
      it.itemNumber,
      `"${it.product.replace(/"/g, '""')}"`,
      it.unit,
      `"${it.brand.replace(/"/g, '""')}"`,
      it.quantity,
      it.unitCost.toFixed(2),
      it.subtotal.toFixed(2),
    ]);

    const totalNeto = quotation.items.reduce((acc, it) => acc + it.subtotal, 0);

    const meta = [
      ['COTIZACIÓN INSTITUCIONAL', quotation.correlativeNumber],
      ['CLIENTE', quotation.client.razonSocial],
      ['RUC CLIENTE', quotation.client.ruc],
      ['FECHA DE EMISIÓN', quotation.date],
      ['CONDICIÓN', 'SIN IGV'],
      ['PROVEEDOR', 'GARAY AQUINO WILDER (RUC: 10415096556)'],
      [],
      headers,
      ...rows,
      [],
      ['SUMA TOTAL (SIN IGV)', '', '', '', '', '', totalNeto.toFixed(2)],
      ['NOTA', 'LOS PRECIOS NO INCLUYEN IGV.'],
    ];

    const csvContent = '\uFEFF' + meta.map((e) => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Cotizacion_${quotation.correlativeNumber}_Pachitea.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo CSV generado y descargado', 'success');
  };

  const handleExportPdf = () => {
    try {
      showToast('Generando archivo PDF...', 'info');
      generateQuotationPdf(quotation);
      showToast('¡Archivo PDF descargado con éxito!', 'success');
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      showToast('Error al generar PDF. Probando método alternativo...', 'error');
      printQuotationDirectly(quotation);
    }
  };

  const handlePrint = () => {
    showToast('Abriendo vista de impresión...', 'info');
    printQuotationDirectly(quotation);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & Controls */}
      <HeaderNav
        quotation={quotation}
        editMode={editMode}
        setEditMode={setEditMode}
        onGenerateNew={handleGenerateNew}
        onRefreshDateTime={handleRefreshDateTime}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
        onExportPdf={handleExportPdf}
        onPrint={handlePrint}
        onExportCsv={handleExportCsv}
        onSaveQuotation={handleSaveQuotation}
      />

      {/* Main Quotation Document Sheet */}
      <main className="flex-1 pb-16">
        <QuotationDocument
          quotation={quotation}
          editMode={editMode}
          onUpdateQuotation={setQuotation}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onDuplicateItem={handleDuplicateItem}
          onMoveItem={handleMoveItem}
          onAddCatalogTemplate={handleAddCatalogTemplate}
          onRefreshDateTime={handleRefreshDateTime}
          onExportPdf={handleExportPdf}
          onSaveQuotation={handleSaveQuotation}
        />
      </main>

      {/* Google Sheets Integration Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        quotation={quotation}
        user={user}
        accessToken={accessToken}
        onAuthSuccess={(u, t) => {
          setUser(u);
          setAccessToken(t);
        }}
      />

      {/* History Modal with reprint and PDF download */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        currentCorrelative={quotation.correlativeNumber}
        onLoadQuotation={handleLoadQuotation}
        onDuplicateQuotation={handleDuplicateQuotation}
        onDeleteHistoryItem={handleDeleteHistoryItem}
        onPrintQuotation={handlePrintSpecificQuotation}
        onExportPdfQuotation={handleExportPdfSpecificQuotation}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 no-print animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'info'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-200" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-amber-300" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
