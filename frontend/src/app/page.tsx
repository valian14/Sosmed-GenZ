"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoadingPage() {
  const [value, setValue] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let currentVal = 0;
    let animationFrameId: number;

    const step = () => {
      currentVal += (100 - currentVal) * 0.03;
      if (currentVal > 99.5) currentVal = 100;

      setValue(currentVal);

      if (currentVal < 100) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => {
            router.push('/login');
          }, 500);
        }, 200);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [router]);

  return (
    <div className={`fixed inset-0 bg-[#020617] flex justify-center items-center z-[9999] transition-opacity duration-500 ease-in-out ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-[220px] text-center font-sans">
        <div className="text-[14px] tracking-[2px] text-[#e5e7eb] mb-5">GenZ Social</div>
        <div className="w-full h-[2px] bg-white/10 overflow-hidden relative rounded-full">
          <div
            className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-[250ms] ease-out rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <div className="mt-2.5 text-[12px] text-[#6b7280] font-medium">
          {Math.floor(value)}%
        </div>
      </div>
    </div>
  );
}
