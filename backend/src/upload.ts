import crypto from 'crypto';
import type { Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedRequest } from './billing.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function safeFileExtFromMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'bin';
}

export function createPhotoUploadInitHandler(supabase: SupabaseClient) {
  return async function photoUploadInitHandler(req: AuthenticatedRequest, res: Response) {
    if (!req.auth?.userId) {
      res.status(401).json({ ok: false, error: 'Authentication required.' });
      return;
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'ancestry-photos';
    const mimeType = String(req.body?.mimeType || '').toLowerCase().trim();
    const fileSizeBytes = Number(req.body?.fileSizeBytes || 0);
    const originalFileName = String(req.body?.fileName || '').trim();

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({
        ok: false,
        error: 'Unsupported mimeType. Allowed: image/jpeg, image/png, image/webp.'
      });
      return;
    }

    const maxBytes = Number(process.env.MAX_PHOTO_UPLOAD_BYTES || 8 * 1024 * 1024);
    if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0 || fileSizeBytes > maxBytes) {
      res.status(400).json({
        ok: false,
        error: `Invalid file size. Must be 1..${maxBytes} bytes.`
      });
      return;
    }

    const ext = safeFileExtFromMime(mimeType);
    const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const id = crypto.randomUUID();
    const path = `users/${req.auth.userId}/photos/${id}.${ext}`;
    const expiresIn = Number(process.env.SUPABASE_UPLOAD_URL_TTL_SECONDS || 300);

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: false });

    if (error || !data) {
      res.status(500).json({ ok: false, error: error?.message || 'Failed to create upload URL.' });
      return;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

    res.status(200).json({
      ok: true,
      upload: {
        uploadMethod: 'PUT',
        uploadUrl: data.signedUrl,
        token: data.token,
        requiredHeaders: { 'Content-Type': mimeType },
        expiresInSeconds: expiresIn,
        bucket,
        path,
        mimeType,
        maxBytes,
        fileUrl: publicUrlData.publicUrl,
        note: 'Store fileUrl and pass it as photo.uploadedPhotoUrl in ancestry profile requests.'
      }
    });
  };
}
