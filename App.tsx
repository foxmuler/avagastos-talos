
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Movement, Settings, View, AppError, MovementOrigin } from './types';
import * as db from './services/db';
import { processReceiptImage, OCRResult } from './services/ocrService';
import CircularProgress from './components/CircularProgress';
import Modal from './components/Modal';
import { APP_VERSION, PlusIcon, HistoryIcon, SettingsIcon, HomeIcon, CameraIcon, TALOS_LOGO_BASE64 } from './constants';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [settings, setSettings] = useState<Settings | null>(null);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [allMovements, setAllMovements] = useState<Movement[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<AppError | null>(null);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [movementToDelete, setMovementToDelete] = useState<number | null>(null);

    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            const loadedSettings = await db.getSettings();
            setSettings(loadedSettings);

            // Monthly Reset Logic
            const latestMovement = await db.getLatestMovement();
            const lastMonth = latestMovement?.mesAño || '1970-01';
            
            if (currentMonth > lastMonth) {
                // This logic implies a new month has started. The balance calculation inherently resets.
                console.log(`New month detected. Previous: ${lastMonth}, Current: ${currentMonth}`);
            }

            const monthlyMovements = await db.getMovementsByMonth(currentMonth);
            const allMovementsData = await db.getAllMovements();
            setMovements(monthlyMovements);
            setAllMovements(allMovementsData);
        } catch (e) {
            setError({ code: 'E-STOR-01', message: 'Error al acceder al almacenamiento local.' });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const { totalSpent, remaining, percentage } = useMemo(() => {
        const totalSpent = movements.reduce((sum, m) => sum + m.importe, 0);
        const initial = settings?.inicialMensual ?? 0;
        const remaining = initial - totalSpent;
        const percentage = initial > 0 ? Math.max(0, Math.min(100, (remaining / initial) * 100)) : 0;
        return { totalSpent, remaining, percentage };
    }, [movements, settings]);
    
    const handleAddOrUpdateMovement = async (data: { amount: number, description: string, origin: MovementOrigin, confidence?: number }) => {
        const movementData = {
            fechaISO: new Date().toISOString(),
            mesAño: currentMonth,
            importe: data.amount,
            descripcion: data.description,
            origen: data.origin,
            ocrConfianza: data.confidence,
        };

        try {
            if (editingMovement) {
                await db.updateMovement({ ...editingMovement, ...movementData, importe: data.amount, descripcion: data.description });
            } else {
                await db.addMovement(movementData);
            }
            closeAddModal();
            await loadData();
        } catch (e) {
            setError({ code: 'E-STOR-01', message: 'Error al acceder al almacenamiento local.'});
        }
    };
    
    const handleDeleteMovement = (id: number) => {
        setMovementToDelete(id);
        setConfirmModalOpen(true);
    };

    const closeConfirmModal = () => {
        setConfirmModalOpen(false);
        setMovementToDelete(null);
    };

    const confirmDelete = async () => {
        if (movementToDelete !== null) {
            try {
                await db.deleteMovement(movementToDelete);
                await loadData();
            } catch (e) {
                setError({ code: 'E-STOR-01', message: 'Error al acceder al almacenamiento local.'});
            } finally {
                closeConfirmModal();
            }
        }
    };

    const handleUpdateSettings = async (newSettings: Omit<Settings, 'id'>) => {
        try {
            await db.updateSettings(newSettings);
            setSettings({ ...newSettings, id: 'default' });
            alert("Ajustes guardados.");
            setView('home');
        } catch (e) {
             setError({ code: 'E-STOR-01', message: 'Error al acceder al almacenamiento local.'});
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsOcrLoading(true);
            setOcrResult(null);
            try {
                const result = await processReceiptImage(file);
                setOcrResult(result);
            } catch (e) {
                setError({ code: 'E-OCR-01', message: 'El texto del ticket es ilegible o no se encontró un importe.' });
            } finally {
                setIsOcrLoading(false);
            }
        }
    };

    const openAddModal = (movement: Movement | null = null) => {
        setEditingMovement(movement);
        setOcrResult(null);
        setIsOcrLoading(false);
        setAddModalOpen(true);
    };

    const closeAddModal = () => {
        setAddModalOpen(false);
        setEditingMovement(null);
    };
    
    const renderHome = () => (
        <div className="flex flex-col items-center justify-start h-full text-center p-4 pt-8">
             <img src={TALOS_LOGO_BASE64} alt="Talos Logo" className="w-40 mb-6" />
             <h2 className="text-2xl font-light text-gray-400 mb-4">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
             <CircularProgress size={280} strokeWidth={20} percentage={percentage} color={remaining >= 0 ? '#22C55E' : '#EF4444'}>
                <span className="text-5xl font-bold tracking-tighter">{remaining.toFixed(2)}€</span>
                <span className="text-lg text-gray-400">restante</span>
             </CircularProgress>
             <div className="mt-8 text-lg text-gray-300">
                <p>Gastado este mes: <span className="font-semibold">{totalSpent.toFixed(2)}€</span></p>
                <p>Presupuesto inicial: <span className="font-semibold">{settings?.inicialMensual.toFixed(2)}€</span></p>
             </div>
        </div>
    );
    
    const renderHistory = () => {
        const groupedMovements = allMovements.reduce((acc, mov) => {
            (acc[mov.mesAño] = acc[mov.mesAño] || []).push(mov);
            return acc;
        }, {} as Record<string, Movement[]>);

        const sortedMonths = Object.keys(groupedMovements).sort().reverse();

        return (
            <div className="p-4 text-white">
                <h1 className="text-3xl font-bold mb-4">Historial de Gastos</h1>
                {sortedMonths.length === 0 ? <p className="text-gray-400">No hay gastos registrados.</p> : sortedMonths.map(month => (
                    <div key={month} className="mb-6">
                         <h2 className="text-xl font-semibold border-b border-gray-700 pb-2 mb-2">{new Date(`${month}-02`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h2>
                         <ul className="space-y-2">
                             {groupedMovements[month].sort((a,b) => new Date(b.fechaISO).getTime() - new Date(a.fechaISO).getTime()).map(mov => (
                                <li key={mov.id} className="bg-[#1c1c24] p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{mov.importe.toFixed(2)}€ <span className="text-xs font-normal text-gray-400 ml-2">{mov.origen}</span></p>
                                        <p className="text-sm text-gray-300">{mov.descripcion || "Sin descripción"}</p>
                                        <p className="text-xs text-gray-500">{new Date(mov.fechaISO).toLocaleString('es-ES')}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button onClick={() => openAddModal(mov)} className="text-blue-400 hover:text-blue-300">Editar</button>
                                        <button onClick={() => handleDeleteMovement(mov.id)} className="text-red-400 hover:text-red-300">Borrar</button>
                                    </div>
                                </li>
                             ))}
                         </ul>
                    </div>
                ))}
            </div>
        );
    };

    const SettingsForm: React.FC<{ s: Settings, onSave: (data: Omit<Settings, 'id'>) => void }> = ({ s, onSave }) => {
        const [initial, setInitial] = useState(s.inicialMensual);
        const [threshold, setThreshold] = useState(s.ocrConfidenceThreshold);
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSave({ inicialMensual: initial, ocrConfidenceThreshold: threshold });
        };

        return (
             <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="initial" className="block mb-2 text-sm font-medium text-gray-300">Presupuesto Mensual Inicial (€)</label>
                    <input type="number" id="initial" value={initial} onChange={e => setInitial(parseFloat(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5" step="0.01" required />
                </div>
                <div>
                    <label htmlFor="threshold" className="block mb-2 text-sm font-medium text-gray-300">Umbral de Confianza OCR (%)</label>
                    <input type="number" id="threshold" value={threshold} onChange={e => setThreshold(parseInt(e.target.value, 10))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5" min="0" max="100" required />
                </div>
                <button type="submit" className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Guardar Cambios</button>
            </form>
        );
    };

    const renderSettings = () => (
         <div className="p-4 text-white">
            <h1 className="text-3xl font-bold mb-4">Ajustes</h1>
            {settings && <SettingsForm s={settings} onSave={handleUpdateSettings} />}
            <p className="text-center text-gray-500 mt-8">Avagastos Talos - Versión {APP_VERSION}</p>
        </div>
    );
    
    const AddExpenseForm: React.FC<{ onSubmit: (data: {amount: number, description: string, origin: MovementOrigin, confidence?: number}) => void; movement: Movement | null; }> = ({ onSubmit, movement }) => {
        const [amount, setAmount] = useState<number | ''>(movement?.importe ?? '');
        const [description, setDescription] = useState(movement?.descripcion ?? '');
        
        useEffect(() => {
            if (ocrResult && ocrResult.confidence >= (settings?.ocrConfidenceThreshold ?? 70)) {
                setAmount(ocrResult.amount);
            }
        }, [ocrResult, settings]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (typeof amount === 'number' && amount > 0) {
                 onSubmit({ amount, description, origin: ocrResult ? 'ocr' : 'manual', confidence: ocrResult?.confidence});
            } else {
                alert("El importe debe ser un número positivo.");
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="flex items-center justify-center p-4 bg-gray-800 rounded-lg">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center space-y-2 text-green-400 hover:text-green-300">
                        <CameraIcon className="w-10 h-10" />
                        <span>Escanear Ticket</span>
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>

                {isOcrLoading && <p className="text-center">Procesando imagen...</p>}

                {ocrResult && (
                    <div className={`p-3 rounded-lg text-center ${ocrResult.confidence >= (settings?.ocrConfidenceThreshold ?? 70) ? 'bg-green-900' : 'bg-red-900'}`}>
                        <p>Importe detectado: <strong>{ocrResult.amount.toFixed(2)}€</strong></p>
                        <p>Confianza: {ocrResult.confidence.toFixed(0)}%</p>
                        {ocrResult.confidence < (settings?.ocrConfidenceThreshold ?? 70) && <p className="text-sm mt-1">Confianza baja. Se recomienda introducir el importe manualmente o repetir la foto.</p>}
                    </div>
                )}

                <div>
                    <label htmlFor="amount" className="block mb-2 text-sm font-medium text-gray-300">Importe (€)</label>
                    <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5" step="0.01" required />
                </div>
                 <div>
                    <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-300">Descripción (Opcional)</label>
                    <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5" />
                </div>
                <button type="submit" className="w-full text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">{movement ? 'Actualizar' : 'Añadir'} Gasto</button>
            </form>
        )
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-screen text-white text-xl">Cargando...</div>;
    }
    
    return (
        <div className="bg-[#0B0B12] text-white min-h-screen font-sans flex flex-col">
            <main className="flex-grow overflow-y-auto relative pb-16">
                {view === 'home' && renderHome()}
                {view === 'history' && renderHistory()}
                {view === 'settings' && renderSettings()}
            </main>
            
            {view === 'home' && (
                 <button onClick={() => openAddModal()} className="fixed bottom-24 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform duration-200 hover:scale-110 z-40">
                    <PlusIcon className="w-8 h-8"/>
                 </button>
            )}

            <footer className="bg-[#101018] p-2 shadow-inner fixed bottom-0 w-full">
                <nav className="flex justify-around">
                    <button onClick={() => setView('home')} className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors w-1/3 ${view === 'home' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                        <HomeIcon className="w-6 h-6"/>
                        <span className="text-xs">Inicio</span>
                    </button>
                    <button onClick={() => setView('history')} className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors w-1/3 ${view === 'history' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                        <HistoryIcon className="w-6 h-6"/>
                        <span className="text-xs">Historial</span>
                    </button>
                    <button onClick={() => setView('settings')} className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors w-1/3 ${view === 'settings' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                        <SettingsIcon className="w-6 h-6"/>
                        <span className="text-xs">Ajustes</span>
                    </button>
                </nav>
            </footer>

            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title={editingMovement ? "Editar Gasto" : "Añadir Gasto"}>
                <AddExpenseForm onSubmit={handleAddOrUpdateMovement} movement={editingMovement} />
            </Modal>

            <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal} title="Confirmar Eliminación">
                <div className="text-center">
                    <p className="mb-6">¿Estás seguro de que quieres eliminar este gasto? Esta acción no se puede deshacer.</p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={closeConfirmModal}
                            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default App;