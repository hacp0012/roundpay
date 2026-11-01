export async function compressImageFile(file: File, maxEdge = 512, quality = 0.86): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Veuillez choisir une image (JPG, PNG, WEBP ou GIF).');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error("Impossible de traiter l'image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Impossible de compresser l'image."))),
      'image/jpeg',
      quality,
    );
  });

  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}
