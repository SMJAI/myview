'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
      <span className="text-sm text-green-100">{text}</span>
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
        queryParams: {
          hd: 'physiohealinghands.com',
          prompt: 'select_account',
        },
      },
    })
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel – brand ── */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 flex-col items-center justify-center p-14 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-0 w-40 h-40 rounded-full bg-white/5 translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
          <Image
            src="/logo.svg"
            alt="Physio Healing Hands"
            width={160}
            height={160}
            className="mb-8 drop-shadow-xl"
            priority
          />
          <h1 className="text-4xl font-bold text-white tracking-tight mb-3">MyView</h1>
          <p className="text-green-100 text-base leading-relaxed">
            Your leave, your wellbeing — managed with care, built for your team.
          </p>

          <div className="mt-10 flex flex-col gap-3 text-left w-full">
            <Feature text="See your leave balances at a glance" />
            <Feature text="Submit and track time-off requests" />
            <Feature text="Stay in sync with the team calendar" />
            <Feature text="Manager approvals — fast and simple" />
          </div>
        </div>
      </div>

      {/* ── Right panel – sign in ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="lg:hidden text-center mb-10">
            <Image
              src="/logo.svg"
              alt="Physio Healing Hands"
              width={96}
              height={96}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-brand-600">MyView</h1>
            <p className="text-sm text-gray-500 mt-1">Physio Healing Hands</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sign in with your Physio Healing Hands Google Workspace account to continue.
            </p>

            {error === 'auth_failed' && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                Sign in failed. Please try again.
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              {loading ? 'Redirecting…' : 'Sign in with Google'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access is restricted to Physio Healing Hands team members only.
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
