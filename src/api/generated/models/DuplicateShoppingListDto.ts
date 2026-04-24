/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ItemOverrideDto } from './ItemOverrideDto';
export type DuplicateShoppingListDto = {
    /**
     * Optional list of item IDs to duplicate. If omitted, all items are duplicated.
     */
    itemIds?: Array<string>;
    /**
     * Per-item quantity/unit overrides applied during duplication.
     */
    itemOverrides?: Array<ItemOverrideDto>;
};

