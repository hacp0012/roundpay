import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useModalHistory } from '../../hooks/useModalHistory';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalId?: string;
  children: React.ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  placement?: 'center' | 'right';
  ariaLabelledBy?: string;
}

const overlayEase = [0.22, 1, 0.36, 1] as const;

/**
 * Shared modal shell:
 * - Browser / Android back closes the modal (history)
 * - Escape closes the modal
 * - Click on the empty overlay closes the modal
 * - Soft fade + scale enter / exit
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  modalId = 'modal',
  children,
  overlayClassName = 'items-center justify-center p-4',
  panelClassName = 'w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl border border-[#eceef3]',
  placement = 'center',
  ariaLabelledBy,
}) => {
  useModalHistory({ isOpen, onClose, modalId });

  const isBottomSheet = overlayClassName.includes('items-end');
  const isRightDrawer = placement === 'right';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={modalId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={ariaLabelledBy}
          className={`fixed inset-0 z-50 flex overflow-y-auto ${overlayClassName}`}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: overlayEase }}
            onClick={onClose}
          />
          <motion.div
            className={`relative ${panelClassName}`}
            initial={
              isRightDrawer
                ? { opacity: 0, x: '100%' }
                : isBottomSheet
                  ? { opacity: 0, y: 36, scale: 0.98 }
                  : { opacity: 0, y: 14, scale: 0.96 }
            }
            animate={isRightDrawer ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={
              isRightDrawer
                ? { opacity: 0, x: '100%' }
                : isBottomSheet
                  ? { opacity: 0, y: 28, scale: 0.98 }
                  : { opacity: 0, y: 8, scale: 0.97 }
            }
            transition={{ duration: 0.26, ease: overlayEase }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
