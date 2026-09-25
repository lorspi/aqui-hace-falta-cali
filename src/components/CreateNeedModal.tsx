import React from 'react';
import { Need } from '../types';
import { PedirPage } from '../pages/flujos/PedirPage';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Partial<Need>) => Promise<void>;
  isSubmitting?: boolean;
  initialCityId?: string;
  onRequireAuth?: () => void;
}

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <PedirPage
      isModal
      onClose={onClose}
      onSuccess={async () => {
        if (onSubmit) {
          try {
            await onSubmit({});
          } catch {
            /* Handled upstream */
          }
        }
        onClose();
      }}
    />
  );
};
