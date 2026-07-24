import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";

export interface MediaUploadProps {
  /** Storage bucket, default `vnsupplier` */
  bucket?: string;
  /** Folder prefix inside the bucket (must start with the current user's UID for owner RLS). If omitted, we prepend `<uid>/`. */
  folder?: string;
  /** Current value (public URL) */
  value?: string | null;
  /** Called with the public URL after successful upload, or empty string on remove */
  onChange: (url: string) => void;
  accept?: string;
  /** Bytes, default 5MB */
  maxSize?: number;
  /** Show preview thumbnail */
  preview?: boolean;
  label?: string;
  className?: string;
}

const DEFAULT_MAX = 5 * 1024 * 1024;

export function MediaUpload({
  bucket = "vnsupplier",
  folder,
  value,
  onChange,
  accept = "image/*",
  maxSize = DEFAULT_MAX,
  preview = true,
  label = "Chọn tệp",
  className,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    if (file.size > maxSize) {
      setErr(`Tệp vượt quá ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    setUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Bạn cần đăng nhập để upload");

      const ext = file.name.split(".").pop() || "bin";
      const prefix = folder ? (folder.startsWith(`${uid}/`) ? folder : `${uid}/${folder}`) : uid;
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      // Try public URL first; if bucket is private, fall back to a long-lived signed URL.
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      let url = pub.publicUrl;
      // Quick HEAD is not reliable in browsers; use signed URL as safe fallback.
      const { data: signed } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
      if (signed?.signedUrl) url = signed.signedUrl;

      onChange(url);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        {preview && value ? (
          accept.startsWith("video") ? (
            <video src={value} className="h-16 w-24 rounded-md border bg-muted object-cover" muted />
          ) : (
            <img src={value} alt="preview" className="h-16 w-16 rounded-md border bg-background object-contain p-1" />
          )
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-md border bg-muted text-[10px] text-muted-foreground">
            {accept.startsWith("video") ? "Video" : "Ảnh"}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Đang tải…" : label}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4" /> Xóa
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {err && <p className="text-[11px] text-destructive">{err}</p>}
          {!err && (
            <p className="text-[11px] text-muted-foreground">
              Tối đa {Math.round(maxSize / 1024 / 1024)}MB. Định dạng: {accept}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Multi-file gallery uploader. Returns array of URLs. */
export function MediaUploadMulti({
  bucket = "vnsupplier",
  folder,
  value = [],
  onChange,
  accept = "image/*",
  maxSize = DEFAULT_MAX,
  max = 12,
  label = "Thêm ảnh",
  className,
}: {
  bucket?: string;
  folder?: string;
  value?: string[];
  onChange: (urls: string[]) => void;
  accept?: string;
  maxSize?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Xóa ảnh"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {value.length < max && (
        <div className="mt-3">
          <MediaUpload
            bucket={bucket}
            folder={folder}
            accept={accept}
            maxSize={maxSize}
            preview={false}
            label={label}
            onChange={(url) => {
              if (url) onChange([...value, url]);
            }}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Đã thêm {value.length}/{max}
          </p>
        </div>
      )}
    </div>
  );
}
