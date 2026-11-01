import { useEffect, useRef } from 'react';

interface UseModalHistoryOptions {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
}

/**
 * Hook to manage modal open/close state in browser history.
 * - Pushes a history state when modal opens so pressing the Back button closes the modal.
 * - Handles ESC key to close.
 * - Pops the history entry if closed programmatically or by backdrop click.
 */
export function useModalHistory({ isOpen, onClose, modalId = 'modal' }: UseModalHistoryOptions) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      if (isPushedRef.current) {
        isPushedRef.current = false;
        if (window.history.state?._modalId === modalId) {
          window.history.back();
        }
      }
      return;
    }

    // Modal is now open
    isPushedRef.current = true;
    window.history.pushState({ _modalId: modalId, _isModal: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      // Browser / mobile back button was pressed
      if (isPushedRef.current) {
        isPushedRef.current = false;
        onCloseRef.current();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, modalId]);
}
