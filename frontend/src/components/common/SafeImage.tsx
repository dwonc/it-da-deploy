// components/common/SafeImage.tsx
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8080";

const toAbsUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const SafeImage = ({ src, alt, ...props }: any) => (
  <img
    src={toAbsUrl(src)}
    alt={alt}
    loading="lazy"
    decoding="async"
    onError={(e) => {
      const img = e.currentTarget;
      if (img.dataset.fallbackApplied === "1") return;
      img.dataset.fallbackApplied = "1";
      img.src =
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400";
    }}
    {...props}
  />
);

export default SafeImage;
