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
  selectedCityId,
  onRequireAuth,
}) => {
  if (!isOpen) return null;

  return (
    <OfrecerPage
      isModal
      initialCityId={selectedCityId}
      onClose={onClose}
      onRequireAuth={onRequireAuth}
      onSuccess={(createdOffer) => {
        if (onSuccess) {
          try {
            onSuccess(createdOffer);
          } catch {
            /* Handled upstream */
          }
        }
      }}
    />
  );
};
