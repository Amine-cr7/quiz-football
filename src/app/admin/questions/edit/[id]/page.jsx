'use client'
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QuestionForm from '@/components/admin/QuestionForm';

export default function EditQuestionPage() {
  const params = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await fetch(`/api/admin/questions?id=${params.id}`);
        const data = await res.json();
        setQuestion(data);
      } catch (error) {
        console.error('Error fetching question:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestion();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!question) return <div>Question not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Question</h1>
      <QuestionForm initialData={question} />
    </div>
  );
}