

export type UserRole = 'admin' | 'user';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  career?: string; // For students
  semester?: number; // For students
}

export interface Course {
  id?: string; // Firestore ID
  name: string;
  type: 'teoria' | 'practica' | 'hibrido';
  careerId: string;
  semester: number;
  totalHours: number; // New field: Total hours per semester (e.g., 110)
}

export interface Career {
  id: string;
  name: string;
  semesters: number[];
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab';
  capacity: number;
}

export interface ScheduleBlock {
  id: string;
  day: string; // Lunes, Martes, etc.
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  courseId: string;
  courseName: string;
  roomName: string;
  careerName: string;
  semester: number;
  type: 'teoria' | 'practica' | 'hibrido';
}

export interface AppState {
  user: User | null;
  loading: boolean;
}