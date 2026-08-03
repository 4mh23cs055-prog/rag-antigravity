import { useState } from 'react';
import { useChatContext } from '../context/ChatContext';
import { uploadDocuments } from '../services/api';

export function useUpload() {
  const { addDocuments, addToast, setIsUploadModalOpen } = useChatContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [indexingStatus, setIndexingStatus] = useState<string>('');

  const handleUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setIndexingStatus('Uploading documents to server...');

    try {
      setIndexingStatus('Processing files & generating BAAI/bge-small-en embeddings...');
      const response = await uploadDocuments(files, (progress) => {
        setUploadProgress(progress);
        if (progress === 100) {
          setIndexingStatus('Splitting text (1000/200) & Upserting into Pinecone...');
        }
      });

      if (response.success && response.documents) {
        const indexedOnly = response.documents.filter((d: any) => d.status === 'indexed');
        addDocuments(indexedOnly);
        
        addToast({
          type: 'success',
          title: 'Documents Indexed',
          message: response.message || `Indexed ${indexedOnly.length} file(s) into Pinecone.`,
        });
        setIsUploadModalOpen(false);
      } else {
        addToast({
          type: 'warning',
          title: 'Upload Warning',
          message: response.message || 'Some files failed to index.',
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.error?.message || error.message || 'Failed to upload documents.',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setIndexingStatus('');
    }
  };

  return {
    isUploading,
    uploadProgress,
    indexingStatus,
    handleUpload,
  };
}
