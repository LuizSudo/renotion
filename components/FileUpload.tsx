"use client";

import { useCallback, useState } from "react";
import { Image, FileText } from "lucide-react";

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void;
  accept?: string;
  maxSizeMB?: number;
  multiple?: false;
}

export function FileUpload({ onUpload, accept, maxSizeMB = 10, multiple = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const file = files[0];
      if (!file) return;

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Arquivo muito grande (máx. ${maxSizeMB}MB)`);
        return;
      }

      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Falha no upload");
        }

        const data = await res.json();
        onUpload(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro no upload");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept || "";
    input.multiple = multiple;
    input.onchange = () => {
      if (input.files) handleFileSelect(input.files);
    };
    input.click();
  };

  const isImage = accept?.startsWith("image/");

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
        ${isDragging
          ? "border-primary bg-accent"
          : "border-border hover:border-ring/50 hover:bg-accent/50"
        }
      `}
    >
      <input type="file" hidden accept={accept} multiple={multiple} onChange={(e) => e.target.files && handleFileSelect(e.target.files)} />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Enviando...</p>
        </div>
      ) : (
        <>
          <div className="mx-auto h-12 w-12 rounded-full bg-accent flex items-center justify-center mb-3">
            {isImage ? <Image size={24} className="text-muted-foreground" aria-hidden="true" /> : <FileText size={24} className="text-muted-foreground" />}
          </div>
          <p className="text-sm font-medium text-foreground">
            {isImage ? "Clique ou arraste uma imagem" : "Clique ou arraste um arquivo"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Máx. {maxSizeMB}MB • {accept || "Todos os tipos"}</p>
        </>
      )}

      {error && (
        <div className="mt-3 p-2 rounded-md bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}