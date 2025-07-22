'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BulkUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        setPreviewData(jsonData.slice(0, 3)); // Show first 3 items as preview
      } catch (err) {
        setError('Invalid JSON file');
        setPreviewData(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !previewData) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          const response = await fetch('/api/admin/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: jsonData })
          });

          if (response.ok) {
            const result = await response.json();
            setSuccess(`Successfully uploaded ${result.count} questions!`);
            setFile(null);
            setPreviewData(null);
            document.getElementById('file-upload').value = '';
          } else {
            setError('Error uploading questions');
          }
        } catch (err) {
          setError('Error processing file');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Bulk Upload Questions</h2>

      <div className="border p-6 rounded-lg bg-gray-50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">JSON File</label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Upload a JSON file containing an array of question objects
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 text-green-700 rounded">
              {success}
            </div>
          )}

          {previewData && (
            <div>
              <h3 className="font-medium mb-2">Preview (first 3 items):</h3>
              <div className="bg-white p-4 rounded border overflow-x-auto">
                <pre className="text-sm">{JSON.stringify(previewData, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
            >
              {loading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </div>
        </form>
      </div>

      <div className="border p-6 rounded-lg bg-gray-50">
        <h3 className="font-bold mb-3">JSON Format Example</h3>
        <pre className="bg-white p-4 rounded border overflow-x-auto text-sm">
            {`[
              {
                "question": {
                  "en": "What is the capital of France?",
                  "ar": "ما هي عاصمة فرنسا؟",
                  "fr": "Quelle est la capitale de la France ?"
                },
                "options": ["Paris", "London", "Berlin", "Madrid"],
                "correctAnswer": "Paris",
                "categoryId": "GEOGRAPHY_ID",
                "difficulty": "easy"
              },
              // More questions...
            ]`}
        </pre>
      </div>
    </div>
  );
}