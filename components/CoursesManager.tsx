

import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { getCourses, addCourse, updateCourse, deleteCourse, seedDefaultCourses } from '../services/scheduleService';
import { CAREERS } from '../constants';
import { Edit2, Trash2, Plus, BookOpen, Clock } from 'lucide-react';

export const CoursesManager: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedCareer, setSelectedCareer] = useState('apsti');
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'teoria' | 'practica' | 'hibrido'>('teoria');
  const [formTotalHours, setFormTotalHours] = useState<number>(110);

  const loadData = async () => {
    setLoading(true);
    const data = await getCourses();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    if (confirm("¿Estás seguro? Esto cargará los cursos por defecto si la base de datos está vacía.")) {
        await seedDefaultCourses();
        loadData();
    }
  };

  const filteredCourses = courses.filter(
    c => c.careerId === selectedCareer && c.semester === selectedSemester
  );

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormName(course.name);
      setFormType(course.type);
      setFormTotalHours(course.totalHours || 110);
    } else {
      setEditingCourse(null);
      setFormName('');
      setFormType('teoria');
      setFormTotalHours(110);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        name: formName,
        type: formType,
        totalHours: Number(formTotalHours)
      };

      if (editingCourse && editingCourse.id) {
        // Update
        await updateCourse(editingCourse.id, courseData);
      } else {
        // Create
        await addCourse({
          ...courseData,
          careerId: selectedCareer,
          semester: selectedSemester
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar el curso");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este curso? Esto puede afectar la generación de horarios.")) {
      await deleteCourse(id);
      loadData();
    }
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'practica':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Práctica (Lab)</span>;
      case 'hibrido':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Híbrido (Mix)</span>;
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">Teoría (Aula)</span>;
    }
  };

  // Calculate weekly hours (16 weeks semester)
  const calculateWeeklyHours = (total: number) => {
    return (total / 16).toFixed(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div>
           <h2 className="text-lg font-bold text-slate-800">Malla Curricular</h2>
           <p className="text-sm text-slate-500">Administra los cursos asignados a cada ciclo y sus cargas horarias.</p>
        </div>
        <div className="flex gap-2">
            {courses.length === 0 && !loading && (
                <button 
                  onClick={handleSeed}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200"
                >
                  Inicializar Datos por Defecto
                </button>
            )}
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700"
            >
              <Plus size={16} />
              Agregar Curso
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 p-4 bg-slate-100 rounded-lg">
        <div className="w-1/2">
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carrera</label>
           <select 
              value={selectedCareer} 
              onChange={(e) => setSelectedCareer(e.target.value)}
              className="w-full form-select rounded-md border-slate-300"
           >
              {CAREERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
           </select>
        </div>
        <div className="w-1/2">
           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semestre</label>
           <select 
              value={selectedSemester} 
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full form-select rounded-md border-slate-300"
           >
              <option value={1}>Semestre I</option>
              <option value={3}>Semestre III</option>
              <option value={5}>Semestre V</option>
           </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando cursos...</div>
        ) : filteredCourses.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p>No hay cursos registrados para este semestre.</p>
            </div>
        ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre del Curso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo (Ambiente)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Carga Horaria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {course.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {getTypeBadge(course.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span>{course.totalHours || 110}h Total</span>
                        <span className="text-xs text-slate-400">
                          (~{calculateWeeklyHours(course.totalHours || 110)}h/sem)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleOpenModal(course)}
                        className="text-brand-600 hover:text-brand-900 mr-4"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => course.id && handleDelete(course.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">
               {editingCourse ? 'Editar Curso' : 'Agregar Nuevo Curso'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
               {editingCourse ? 'Modificando curso existente.' : `Agregando a ${selectedCareer.toUpperCase()} - Semestre ${selectedSemester}`}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre del Curso</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Tipo de Enseñanza</label>
                    <select 
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    >
                       <option value="teoria">Teoría (Solo Aula)</option>
                       <option value="practica">Práctica (Solo Laboratorio)</option>
                       <option value="hibrido">Híbrido (Mix)</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Horas Semestrales</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={formTotalHours}
                      onChange={(e) => setFormTotalHours(Number(e.target.value))}
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    />
                 </div>
               </div>
               
               <div className="bg-slate-50 p-3 rounded text-xs text-slate-500">
                  <p><strong>Cálculo Automático:</strong></p>
                  <p>{formTotalHours} horas / 16 semanas = <strong>{calculateWeeklyHours(formTotalHours)} horas semanales</strong></p>
                  {formType === 'hibrido' && <p className="mt-1 text-purple-600">El sistema balanceará estas horas entre aulas y laboratorios.</p>}
               </div>

               <div className="flex gap-3 pt-4 border-t mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-4 py-2 text-white bg-brand-600 rounded-md hover:bg-brand-700"
                  >
                    Guardar
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};