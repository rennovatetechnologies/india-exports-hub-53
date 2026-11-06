/** Site mark. Transparent PNG of the Virastra globe emblem. */
export const BRAND_LOGO_SRC = "/logo.png";

export default function BrandLogo({ className = "h-10 w-auto", alt = "", ...props }) {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={alt}
      className={`object-contain ${className}`}
      {...props}
    />
  );
}
