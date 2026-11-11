// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { hariBerikutnya, hariSetelah, tabelKalender } from "./kalender";
import { prosesPermintaan } from "./proses";
import { buatPembatas } from "./rate-limit";
import { buatTranskriptorOpenAI, GalatKonfigurasi, pilihTranskriptor } from "./transcribe";
import {
  buatPeringkasClaude,
  GalatRingkasan,
  rapikanKeluaran,
  type KeluaranAI,
  type KlienClaude,
} from "./summarize";

const RAPAT = Date.parse("2026-11-10T14:30:00+07:00"); // Selasa
const RAHASIA = "isi transkrip yang tidak boleh masuk log";

const KELUARAN: KeluaranAI = {
  title: "Rapat panitia",
  category: "Rapat",
  summary: "Rapat membahas dana.",
  keyPoints: ["Proposal dikirim sebelum Jumat."],
  todos: [
    { text: "Kirim proposal sponsor", due: "2026-11-13" },
    { text: "Cek harga sewa sound system", due: null },
  ],
};

describe("kalender", () => {
  it("menyusun tabel tanggal dari hari rekaman di Jakarta", () => {
    const baris = tabelKalender(RAPAT).split("\n");
    expect(baris).toHaveLength(15);
    expect(baris[0]).toBe("2026-11-10 = Selasa (hari rekaman)");
    expect(baris[1]).toBe("2026-11-11 = Rabu (besok)");
    expect(baris[3]).toBe("2026-11-13 = Jumat");
    expect(baris[14]).toBe("2026-11-24 = Selasa");
  });

  it("memakai tanggal Jakarta untuk rekaman lewat tengah malam", () => {
    // 00.30 WIB tanggal 11 masih tanggal 10 di UTC.
    const larut = Date.parse("2026-11-11T00:30:00+07:00");
    expect(tabelKalender(larut).split("\n")[0]).toBe("2026-11-11 = Rabu (hari rekaman)");
  });

  it("menghitung besok dan Jumat berikutnya", () => {
    expect(hariSetelah(RAPAT, 1)).toBe("2026-11-11");
    expect(hariBerikutnya(RAPAT, 5)).toBe("2026-11-13");
    // Direkam hari Jumat: "Jumat" berarti Jumat depan, bukan hari ini.
    expect(hariBerikutnya(Date.parse("2026-11-13T10:00:00+07:00"), 5)).toBe("2026-11-20");
    expect(hariSetelah(Date.parse("2026-11-30T10:00:00+07:00"), 1)).toBe("2026-12-01");
  });
});

describe("rapikanKeluaran", () => {
  it("memetakan keluaran model ke bentuk internal", () => {
    expect(rapikanKeluaran(KELUARAN, RAPAT)).toEqual({
      judul: "Rapat panitia",
      kategori: "Rapat",
      ringkasan: "Rapat membahas dana.",
      poin: ["Proposal dikirim sebelum Jumat."],
      tugas: [
        { teks: "Kirim proposal sponsor", tenggat: "2026-11-13" },
        { teks: "Cek harga sewa sound system", tenggat: undefined },
      ],
    });
  });

  it("membuang tenggat sebelum hari rekaman atau terlalu jauh, tugasnya tetap", () => {
    const hasil = rapikanKeluaran(
      {
        ...KELUARAN,
        todos: [
          { text: "Sudah lewat", due: "2026-11-01" },
          { text: "Terlalu jauh", due: "2029-01-01" },
          { text: "Hari ini", due: "2026-11-10" },
        ],
      },
      RAPAT,
    );
    expect(hasil.tugas.map((t) => t.tenggat)).toEqual([undefined, undefined, "2026-11-10"]);
  });

  it("menolak tenggat yang bukan tanggal, judul kosong, dan tugas kosong", () => {
    const dengan = (ubah: Partial<KeluaranAI>) => () =>
      rapikanKeluaran({ ...KELUARAN, ...ubah }, RAPAT);
    expect(dengan({ todos: [{ text: "Kirim", due: "Jumat" }] })).toThrow();
    expect(dengan({ title: "   " })).toThrow();
    expect(dengan({ todos: [{ text: "  ", due: null }] })).toThrow();
  });
});

describe("peringkas Claude", () => {
  const klienDengan = (...jawaban: Array<{ stop_reason: string; parsed_output: unknown }>) => {
    const parse = vi.fn();
    for (const j of jawaban) parse.mockResolvedValueOnce(j);
    return { klien: { messages: { parse } } as KlienClaude, parse };
  };
  const masukan = { transkrip: RAHASIA, direkamPada: RAPAT };

  it("memakai model dari env, structured outputs, dan menyertakan tabel tanggal", async () => {
    const { klien, parse } = klienDengan({ stop_reason: "end_turn", parsed_output: KELUARAN });
    const hasil = await buatPeringkasClaude(klien)(masukan);
    expect(hasil.judul).toBe("Rapat panitia");
    expect(parse).toHaveBeenCalledOnce();

    const parameter = parse.mock.calls[0][0];
    expect(parameter.model).toBe("claude-haiku-5-5");
    expect(parameter.output_config.effort).toBe("low");
    expect(parameter.output_config.format.type).toBe("json_schema");
    const pesan = parameter.messages[0].content as string;
    expect(pesan).toContain("10 Nov 2026 pukul 14.30 WIB");
    expect(pesan).toContain("2026-11-13 = Jumat");
    expect(pesan).toContain(`<transkrip>\n${RAHASIA}\n</transkrip>`);
    // Model lama tidak menerima parameter ini; pastikan tidak terkirim.
    expect(parameter).not.toHaveProperty("temperature");
    expect(parameter).not.toHaveProperty("thinking");
  });

  it("mencoba sekali lagi bila keluaran tidak valid, lalu berhasil", async () => {
    const { klien, parse } = klienDengan(
      { stop_reason: "end_turn", parsed_output: { ...KELUARAN, todos: [{ text: "x", due: "Jumat" }] } },
      { stop_reason: "end_turn", parsed_output: KELUARAN },
    );
    await expect(buatPeringkasClaude(klien)(masukan)).resolves.toMatchObject({
      judul: "Rapat panitia",
    });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("gagal setelah dua keluaran tidak valid, tanpa percobaan ketiga", async () => {
    const { klien, parse } = klienDengan(
      { stop_reason: "max_tokens", parsed_output: null },
      { stop_reason: "end_turn", parsed_output: { title: "tanpa isi lain" } },
    );
    await expect(buatPeringkasClaude(klien)(masukan)).rejects.toBeInstanceOf(GalatRingkasan);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("tidak mengulang bila model menolak", async () => {
    const { klien, parse } = klienDengan({ stop_reason: "refusal", parsed_output: null });
    await expect(buatPeringkasClaude(klien)(masukan)).rejects.toBeInstanceOf(GalatRingkasan);
    expect(parse).toHaveBeenCalledOnce();
  });
});

describe("pembatas permintaan", () => {
  it("menolak setelah kuota habis dan pulih di jendela berikutnya", () => {
    const pembatas = buatPembatas(2, 60_000);
    expect(pembatas.cek("a", 0).diizinkan).toBe(true);
    expect(pembatas.cek("a", 1000).diizinkan).toBe(true);
    expect(pembatas.cek("a", 2000)).toEqual({ diizinkan: false, cobaLagiDetik: 58 });
    expect(pembatas.cek("b", 2000).diizinkan).toBe(true);
    expect(pembatas.cek("a", 60_000).diizinkan).toBe(true);
  });
});

describe("POST /api/process", () => {
  const audio = (ukuran = 2048, tipe = "audio/webm;codecs=opus") =>
    new File([new Uint8Array(ukuran)], "rekaman.webm", { type: tipe });

  function permintaan(isi: Record<string, string | Blob>, header: Record<string, string> = {}) {
    const formulir = new FormData();
    for (const [kunci, nilai] of Object.entries(isi)) formulir.set(kunci, nilai);
    return new Request("http://localhost/api/process", {
      method: "POST",
      body: formulir,
      headers: header,
    });
  }
  const sah = () => ({
    audio: audio(),
    direkamPada: String(RAPAT),
    durasiMs: "134000",
  });
  const tiruan = (ubah: Record<string, unknown> = {}) => ({
    pembatas: buatPembatas(100, 60_000),
    transkriptor: vi.fn(async () => ({ teks: RAHASIA, durasiMs: 134_000 })),
    peringkas: vi.fn(async () => rapikanKeluaran(KELUARAN, RAPAT)),
    catat: vi.fn(),
    ...ubah,
  });

  it("mentranskripsi dulu, lalu merangkum, dan mengembalikan hasil lengkap", async () => {
    const urutan: string[] = [];
    const k = tiruan({
      transkriptor: vi.fn(async () => {
        urutan.push("transkripsi");
        return { teks: `  ${RAHASIA}  ` };
      }),
      peringkas: vi.fn(async (masukan: { transkrip: string; direkamPada: number }) => {
        urutan.push("ringkasan");
        expect(masukan).toEqual({ transkrip: RAHASIA, direkamPada: RAPAT });
        return rapikanKeluaran(KELUARAN, RAPAT);
      }),
    });
    const respons = await prosesPermintaan(permintaan(sah()), k);

    expect(respons.status).toBe(200);
    expect(respons.headers.get("cache-control")).toBe("no-store");
    expect(urutan).toEqual(["transkripsi", "ringkasan"]);
    expect(await respons.json()).toEqual({
      judul: "Rapat panitia",
      kategori: "Rapat",
      ringkasan: "Rapat membahas dana.",
      poin: ["Proposal dikirim sebelum Jumat."],
      transkrip: RAHASIA,
      tugas: [
        { teks: "Kirim proposal sponsor", tenggat: "2026-11-13" },
        { teks: "Cek harga sewa sound system" },
      ],
    });
  });

  it.each([
    ["tanpa audio", { direkamPada: String(RAPAT), durasiMs: "1000" }, 400, "permintaan-tidak-valid"],
    ["audio kosong", { ...sah(), audio: audio(0) }, 400, "permintaan-tidak-valid"],
    ["bukan audio", { ...sah(), audio: audio(100, "video/mp4") }, 415, "tipe-tidak-didukung"],
    ["berkas teks", { ...sah(), audio: audio(100, "text/plain") }, 415, "tipe-tidak-didukung"],
    ["terlalu besar", { ...sah(), audio: audio(8 * 1024 * 1024 + 1) }, 413, "terlalu-besar"],
    ["durasi lebih dari 10 menit", { ...sah(), durasiMs: "700000" }, 422, "terlalu-panjang"],
    ["durasi bukan angka", { ...sah(), durasiMs: "lama" }, 400, "permintaan-tidak-valid"],
    ["tanggal rekaman tidak sah", { ...sah(), direkamPada: "kemarin" }, 400, "permintaan-tidak-valid"],
  ])("menolak %s", async (_nama, isi, status, kode) => {
    const k = tiruan();
    const respons = await prosesPermintaan(permintaan(isi as Record<string, string | Blob>), k);
    expect(respons.status).toBe(status);
    expect(await respons.json()).toEqual({ galat: kode });
    expect(k.transkriptor).not.toHaveBeenCalled();
  });

  it("menerima audio MP4 dari Safari", async () => {
    const respons = await prosesPermintaan(
      permintaan({ ...sah(), audio: audio(2048, "audio/mp4") }),
      tiruan(),
    );
    expect(respons.status).toBe(200);
  });

  it("menegakkan batas 10 menit dari durasi yang dilaporkan penyedia", async () => {
    const k = tiruan({
      transkriptor: vi.fn(async () => ({ teks: RAHASIA, durasiMs: 11 * 60_000 })),
    });
    // Browser mengaku 2 menit, penyedia mengukur 11 menit.
    const respons = await prosesPermintaan(permintaan(sah()), k);
    expect(respons.status).toBe(422);
    expect(await respons.json()).toEqual({ galat: "terlalu-panjang" });
    expect(k.peringkas).not.toHaveBeenCalled();
  });

  it("melaporkan rekaman tanpa suara tanpa memanggil peringkas", async () => {
    const k = tiruan({ transkriptor: vi.fn(async () => ({ teks: "   " })) });
    const respons = await prosesPermintaan(permintaan(sah()), k);
    expect(respons.status).toBe(422);
    expect(await respons.json()).toEqual({ galat: "tidak-terdengar" });
    expect(k.peringkas).not.toHaveBeenCalled();
  });

  it("membatasi permintaan per alamat IP", async () => {
    const k = tiruan({ pembatas: buatPembatas(1, 60_000) });
    const dari = (ip: string) => prosesPermintaan(permintaan(sah(), { "x-forwarded-for": ip }), k);
    expect((await dari("10.0.0.1")).status).toBe(200);
    const ditolak = await dari("10.0.0.1");
    expect(ditolak.status).toBe(429);
    expect(Number(ditolak.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await dari("10.0.0.2")).status).toBe(200);
    expect(k.transkriptor).toHaveBeenCalledTimes(2);
  });

  it("tidak membocorkan isi transkrip ke log atau ke respons galat", async () => {
    const konsol = vi.spyOn(console, "error").mockImplementation(() => {});
    const k = tiruan({
      peringkas: vi.fn(async () => {
        throw new GalatRingkasan(`gagal merangkum: ${RAHASIA}`);
      }),
      catat: undefined,
    });
    const respons = await prosesPermintaan(permintaan(sah()), k);
    expect(respons.status).toBe(502);
    const badan = await respons.text();
    expect(badan).toBe('{"galat":"ringkasan-gagal"}');
    expect(konsol).toHaveBeenCalledOnce();
    expect(JSON.stringify(konsol.mock.calls)).not.toContain(RAHASIA);
    konsol.mockRestore();
  });

  it("galat tak terduga dari penyedia menjadi 502 tanpa rincian", async () => {
    const k = tiruan({
      transkriptor: vi.fn(async () => {
        throw new Error(`penyedia mati: ${RAHASIA}`);
      }),
    });
    const respons = await prosesPermintaan(permintaan(sah()), k);
    expect(respons.status).toBe(502);
    expect(await respons.json()).toEqual({ galat: "galat-server" });
    expect(JSON.stringify(k.catat.mock.calls)).not.toContain(RAHASIA);
  });
});

describe("transkripsi berformat OpenAI", () => {
  const opsi = { basis: "https://contoh.test/v1/", model: "whisper-uji", kunci: "kunci-rahasia" };
  const masukan = {
    audio: new Blob([new Uint8Array(64)], { type: "audio/mp4" }),
    mimeType: "audio/mp4",
    durasiMs: 5000,
  };
  const jawab = (badan: unknown, status = 200) =>
    vi.fn<typeof fetch>(async () => Response.json(badan, { status }));

  it("mengirim berkas, model, dan bahasa; membaca teks dan durasi", async () => {
    const ambil = jawab({ text: "halo semua", duration: 12.34 });
    const hasil = await buatTranskriptorOpenAI(opsi, ambil)(masukan);
    expect(hasil).toEqual({ teks: "halo semua", durasiMs: 12340 });

    const [url, init] = ambil.mock.calls[0];
    expect(url).toBe("https://contoh.test/v1/audio/transcriptions");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer kunci-rahasia");
    const formulir = init?.body as FormData;
    expect(formulir.get("model")).toBe("whisper-uji");
    expect(formulir.get("language")).toBe("id");
    expect(formulir.get("response_format")).toBe("verbose_json");
    const berkas = formulir.get("file") as File;
    expect(berkas.name).toBe("rekaman.m4a");
    expect(berkas.type).toBe("audio/mp4");
    expect(berkas.size).toBe(64);
  });

  it("memakai akhir segmen terakhir bila durasi tidak dikirim", async () => {
    const ambil = jawab({ text: "halo", segments: [{ end: 3.5 }, { end: 700.2 }] });
    expect((await buatTranskriptorOpenAI(opsi, ambil)(masukan)).durasiMs).toBe(700200);
    const tanpa = jawab({ text: "halo" });
    expect((await buatTranskriptorOpenAI(opsi, tanpa)(masukan)).durasiMs).toBeUndefined();
  });

  it("galat dari penyedia tidak membawa isi jawaban atau kunci", async () => {
    const ambil = jawab({ error: { message: `bocoran ${RAHASIA}` } }, 401);
    const gagal = await buatTranskriptorOpenAI(opsi, ambil)(masukan).catch((e: Error) => e);
    expect(gagal).toBeInstanceOf(Error);
    expect((gagal as Error).message).toBe("Transkripsi gagal dengan status 401");
    await expect(buatTranskriptorOpenAI(opsi, jawab({ teks: "salah bentuk" }))(masukan)).rejects.toThrow(
      "Jawaban transkripsi tidak dikenali",
    );
  });

  it("menolak penyedia asli tanpa kunci dan penyedia tak dikenal", () => {
    vi.stubEnv("TRANSCRIBE_PROVIDER", "groq");
    vi.stubEnv("TRANSCRIBE_API_KEY", "");
    expect(() => pilihTranskriptor()).toThrow(GalatKonfigurasi);
    vi.stubEnv("TRANSCRIBE_API_KEY", "ada");
    expect(pilihTranskriptor()).toBeTypeOf("function");
    vi.stubEnv("TRANSCRIBE_PROVIDER", "entah");
    expect(() => pilihTranskriptor()).toThrow(GalatKonfigurasi);
    vi.unstubAllEnvs();
  });

  it("menolak penyedia tiruan di produksi kecuali diizinkan", () => {
    vi.stubEnv("TRANSCRIBE_PROVIDER", "mock");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => pilihTranskriptor()).toThrow(GalatKonfigurasi);
    vi.stubEnv("ALLOW_MOCK_AI", "1");
    expect(pilihTranskriptor()).toBeTypeOf("function");
    vi.unstubAllEnvs();
  });
});
