import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INSTITUTION_NAME, APP_NAME, INSTITUTION_ADDRESS, CAREERS } from '../constants';
import { LogIn, UserPlus, Database, CheckCircle, AlertTriangle, GraduationCap, ChevronRight } from 'lucide-react';
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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
      navigate('/');
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError("Credenciales incorrectas. Verifique su correo y contraseña.");
          break;
        case 'auth/email-already-in-use':
          setError("Este correo electrónico ya está registrado. Intente iniciar sesión.");
          setMode('login');
          break;
        case 'auth/weak-password':
          setError("La contraseña es muy débil. Debe tener al menos 6 caracteres.");
          break;
        default:
          setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTestUsers = async () => {
    if (!window.confirm("¿Desea generar/reparar usuarios de prueba?")) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    const usersToCreate = [
      { email: "admin@sigha.com", pass: "123456", name: "Admin Principal", role: "admin" as const, career: null, sem: null },
      { email: "alumno.apsti@sigha.com", pass: "123456", name: "Juan APSTI", role: "user" as const, career: "APSTI", sem: 3 },
      { email: "alumno.conta@sigha.com", pass: "123456", name: "Maria Contabilidad", role: "user" as const, career: "CONTABILIDAD", sem: 1 }
    ];

    try {
      let count = 0;
      for (const u of usersToCreate) {
        let uid = '';
        try {
          const cred = await createUserWithEmailAndPassword(auth, u.email, u.pass);
          uid = cred.user.uid;
        } catch (e: any) {
           if (e.code === 'auth/email-already-in-use') {
             try {
                const loginCred = await signInWithEmailAndPassword(auth, u.email, u.pass);
                uid = loginCred.user.uid;
             } catch (loginErr) { continue; }
           } else { continue; }
        }
        if (uid) {
          await setDoc(doc(db, "users", uid), {
            uid: uid, email: u.email, displayName: u.name, role: u.role, career: u.career, semester: u.sem, updatedAt: new Date().toISOString()
          }, { merge: true });
          count++;
        }
      }
      await signOut(auth);
      setSuccessMsg(`✅ Usuarios Demo Configurados (${count}).\nAdmin: admin@sigha.com / 123456`);
      setEmail("admin@sigha.com");
      setPassword("123456");
      setMode('login');
    } catch (err: any) {
      setError("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900 opacity-90"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center gap-3 text-brand-200 mb-6">
            <GraduationCap size={32} />
            <span className="text-sm font-semibold tracking-widest uppercase">Sistema Académico</span>
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-4">{APP_NAME}</h1>
          <p className="text-xl text-brand-100 max-w-md">{INSTITUTION_NAME}</p>
        </div>

        <div className="relative z-10 text-sm text-brand-200/60">
           <p className="mb-2">{INSTITUTION_ADDRESS}</p>
           <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex p-3 bg-brand-100 rounded-full text-brand-700 mb-4">
               <GraduationCap size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{APP_NAME}</h2>
            <p className="text-slate-500 text-sm">{INSTITUTION_NAME}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-8 border border-slate-100">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900">
                {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear nueva cuenta'}
              </h3>
              <p className="text-slate-500 mt-2">
                {mode === 'login' 
                  ? 'Ingrese sus credenciales para acceder.' 
                  : 'Complete sus datos para registrarse.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo</label>
                  <input 
                    type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Juan Perez"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo Institucional</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@iestp.edu.pe"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>

              {mode === 'register' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Rol</label>
                      <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                         <button type="button" onClick={() => setRole('user')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === 'user' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Estudiante/Docente</button>
                         <button type="button" onClick={() => setRole('admin')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Administrador</button>
                      </div>
                   </div>

                   {role === 'user' && (
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carrera</label>
                          <select 
                            value={career} onChange={(e) => setCareer(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                          >
                            {CAREERS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Semestre</label>
                          <select 
                            value={semester} onChange={(e) => setSemester(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                          >
                            <option value={1}>Ciclo I</option>
                            <option value={3}>Ciclo III</option>
                            <option value={5}>Ciclo V</option>
                          </select>
                       </div>
                     </div>
                   )}
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg flex items-start gap-2 border border-red-100">
                   <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                   <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="text-emerald-700 text-sm p-3 bg-emerald-50 rounded-lg flex items-start gap-2 border border-emerald-100 whitespace-pre-line">
                   <CheckCircle size={18} className="shrink-0 mt-0.5" />
                   <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 active:transform active:scale-[0.98] transition-all shadow-lg shadow-brand-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <span className="animate-pulse">Procesando...</span> : (
                  <>
                    {mode === 'login' ? 'Ingresar' : 'Registrarse'}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
               <button 
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="w-full text-center text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
               >
                 {mode === 'login' ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
               </button>
            </div>
          </div>
          
          <div className="mt-8 text-center">
             <button
                type="button"
                onClick={handleGenerateTestUsers}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 hover:text-brand-600 transition-colors bg-transparent hover:bg-white rounded-full"
             >
               <Database size={14} />
               Generar Datos Demo
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};