import { Career, Room } from './types';

export const APP_NAME = "SIGHA - Ramon Copaja";
export const INSTITUTION_NAME = "Instituto de Educación Superior Tecnológico Público “Ramon Copaja”";
export const INSTITUTION_ADDRESS = "Fundo Umute kl 02 carretera Tarata-Tacna";

// Added Saturday to accommodate the requirement of 110 hours/semester (~7 hours/week per course).
// 5 courses * 7 hours = 35 hours total needed per week.
// Mon-Sat (6 days * 6 slots) = 36 slots available. Perfect fit.
export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// 45 min per pedagogical hour.
// Start: 8:00 AM
// Break: 11:00 - 11:15 (15 mins)
// End Class: 12:45 (6 slots of 45 mins fit perfectly: 4 before break, 2 after)
// 08:00 - 11:00 (180 mins = 4 * 45)
// 11:00 - 11:15 Break
// 11:15 - 12:45 (90 mins = 2 * 45)
export const TIME_SLOTS = [
  "08:00 - 08:45", // Hora 1
  "08:45 - 09:30", // Hora 2
  "09:30 - 10:15", // Hora 3
  "10:15 - 11:00", // Hora 4
  // RECREO 11:00 - 11:15
  "11:15 - 12:00", // Hora 5
  "12:00 - 12:45"  // Hora 6
];

export const CAREERS: Career[] = [
  { id: 'apsti', name: 'APSTI', semesters: [1, 3, 5] },
  { id: 'contabilidad', name: 'CONTABILIDAD', semesters: [1, 3, 5] }
];

// Defined: 4 Classrooms (Theory) and 3 Labs (Practice)
export const ROOMS: Room[] = [
  // Teoría
  { id: 't1', name: 'Aula 101 (Teoría)', type: 'classroom', capacity: 30 },
  { id: 't2', name: 'Aula 102 (Teoría)', type: 'classroom', capacity: 30 },
  { id: 't3', name: 'Aula 103 (Teoría)', type: 'classroom', capacity: 30 },
  { id: 't4', name: 'Aula 104 (Teoría)', type: 'classroom', capacity: 30 },
  // Práctica
  { id: 'l1', name: 'Lab Computación 1', type: 'lab', capacity: 25 }, // Para APSTI fuerte
  { id: 'l2', name: 'Lab Computación 2', type: 'lab', capacity: 25 }, // Para APSTI fuerte
  { id: 'l3', name: 'Lab Contabilidad', type: 'lab', capacity: 25 }, // Para Contabilidad (Software contable)
];