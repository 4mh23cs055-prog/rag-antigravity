import React, { useState, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useUpload } from '../hooks/useUpload';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const DocumentUploadModal: React.FC = () => {
  const { isUploadModalOpen, setIsUploadModalOpen } = useChatContext();
  const { isUploading, uploadProgress, indexingStatus, handleUpload } = useUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadModalOpen) return null;

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = () => {
    if (selectedFiles.length > 0) {
      handleUpload(selectedFiles);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base font-outfit">Upload & Index Documents</h3>
              <p className="text-xs text-slate-400">PDF, TXT, Markdown, HTML, DOCX (Max 25MB)</p>
            </div>
          </div>
          <button
            onClick={() => !isUploading && setIsUploadModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Body */}
        <div className="p-6 space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.markdown,.html,.htm,.docx"
              onChange={onFileSelect}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-3 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">
              Click or drag documents here to upload
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports multiple PDFs, TXT, MD & HTML files
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Selected Files ({selectedFiles.length})
              </span>
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-slate-200 font-medium truncate">{file.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress / Status */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  {indexingStatus || 'Processing...'}
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsUploadModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
            disabled={isUploading}
          >
            Cancel
          </button>

          <button
            onClick={startUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Indexing...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Start Indexing</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
