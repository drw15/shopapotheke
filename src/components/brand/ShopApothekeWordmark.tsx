/**
 * Shop Apotheke wordmark.
 *
 * A recreation for the prototype: the red arrow-leaf glyph followed by the
 * wordmark, matching the proportions in the reference screenshots.
 */
export function ShopApothekeWordmark({ size = 26 }: { size?: number }) {
  return (
    <span
      className="sa-wordmark"
      style={{ fontSize: `${size}px` }}
      aria-label="Shop Apotheke"
      role="img"
    >
      <svg
        className="sa-wordmark__glyph"
        width={size * 0.72}
        height={size * 0.72}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M2.4 13.6 20.8 3.2c.9-.5 1.9.5 1.4 1.4L11.8 23c-.5.9-1.9.7-2.1-.3l-1.4-6.2c-.1-.4-.4-.7-.8-.8l-4.8-1.1c-1-.2-1.2-1.5-.3-2Z"
          fill="currentColor"
        />
      </svg>
      <span className="sa-wordmark__text">Shop Apotheke</span>
    </span>
  )
}
