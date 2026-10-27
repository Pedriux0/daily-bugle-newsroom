import React from 'react';
import uncleBenImg from '../../assets/uncleben.jpeg';

const UncleBenReminder: React.FC = () => {
  return (
    <div className="mt-6 bg-black/80 border border-white/10 rounded-lg overflow-hidden backdrop-blur relative">
      {/* Image */}
      <div className="relative">
        <img
          src={uncleBenImg}
          alt="Uncle Ben"
          className="w-full h-48 object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Quote */}
      <div className="p-5 text-center">
        <p className="text-white/90 text-sm italic leading-relaxed mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          "With great power comes great responsibility."
        </p>
        <div className="w-12 h-px bg-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-xs font-mono tracking-widest uppercase">
          In memory of Ben Parker
        </p>
        <p className="text-white/20 text-[10px] font-mono mt-1">
          The reason behind the mask
        </p>
      </div>
    </div>
  );
};

export default UncleBenReminder;
