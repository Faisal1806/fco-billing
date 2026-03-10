
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Camera, RefreshCw, CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractWatak } from '@/ai/flows/extract-watak-flow';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraScannerProps {
  onScanComplete: (data: any) => void;
}

export default function CameraScanner({ onScanComplete }: CameraScannerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        } 
      });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use the AI scanner.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUri);
        stopCamera();
      }
    }
  };

  const handleProcessScan = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
      const result = await extractWatak({ photoDataUri: capturedImage });
      onScanComplete(result);
      setIsOpen(false);
      toast({
        title: 'Scan Successful',
        description: 'Invoice data has been extracted and auto-filled.',
        isSuccess: true
      });
    } catch (error) {
      console.error('OCR failed:', error);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: (error as Error).message || 'Could not read the invoice. Try a clearer photo.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 neon-glow-container">
          <Sparkles className="h-4 w-4" /> AI OCR Scanner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border-white/10 shadow-2xl">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
          <DialogTitle className="flex items-center gap-3 text-xl font-black tracking-tighter">
            <div className="p-2 bg-accent/20 rounded-lg text-accent">
                <Camera className="h-5 w-5" />
            </div>
            INVOICE INTELLIGENCE SCANNER
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[400px]">
          <video 
            ref={videoRef} 
            className={cn("w-full h-full object-contain", !isCapturing && "hidden")} 
            autoPlay 
            muted 
            playsInline
          />
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          )}
          
          <AnimatePresence>
            {isProcessing && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20 text-center p-8"
                >
                    <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-accent mb-6" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"
                        />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter mb-2">GEMINI AI IS ANALYZING</h3>
                    <p className="text-muted-foreground font-medium max-w-xs">Extracting quantities, rates, and party names from your document...</p>
                </motion.div>
            )}
          </AnimatePresence>

          {!hasCameraPermission && !capturedImage && (
            <div className="p-10 text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-6 text-destructive opacity-50" />
              <h3 className="text-lg font-bold text-white mb-2">Camera Access Required</h3>
              <p className="text-muted-foreground mb-6">Please allow camera permissions to use the AI OCR feature.</p>
              <Button onClick={startCamera} className="bg-primary text-primary-foreground font-bold">Retry Access</Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="p-6 border-t border-white/5 bg-white/[0.02] flex-row items-center justify-between gap-4">
          <div className="flex gap-2">
            {capturedImage ? (
              <Button variant="outline" onClick={retakePhoto} disabled={isProcessing} className="h-12 px-6 rounded-xl font-bold border-white/10">
                <RefreshCw className="h-4 w-4 mr-2" /> Retake
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="font-bold text-muted-foreground">Cancel</Button>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
             {isCapturing && (
                <button 
                    onClick={capturePhoto}
                    className="h-20 w-20 rounded-full border-8 border-white/20 bg-white shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-90 transition-all group flex items-center justify-center"
                >
                    <div className="h-12 w-12 rounded-full border-4 border-black/5" />
                </button>
             )}
          </div>

          <div>
            {capturedImage && (
              <Button 
                onClick={handleProcessScan} 
                disabled={isProcessing} 
                className="h-12 px-8 rounded-xl font-black tracking-widest bg-accent text-black hover:bg-accent/90 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> EXTRACT DATA
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
