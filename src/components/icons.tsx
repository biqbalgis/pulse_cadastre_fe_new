import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
  </Svg>
);
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.4}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const GearIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
);
export const UserIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4 20.5c0-4.1 3.6-6.5 8-6.5s8 2.4 8 6.5z" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const ClipboardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5" />
  </Svg>
);
export const FilePlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3v5h5M12 11v6M9 14h6" />
  </Svg>
);
export const UploadDocIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4h6v3H9zM12 17v-6M9.5 13.5 12 11l2.5 2.5" />
  </Svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.2 2.4 2.4 4.8-5" />
  </Svg>
);
export const ListIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
  </Svg>
);
export const AssignIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H13" />
    <path d="M8.5 9h5M8.5 13h3M16 12l4 0M18 10l2 2-2 2" />
  </Svg>
);
export const ShieldCheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Svg>
);
export const SyncIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9" />
    <path d="M18.5 3.5v4h-4M5.5 20.5v-4h4" />
  </Svg>
);
export const BriefcaseIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="5" width="12" height="15" rx="1.5" />
    <path d="M7.5 9h5M7.5 12.5h5M7.5 16h3M16 8h2.5A1.5 1.5 0 0 1 20 9.5V20" />
  </Svg>
);
export const WorkspaceIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="12" rx="1.5" />
    <path d="m7 14 3-3.5 2.5 2 2.5-3 2 2.5M9 20h6" />
  </Svg>
);
export const FileTextIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h7" />
  </Svg>
);
export const LayersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h11a1 1 0 0 1 1 1v11" />
    <rect x="4" y="7" width="12" height="13" rx="1.5" />
    <path d="M7 11.5h6M7 15h4" />
  </Svg>
);
export const ReviewIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 18c2-1.5 3.5-4 4-6.5M8 11.5 4 8l3-4 5 3.5" />
    <circle cx="15" cy="14" r="4" />
    <path d="m18 17 2.5 2.5" />
  </Svg>
);
export const MapPinIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M3 10.5 10.5 8l11 3 7.5-2.5v15L21.5 26l-11-3L3 25.5z" opacity="0.85" />
    <path
      d="M16 4.5a5 5 0 0 0-5 5c0 3.6 5 9 5 9s5-5.4 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
      fill="#fff"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);
export const ParcelIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M6 9.5 17 5l9 6.5-4 13.5L8 27z" opacity="0.9" />
    <path d="M17 5 15 16l11-4.5M15 16l-7 11M15 16l7 9" stroke="#fff" strokeWidth="1.4" fill="none" />
  </svg>
);
export const PenNibIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...p}>
    <path d="M4 8h24" />
    <circle cx="4" cy="8" r="2" fill="currentColor" />
    <circle cx="28" cy="8" r="2" fill="currentColor" />
    <path d="M16 8v4" />
    <path d="M10.5 15 16 12l5.5 3-2 9h-7z" fill="currentColor" />
    <circle cx="16" cy="19" r="1.6" fill="#fff" stroke="none" />
    <path d="M14 27h4" />
  </svg>
);
export const MagnifierIcon = (p: IconProps) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" {...p}>
    <circle cx="13.5" cy="13.5" r="8.5" />
    <path d="m20 20 7 7" strokeWidth="3.4" />
    <path d="m9.5 13.5 3 3 5-6" strokeWidth="2.2" />
  </svg>
);
export const GlobeIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.4}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.4}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const DotIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="7.5" />
  </Svg>
);
