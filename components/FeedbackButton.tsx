'use client';

import { useState } from 'react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute top-4 right-4 z-40 p-1.5 rounded-full shadow-md transition-all hover:scale-110 active:scale-95 lg:top-6 lg:right-6"
        style={{
          backgroundColor: 'rgba(0, 255, 65, 0.15)',
          border: '1px solid var(--accent-color)',
          color: 'var(--accent-color)',
        }}
        aria-label="Send Feedback"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
        </svg>
      </button>

      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
