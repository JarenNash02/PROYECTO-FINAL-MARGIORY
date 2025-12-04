import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INSTITUTION_NAME, APP_NAME, INSTITUTION_ADDRESS, CAREERS } from '../constants';
import { Lock, LogIn, UserPlus, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [career, setCareer] = useState('APSTI');
  const [semester, setSemester] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 1. Create User in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Save detailed profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: fullName,
          role: role,
          career: role === 'user' ? career : null,
          semester: role === 'user' ? Number(semester) : null,
          createdAt: new Date().toISOString()
        });
      }
      // Auth state change triggers App.tsx logic automatically
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      
      // Translate Firebase errors to Spanish user-friendly messages
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError("Credenciales incorrectas. Verifique su correo y contraseña.");
          break;
        case 'auth/email-already-in-use':
          setError("Este correo electrónico ya está registrado. Intente iniciar sesión.");
          setMode('login'); // Auto-switch to login for convenience
          break;
        case 'auth/weak-password':
          setError("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
          break;
        case 'auth/too-many-requests':
          setError("Demasiados intentos fallidos. Por favor espere unos minutos.");
          break;
        case 'auth/network-request-failed':
          setError("Error de conexión. Verifique su internet.");
          break;
        default:
          setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTestUsers = async () => {
    if (!window.confirm("¿Desea generar/reparar usuarios de prueba?\n\nSi los usuarios ya existen, se actualizarán sus permisos.")) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const usersToCreate = [
      { email: "admin@sigha.com", pass: "123456", name: "Admin Principal", role: "admin" as const, career: null, sem: null },
      { email: "alumno.apsti@sigha.com", pass: "123456", name: "Juan APSTI", role: "user" as const, career: "APSTI", sem: 3 },
      { email: "alumno.conta@sigha.com", pass: "123456", name: "Maria Contabilidad", role: "user" as const, career: "CONTABILIDAD", sem: 1 }
    ];

    try {
      let createdCount = 0;
      let updatedCount = 0;

      for (const u of usersToCreate) {
        let uid = '';
        
        try {
          // Attempt to create user
          const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
          uid = cred.user.uid;
          createdCount++;
        } catch (e: any) {
          // If error is NOT "email already in use", log it and stop/skip
          if (e.code === 'auth/operation-not-allowed') {
            throw new Error("PROVIDER_DISABLED");
          }
          
          if (e.code === 'auth/email-already-in-use') {
            // User exists in Auth, but we might need to repair Firestore data.
            // We need to sign in to get the UID (or catch it if we can't). 
            // NOTE: We can't get UID easily without signing in if we don't have it.
            // For a test generator, we will try to Sign In to get the UID to repair the DB.
            try {
              const loginCred = await signInWithEmailAndPassword(auth, u.email, u.pass);
              uid = loginCred.user.uid;
              updatedCount++;
            } catch (loginErr) {
              console.warn(`No se pudo acceder a ${u.email} para actualizar datos. Contraseña incorrecta?`);
              continue; // Skip updating this user
            }
          } else {
            console.error(`Failed to create ${u.email}`, e);
            continue;
          }
        }

        // If we have a UID (either new or existing), ensure Firestore data is correct
        if (uid) {
          await setDoc(doc(db, "users", uid), {
            uid: uid,
            email: u.email,
            displayName: u.name,
            role: u.role,
            career: u.career,
            semester: u.sem,
            updatedAt: new Date().toISOString()
          }, { merge: true }); // Merge ensures we don't overwrite unrelated fields if any
        }
      }
      
      // Sign out to leave clean state
      await signOut(auth);
      
      setSuccessMsg(`✅ Proceso finalizado.\n${createdCount} creados, ${updatedCount} actualizados.\n\nUse: admin@sigha.com / 123456`);
      
      // Auto-fill login
      setEmail("admin@sigha.com");
      setPassword("123456");
      setMode('login');

    } catch (err: any) {
      if (err.message === 'PROVIDER_DISABLED') {
        setError("⚠️ ERROR CRÍTICO: Debe habilitar 'Email/Password' en la consola de Firebase > Authentication.");
      } else {
        setError("Error generando usuarios: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-brand-600 px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{APP_NAME}</h1>
          <p className="text-brand-100 text-sm">{INSTITUTION_NAME}</p>
        </div>
        
        <div className="px-8 py-10">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-slate-800">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Nueva'}
            </h2>
            <p className="text-slate-500 mt-2 text-xs">
              {mode === 'login' 
                ? 'Ingrese sus credenciales registradas' 
                : 'Complete el formulario para registrarse en el sistema'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Register: Full Name */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@iestp.edu.pe"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            {/* Register: Role Selection */}
            {mode === 'register' && (
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-3">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Usuario</label>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="user">Estudiante / Docente</option>
                      <option value="admin">Administrador (Gestión)</option>
                    </select>
                 </div>

                 {role === 'user' && (
                   <div className="grid grid-cols-2 gap-3">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Carrera</label>
                        <select 
                          value={career} 
                          onChange={(e) => setCareer(e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md"
                        >
                          {CAREERS.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Semestre</label>
                        <select 
                          value={semester} 
                          onChange={(e) => setSemester(Number(e.target.value))}
                          className="w-full px-2 py-2 text-sm border border-slate-300 rounded-md"
                        >
                          <option value={1}>I</option>
                          <option value={3}>III</option>
                          <option value={5}>V</option>
                        </select>
                     </div>
                   </div>
                 )}
              </div>
            )}

            {error && (
              <div className="text-red-500 text-xs p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
                 <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                 <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-green-600 text-xs p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-2 whitespace-pre-line">
                 <CheckCircle size={16} className="mt-0.5 shrink-0" />
                 <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <span className="animate-pulse">Procesando...</span>
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === 'login' ? 'Ingresar al Sistema' : 'Registrar Cuenta'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
             <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-brand-600 hover:text-brand-800 font-medium"
             >
               {mode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
             </button>
          </div>
          
          {/* Test User Generator Button */}
          <div className="mt-8 pt-6 border-t border-slate-100">
             <button
                type="button"
                onClick={handleGenerateTestUsers}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
             >
               <Database size={16} />
               Generar Usuarios de Prueba (Demo)
             </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              {INSTITUTION_ADDRESS}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              © {new Date().getFullYear()} IESTP Ramon Copaja
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};