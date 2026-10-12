export default function Logo({ variant = "dark", className = "h-9 w-auto" }) {
  const src =
    variant === "cream" ? "/images/brand/logo-cream.png" : "/images/brand/logo.png";
  return (
    <img
      src={src}
      alt="The Harvest Theory"
      draggable={false}
      className={`${className} select-none`}
    />
  );
}
