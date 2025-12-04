

import { ScheduleBlock, Career, Room, Course } from '../types';
import { CAREERS, ROOMS, TIME_SLOTS, DAYS_OF_WEEK } from '../constants';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// --- DEFAULT DATA (FALLBACK) ---
const DEFAULT_COURSES: Course[] = [
  // APSTI 1
  { careerId: 'apsti', semester: 1, name: 'Fundamentos de Programación', type: 'hibrido', totalHours: 110 },
  { careerId: 'apsti', semester: 1, name: 'Arquitectura de Computadoras', type: 'hibrido', totalHours: 110 },
  { careerId: 'apsti', semester: 1, name: 'Herramientas Multimedia', type: 'practica', totalHours: 110 },
  { careerId: 'apsti', semester: 1, name: 'Matemática Aplicada', type: 'teoria', totalHours: 110 },
  { careerId: 'apsti', semester: 1, name: 'Comunicación Efectiva', type: 'teoria', totalHours: 110 },
  // APSTI 3
  { careerId: 'apsti', semester: 3, name: 'Estructura de Datos', type: 'practica', totalHours: 110 },
  { careerId: 'apsti', semester: 3, name: 'Análisis y Diseño de Sistemas', type: 'teoria', totalHours: 110 },
  { careerId: 'apsti', semester: 3, name: 'Base de Datos II', type: 'hibrido', totalHours: 110 },
  { careerId: 'apsti', semester: 3, name: 'Investigación e Innovación', type: 'teoria', totalHours: 110 },
  { careerId: 'apsti', semester: 3, name: 'Inglés Técnico', type: 'teoria', totalHours: 110 },
  // APSTI 5
  { careerId: 'apsti', semester: 5, name: 'Desarrollo de Software Móvil', type: 'practica', totalHours: 110 },
  { careerId: 'apsti', semester: 5, name: 'Inteligencia de Negocios', type: 'hibrido', totalHours: 110 },
  { careerId: 'apsti', semester: 5, name: 'Seguridad Informática', type: 'hibrido', totalHours: 110 },
  { careerId: 'apsti', semester: 5, name: 'Gestión de Proyectos TI', type: 'teoria', totalHours: 110 },
  { careerId: 'apsti', semester: 5, name: 'Ética Profesional', type: 'teoria', totalHours: 110 },
  // CONTABILIDAD 1
  { careerId: 'contabilidad', semester: 1, name: 'Contabilidad General I', type: 'hibrido', totalHours: 110 },
  { careerId: 'contabilidad', semester: 1, name: 'Documentación Comercial', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 1, name: 'Legislación Tributaria', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 1, name: 'Informática Contable I', type: 'practica', totalHours: 110 },
  { careerId: 'contabilidad', semester: 1, name: 'Técnicas de Comunicación', type: 'teoria', totalHours: 110 },
  // CONTABILIDAD 3
  { careerId: 'contabilidad', semester: 3, name: 'Contabilidad de Costos', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 3, name: 'Técnica Presupuestal', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 3, name: 'Software Contable I', type: 'practica', totalHours: 110 },
  { careerId: 'contabilidad', semester: 3, name: 'Estadística General', type: 'hibrido', totalHours: 110 },
  { careerId: 'contabilidad', semester: 3, name: 'Legislación Laboral', type: 'teoria', totalHours: 110 },
  // CONTABILIDAD 5
  { careerId: 'contabilidad', semester: 5, name: 'Auditoría Financiera', type: 'hibrido', totalHours: 110 },
  { careerId: 'contabilidad', semester: 5, name: 'Contabilidad Gubernamental', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 5, name: 'Análisis de Estados Financieros', type: 'teoria', totalHours: 110 },
  { careerId: 'contabilidad', semester: 5, name: 'Aplicaciones Informáticas II', type: 'practica', totalHours: 110 },
  { careerId: 'contabilidad', semester: 5, name: 'Formulación de Proyectos', type: 'teoria', totalHours: 110 }
];

// --- COURSE MANAGEMENT (FIRESTORE) ---

export const getCourses = async (): Promise<Course[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "courses"));
    if (querySnapshot.empty) return [];
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Course));
  } catch (error) {
    console.error("Error getting courses:", error);
    return [];
  }
};

export const seedDefaultCourses = async () => {
  try {
    const existing = await getCourses();
    if (existing.length > 0) return; // Don't overwrite

    const batch = writeBatch(db);
    DEFAULT_COURSES.forEach(course => {
      const docRef = doc(collection(db, "courses"));
      batch.set(docRef, course);
    });
    await batch.commit();
    console.log("Seeded default courses");
  } catch (error) {
    console.error("Error seeding courses:", error);
  }
};

export const addCourse = async (course: Course) => {
  await addDoc(collection(db, "courses"), {
    name: course.name,
    type: course.type,
    careerId: course.careerId,
    semester: course.semester,
    totalHours: course.totalHours || 110
  });
};

export const updateCourse = async (id: string, course: Partial<Course>) => {
  const courseRef = doc(db, "courses", id);
  await updateDoc(courseRef, { ...course });
};

export const deleteCourse = async (id: string) => {
  await deleteDoc(doc(db, "courses", id));
};

// --- SCHEDULE LOGIC ---

// Helper to filter courses from a provided list
const getCoursesForGroupFromList = (allCourses: Course[], careerId: string, semester: number) => {
  return allCourses.filter(c => c.careerId === careerId && c.semester === semester);
};

// --- FIRESTORE INTEGRATION (SCHEDULES) ---

export const saveScheduleToFirebase = async (schedule: ScheduleBlock[]) => {
  try {
    await setDoc(doc(db, "schedules", "current"), {
      blocks: schedule,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error saving schedule to Firebase:", error);
    throw error;
  }
};

export const loadScheduleFromFirebase = async (): Promise<ScheduleBlock[] | null> => {
  try {
    const docRef = doc(db, "schedules", "current");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.blocks as ScheduleBlock[];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading schedule from Firebase:", error);
    return null;
  }
};

// --- GENERATOR LOGIC ---

export const generateMockSchedule = (dynamicCourses: Course[] = []): ScheduleBlock[] => {
  const schedule: ScheduleBlock[] = [];
  let blockIdCounter = 1;

  // Use dynamic courses if available, otherwise default
  const sourceCourses = dynamicCourses.length > 0 ? dynamicCourses : DEFAULT_COURSES;

  // Track room usage: "DayIndex-SlotIndex" -> Set of RoomIDs used
  const occupiedRooms = new Map<string, Set<string>>();

  // Helper to check if room is free
  const isRoomFree = (dayIdx: number, slotIdx: number, roomId: string) => {
    const key = `${dayIdx}-${slotIdx}`;
    if (!occupiedRooms.has(key)) return true;
    return !occupiedRooms.get(key)!.has(roomId);
  };

  // Helper to mark room as used
  const bookRoom = (dayIdx: number, slotIdx: number, roomId: string) => {
    const key = `${dayIdx}-${slotIdx}`;
    if (!occupiedRooms.has(key)) occupiedRooms.set(key, new Set());
    occupiedRooms.get(key)!.add(roomId);
  };

  // Helper to find what room was used by this group in the previous slot
  const getPreviousRoomForGroup = (day: string, prevStartTime: string, careerName: string, semester: number): string | null => {
    const block = schedule.find(b => 
      b.day === day && 
      b.startTime === prevStartTime &&
      b.careerName === careerName &&
      b.semester === semester
    );
    if (!block) return null;
    const room = ROOMS.find(r => r.name === block.roomName);
    return room ? room.id : null;
  };

  // Prepare Groups with Target Hours
  // We calculate needed weekly hours based on totalHours / 16 weeks
  interface CourseWithProgress extends Course {
    targetWeeklyHours: number;
    assignedHours: number;
  }

  const groups: {
    careerId: string;
    careerName: string;
    semester: number;
    courses: CourseWithProgress[];
  }[] = [];

  CAREERS.forEach(career => {
    career.semesters.forEach(sem => {
      const groupCourses = getCoursesForGroupFromList(sourceCourses, career.id, sem);
      if (groupCourses.length > 0) {
        groups.push({
          careerId: career.id,
          careerName: career.name,
          semester: sem,
          courses: groupCourses.map(c => ({
            ...c,
            // Calculate weekly hours needed. Default 110 -> ~7 hours/week
            targetWeeklyHours: Math.ceil((c.totalHours || 110) / 16),
            assignedHours: 0
          }))
        });
      }
    });
  });

  // Schedule Logic
  DAYS_OF_WEEK.forEach((day, dayIdx) => {
    TIME_SLOTS.forEach((time, slotIdx) => {
      
      const startTime = time.split(' - ')[0];
      const endTime = time.split(' - ')[1];

      groups.forEach((group, groupIdx) => {
        // Filter courses that still need hours
        const activeCourses = group.courses.filter(c => c.assignedHours < c.targetWeeklyHours);
        
        if (activeCourses.length === 0) return; // This group is done for the week

        // Simple Rotation Logic based on day and block, but respecting availability
        // Block index (0, 1, 2) for 6 slots
        const blockIndex = Math.floor(slotIdx / 2);
        
        // Find a course for this slot
        // We offset by dayIdx and blockIndex to rotate, but we must pick from activeCourses
        const courseIndex = (dayIdx * 3 + blockIndex + groupIdx) % activeCourses.length;
        const course = activeCourses[courseIndex];
          
        let assigned = false;
        
        // 1. Check Continuity (Previous Slot same Day) - Try to keep same course for 2 hours
        if (slotIdx > 0) {
          const prevSlotStart = TIME_SLOTS[slotIdx - 1].split(' - ')[0];
          const prevBlock = schedule.find(b => b.day === day && b.startTime === prevSlotStart && b.careerName === group.careerName && b.semester === group.semester);

          if (prevBlock) {
             // Find the specific course object for the previous block
             const prevCourseObj = group.courses.find(c => c.name === prevBlock.courseName);
             
             // Only continue if it's the same course AND it still needs hours
             if (prevCourseObj && prevCourseObj.name === course.name && prevCourseObj.assignedHours < prevCourseObj.targetWeeklyHours) {
                
                const prevRoomId = getPreviousRoomForGroup(day, prevSlotStart, group.careerName, group.semester);
                
                if (prevRoomId && isRoomFree(dayIdx, slotIdx, prevRoomId)) {
                   const roomObj = ROOMS.find(r => r.id === prevRoomId);
                   if (roomObj) {
                     bookRoom(dayIdx, slotIdx, prevRoomId);
                     schedule.push({
                       id: `blk-${blockIdCounter++}`,
                       day: day,
                       startTime,
                       endTime,
                       courseId: course.id || `${group.careerId}-${group.semester}-${course.name}`,
                       courseName: course.name,
                       type: course.type,
                       roomName: roomObj.name,
                       careerName: group.careerName,
                       semester: group.semester
                     });
                     course.assignedHours++;
                     assigned = true;
                   }
                }
             }
          }
        }

        // 2. New Allocation (Start of day or Start of new 2h block or failed continuity)
        if (!assigned) {
           let requiredRoomType: 'classroom' | 'lab';

           if (course.type === 'teoria') {
             requiredRoomType = 'classroom';
           } else if (course.type === 'practica') {
             requiredRoomType = 'lab';
           } else {
             // HYBRID LOGIC: Balance existing assignments for this course
             const existingBlocks = schedule.filter(b => b.courseName === course.name);
             const labCount = existingBlocks.filter(b => b.roomName.toLowerCase().includes('lab')).length;
             const theoryCount = existingBlocks.filter(b => !b.roomName.toLowerCase().includes('lab')).length;

             if (labCount <= theoryCount) {
               requiredRoomType = 'lab';
             } else {
               requiredRoomType = 'classroom';
             }
           }
           
           // Find available rooms
           let availableRooms = ROOMS.filter(r => 
             r.type === requiredRoomType && isRoomFree(dayIdx, slotIdx, r.id)
           );

           // Fallback for Hybrid if preferred type is full
           if (availableRooms.length === 0 && course.type === 'hibrido') {
              const fallbackType = requiredRoomType === 'lab' ? 'classroom' : 'lab';
              availableRooms = ROOMS.filter(r => 
                r.type === fallbackType && isRoomFree(dayIdx, slotIdx, r.id)
              );
           }

           if (availableRooms.length > 0) {
             // Heuristic: Prefer rooms matching semester if possible to group students
             let selectedRoom = availableRooms.find(r => r.id.endsWith(group.semester.toString()));
             if (!selectedRoom) selectedRoom = availableRooms[0];

             bookRoom(dayIdx, slotIdx, selectedRoom.id);
             
             schedule.push({
               id: `blk-${blockIdCounter++}`,
               day: day,
               startTime,
               endTime,
               courseId: course.id || `${group.careerId}-${group.semester}-${course.name}`,
               courseName: course.name,
               type: course.type,
               roomName: selectedRoom.name,
               careerName: group.careerName,
               semester: group.semester
             });
             course.assignedHours++;
           } 
        }

      });
    });
  });

  return schedule;
};

export const getMetrics = (schedule: ScheduleBlock[]) => {
  const totalHours = schedule.length;
  
  // Count hours per room
  const assignmentsByRoom = schedule.reduce((acc, curr) => {
    acc[curr.roomName] = (acc[curr.roomName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count hours per career
  const assignmentsByCareer = schedule.reduce((acc, curr) => {
    acc[curr.careerName] = (acc[curr.careerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { totalHours, assignmentsByRoom, assignmentsByCareer };
};