import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

export const MB = 1024 * 1024;

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const AUDIO_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
];

/** Storage en disco con nombre aleatorio criptográficamente seguro. */
export function diskStorageWithPrefix(prefix = '') {
  return diskStorage({
    destination: './uploads',
    filename: (_req, file, cb) => {
      cb(null, `${prefix}${randomBytes(12).toString('hex')}${extname(file.originalname).toLowerCase()}`);
    },
  });
}

/** Solo imágenes JPG/PNG/WEBP. */
export function imageFileFilter(
  _req: unknown,
  file: { mimetype: string },
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (!IMAGE_MIMES.includes(file.mimetype)) {
    return cb(
      new BadRequestException('Solo se permiten imágenes JPG, PNG o WEBP.'),
      false,
    );
  }
  cb(null, true);
}

/** Audio (MP3/WAV) en los campos de audio e imagen en los de portada. */
export function trackFileFilter(
  _req: unknown,
  file: { mimetype: string; fieldname: string },
  cb: (error: Error | null, accept: boolean) => void,
) {
  const isAudioField = ['audio', 'audioFile'].includes(file.fieldname);
  const allowed = isAudioField ? AUDIO_MIMES : IMAGE_MIMES;
  if (!allowed.includes(file.mimetype)) {
    return cb(
      new BadRequestException(
        isAudioField
          ? 'El audio debe ser un archivo MP3 o WAV.'
          : 'La portada debe ser una imagen JPG, PNG o WEBP.',
      ),
      false,
    );
  }
  cb(null, true);
}
