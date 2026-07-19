import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative rounded-2xl bg-gray-800 shadow-xl border border-gray-700 mx-4 md:mx-0">
      <form onSubmit={handleSubmit} className="flex items-end p-2 gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AI..."
          className="w-full max-h-48 min-h-[44px] bg-transparent text-gray-100 placeholder-gray-400 border-0 focus:ring-0 resize-none py-3 px-4 rounded-xl custom-scrollbar"
          disabled={disabled}
          rows={1}
          style={{ height: 'auto' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="p-2.5 mb-0.5 rounded-xl bg-white text-gray-900 disabled:bg-gray-700 disabled:text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
        >
          <SendHorizontal size={20} />
        </button>
      </form>
    </div>
  );
}
