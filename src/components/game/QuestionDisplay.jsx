// src/components/game/QuestionDisplay.jsx
"use client";

export default function QuestionDisplay({ 
  question, 
  options, 
  selectedAnswer, 
  hasAnswered, 
  onAnswerSelect 
}) {
  const handleClick = (option) => {
    if (hasAnswered) return;
    onAnswerSelect(option);
  };

  const renderOptionContent = (option, index) => {
    // Extract text from option object or convert to string
    const optionText = typeof option === 'object' && option !== null && option.text 
      ? option.text 
      : String(option || '');

    return (
      <>
        <span className="font-medium mr-2">
          {String.fromCharCode(65 + index)}.
        </span>
        {optionText}
      </>
    );
  };

  // Helper function to compare options for selection state
  const isOptionSelected = (option) => {
    if (typeof option === 'object' && typeof selectedAnswer === 'object') {
      return JSON.stringify(option) === JSON.stringify(selectedAnswer);
    }
    return option === selectedAnswer;
  };

  if (!question || !options) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {question}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => (
          <button
            key={`option-${index}`}
            onClick={() => handleClick(option)}
            disabled={hasAnswered}
            className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
              isOptionSelected(option)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : hasAnswered
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {renderOptionContent(option, index)}
          </button>
        ))}
      </div>

      {hasAnswered && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">
            {selectedAnswer ? '✓ Answer submitted!' : '⏰ Time up!'} 
            Waiting for other player...
          </p>
        </div>
      )}
    </div>
  );
}