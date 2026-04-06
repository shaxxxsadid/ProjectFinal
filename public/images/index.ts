import MenuBlack from "@/public/menuBlack.svg";
import MenuWhite from "@/public/menuWhite.svg";
import Moon from "@/public/moon.svg";
import Sun from "@/public/sun.svg";
import LogInWhite from "@/public/login-white.svg";
import LogInBlack from "@/public/login-black.svg";
import LogOutWhite from "@/public/logout-white.svg";
import LogOutBlack from "@/public/logout-black.svg";
import HomeBlack from "@/public/home-black.svg";
import HomeWhite from "@/public/home-white.svg";
import CatalogWhite from "@/public/catalog-white.svg";
import CatalogBlack from "@/public/catalog-black.svg";
import PanelWhite from "@/public/panel-white.svg";
import PanelBlack from "@/public/panel-black.svg";
import UserPlaceholderWhite from "@/public/user-placeholder-white.svg";
import UserPlaceholderBlack from "@/public/user-placeholder-black.svg";
import LockWhite from "@/public/lock-white.svg";
import LockBlack from "@/public/lock-black.svg";

export const Images = {
    dark: {
        menu: MenuBlack,
        moon: Moon,
        logIn: LogInWhite,
        logOut: LogOutWhite,
        home: HomeBlack,
        catalog: CatalogWhite,
        panel: PanelWhite,
        admin: LockWhite,
        userPlaceholder: UserPlaceholderWhite,
    },
    light: {
        menu: MenuWhite,
        sun: Sun,
        logIn: LogInBlack,
        logOut: LogOutBlack,
        home: HomeWhite,
        catalog: CatalogBlack,
        panel: PanelBlack,
        admin: LockBlack,
        userPlaceholder: UserPlaceholderBlack,
    }
} as const;

export { MenuBlack, MenuWhite, Moon, Sun, LogInWhite, LogInBlack, LogOutWhite, LogOutBlack };