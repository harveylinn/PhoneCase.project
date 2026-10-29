export interface MemberInfo {
    id: number;
    account: string;
    name: string;
    email: string;
    phone: string | null;
    defaultAddress: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface ProfileUpdate {
    name?: string;
    phone?: string | null;
    defaultAddress?: string | null;
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
