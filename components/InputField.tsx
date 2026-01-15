import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
  rows?: number;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  id, 
  isTextArea = false, 
  className = '',
  rows,
  ...props 
}) => {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  // Added bg-white and text-gray-900 to ensure high contrast and prevent browser default dark styles
  const commonStyles = "w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-royalBlue focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400 bg-white text-gray-900";

  return (
    <div className="mb-6">
      <label 
        htmlFor={inputId} 
        className="block mb-2 text-xl font-bold text-gray-800"
      >
        {label}
      </label>
      {isTextArea ? (
        <textarea
          id={inputId}
          className={`${commonStyles} min-h-[150px] ${className}`}
          rows={rows}
          {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      ) : (
        <input
          id={inputId}
          className={`${commonStyles} ${className}`}
          {...props as React.InputHTMLAttributes<HTMLInputElement>}
        />
      )}
    </div>
  );
};