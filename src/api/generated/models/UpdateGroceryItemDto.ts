/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateGroceryItemDto = {
    name?: string;
    quantity?: number;
    unit?: UpdateGroceryItemDto.unit;
    purchased?: boolean;
};
export namespace UpdateGroceryItemDto {
    export enum unit {
        PIECE_S_ = 'Piece(s)',
        GRAM = 'Gram',
        KILOGRAM = 'Kilogram',
        LITER = 'Liter',
        MILLILITER = 'Milliliter',
    }
}

