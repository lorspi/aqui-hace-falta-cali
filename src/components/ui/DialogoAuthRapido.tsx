import React from 'react';
import { RegistroPage } from '../../pages/registro/RegistroPage';
import type { ModoRegistro } from '../../types/cuenta';

export interface DialogoAuthRapidoProps {
  abierto: boolean;
  onCerrar: () => void;
  onExito?: (usuario?: any) => void;
  modoInicial?: ModoRegistro;
}

/**
 * Diálogo modal in-situ que reutiliza el módulo oficial de registro y login (RegistroPage)
 * alojado dentro de un contenedor modal accesible y responsive sin alterar su formulario,
 * validaciones ni navegación de pasos.
 */
export const DialogoAuthRapido: React.FC<DialogoAuthRapidoProps> = ({
  abierto,
  onCerrar,
  onExito,
  modoInicial = 'login',
}) => {
  if (!abierto) return null;

  return (
    <RegistroPage
      isModal={true}
      onCerrar={onCerrar}
      onExito={onExito}
      modoInicial={modoInicial}
    />
  );
};
