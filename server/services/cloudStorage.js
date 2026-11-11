import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isSupabaseReady, uploadPhotoToSupabase, deletePhotoFromSupabase } from './supabaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VAULT_UPLOADS_DIR = path.join(__dirname, '../uploads', 'vault');

if (!fs.existsSync(VAULT_UPLOADS_DIR)) {
  fs.mkdirSync(VAULT_UPLOADS_DIR, { recursive: true });
}

/**
 * Uploads a base64 or binary image to Supabase Storage or online CDN (Cloudinary / ImgBB)
 * or persists it on the server filesystem.
 */
export async function uploadImageToOnlineStorage(photoUrl, { userId, date, pose, id, weightKg, notes, type }) {
  if (!photoUrl || typeof photoUrl !== 'string') return photoUrl;
  if (!photoUrl.startsWith('data:image/')) return photoUrl; // Already an online URL

  // 1. Check if Supabase Cloud Storage is configured
  if (isSupabaseReady()) {
    try {
      const res = await uploadPhotoToSupabase(photoUrl, { userId, date, pose, id, weightKg, notes, type });
      if (res?.publicUrl) {
        return res.publicUrl;
      }
    } catch (err) {
      console.warn('[CloudStorage] Supabase photo upload failed, trying fallback:', err.message);
    }
  }

  const matches = photoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches) return photoUrl;

  const rawExt = matches[1].toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const base64Data = matches[2];

  // 2. Check if ImgBB API key is configured (Free online CDN)
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (imgbbKey) {
    try {
      const formData = new URLSearchParams();
      formData.append('image', base64Data);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.success && data.data && data.data.url) {
        return data.data.url;
      }
    } catch (err) {
      console.warn('ImgBB upload failed, falling back to server disk:', err.message);
    }
  }

  // 2. Check if Cloudinary is configured (Free online CDN)
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (cloudName && uploadPreset) {
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: photoUrl,
          upload_preset: uploadPreset,
          folder: `physique_vault/${userId || 'guest'}`
        })
      });
      const data = await res.json();
      if (data && data.secure_url) {
        return data.secure_url;
      }
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to server disk:', err.message);
    }
  }

  // 3. Server-side online file hosting
  try {
    const safeDate = (date || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
    const safePose = (pose || 'pose').toLowerCase();
    const safeUser = (userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '-');
    const filename = `photo-${safeUser}-${safeDate}-${safePose}-${id || Date.now()}.${ext}`;
    const filePath = path.join(VAULT_UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/vault/${filename}`;
  } catch (err) {
    console.error('Failed to write photo to disk, retaining dataUrl:', err.message);
    return photoUrl;
  }
}

export function deleteImageFromOnlineStorage(photoUrl, id) {
  if (!photoUrl || typeof photoUrl !== 'string') return;
  if (isSupabaseReady()) {
    deletePhotoFromSupabase({ photoUrl, id });
  }
  if (photoUrl.startsWith('/uploads/vault/')) {
    try {
      const filename = path.basename(photoUrl);
      const filePath = path.join(VAULT_UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  }
}
