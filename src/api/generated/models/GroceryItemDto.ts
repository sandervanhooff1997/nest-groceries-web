/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GroceryItemDto = {
    name: string;
    quantity?: number;
    unit?: GroceryItemDto.unit;
    purchased?: boolean;
};
export namespace GroceryItemDto {
    export enum unit {
        PIECE_S_ = 'Piece(s)',
        GRAM = 'Gram',
        KILOGRAM = 'Kilogram',
        LITER = 'Liter',
        MILLILITER = 'Milliliter',
    }
}

