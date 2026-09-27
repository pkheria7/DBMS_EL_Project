import React, { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '../api/client';

const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

export default function FileUploadButton({ onUpload, label = 'Upload File' }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');

    const form = new FormData();
    form.append('file', file);

    try {
      const { data } = await client.post('/api/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStatus('done');
      onUpload(data.url);
      toast.success('File uploaded successfully');
    } catch (err) {
      setStatus('error');
      const detail = err.response?.data?.detail || 'Upload failed. Please try again.';
      toast.error(detail);
    } finally {
      // reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-3 mt-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={status === 'uploading'}
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-500 rounded-lg text-slate-200 text-sm transition-all"
      >
        {status === 'uploading' ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : status === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>
          {status === 'uploading'
            ? 'Uploading…'
            : status === 'done'
            ? 'Uploaded'
            : label}
        </span>
      </button>

      {fileName && status !== 'idle' && (
        <span className="text-slate-400 text-xs truncate max-w-[180px]" title={fileName}>
          {fileName}
        </span>
      )}
    </div>
  );
}
