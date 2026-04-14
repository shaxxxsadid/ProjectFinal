

export interface AccountTypeStat {
    _id: string;
    count: number;
}

export interface AccountProviderStat {
    _id: string;
    count: number;
}

export interface UserRegistrationStat {
    _id: string; // дата в формате "YYYY-MM-DD"
    count: number;
}

export interface UserActiveStat {
    _id: boolean; // true = активные, false = неактивные
    count: number;
}

export interface UserRoleStat {
    _id: string; // название роли
    count: number;
}

export interface DashboardClientProps {
    accountTypeStats: AccountTypeStat[];
    accountProviderStats: AccountProviderStat[];
    userRegistrationStats: UserRegistrationStat[];
    userActiveStats: UserActiveStat[];
    userRoleStats: UserRoleStat[];
    stokeStats: StokeStat[];
}

export interface StokeStat {
    _id: string; // название склада
    count: number; // общее количество товаров на складе
}