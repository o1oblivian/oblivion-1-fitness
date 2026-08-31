import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Video,
  Camera,
  Upload,
  Dumbbell,
  Check,
  Plus,
  Tag,
  Link2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { ProgramPreview } from '@/utils/reelsTypes';

interface ReelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onPosted: () => void;
  showToast: (msg: string) => void;
}

const WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Full Body', 'Upper Body', 'Lower Body', 'Cardio', 'HIIT', 'Mobility', 'Olympic Lifting'];
const TAG_SUGGESTIONS = ['Hypertrophy', 'Powerbuilding', 'Strength', 'Conditioning', 'Beginner', 'Advanced', 'Home Workout', 'Deadlift', 'Squat', 'Bench Press'];

export const ReelUploadModal: React.FC<ReelUploadModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onPosted,
  showToast,
}) => {
  const [step, setStep] = useState<'media' | 'details' | 'program'>('media');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [coachName, setCoachName] = useState('');
  const [workoutType, setWorkoutType] = useState('Full Body');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Program linking
  const [linkProgram, setLinkProgram] = useState(false);
  const [userPrograms, setUserPrograms] = useState<ProgramPreview[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Program creation (inline)
  const [newProgramTitle, setNewProgramTitle] = useState('');
  const [newProgramPrice, setNewProgramPrice] = useState('');
  const [newProgramDuration, setNewProgramDuration] = useState('4');
  const [newProgramCategory, setNewProgramCategory] = useState('Hypertrophy');
  const [newProgramDifficulty, setNewProgramDifficulty] = useState('Intermediate');
  const [newProgramDesc, setNewProgramDesc] = useState('');
  const [createNewProgram, setCreateNewProgram] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadUserPrograms = useCallback(async () => {
    if (!currentUserEmail) return;
    setLoadingPrograms(true);
    try {
      const { data, error } = await supabase
        .from('coach_programs')
        .select('id, title, description, category, difficulty, duration_weeks, price_cents, cover_image_url, coach_email')
        .eq('coach_email', currentUserEmail)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserPrograms(
        (data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description || '',
          category: p.category || '',
          difficulty: p.difficulty || '',
          duration_weeks: p.duration_weeks || 4,
          price_cents: p.price_cents || 0,
          cover_image_url: p.cover_image_url || '',
          coach_email: p.coach_email,
        }))
      );
    } catch {
      // non-critical
    } finally {
      setLoadingPrograms(false);
    }
  }, [currentUserEmail]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      setError('Please select a video or image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large — max 50MB');
      return;
    }

    setError(null);
    setUploadingMedia(true);

    const fileExt = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${fileExt}`;
    const filePath = `${currentUserEmail || 'anonymous'}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('reels-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('reels-media')
        .getPublicUrl(filePath);

      setMediaUrl(urlData.publicUrl);
      setMediaType(isVideo ? 'video' : 'image');
      setUploadingMedia(false);
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Failed to upload media');
      setUploadingMedia(false);
    }
  };

  const handleImageUrl = () => {
    const url = imageInputRef.current?.value?.trim();
    if (!url) return;
    setMediaUrl(url);
    setMediaType('image');
    setStep('details');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setCustomTag('');
    }
  };

  const handleCreateProgram = async (): Promise<string | null> => {
    if (!newProgramTitle.trim()) {
      setError('Program title is required');
      return null;
    }
    const priceCents = Math.round(parseFloat(newProgramPrice || '0') * 100);
    if (priceCents < 0 || isNaN(priceCents)) {
      setError('Invalid price');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('coach_programs')
        .insert({
          coach_email: currentUserEmail,
          title: newProgramTitle.trim(),
          description: newProgramDesc.trim(),
          category: newProgramCategory,
          difficulty: newProgramDifficulty,
          duration_weeks: parseInt(newProgramDuration) || 4,
          price_cents: priceCents,
          cover_image_url: thumbnailUrl || '',
          is_published: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create program');
      return null;
    }
  };

  const handlePost = async () => {
    if (!mediaUrl) {
      setError('Media is required');
      return;
    }
    if (!caption.trim() && !workoutType) {
      setError('Add a caption or workout type');
      return;
    }

    setIsPosting(true);
    setError(null);

    let programId = selectedProgramId || null;

    if (linkProgram && createNewProgram) {
      const newId = await handleCreateProgram();
      if (newId) {
        programId = newId;
      } else {
        setIsPosting(false);
        return;
      }
    }

    try {
      const { error: insertError } = await supabase.from('coach_reels').insert({
        coach_email: currentUserEmail,
        coach_name: coachName.trim() || currentUserEmail.split('@')[0],
        coach_avatar: '',
        caption: caption.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl.trim(),
        program_id: programId || null,
        workout_type: workoutType,
        tags: selectedTags,
        is_published: true,
      });

      if (insertError) throw insertError;

      // Reset state
      setMediaUrl('');
      setMediaType('video');
      setThumbnailUrl('');
      setCaption('');
      setCoachName('');
      setWorkoutType('Full Body');
      setSelectedTags([]);
      setCustomTag('');
      setLinkProgram(false);
      setSelectedProgramId('');
      setCreateNewProgram(false);
      setNewProgramTitle('');
      setNewProgramPrice('');
      setNewProgramDuration('4');
      setNewProgramDesc('');
      setStep('media');
      setIsPosting(false);
      onPosted();
    } catch (err: any) {
      setError(err.message || 'Failed to post reel');
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[180] flex items-end justify-center px-3 pb-20 pointer-events-none">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[80dvh] flex flex-col pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,0,0,0.08)] bg-white sticky top-0 z-10">
          <button
            onClick={() => {
              if (step === 'details') setStep('media');
              else if (step === 'program') setStep('details');
              else onClose();
            }}
            className="text-sm font-black text-black dark:text-white cursor-pointer"
          >
            {step === 'media' ? 'Cancel' : 'Back'}
          </button>
          <h3 className="text-lg font-black text-black dark:text-white tracking-tight">
            {step === 'media' && 'Upload Reel'}
            {step === 'details' && 'Reel Details'}
            {step === 'program' && 'Link Program'}
          </h3>
          <div className="w-12 text-right">
            <span className="text-sm font-mono text-black/60 dark:text-white/60 font-bold">
              {step === 'media' ? '1/3' : step === 'details' ? '2/3' : '3/3'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Media Upload */}
          {step === 'media' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto mb-3 border border-[#DC2626]/20">
                  <Video className="w-7 h-7 text-[#DC2626]" />
                </div>
                <h4 className="text-lg font-black text-black dark:text-white mb-1">Share Your Workout</h4>
                <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed font-bold">
                  Upload a short video or photo demonstrating exercises, form tips, or workout snippets.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="w-full py-3.5 bg-red-600 text-white font-black text-sm rounded-xl hover:bg-red-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {uploadingMedia ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Choose Video or Photo
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(0,0,0,0.08)]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-black/60 dark:text-white/60 font-mono font-bold">OR</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  ref={imageInputRef}
                  type="url"
                  placeholder="Paste image URL..."
                  className="flex-1 px-3 py-2 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  onClick={handleImageUrl}
                  className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-black font-black text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-white/90 cursor-pointer whitespace-nowrap shadow-lg active:scale-95"
                >
                  Use URL
                </button>
              </div>

              {/* Quick demo images */}
              <div>
                <div className="text-sm font-mono text-black/60 dark:text-white/60 uppercase tracking-wider mb-2 font-bold">
                  Quick Demo Media
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=600&q=80',
                    'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=600&q=80',
                  ].map((url) => (
                    <button
                      key={url}
                      onClick={() => {
                        setMediaUrl(url);
                        setMediaType('image');
                        setStep('details');
                      }}
                      className="aspect-[9/14] rounded-lg overflow-hidden border-2 border-transparent hover:border-[#DC2626] transition-all cursor-pointer"
                    >
                      <img src={url} alt="Demo" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden bg-[#1A1E1D]" style={{ aspectRatio: '9/14' }}>
                {mediaType === 'video' ? (
                  <video src={mediaUrl} muted loop playsInline autoPlay className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />
                <span className="absolute top-2 right-2 text-sm font-mono font-black text-white bg-black/40 px-1.5 py-0.5 rounded-md border border-white/20">
                  PREVIEW
                </span>
              </div>

              {/* Coach Display Name */}
              <div>
                <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1.5">
                  Coach Display Name
                </label>
                <input
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  placeholder={currentUserEmail.split('@')[0]}
                  className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1.5">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Describe the workout, exercise, or form tip..."
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl resize-none focus:outline-none focus:border-amber-500 transition-colors"
                />
                <div className="text-[9px] text-gray-400 text-right mt-0.5 font-mono">{caption.length}/300</div>
              </div>

              {/* Workout Type */}
              <div>
                <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1.5">
                  Workout Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((wt) => (
                    <button
                      key={wt}
                      onClick={() => setWorkoutType(wt)}
                      className={`px-2 py-1 rounded-full text-sm font-black transition-all cursor-pointer ${
                        workoutType === wt
                          ? 'bg-[#1A1E1D] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10'
                      }`}
                    >
                      {wt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1.5">
                  Tags (optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 rounded-full text-sm font-black transition-all cursor-pointer flex items-center gap-1 ${
                        selectedTags.includes(tag)
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10'
                      }`}
                    >
                      {selectedTags.includes(tag) && <Check className="w-2.5 h-2.5" />}
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    placeholder="Add custom tag..."
                    className="flex-1 px-3 py-2 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-3 py-2 bg-[#1A1E1D] text-white font-bold text-xs rounded-xl hover:bg-[#3A3F3D] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep('program')}
                  className="flex-1 py-2 bg-[#F2F2F7] text-[#000000] font-bold text-xs rounded-xl border border-[rgba(0,0,0,0.08)] hover:bg-[#E5E5EA] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Link a Program
                </button>
                <button
                  onClick={handlePost}
                  disabled={isPosting}
                  className="flex-1 py-3.5 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-500 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isPosting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Reel'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Link/Create Program */}
          {step === 'program' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/15">
                <div className="flex items-center gap-2">
                  <ShoppingBagIcon />
                  <div>
                    <div className="text-sm font-black text-black dark:text-white">Sell a Program</div>
                    <div className="text-sm text-black/60 dark:text-white/60 font-bold">Platform takes 15% commission</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setLinkProgram(!linkProgram);
                    if (!linkProgram) loadUserPrograms();
                  }}
                  className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${linkProgram ? 'bg-[#DC2626]' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${linkProgram ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {linkProgram && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCreateNewProgram(false);
                        loadUserPrograms();
                      }}
                      className={`flex-1 py-2 text-sm font-black rounded-xl transition-all cursor-pointer ${!createNewProgram ? 'bg-[#1A1E1D] text-white' : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10'}`}
                    >
                      Existing
                    </button>
                    <button
                      onClick={() => setCreateNewProgram(true)}
                      className={`flex-1 py-2 text-sm font-black rounded-xl transition-all cursor-pointer ${createNewProgram ? 'bg-[#1A1E1D] text-white' : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border border-black/10 dark:border-white/10'}`}
                    >
                      Create New
                    </button>
                  </div>

                  {/* Existing programs */}
                  {!createNewProgram && (
                    <div className="space-y-2">
                      {loadingPrograms && (
                        <div className="text-sm font-mono text-black/60 dark:text-white/60 font-bold">Loading your programs...</div>
                      )}
                      {!loadingPrograms && userPrograms.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-black/60 dark:text-white/60 font-bold mb-2">No programs yet — create one to sell.</p>
                        </div>
                      )}
                      {userPrograms.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedProgramId(selectedProgramId === p.id ? '' : p.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                            selectedProgramId === p.id
                              ? 'bg-[#DC2626]/5 border-[#DC2626]'
                              : 'bg-white border-[rgba(0,0,0,0.08)] hover:bg-[#F2F2F7]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/5 dark:bg-white/10 shrink-0">
                            {p.cover_image_url ? (
                              <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Dumbbell className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black text-black dark:text-white truncate">{p.title}</div>
                            <div className="text-sm text-black/60 dark:text-white/60 font-mono font-bold">
                              {p.duration_weeks}w · {p.difficulty} · {p.price_cents === 0 ? 'FREE' : `$${(p.price_cents / 100).toFixed(2)}`}
                            </div>
                          </div>
                          {selectedProgramId === p.id && <Check className="w-4 h-4 text-[#DC2626] shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Create new program */}
                  {createNewProgram && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                          Program Title
                        </label>
                        <input
                          value={newProgramTitle}
                          onChange={(e) => setNewProgramTitle(e.target.value)}
                          placeholder="e.g. 12-Week Hypertrophy Builder"
                          className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                            Price (AUD)
                          </label>
                          <input
                            value={newProgramPrice}
                            onChange={(e) => setNewProgramPrice(e.target.value)}
                            placeholder="49.00"
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                            Duration (weeks)
                          </label>
                          <input
                            value={newProgramDuration}
                            onChange={(e) => setNewProgramDuration(e.target.value)}
                            type="number"
                            min="1"
                            max="52"
                            className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                            Category
                          </label>
                          <select
                            value={newProgramCategory}
                            onChange={(e) => setNewProgramCategory(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                          >
                            <option>Hypertrophy</option>
                            <option>Powerlifting</option>
                            <option>Conditioning</option>
                            <option>Mobility</option>
                            <option>Olympic</option>
                            <option>General</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                            Difficulty
                          </label>
                          <select
                            value={newProgramDifficulty}
                            onChange={(e) => setNewProgramDifficulty(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                          >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-mono font-black text-black dark:text-white uppercase tracking-wider block mb-1">
                          Description
                        </label>
                        <textarea
                          value={newProgramDesc}
                          onChange={(e) => setNewProgramDesc(e.target.value)}
                          placeholder="What does this program cover? What results can athletes expect?"
                          rows={2}
                          maxLength={500}
                          className="w-full px-4 py-3 text-sm bg-white text-black font-extrabold border-2 border-slate-900 rounded-2xl resize-none focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      {newProgramPrice && parseFloat(newProgramPrice) > 0 && (
                        <div className="p-3 bg-red-600/5 rounded-xl border border-red-600/20 text-sm font-mono font-bold">
                          <div className="flex justify-between text-black/60 dark:text-white/60">
                            <span>Price</span>
                            <span className="font-black text-black dark:text-white">${parseFloat(newProgramPrice).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-black/60 dark:text-white/60 mt-0.5">
                            <span>Platform fee (15%)</span>
                            <span className="text-red-600 dark:text-red-400">-${(parseFloat(newProgramPrice) * 0.15).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-black/60 dark:text-white/60 mt-0.5 pt-0.5 border-t border-red-600/10">
                            <span>Your payout</span>
                            <span className="font-black text-red-600 dark:text-red-400">${(parseFloat(newProgramPrice) * 0.85).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handlePost}
                    disabled={isPosting}
                    className="w-full py-3.5 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-500 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isPosting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Post Reel{linkProgram && (selectedProgramId || createNewProgram) ? ' + Link Program' : ''}
                      </>
                    )}
                  </button>
                </>
              )}

              {!linkProgram && (
                <button
                  onClick={handlePost}
                  disabled={isPosting}
                  className="w-full py-3 bg-[#DC2626] text-white font-bold text-xs rounded-xl hover:bg-[#B91C1C] active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    'Post Reel'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ShoppingBagIcon() {
  return (
    <svg className="w-5 h-5 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
