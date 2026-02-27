import sahaayLogoSrc from "../../assets/sahaay-logo.png";

// Renders the actual Sahaay brand logo image.
// The image has a black background — we use CSS to make it transparent
// by blending only the coloured pixels through "mix-blend-mode: lighten"
// on a dark background, or simply via object-fit on the known dark canvas.
const SahaayLogo = ({ size = 36 }) => (
  <img
    src={sahaayLogoSrc}
    alt="Sahaay logo"
    style={{
      width: size,
      height: size,
      objectFit: "contain",
      // The logo PNG has a black background; mix-blend-mode screen makes
      // the black pixels disappear so it composites cleanly on any bg.
      mixBlendMode: "screen",
      display: "block",
      flexShrink: 0,
    }}
  />
);

export default SahaayLogo;