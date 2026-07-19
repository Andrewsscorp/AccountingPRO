import { Decimal } from 'decimal.js';

export class InvalidEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEntryError';
  }
}

export class UnbalancedTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnbalancedTransactionError';
  }
}

export interface MovimientoInput {
  debito: number | string;
  credito: number | string;
}

export class LedgerService {
  /**
   * Valida un asiento contable asegurando la partida doble.
   * La suma de los débitos debe ser exactamente igual a la suma de los créditos.
   * Además, debe haber al menos un débito y un crédito (mínimo dos movimientos).
   *
   * @param movimientos Array de movimientos contables con sus débitos y créditos.
   * @returns true si el asiento es válido.
   * @throws InvalidEntryError si hay menos de dos movimientos.
   * @throws UnbalancedTransactionError si la suma de débitos y créditos no cuadra.
   */
  public static validateDoubleEntry(movimientos: MovimientoInput[]): boolean {
    if (!movimientos || movimientos.length < 2) {
      throw new InvalidEntryError('Un asiento contable debe tener al menos dos movimientos.');
    }

    let totalDebitos = new Decimal(0);
    let totalCreditos = new Decimal(0);

    for (const mov of movimientos) {
      totalDebitos = totalDebitos.plus(new Decimal(mov.debito || 0));
      totalCreditos = totalCreditos.plus(new Decimal(mov.credito || 0));
    }

    if (!totalDebitos.equals(totalCreditos)) {
      throw new UnbalancedTransactionError(
        `Descuadre en asiento: Débitos (${totalDebitos.toString()}) != Créditos (${totalCreditos.toString()})`
      );
    }

    return true;
  }
}
