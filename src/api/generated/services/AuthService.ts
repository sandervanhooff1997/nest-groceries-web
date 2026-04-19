/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthTokenResponseDto } from '../models/AuthTokenResponseDto';
import type { IssueTokenDto } from '../models/IssueTokenDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Issue a JWT access token for a validated user payload
     * @returns AuthTokenResponseDto JWT access token issued successfully.
     * @throws ApiError
     */
    public static authControllerIssueToken({
        requestBody,
    }: {
        requestBody: IssueTokenDto,
    }): CancelablePromise<AuthTokenResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/token',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
