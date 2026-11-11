"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { Ikon } from "@/components/ui/Ikon";

/** Accordion "Transkrip lengkap" (Figma 2:666, isi terbuka dari 2:1430). */
export function Transkrip({ teks }: { teks: string }) {
  return (
    <Accordion.Root
      type="single"
      collapsible
      className="rounded-kartu border border-garis bg-permukaan"
    >
      <Accordion.Item value="transkrip">
        <Accordion.Header asChild>
          <h2>
            <Accordion.Trigger className="group flex h-[54px] w-full items-center justify-between rounded-kartu px-[15px] text-isi font-medium">
              Transkrip lengkap
              <span className="transition-transform group-data-[state=open]:rotate-180">
                <Ikon nama="down" />
              </span>
            </Accordion.Trigger>
          </h2>
        </Accordion.Header>
        <Accordion.Content className="px-[15px] pb-[15px] text-isi whitespace-pre-wrap text-redup">
          {teks}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
