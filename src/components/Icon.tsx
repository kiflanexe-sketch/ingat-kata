import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const Svg = ({ size = 20, children, ...props }: IconProps & { children: ReactNode }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
    {children}
  </svg>
);

export const IconBrain = (p: IconProps) => <Svg size={40} {...p}><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5a5.5 5.5 0 0 0 4 5.5c0 4 2 7 2 7h4s2-3 2-7a5.5 5.5 0 0 0 4-5.5A5.5 5.5 0 0 0 14.5 2c-1.5 0-2.8.8-3.5 2-.7-1.2-2-2-3.5-2Z"/><path d="M12 15v4"/><path d="M9 19v2h6v-2"/></Svg>;
export const IconCheck = (p: IconProps) => <Svg size={24} {...p}><polyline points="20 6 9 17 4 12"/></Svg>;
export const IconPlus = (p: IconProps) => <Svg size={20} {...p}><path d="M5 12h14"/><path d="M12 5v14"/></Svg>;
export const IconClock = (p: IconProps) => <Svg size={24} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>;
export const IconSettings = (p: IconProps) => <Svg size={20} {...p}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></Svg>;
export const IconTrash2 = (p: IconProps) => <Svg size={18} {...p}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></Svg>;
export const IconArrowLeft = (p: IconProps) => <Svg size={20} {...p}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></Svg>;
export const IconRepeat = (p: IconProps) => <Svg size={20} {...p}><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></Svg>;
export const IconDownload = (p: IconProps) => <Svg size={20} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>;
export const IconAlertCircle = (p: IconProps) => <Svg size={20} {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
export const IconGlobe = (p: IconProps) => <Svg size={24} {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
export const IconStar = (p: IconProps) => <Svg size={14} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
export const IconBook = (p: IconProps) => <Svg size={20} {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Svg>;
export const IconShuffle = (p: IconProps) => <Svg size={24} {...p}><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l14.2-13"/><path d="M22 22v-5h-5"/><path d="M2 6h1.4c1.3 0 2.5.6 3.3 1.7l3.2 2.9"/><path d="M13.7 15.7l3.2 2.9c.8 1.1 2 1.7 3.3 1.7H22"/><path d="M22 2v5h-5"/></Svg>;
export const IconEdit = (p: IconProps) => <Svg size={18} {...p}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></Svg>;
export const IconMoveDown = (p: IconProps) => <Svg size={18} {...p}><path d="M8 18L12 22L16 18"/><path d="M12 2L12 22"/></Svg>;
export const IconMoveUp = (p: IconProps) => <Svg size={18} {...p}><path d="M16 6L12 2L8 6"/><path d="M12 22L12 2"/></Svg>;
export const IconVolume = (p: IconProps) => <Svg size={20} {...p}><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></Svg>;
export const IconSearch = (p: IconProps) => <Svg size={18} {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Svg>;
export const IconX = (p: IconProps) => <Svg size={20} {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Svg>;
export const IconUpload = (p: IconProps) => <Svg size={20} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>;
