

import React, { useMemo, useRef } from 'react';
import { ScheduleBlock, User } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { Printer, Download, Filter, Coffee } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScheduleViewProps {
  schedule: ScheduleBlock[];
  user: User;
  readOnly?: boolean;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, user }) => {
  const [filterCareer, setFilterCareer] = React.useState<string>(user.role === 'user' ? (user.career || 'all') : 'all');
  const [filterSemester, setFilterSemester] = React.useState<string>(user.role === 'user' ? (user.semester?.toString() || 'all') : 'all');

  const filteredSchedule = useMemo(() => {
    return schedule.filter(block => {
      if (filterCareer !== 'all' && block.careerName !== filterCareer) return false;
      if (filterSemester !== 'all' && block.semester.toString() !== filterSemester) return false;
      return true;
    });
  }, [schedule, filterCareer, filterSemester]);

  const getBlockForSlot = (day: string, timeSlot: string) => {
    const start = timeSlot.split(' - ')[0];
    return filteredSchedule.find(b => b.day === day && b.startTime === start);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('l'); // Landscape for better fit with 6 days
    doc.text(`Horario Académico - ${filterCareer} Semestre ${filterSemester}`, 14, 15);
    
    // Construct table body with Break
    const tableBody: string[][] = [];
    
    TIME_SLOTS.forEach((slot, index) => {
      const row: string[] = [slot];
      DAYS_OF_WEEK.forEach(day => {
        const block = getBlockForSlot(day, slot);
        row.push(block ? `${block.courseName}\n(${block.roomName})` : '-');
      });
      tableBody.push(row);

      // Insert Break in PDF after 4th slot (10:15-11:00)
      if (index === 3) {
        // Create a row with RECREO repeated for each day column
        const breakRow = ['11:00 - 11:15', ...Array(DAYS_OF_WEEK.length).fill('RECREO')];
        tableBody.push(breakRow);
      }
    });

    autoTable(doc, {
      head: [['Hora', ...DAYS_OF_WEEK]],
      body: tableBody,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      theme: 'grid',
      didParseCell: (data) => {
        if (data.row.raw[0] === '11:00 - 11:15') {
            data.cell.styles.fillColor = [241, 245, 249]; // slate-100
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
        }
      }
    });

    doc.save('horario.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border border-slate-200 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filtros:</span>
          </div>
          
          <select 
            className="form-select text-sm border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
            value={filterCareer}
            onChange={(e) => setFilterCareer(e.target.value)}
            disabled={user.role === 'user'}
          >
            <option value="all">Todas las Carreras</option>
            <option value="APSTI">APSTI</option>
            <option value="CONTABILIDAD">CONTABILIDAD</option>
          </select>

          <select 
            className="form-select text-sm border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            disabled={user.role === 'user'}
          >
            <option value="all">Todos los Semestres</option>
            <option value="1">Semestre 1</option>
            <option value="3">Semestre 3</option>
            <option value="5">Semestre 5</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            <Printer size={16} />
            Imprimir
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 border border-transparent rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            <Download size={16} />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32 sticky left-0 bg-slate-50 z-10">
                  Hora
                </th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[180px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {TIME_SLOTS.map((slot, index) => (
                <React.Fragment key={slot}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {slot}
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const block = getBlockForSlot(day, slot);
                      // Determine visual style based on actual ROOM ASSIGNMENT, not just course type
                      const isLab = block?.roomName.toLowerCase().includes('lab');
                      
                      return (
                        <td key={`${day}-${slot}`} className="px-2 py-2 align-top h-24">
                          {block ? (
                            <div className={`
                              h-full w-full rounded-md p-2 text-xs border-l-4 shadow-sm flex flex-col justify-between
                              ${isLab ? 'bg-indigo-50 border-indigo-500 text-indigo-900' : 'bg-emerald-50 border-emerald-500 text-emerald-900'}
                            `}>
                              <div>
                                <p className="font-bold line-clamp-2">{block.courseName}</p>
                                <p className="opacity-75">{block.roomName}</p>
                              </div>
                              <div className="mt-1 pt-1 border-t border-black/10 flex justify-between items-center">
                                <span className="uppercase tracking-tighter text-[10px] font-semibold">{block.careerName} {block.semester}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/50`}>
                                  {isLab ? 'P' : 'T'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full w-full rounded-md border-2 border-dashed border-slate-100" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  {/* Break Row after 4th slot (10:15-11:00) */}
                  {index === 3 && (
                    <tr className="bg-slate-100 border-y border-slate-200">
                      <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-slate-600 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                        11:00 - 11:15
                      </td>
                      <td colSpan={DAYS_OF_WEEK.length} className="px-6 py-3 text-center">
                         <div className="flex items-center justify-center gap-2 text-slate-400 font-bold tracking-[0.2em] text-sm">
                            <Coffee size={18} />
                            RECREO
                         </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};