/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ItemOverrideDto = {
    id?: string;
    quantity?: number;
    unit?: ItemOverrideDto.unit;
};
export namespace ItemOverrideDto {
    export enum unit {
        PIECE_S_ = 'Piece(s)',
        GRAM = 'Gram',
        KILOGRAM = 'Kilogram',
        LITER = 'Liter',
        MILLILITER = 'Milliliter',
    }
}

