import { Link } from "react-router-dom";

import pulseLogo from "@/assets/pulse.png";
import punjabLogo from "@/assets/punjab-govt.png";
import { GlobeIcon } from "./icons";

export function BrandLogos({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="header__logos" aria-label="PLRA Enterprise GIS home">
      <img className="logo" src={pulseLogo} alt="PULSE" />
      <img className="logo" src={punjabLogo} alt="Government of Punjab" />
    </Link>
  );
}

/**
 * Placeholder for the partner logo shown in the Figma footer. Replace with the
 * official artwork (src/assets) when it is available.
 */
export function PartnerBadge() {
  return (
    <span className="partner-badge" aria-label="Partner: The World Bank">
      <GlobeIcon />
      THE WORLD BANK
    </span>
  );
}
