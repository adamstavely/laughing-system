/**
 * Base Modal Component
 * Shared foundation for all modal components to eliminate duplication
 */

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import sharedStyles from '../../styles/modal.shared.module.css';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  closeOnBackdropClick?: boolean;
  ariaLabelledBy?: string;
  onOpen?: () => void;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  maxWidth = '700px',
  closeOnBackdropClick = true,
  ariaLabelledBy,
  onOpen,
}: BaseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    modalRef.current?.focus();

    // Call onOpen callback if provided
    onOpen?.();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose, onOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={sharedStyles.modalBackdrop}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || 'modal-title'}
    >
      <div
        ref={modalRef}
        className={sharedStyles.modalContainer}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={sharedStyles.modalHeader}>
          <div className={sharedStyles.modalHeaderLeft}>
            {icon && <span className={sharedStyles.modalHeaderIcon}>{icon}</span>}
            <h2 id={ariaLabelledBy || 'modal-title'}>{title}</h2>
          </div>
          <button
            className={sharedStyles.modalCloseButton}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className={sharedStyles.modalContent}>{children}</div>

        {footer && <div className={sharedStyles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}
