
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateMockSchedule, getCourses } from '../services/scheduleService';
import { ScheduleBlock } from '../types';

interface ScheduleGeneratorProps {
  onScheduleGenerated: (schedule: ScheduleBlock[]) => void;
}

export const ScheduleGenerator: React.FC<ScheduleGeneratorProps> = ({ onScheduleGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus('idle');
    
    try {
      // 1. Fetch current course configuration from DB
      const currentCourses = await getCourses();
      
      // 2. Generate schedule using these courses
      // (Artificial delay to simulate calculation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newSchedule = generateMockSchedule(currentCourses);
      onScheduleGenerated(newSchedule);
      setStatus('success');
    } catch (e) {
      console.error(e);
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center max-w-2xl mx-auto mt-10">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
          <RefreshCw size={32} className={isGenerating ? "animate-spin" : ""} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Generador de Horarios Automático</h2>
        <p className="text-slate-500 mt-2">
          El sistema utilizará los cursos configurados en el módulo "Gestión de Cursos" y optimizará la asignación de aulas.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center justify-center gap-2">
          <CheckCircle size={20} />
          <span>Horarios generados y optimizados correctamente.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center justify-center gap-2">
          <AlertTriangle size={20} />
          <span>Hubo un error al generar los horarios. Intente nuevamente.</span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="
          inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all w-full sm:w-auto
        "
      >
        {isGenerating ? 'Generando...' : 'Iniciar Generación de Horarios'}
      </button>
      
      <p className="mt-4 text-xs text-slate-400">
        Esta acción reemplazará los horarios actuales. Se recomienda exportar un backup antes de proceder.
      </p>
    </div>
  );
};
