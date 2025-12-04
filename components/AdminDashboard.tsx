import React from 'react';
import { ScheduleBlock } from '../types';
import { getMetrics } from '../services/scheduleService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdminDashboardProps {
  schedule: ScheduleBlock[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ schedule }) => {
  const { totalHours, assignmentsByRoom, assignmentsByCareer } = getMetrics(schedule);

  const roomData = Object.entries(assignmentsByRoom).map(([name, count]) => ({ name, count }));
  const careerData = Object.entries(assignmentsByCareer).map(([name, count]) => ({ name, value: count }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Horas Asignadas</h3>
          <p className="mt-2 text-3xl font-extrabold text-brand-600">{totalHours}</p>
          <p className="text-xs text-slate-400 mt-1">En ciclo actual</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Ambientes</h3>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">{roomData.length}</p>
          <p className="text-xs text-slate-400 mt-1">Laboratorios y Aulas</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Carreras Activas</h3>
          <p className="mt-2 text-3xl font-extrabold text-indigo-600">{careerData.length}</p>
          <p className="text-xs text-slate-400 mt-1">Programas de Estudio</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Uso de Ambientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} name="Horas Asignadas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución por Carrera</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={careerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {careerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};