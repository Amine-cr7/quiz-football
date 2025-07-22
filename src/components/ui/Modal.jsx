'use client'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export const Modal = ({
  children,
  isOpen = false,
  onClose,
  title,
  closeOnOutsideClick = true,
  className
}) => {
  const modalRef = useRef(null)
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
  
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose?.()
    }
  }
  
  if (!isOpen) return null
  
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOutsideClick}
    >
      <div
        ref={modalRef}
        className={clsx(
          'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="border-b p-4">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        
        <div className="p-4">
          {children}
        </div>
        
        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Helper function for class concatenation
function clsx(...args) {
  return args.filter(Boolean).join(' ')
} 
