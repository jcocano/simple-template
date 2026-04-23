-- Bundle M.2 · Local-first image storage.
-- `local_path` es el nombre físico (relativo a workspaceImagesDir(wsId)) para
-- filas con provider='local'. Para los demás providers queda NULL — la URL de
-- red (imgbb/cloudinary/s3/github/ftp) o data: (base64) ya vive en `url` y es
-- la fuente autoritativa del render.

ALTER TABLE images ADD COLUMN local_path TEXT;
