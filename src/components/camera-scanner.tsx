
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
import { Camera, RefreshCw, CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractWatak } from '@/ai/flows/extract-watak-flow';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
        video: { facingMode: 'environment' } // Prefer back camera
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
        description: 'Please enable camera permissions in your browser settings.',
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
        const dataUri = canvas.toDataURL('image/jpeg');
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
      });
    } catch (error) {
      console.error('OCR failed:', error);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: (error as Error).message || 'Could not read the invoice.',
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
        <Button variant="outline" className="gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20">
          <Camera className="h-4 w-4" /> AI Scan Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Invoice Scanner (AI OCR)
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[300px]">
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
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-bold animate-pulse">Gemini AI is reading your invoice...</p>
              <p className="text-sm opacity-70">Extracting quantities, rates, and names</p>
            </div>
          )}

          {!hasCameraPermission && !capturedImage && (
            <div className="p-6 text-center text-white">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p>Camera access is required to use the scanner.</p>
              <Button onClick={startCamera} className="mt-4">Retry Camera</Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="p-4 border-t bg-card gap-2 sm:justify-between flex-row items-center">
          <div className="flex gap-2">
            {capturedImage ? (
              <Button variant="outline" onClick={retakePhoto} disabled={isProcessing}>
                <RefreshCw className="h-4 w-4 mr-2" /> Retake
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            )}
          </div>
          
          <div className="flex-1 flex justify-center">
             {isCapturing && (
                <button 
                    onClick={capturePhoto}
                    className="h-16 w-16 rounded-full border-4 border-white bg-red-500 shadow-xl hover:scale-110 active:scale-95 transition-all"
                />
             )}
          </div>

          <div>
            {capturedImage && (
              <Button onClick={handleProcessScan} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Extract Data
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
