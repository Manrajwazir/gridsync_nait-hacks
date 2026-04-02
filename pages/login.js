import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

/*
 * Login Page — Cinematic dark-theme redesign
 * Split layout: left = aurora brand panel, right = auth form
 * All auth logic unchanged — only the visual layer is replaced.
 */

const OPERATOR_CODE = 'AESO2026'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [mode, setMode]                 = useState('signin')
  const [role, setRole]                 = useState('consumer')
  const [operatorCode, setOperatorCode] = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (role === 'operator' && operatorCode !== OPERATOR_CODE) {
          throw new Error('Invalid operator access code. Contact your AESO administrator.')
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { role } }
        })
        if (signUpError) throw signUpError
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email, role,
            display_name: email.split('@')[0], points: 0, streak: 0,
          })
        }
        if (data.session) { router.push(role === 'operator' ? '/operator' : '/dashboard'); return }
        setSignupSuccess(true)
        return
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const userRole = profile?.role ?? data.user.user_metadata?.role ?? 'consumer'
        if (!profile) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email: data.user.email, role: userRole,
            display_name: data.user.email?.split('@')[0], points: 0, streak: 0,
          })
        }
        router.push(userRole === 'operator' ? '/operator' : '/dashboard')
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('already registered') ||
          err.message?.toLowerCase().includes('already been registered')) {
        setMode('signin')
        setError('This email is already registered — try signing in instead.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Aurora ribbons (same as landing) ── */
        @keyframes ar1 {
          0%,100% { transform:translateY(0px); opacity:.8; }
          30%      { transform:translateY(-28px); opacity:1; }
          65%      { transform:translateY(-12px); opacity:.7; }
          85%      { transform:translateY(-34px); opacity:.9; }
        }
        @keyframes ar2 {
          0%,100% { transform:translateY(0px); opacity:.55; }
          25%      { transform:translateY(-22px); opacity:.8; }
          60%      { transform:translateY(-8px); opacity:.5; }
          80%      { transform:translateY(-26px); opacity:.72; }
        }
        @keyframes ar3 {
          0%,100% { transform:translateY(0px); opacity:.38; }
          40%      { transform:translateY(-18px); opacity:.6; }
          70%      { transform:translateY(-30px); opacity:.42; }
        }

        /* ── Form inputs ── */
        .gs-input {
          width: 100%; padding: 11px 14px; box-sizing: border-box;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px; color: #ededed; font-size: 14px;
          font-family: 'Inter', sans-serif; outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .gs-input:focus { border-color: rgba(0,112,243,0.55); background: rgba(255,255,255,0.07); }
        .gs-input::placeholder { color: #3a3a3a; }

        /* ── Role cards ── */
        .role-card {
          flex: 1; padding: 13px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; cursor: pointer; text-align: left;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .role-card.active {
          background: rgba(0,112,243,0.08);
          border-color: rgba(0,112,243,0.45);
        }
        .role-card:hover:not(.active) { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); }

        /* ── Submit button ── */
        .gs-submit {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg,#0070f3,#0052cc);
          color: #fff; border: none; border-radius: 10px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 20px rgba(0,112,243,0.3);
          transition: all 0.2s;
        }
        .gs-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(0,112,243,0.45); }
        .gs-submit:disabled { background: #1a1a1a; color: #444; box-shadow: none; cursor: not-allowed; }

        /* ── Mode tabs ── */
        .mode-tab {
          flex: 1; padding: 9px; background: transparent; border: none;
          border-radius: 7px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.18s; font-family: 'Inter', sans-serif;
        }
        .mode-tab.active { background: rgba(255,255,255,0.08); color: #ededed; }
        .mode-tab:not(.active) { color: #444; }
        .mode-tab:not(.active):hover { color: #777; }
      `}</style>

      <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Inter',sans-serif", background:'#000' }}>

        {/* ════ LEFT PANEL — brand + aurora ════ */}
        <div style={{
          flex:'0 0 48%', position:'relative', overflow:'hidden',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          padding:'40px 48px',
        }}>
          {/* Aurora ribbons */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', zIndex:0 }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'100%', background:'linear-gradient(180deg,rgba(0,10,40,.6) 0%,transparent 50%)' }}/>
            <div style={{ position:'absolute', top:'18%', left:'-5%', width:'110%', height:'120px', background:'linear-gradient(180deg,transparent,rgba(0,210,80,.2) 40%,rgba(0,195,120,.16) 68%,transparent)', filter:'blur(18px)', animation:'ar1 7s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', top:'10%', left:'-8%', width:'118%', height:'100px', background:'linear-gradient(180deg,transparent,rgba(0,212,200,.17) 42%,rgba(0,190,255,.14) 70%,transparent)', filter:'blur(22px)', animation:'ar2 9s ease-in-out infinite', animationDelay:'1.2s' }}/>
            <div style={{ position:'absolute', top:'4%', left:'-3%', width:'108%', height:'80px', background:'linear-gradient(180deg,transparent,rgba(0,130,255,.12) 44%,rgba(20,70,255,.1) 74%,transparent)', filter:'blur(26px)', animation:'ar3 12s ease-in-out infinite', animationDelay:'0.5s' }}/>
            {/* Grid dot pattern overlay */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'32px 32px', zIndex:1 }}/>
            {/* Bottom fade to black */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'40%', background:'linear-gradient(0deg,#000 0%,transparent 100%)', zIndex:2 }}/>
          </div>

          {/* Logo */}
          <div style={{ position:'relative', zIndex:10 }}>
            <Link href="/" style={{ textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'20px', fontWeight:'800', color:'#ededed', letterSpacing:'-0.5px' }}>GridSync</span>
                <span style={{ fontSize:'9px', padding:'2px 7px', background:'rgba(0,112,243,.14)', color:'#4d94ff', borderRadius:'4px', fontWeight:'700', letterSpacing:'.7px' }}>
                  GRID INTELLIGENCE
                </span>
              </div>
            </Link>
          </div>

          {/* Center copy */}
          <div style={{ position:'relative', zIndex:10 }}>
            <h1 style={{ fontSize:'36px', fontWeight:'800', color:'#fff', letterSpacing:'-1.5px', lineHeight:'1.15', margin:'0 0 16px' }}>
              Alberta&apos;s Grid,<br/>
              <span style={{ background:'linear-gradient(135deg,#00d4ff,#0070f3)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                Intelligence First.
              </span>
            </h1>
            <p style={{ fontSize:'14px', color:'#555', lineHeight:'1.75', maxWidth:'340px', margin:0 }}>
              48-hour AI demand forecasting and real-time demand response coordination for AESO, Alberta utilities, and municipalities.
            </p>

            {/* Stats strip */}
            <div style={{ display:'flex', gap:'32px', marginTop:'36px' }}>
              {[['48h','Forecast Window'],['94.2%','Accuracy'],['&lt;1s','Alert Speed']].map(([v,l],i) => (
                <div key={i}>
                  <div style={{ fontSize:'20px', fontWeight:'700', color:'#ededed', fontFamily:"'SF Mono',monospace", letterSpacing:'-0.5px' }} dangerouslySetInnerHTML={{__html:v}}/>
                  <div style={{ fontSize:'10px', color:'#444', marginTop:'3px' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom link */}
          <div style={{ position:'relative', zIndex:10 }}>
            <Link href="/dashboard" style={{ fontSize:'12px', color:'#444', textDecoration:'none', transition:'color .2s' }}
              onMouseEnter={e=>e.target.style.color='#777'}
              onMouseLeave={e=>e.target.style.color='#444'}
            >
              ← View live grid without signing in
            </Link>
          </div>
        </div>

        {/* ════ RIGHT PANEL — auth form ════ */}
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          padding:'48px 40px',
          borderLeft:'1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ width:'100%', maxWidth:'360px' }}>

            {signupSuccess ? (
              /* ── Success state ── */
              <div style={{ textAlign:'center' }}>
                <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(0,200,83,0.1)', border:'1px solid rgba(0,200,83,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 20px' }}>✉️</div>
                <div style={{ fontSize:'20px', fontWeight:'700', color:'#ededed', marginBottom:'10px' }}>Account Created</div>
                <div style={{ fontSize:'13px', color:'#555', lineHeight:'1.65', marginBottom:'24px' }}>
                  Check <span style={{ color:'#4d94ff' }}>{email}</span> to confirm your account, or sign in directly if confirmation is disabled.
                </div>
                <button className="gs-submit" onClick={() => { setSignupSuccess(false); setMode('signin') }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Heading */}
                <div style={{ marginBottom:'32px' }}>
                  <h2 style={{ fontSize:'24px', fontWeight:'700', color:'#ededed', margin:'0 0 6px', letterSpacing:'-0.5px' }}>
                    {mode === 'signin' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p style={{ fontSize:'13px', color:'#444', margin:0 }}>
                    {mode === 'signin'
                      ? 'Sign in to access the GridSync platform.'
                      : 'Join the Alberta Grid Intelligence Platform.'}
                  </p>
                </div>

                {/* Mode tabs */}
                <div style={{ display:'flex', gap:'3px', marginBottom:'28px', background:'rgba(255,255,255,0.03)', borderRadius:'10px', padding:'3px' }}>
                  {['signin','signup'].map(m => (
                    <button key={m} className={`mode-tab${mode===m?' active':''}`} onClick={() => { setMode(m); setError('') }}>
                      {m === 'signin' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'7px', fontWeight:'500' }}>Email address</label>
                  <input className="gs-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" style={{ marginBottom:'16px' }}/>

                  {/* Password */}
                  <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'7px', fontWeight:'500' }}>Password</label>
                  <input className="gs-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" style={{ marginBottom: mode==='signup' ? '16px' : '24px' }}/>

                  {/* Signup extras */}
                  {mode === 'signup' && (
                    <>
                      <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'10px', fontWeight:'500' }}>I am joining as...</label>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
                        {[
                          { id:'consumer', label:'Subscriber',  desc:'Resident / building manager', icon:'🏙️' },
                          { id:'operator', label:'Operator',    desc:'AESO / utility staff', icon:'⚡' },
                        ].map(r => (
                          <button type="button" key={r.id} className={`role-card${role===r.id?' active':''}`} onClick={()=>setRole(r.id)}>
                            <div style={{ fontSize:'18px', marginBottom:'5px' }}>{r.icon}</div>
                            <div style={{ fontSize:'13px', fontWeight:'700', color:'#ededed', marginBottom:'2px' }}>{r.label}</div>
                            <div style={{ fontSize:'10px', color:'#444' }}>{r.desc}</div>
                          </button>
                        ))}
                      </div>

                      {role === 'operator' && (
                        <>
                          <label style={{ fontSize:'12px', color:'#555', display:'block', marginBottom:'7px', fontWeight:'500' }}>
                            🔑 Operator Access Code
                          </label>
                          <input className="gs-input" type="text" value={operatorCode} onChange={e=>setOperatorCode(e.target.value.toUpperCase())} required placeholder="Provided by AESO administrator" style={{ marginBottom:'6px' }}/>
                          <div style={{ fontSize:'11px', color:'#333', marginBottom:'20px' }}>
                            Contact your AESO grid administrator to receive this code.
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Error */}
                  {error && (
                    <div style={{ padding:'10px 14px', borderRadius:'9px', background:'rgba(255,59,48,0.07)', border:'1px solid rgba(255,59,48,0.2)', color:'#ff6b6b', fontSize:'12px', marginBottom:'16px', lineHeight:'1.5' }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="gs-submit" disabled={loading}>
                    {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
                  </button>
                </form>

                {/* Footer */}
                <div style={{ marginTop:'24px', textAlign:'center' }}>
                  <span style={{ fontSize:'12px', color:'#333' }}>
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  </span>
                  <button onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('')}} style={{ fontSize:'12px', color:'#4d94ff', background:'none', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif", padding:0 }}>
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
