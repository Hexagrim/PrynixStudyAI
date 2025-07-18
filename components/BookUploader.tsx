import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import { Spinner } from './Spinner';
import { UploadIcon, BookOpenIcon } from './icons';

// Set up the worker for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

// Pointing directly to the PDF files in the user's GitHub repository.
const predefinedBooks = {
  'Social Studies Grade 9': 'https://raw.githubusercontent.com/Hexagrim/PrynixStudyAI/main/social_1.pdf',
  'Nepali Grade 9': 'https://raw.githubusercontent.com/Hexagrim/PrynixStudyAI/main/nepali.pdf',
  'Optional Math Grade 9': 'https://raw.githubusercontent.com/Hexagrim/PrynixStudyAI/main/opt.pdf',
};

interface BookUploaderProps {
  onBookUploaded: (pages: string[]) => void;
  bookPages: string[];
}

export const BookUploader: React.FC<BookUploaderProps> = ({ onBookUploaded, bookPages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const processPdfFile = useCallback(async (pdfFile: File) => {
    const fileBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(fileBuffer).promise;
    const pages: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    setProgress({ current: 0, total: pdf.numPages });

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      // Using a fixed scale for good quality.
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      await page.render(renderContext).promise;

      pages.push(canvas.toDataURL('image/jpeg').split(',')[1]);
      setProgress({ current: i, total: pdf.numPages });
    }
    canvas.remove(); // Clean up the canvas element from memory
    return pages;
  }, []);

  const handleSelectPredefined = useCallback(async (bookName: keyof typeof predefinedBooks) => {
    setIsLoading(true);
    setError(null);
    setFileName(bookName);
    setProgress({ current: 0, total: 0 });
    
    try {
      const bookUrl = predefinedBooks[bookName];
      
      const response = await fetch(bookUrl);
      if (!response.ok) {
        throw new Error(`Failed to download book: ${response.statusText} (status: ${response.status}). Check if the URL is correct and the repository is public.`);
      }
      
      const pdfBlob = await response.blob();
      const pdfFile = new File([pdfBlob], `${bookName}.pdf`, { type: 'application/pdf' });
      const pages = await processPdfFile(pdfFile);
      onBookUploaded(pages);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to load "${bookName}". ${errorMessage}`);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }, [onBookUploaded, processPdfFile]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setProgress({ current: 0, total: 0 });

    try {
      if (file.type === 'application/pdf') {
        const pages = await processPdfFile(file);
        onBookUploaded(pages);
      } else {
         throw new Error("Invalid file type. Please upload a PDF file.");
      }

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Failed to process file. ${errorMessage}`);
      setFileName(null);
    } finally {
      setIsLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [onBookUploaded, processPdfFile]);

  return (
    <div className="space-y-4 flex-grow flex flex-col min-h-0">
      
      {/* --- Predefined Books --- */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Select a Provided Book</h2>
        <div className="space-y-2">
          {Object.keys(predefinedBooks).map(name => (
            <button
              key={name}
              onClick={() => handleSelectPredefined(name as keyof typeof predefinedBooks)}
              disabled={isLoading}
              className="w-full text-left cursor-pointer bg-slate-800 hover:bg-slate-700/80 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-start transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <BookOpenIcon className="w-5 h-5 mr-3 text-slate-400" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-700 !my-6" />

      {/* --- Custom Upload --- */}
      <div>
        <h2 className="text-lg font-semibold text-slate-300 mb-3">Or Upload a Custom Book</h2>
        <label htmlFor="book-upload" className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <UploadIcon className="w-5 h-5 mr-2" />
          <span>{isLoading ? 'Processing...' : 'Upload Book (PDF)'}</span>
        </label>
        <input id="book-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isLoading} />
      </div>
      
      {isLoading && (
        <div className="flex flex-col justify-center items-center py-4 space-y-2">
          <Spinner />
          {progress.total > 0 && (
            <p className="text-sm text-slate-400">
              Converting page {progress.current} of {progress.total}...
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm py-2 px-3 bg-red-900/30 rounded-md">{error}</p>}
      
      {bookPages.length > 0 && !isLoading && (
        <div className="flex-grow flex flex-col min-h-0 !mt-6">
          <p className="text-sm text-slate-400 mb-2 font-semibold">{fileName || 'Current Book'}: {bookPages.length} pages loaded.</p>
          <div className="flex-grow overflow-y-auto pr-2 rounded-lg bg-slate-800/50 p-2 border border-slate-700">
            <div className="grid grid-cols-3 gap-2">
              {bookPages.map((page, index) => (
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${page}`}
                  alt={`Page ${index + 1}`}
                  className="w-full h-auto object-cover rounded-md aspect-[2/3]"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};