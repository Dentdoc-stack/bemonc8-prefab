'use client';

import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export default function FileUpload({ onFileSelect, loading, error }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setFileName(file.name);
        onFileSelect(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full">
      <Card
        className={`relative border-3 border-dashed transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'hover:border-muted-foreground/50'
        } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleChange}
          disabled={loading}
        />
        <CardContent className="p-12 text-center">
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              {loading ? 'Processing...' : 'Drop your Excel file here'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse (.xlsx, .xls)
            </p>
            {fileName && !loading && (
              <p className="text-sm text-green-600 font-medium">
                ✓ {fileName}
              </p>
            )}
          </label>
        </CardContent>
      </Card>

      {error && (
        <Card className="mt-4 border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
