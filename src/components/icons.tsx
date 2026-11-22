const svg = (size: number, d: string, fill = false) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export const WhatsAppIcon = ({ size = 20 }: { size?: number }) => svg(size,
  "M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2z", true);
export const BagIcon = ({ size = 20 }: { size?: number }) => svg(size, "M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0");
export const PhoneIcon = ({ size = 18 }: { size?: number }) => svg(size, "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z");
export const MailIcon = ({ size = 18 }: { size?: number }) => svg(size, "M4 6h16v12H4zM4 7l8 6 8-6");
export const PinIcon = ({ size = 18 }: { size?: number }) => svg(size, "M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z");
export const TruckIcon = ({ size = 22 }: { size?: number }) => svg(size, "M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 100-4 2 2 0 000 4zM17 19a2 2 0 100-4 2 2 0 000 4z");
export const LeafIcon = ({ size = 22 }: { size?: number }) => svg(size, "M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7");
export const ShieldIcon = ({ size = 22 }: { size?: number }) => svg(size, "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3zM8.5 12l2.5 2.5 4.5-5");
export const DropIcon = ({ size = 22 }: { size?: number }) => svg(size, "M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z");
