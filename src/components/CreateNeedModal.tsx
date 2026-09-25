import React from 'react';
import { Need } from '../types';
import { PedirPage } from '../pages/flujos/PedirPage';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Partial<Need>) => Promise<void>;
  onSuccess?: (createdNeed?: Need) => void;
  isSubmitting?: boolean;
  initialCityId?: string;
  onRequireAuth?: () => void;
}

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCityId,
  onRequireAuth,
}) => {
  if (!isOpen) return null;

  return (
    <PedirPage
      isModal
      initialCityId={initialCityId}
      onClose={onClose}
      onRequireAuth={onRequireAuth}
      onSuccess={(createdNeed) => {
        if (onSuccess) {
          try {
            onSuccess(createdNeed);
          } catch {
            /* Handled upstream */
          }
        }
      }}
    />
  );
};
