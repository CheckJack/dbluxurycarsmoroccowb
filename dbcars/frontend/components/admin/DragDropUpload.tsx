'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface DragDropUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxSize?: number; // in MB
  className?: string;
  label?: string;
  helperText?: string;
}

export default function DragDropUpload({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  disabled = false,
  maxSize = 5,
  className = '',
  label,
  helperText,
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes

    for (const file of files) {
      // Check file size
      if (file.size > maxSizeBytes) {
        console.warn(`File ${file.name} is too large. Max size is ${maxSize}MB`);
        continue;
      }

      // Check file type if accept is specified
      if (accept && accept !== '*') {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        const fileType = file.type;
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        const isAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return type === fileExtension;
          } else if (type.includes('/*')) {
            const baseType = type.split('/')[0];
            return fileType.startsWith(baseType + '/');
          } else {
            return fileType === type;
          }
        });

        if (!isAccepted) {
          console.warn(`File ${file.name} is not an accepted file type`);
          continue;
        }
      }

      // File passed all validations
      validFiles.push(file);
    }

    return validFiles;
  }, [accept, maxSize]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = validateFiles(multiple ? fileArray : [fileArray[0]]);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [multiple, validateFiles, onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-500/10 border-solid'
            : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:bg-gray-800'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          {isDragging ? (
            <>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 animate-bounce" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-blue-400">
                Drop files here
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-gray-600 transition-colors">
                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base font-medium text-gray-300 mb-1">
                Drag and drop {multiple ? 'images' : 'an image'} here, or{' '}
                <span className="text-blue-400 hover:text-blue-300 underline">
                  browse
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {accept.includes('image') ? 'Images' : 'Files'} up to {maxSize}MB
                {multiple ? ' (multiple files allowed)' : ''}
              </p>
            </>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 mt-2">
          {helperText}
        </p>
      )}
    </div>
  );
}

