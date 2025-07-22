'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionForm({ initialData = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    question: { en: '', ar: '', fr: '', de: '', es: '', pt: '' },
    options: ['', '', '', ''],
    correctAnswer: '', 
    categoryId: '',
    difficulty: 'medium'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Convert old format to new format if needed
      const convertedData = initialData.options?.en 
        ? initialData 
        : {
            ...initialData,
            question: initialData.question || { en: '', ar: '', fr: '', de: '', es: '', pt: '' },
            options: initialData.options || ['', '', '', ''],
            correctAnswer: initialData.correctAnswer || ''
          };
      setFormData(convertedData);
    }
    fetchCategories();
  }, [initialData]);

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    const data = await res.json();
    setCategories(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = initialData 
        ? `/api/admin/questions?id=${initialData.id}`
        : '/api/admin/questions';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialData ? { id: initialData.id, ...formData } : formData)
      });
      
      if (response.ok) {
        router.push('/admin/questions');
      }
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Question translations */}
        {['en', 'ar', 'fr', 'de', 'es', 'pt'].map(lang => (
          <div key={lang} className="border p-4 rounded">
            <h3 className="font-bold mb-3">{lang.toUpperCase()}</h3>
            
            <div className="mb-4">
              <label className="block mb-1">Question ({lang})</label>
              <input
                type="text"
                name={`question.${lang}`}
                value={formData.question[lang] || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required={lang === 'en'} // Only English question is required
              />
            </div>
          </div>
        ))}
      </div>

      {/* Options section (English only) */}
      <div className="border p-4 rounded">
        <h3 className="font-bold mb-3">Options (English Only)</h3>
        {[0, 1, 2, 3].map(index => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={formData.options[index] || ''}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-1 p-2 border rounded"
              required
            />
            <input
              type="radio"
              name="correctAnswer"
              value={formData.options[index]}
              checked={formData.correctAnswer === formData.options[index]}
              onChange={() => setFormData(prev => ({
                ...prev,
                correctAnswer: prev.options[index]
              }))}
              className="ml-2"
            />
          </div>
        ))}
      </div>

      {/* Correct answer display (read-only) */}
      <div className="border p-4 rounded">
        <h3 className="font-bold mb-3">Correct Answer</h3>
        <input
          type="text"
          value={formData.correctAnswer || ''}
          readOnly
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>
      
      <div className="flex space-x-4">
        <div className="w-full md:w-1/2">
          <label className="block mb-1">Category</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block mb-1">Difficulty</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/admin/questions')}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-400"
        >
          {loading ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
}