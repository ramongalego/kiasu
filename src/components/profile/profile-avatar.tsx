'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui';
import { uploadProfilePicture } from '@/app/(app)/profile/actions';

interface ProfileAvatarProps {
  src: string | null;
  name: string | null;
}

export function ProfileAvatar({ src, name }: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Store preview alongside the src it was created for, so it auto-clears
  // when the server-provided src updates after revalidation.
  const [previewState, setPreviewState] = useState<{
    url: string;
    forSrc: string | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview =
    previewState && previewState.forSrc === src ? previewState.url : null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewState({ url: objectUrl, forSrc: src });

    const formData = new FormData();
    formData.append('file', file);

    startTransition(async () => {
      const result = await uploadProfilePicture(formData);

      if (result.error) {
        setPreviewState(null);
        URL.revokeObjectURL(objectUrl);
        toast.error(result.error);
      } else {
        // Don't clear the preview here — keep it visible until the
        // server-provided `src` prop catches up via revalidation.
        // Clearing it now would briefly flash the old image.
        URL.revokeObjectURL(objectUrl);
        window.dispatchEvent(
          new CustomEvent('profile-picture-updated', {
            detail: result.url,
          }),
        );
      }
    });

    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  return (
    <div className="group relative">
      <Avatar src={preview ?? src} name={name} size="xl" />

      <button
        type="button"
        aria-label="Change profile picture"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
      >
        <Camera className="h-3.5 w-3.5 cursor-pointer" />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
