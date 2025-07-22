'use client'
import QuestionForm from '@/components/admin/QuestionForm';

export default function NewQuestionPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Question</h1>
      <QuestionForm />
    </div>
  );
}