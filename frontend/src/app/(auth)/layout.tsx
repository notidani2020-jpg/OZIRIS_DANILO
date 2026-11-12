import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-[#090d10] text-white">
      {/* Left side: Branding / Decor (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0c1217] flex-col justify-between p-12 overflow-hidden border-r border-emerald-500/10">
        {/* Dynamic Abstract Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Oziris Logo"
              width={220}
              height={80}
              className="object-contain brightness-0 invert drop-shadow-[0_0_18px_rgba(16,185,129,0.16)]"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Eleva tu sonido al <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
              siguiente nivel.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Únete a la comunidad de productores emergentes. Descubre, colabora y monetiza tus creaciones en un solo lugar.
          </p>
        </div>
        <div className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Oziris Platform. Pro Edition.
        </div>
      </div>

      {/* Right side: Form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent lg:hidden" />
        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
