import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, CheckCircle } from 'lucide-react';

interface Props {
  onScan: (bmp: string) => void;
  onClose: () => void;
}

export const InventoryScanner: React.FC<Props> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameras, setHasCameras] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanned = useRef<{ code: string; time: number } | null>(null);

  // Nova função otimizada para o bip de leitura com inicialização persistente
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      
      const audioCtx = audioCtxRef.current;
      
      // Força o desbloqueio caso o navegador tente silenciar por política de autoplay
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio beep synthesis error:", e);
    }
  };

  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let html5Qrcode: Html5Qrcode;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          html5Qrcode = new Html5Qrcode("qr-reader");
          scannerRef.current = html5Qrcode;
          
          // Se encontrar múltiplas câmeras, tenta pegar o ID da última de forma explícita,
          // que geralmente é a traseira em dispositivos móveis modernos (ex: ultra-wide/macro).
          // Caso contrário, usa { facingMode: "environment" }.
          const cameraConfig = devices.length > 1 
            ? { deviceId: { exact: devices[devices.length - 1].id } }
            : { facingMode: "environment" };

          await html5Qrcode.start(
            cameraConfig,
            {
              fps: 15,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              const now = Date.now();
              // Evita ler o mesmo código seguidamente num intervalo de 5 segundos
              if (lastScanned.current && lastScanned.current.code === decodedText && now - lastScanned.current.time < 5000) {
                return;
              }
              
              lastScanned.current = { code: decodedText, time: now };
              
              // Dispara o bip de forma segura
              playBeep();
              onScanRef.current(decodedText);
            },
            (errorMessage) => {
              // Ignorar erros de busca que acontecem a cada frame
            }
          );
          setIsScanning(true);
        } else {
          setHasCameras(false);
          setError("Nenhuma câmera encontrada no dispositivo.");
        }
      } catch (err) {
        console.error("Erro ao acessar câmera.", err);
        setError("Erro ao acessar a câmera. Verifique as permissões do seu dispositivo e navegador.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error("Erro ao parar scanner:", err));
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md">
      <div className="p-6 flex justify-between items-center bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Camera className="text-red-600" size={24} />
          <div>
            <h2 className="text-white font-black uppercase text-sm tracking-widest">Scanner de Inventário</h2>
            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Aponte para o QR Code da etiqueta</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-600 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!hasCameras && !isScanning && !error && (
          <div className="text-white/50 text-xs font-bold uppercase p-6 border-2 border-white/10 rounded-3xl">
            Procurando câmeras...
          </div>
        )}
        
        <div id="qr-reader" className="w-full max-w-md overflow-hidden rounded-[40px] border-4 border-red-600 shadow-2xl shadow-red-900/20 bg-black min-h-[300px] flex items-center justify-center relative">
           {/* Feed da câmera injetado pelo html5-qrcode */}
        </div>
        
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-2xl text-red-100 text-xs font-bold uppercase text-center max-w-md">
            {error}
          </div>
        )}

        <div className="mt-10 flex items-center gap-4 text-white/40">
           <div className="flex flex-col items-center">
             <div className={`w-12 h-12 rounded-full border-2 ${isScanning ? 'border-red-600 text-red-600' : 'border-white/10'} flex items-center justify-center mb-2 transition-colors`}>
                <Camera size={20} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest">Pronto</p>
           </div>
           <div className="w-8 h-[1px] bg-white/10" />
           <div className="flex flex-col items-center">
             <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center mb-2">
                <CheckCircle size={20} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest">Bip</p>
           </div>
           <div className="w-8 h-[1px] bg-white/10" />
           <div className="flex flex-col items-center">
             <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center mb-2">
                <CheckCircle size={20} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest">Registra</p>
           </div>
        </div>
      </div>

      <div className="p-8 text-center bg-black/50 border-t border-white/10">
         <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">SESCINC BACO - SISTEMA DE GERENCIAMENTO</p>
      </div>
    </div>
  );
};
