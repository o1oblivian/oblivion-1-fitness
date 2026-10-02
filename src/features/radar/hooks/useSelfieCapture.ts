import { useState, useRef, useEffect } from 'react';
import { getRandomPoseChallenge, verifyAthletePose, PoseChallenge } from '../services/poseVerificationService';
import { useBuddyProfileStore } from '../../../stores/useBuddyProfileStore';
import { tactileEngine } from '../../../services/tactileEngine';

export function useSelfieCapture(isOpen: boolean, onVerified?: () => void) {
  const [challenge, setChallenge] = useState<PoseChallenge>(getRandomPoseChallenge());
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const buddyPhotos = useBuddyProfileStore((s) => s.buddyPhotos);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage('Camera access is not supported on this device. You can upload a photo instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e: any) {
      console.warn('[SelfieCapture] Camera fallback active:', e);
      setErrorMessage('Camera access was denied or unavailable. You can upload a photo or allow camera in device settings.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setChallenge(getRandomPoseChallenge());
      setCapturedImage(null);
      setIsSuccess(false);
      setErrorMessage(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const runVerification = async (selfieBase64: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    const avatar = buddyPhotos[0] || '';
    const res = await verifyAthletePose(avatar, selfieBase64, challenge);
    setIsVerifying(false);

    if (res.isVerified) {
      setIsSuccess(true);
      tactileEngine.playPRCelebration();
      onVerified?.();
    } else {
      setErrorMessage(res.reason || 'Pose check failed. Please ensure the pose strictly matches the prompt.');
    }
  };

  const capturePhoto = () => {
    tactileEngine.triggerSelectionBuzz();
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    runVerification(dataUrl);
  };

  const uploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCapturedImage(result);
      runVerification(result);
    };
    reader.readAsDataURL(file);
  };

  return {
    challenge,
    capturedImage,
    isVerifying,
    isSuccess,
    errorMessage,
    videoRef,
    fileInputRef,
    hasStream: Boolean(streamRef.current),
    capturePhoto,
    uploadPhoto,
    resetCapture: () => {
      setCapturedImage(null);
      setErrorMessage(null);
      startCamera();
    },
  };
}
