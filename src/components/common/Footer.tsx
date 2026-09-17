import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer
      className={`py-2.5 px-4 bg-[#0a0c10] text-slate-200 border-t border-slate-800/80 text-center select-none no-print shrink-0 ${className}`}
    >
      <div className="flex items-center justify-center space-x-1.5 text-xs font-medium tracking-wide">
        <span className="text-slate-100">Crafted with</span>
        <Heart
          className="w-4 h-4 text-red-500 fill-transparent stroke-[2.2] inline-block shrink-0 transition-transform duration-300 hover:scale-125"
          aria-label="love"
        />
        <span className="text-slate-100">
          by <strong className="font-bold text-white tracking-wider">AKR Labs</strong>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
