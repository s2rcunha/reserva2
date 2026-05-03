import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const main = document.getElementById('main-scroll-area');
      if (main && main.scrollTop > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    const main = document.getElementById('main-scroll-area');
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button 
      onClick={() => {
        const main = document.getElementById('main-scroll-area');
        main?.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white rounded-full flex items-center justify-center w-14 h-14 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
      title="Voltar ao topo"
    >
      <ChevronUp size={24} />
    </button>
  );
};
