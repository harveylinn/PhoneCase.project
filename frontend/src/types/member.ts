export interface MemberInfo {
    id: number;
    account: string;
    name: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    member?: MemberInfo;
}

export interface MeResponse {
    success: boolean;
    message?: string;
    member?: MemberInfo;
}