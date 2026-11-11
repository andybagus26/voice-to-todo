import Link from "next/link";
import { cn } from "@/lib/cn";
import { Ikon } from "./Ikon";

export type HalamanAktif = "beranda" | "riwayat";

type Props = {
  aktif: HalamanAktif;
  className?: string;
};

export function NavigasiBawah({ aktif, className }: Props) {
  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        "border-t border-garis bg-permukaan pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto flex h-[75px] w-full max-w-[390px] justify-between px-[15px] pt-[5px]">
        <ItemNav
          href="/"
          label="Beranda"
          aktif={aktif === "beranda"}
          ikon={aktif === "beranda" ? "home-aktif" : "home"}
        />
        <ItemNav
          href="/riwayat"
          label="Riwayat"
          aktif={aktif === "riwayat"}
          ikon={aktif === "riwayat" ? "history-aktif" : "history"}
        />
      </ul>
    </nav>
  );
}

function ItemNav({
  href,
  label,
  aktif,
  ikon,
}: {
  href: string;
  label: string;
  aktif: boolean;
  ikon: "home" | "home-aktif" | "history" | "history-aktif";
}) {
  return (
    <li className="w-40 min-w-0 shrink">
      <Link
        href={href}
        aria-current={aktif ? "page" : undefined}
        className={cn(
          "flex h-16 w-full flex-col items-center gap-1.5 rounded-kontrol pt-1 text-kecil font-medium",
          aktif ? "text-aksen" : "text-redup",
        )}
      >
        <Ikon nama={ikon} />
        {label}
      </Link>
    </li>
  );
}
