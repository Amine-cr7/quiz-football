// components/ui/Loader.jsx
'use client'

export const Loader = ({ size = 'medium', className }) => {
  const sizes = {
    small: 'h-4 w-4 border-2',
    medium: 'h-6 w-6 border-3',
    large: 'h-8 w-8 border-4'
  }
  
  return (
    <div className={className}>
      <div 
        className={`animate-spin rounded-full border-solid border-current border-t-transparent ${sizes[size]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}