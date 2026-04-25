'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

function Check() {
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(110,231,183,0.15)' }}>
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l2.5 2.5L9 1" stroke="#6ee7b7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <Check />
      <span className="text-sm" style={{ color: 'rgba(167,243,208,0.9)' }}>{text}</span>
    </div>
  )
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  async function handleGoogleSignIn() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: 'physiohealinghands.com', prompt: 'select_account' },
      },
    })
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[56%] relative overflow-hidden flex-col justify-center px-20 py-16"
        style={{ background: 'linear-gradient(145deg, #041f14 0%, #063d26 40%, #0a6640 70%, #1a9060 100%)' }}
      >
        {/* Dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Animated blob shapes */}
        <div
          className="absolute -top-40 -right-40 w-[520px] h-[520px] animate-blob pointer-events-none"
          style={{ background: 'rgba(110,231,183,0.07)' }}
        />
        <div
          className="absolute -bottom-56 -left-24 w-[480px] h-[480px] animate-blob-slow pointer-events-none"
          style={{ background: 'rgba(167,243,208,0.06)' }}
        />
        <div
          className="absolute top-1/2 right-12 w-52 h-52 animate-blob-slower pointer-events-none"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />

        {/* Glowing accent orb */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(31,159,112,0.25) 0%, transparent 70%)' }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Logo badge */}
          <div
            className="w-24 h-24 rounded-3xl mb-10 flex items-center justify-center shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Image src="/logo.png" alt="Physio Healing Hands" width={68} height={68} className="rounded-2xl" priority />
          </div>

          <h1 className="text-5xl font-bold text-white tracking-tight mb-2 leading-tight">MyView</h1>
          <p className="text-lg font-medium mb-2" style={{ color: 'rgba(167,243,208,0.8)' }}>
            Physio Healing Hands
          </p>
          <p className="text-sm leading-relaxed mb-12 max-w-xs" style={{ color: 'rgba(167,243,208,0.6)' }}>
            Your leave, your wellbeing — managed with care, built for your team.
          </p>

          <div className="space-y-3.5">
            <Feature text="See your leave balances at a glance" />
            <Feature text="Submit and track time-off requests" />
            <Feature text="Stay in sync with the team calendar" />
            <Feature text="Manager approvals — fast and simple" />
          </div>

          {/* Bottom branding strip */}
          <div className="mt-16 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs" style={{ color: 'rgba(167,243,208,0.4)' }}>myview.work</span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-12"
        style={{ background: 'linear-gradient(160deg, #f0fdf8 0%, #ffffff 50%, #f0fdf4 100%)' }}
      >
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-md"
              style={{ background: '#eef9f5', border: '1px solid #d1f0e6' }}
            >
              <Image src="/logo.png" alt="PHH" width={56} height={56} priority />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#1f9f70' }}>MyView</h1>
            <p className="text-sm text-gray-500 mt-1">Physio Healing Hands</p>
          </div>

          {/* Sign-in card */}
          <div
            className="bg-white rounded-3xl p-8"
            style={{
              boxShadow: '0 32px 64px -12px rgba(15,80,50,0.18), 0 0 0 1px rgba(31,159,112,0.06)',
            }}
          >
            {/* Green accent bar */}
            <div
              className="w-10 h-1 rounded-full mb-7"
              style={{ background: 'linear-gradient(90deg, #1f9f70, #6ee7b7)' }}
            />

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Sign in with your Physio Healing Hands<br />Google Workspace account.
            </p>

            {error === 'auth_failed' && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
                </svg>
                Sign in failed. Please try again.
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-700 bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1.5px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access restricted to Physio Healing Hands team members.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
