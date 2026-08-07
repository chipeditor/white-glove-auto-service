'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileText, Film, Trash2, Loader2 } from 'lucide-react';

/// The subset of media_assets this component actually renders. Exported so
/// callers can type their query results against it instead of re-declaring.
export interface UploadedFile {
  id: string;
  url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  type: string;
  caption: string | null;
  created_at: string;
}

type MediaAsset = UploadedFile;

interface FileUploadProps {
  vehicleId: string;
  organizationId: string;
  inspectionId?: string;
  inspectionItemId?: string;
  existingFiles?: MediaAsset[];
  onUploadComplete?: (asset: MediaAsset) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function FileUpload({
  vehicleId,
  organizationId,
  inspectionId,
  inspectionItemId,
  existingFiles = [],
  onUploadComplete,
  onDelete,
  compact = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<MediaAsset[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaAsset | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', vehicleId);
    formData.append('organizationId', organizationId);
    if (inspectionId) formData.append('inspectionId', inspectionId);
    if (inspectionItemId) formData.append('inspectionItemId', inspectionItemId);

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setFiles(prev => [data.asset, ...prev]);
      onUploadComplete?.(data.asset);
    } catch {
      setError('Upload failed — please try again');
    } finally {
      setUploading(false);
    }
  }, [vehicleId, organizationId, inspectionId, inspectionItemId, onUploadComplete]);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(uploadFile);
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
        if (selectedFile?.id === id) setSelectedFile(null);
        onDelete?.(id);
      }
    } catch { /* ignore */ }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileIcon = (type: string) => {
    if (type === 'photo') return <Image className="w-4 h-4" />;
    if (type === 'video') return <Film className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
          ${dragOver ? 'border-wg-gold bg-wg-gold/5' : 'border-wg-border hover:border-wg-gold/50'}
          ${compact ? 'p-4' : 'p-8'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*,.pdf"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-wg-gold animate-spin" />
          ) : (
            <Upload className={`text-wg-muted ${compact ? 'w-5 h-5' : 'w-8 h-8'}`} />
          )}
          <div>
            <p className={`text-wg-text ${compact ? 'text-xs' : 'text-sm'} font-medium`}>
              {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
            </p>
            {!compact && (
              <p className="text-xs text-wg-muted mt-1">
                JPG, PNG, GIF, HEIC, PDF, MP4 — max 10 MB
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Gallery */}
      {files.length > 0 && (
        <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'}`}>
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-square rounded-lg overflow-hidden bg-wg-card border border-wg-border cursor-pointer hover:border-wg-gold/50 transition-colors"
              onClick={() => setSelectedFile(file)}
            >
              {file.type === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                  {fileIcon(file.type)}
                  <span className="text-[10px] text-wg-muted text-center line-clamp-2 break-all">
                    {file.file_name}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                  className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setSelectedFile(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            {selectedFile.type === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedFile.url}
                alt={selectedFile.file_name}
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <div className="bg-wg-card rounded-lg p-8 text-center">
                {fileIcon(selectedFile.type)}
                <p className="text-wg-text mt-2">{selectedFile.file_name}</p>
                <a
                  href={selectedFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block px-4 py-2 bg-wg-gold text-black rounded-lg text-sm font-medium"
                >
                  Download
                </a>
              </div>
            )}
            <div className="mt-3 text-center">
              <p className="text-sm text-white/80">{selectedFile.file_name}</p>
              <p className="text-xs text-white/50">{formatSize(selectedFile.file_size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
