import React from 'react';
import { Offer } from '../types';
import { OfrecerPage } from '../pages/flujos/OfrecerPage';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newOffer?: Offer) => void;
  selectedCityId?: string;
  onRequireAuth?: () => void;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <OfrecerPage
      isModal
      onClose={onClose}
      onSuccess={() => {
        if (onSuccess) {
          try {
            onSuccess();
          } catch {
            /* Handled upstream */
          }
        }
        onClose();
      }}
    />
  );
};
