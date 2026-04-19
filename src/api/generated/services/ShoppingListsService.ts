/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateShoppingListDto } from '../models/CreateShoppingListDto';
import type { DuplicateShoppingListDto } from '../models/DuplicateShoppingListDto';
import type { GroceryItemDto } from '../models/GroceryItemDto';
import type { UpdateShoppingListDto } from '../models/UpdateShoppingListDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShoppingListsService {
    /**
     * Create a shopping list
     * @returns any The shopping list has been created.
     * @throws ApiError
     */
    public static shoppingListsControllerCreate({
        requestBody,
    }: {
        requestBody: CreateShoppingListDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/shopping-lists',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List the current user's shopping lists
     * @returns any Shopping lists retrieved successfully.
     * @throws ApiError
     */
    public static shoppingListsControllerFindAll(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shopping-lists',
        });
    }
    /**
     * Get a shopping list by id for the current user
     * @returns any Shopping list retrieved successfully.
     * @throws ApiError
     */
    public static shoppingListsControllerFindById({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/shopping-lists/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a shopping list for the current user
     * @returns any Shopping list updated successfully.
     * @throws ApiError
     */
    public static shoppingListsControllerUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: UpdateShoppingListDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/shopping-lists/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete a shopping list for the current user
     * @returns any Shopping list deleted successfully.
     * @throws ApiError
     */
    public static shoppingListsControllerDelete({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/shopping-lists/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Duplicate a shopping list for the current user
     * @returns any Shopping list duplicated successfully.
     * @throws ApiError
     */
    public static shoppingListActionsControllerDuplicate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: DuplicateShoppingListDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/shopping-lists/{id}/duplicate',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add a grocery item to a shopping list
     * @returns any Grocery item added successfully.
     * @throws ApiError
     */
    public static groceryItemsControllerAddItem({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: GroceryItemDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/shopping-lists/{id}/items',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a grocery item from a shopping list
     * @returns any Grocery item removed successfully.
     * @throws ApiError
     */
    public static groceryItemsControllerRemoveItem({
        id,
        itemId,
    }: {
        id: string,
        itemId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/shopping-lists/{id}/items/{itemId}',
            path: {
                'id': id,
                'itemId': itemId,
            },
        });
    }
    /**
     * Mark a grocery item as complete
     * @returns any Grocery item marked as complete.
     * @throws ApiError
     */
    public static groceryItemActionsControllerCompleteItem({
        id,
        itemId,
    }: {
        id: string,
        itemId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/shopping-lists/{id}/items/{itemId}/complete',
            path: {
                'id': id,
                'itemId': itemId,
            },
        });
    }
    /**
     * Mark a grocery item as uncomplete
     * @returns any Grocery item marked as uncomplete.
     * @throws ApiError
     */
    public static groceryItemActionsControllerUncompleteItem({
        id,
        itemId,
    }: {
        id: string,
        itemId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/shopping-lists/{id}/items/{itemId}/uncomplete',
            path: {
                'id': id,
                'itemId': itemId,
            },
        });
    }
}
