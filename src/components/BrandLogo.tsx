import artwork from "@/lib/brand.json";

type Props = {
  className?: string;
  symbolOnly?: boolean;
};

/** Vector artwork shared by the app and the downloadable brand assets. */
export function BrandLogo({ className, symbolOnly = false }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={symbolOnly ? "0 0 40 40" : "0 0 144 40"}
      width={symbolOnly ? 40 : 144}
      height={40}
      fill="currentColor"
      role="img"
      aria-label="Marka"
      focusable="false"
      className={className}
    >
      <path d={artwork.mark} />
      {!symbolOnly && (
        <g transform="translate(46 32) scale(0.034 -0.034)">
          {artwork.letters.map(({ path, offset }, index) => (
            <path key={index} d={path} transform={`translate(${offset} 0)`} />
          ))}
        </g>
      )}
    </svg>
  );
}
