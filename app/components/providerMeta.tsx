import { FaGoogle } from "react-icons/fa";
import { FaApple, FaAt, FaGithubAlt, FaOdnoklassniki, FaVk, FaYandexInternational } from "react-icons/fa6";

export type ProviderMeta = {
    icon: React.ElementType;
    label: string;
    color: string;
};

export const PROVIDER_META: Record<string, ProviderMeta> = {
    google:  { icon: FaGoogle,              label: "Google",  color: "bg-red-500/10 text-red-400 border-red-500/20" },
    github:  { icon: FaGithubAlt,           label: "GitHub",  color: "bg-foreground/10 text-foreground/60 border-foreground/15" },
    vk:      { icon: FaVk,                  label: "VK",      color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    yandex:  { icon: FaYandexInternational, label: "Yandex",  color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    mailru:  { icon: FaAt,                  label: "Mail.ru", color: "bg-blue-400/10 text-blue-300 border-blue-400/20" },
    ok:      { icon: FaOdnoklassniki,       label: "OK",      color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    apple:   { icon: FaApple,               label: "Apple",   color: "bg-foreground/10 text-foreground/60 border-foreground/15" },
};