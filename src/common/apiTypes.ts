
export interface IApiResponse {
    data?: object
    error?: {
        code?: number,
        message: string
    }
}
// export interface IApiSuccess {
//     data: object
// }
//
// export interface IApiError {
//     error: {
//         code?: number,
//         message: string
//     }
// }