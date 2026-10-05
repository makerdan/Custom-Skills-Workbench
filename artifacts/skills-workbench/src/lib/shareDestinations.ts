export type ShareDestinationId =
  | 'email'
  | 'text'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'replit'
  | 'copy';

export type ShareDestination = {
  id: ShareDestinationId;
  label: string;
  kind: 'link' | 'copy';
};

export const shareDestinations: ShareDestination[] = [
  { id: 'email', label: 'Email', kind: 'link' },
  { id: 'text', label: 'Text', kind: 'link' },
  { id: 'facebook', label: 'Facebook', kind: 'link' },
  { id: 'x', label: 'X', kind: 'link' },
  { id: 'linkedin', label: 'LinkedIn', kind: 'link' },
  { id: 'replit', label: 'Replit', kind: 'copy' },
  { id: 'copy', label: 'Copy link', kind: 'copy' },
];

export function buildSharePageUrl(
  token: string,
  origin: string,
  basePath: string,
): string {
  const base = basePath.endsWith('/') ? basePath : `${basePath}/`;
  return `${origin}${base}share/${encodeURIComponent(token)}`;
}

export function buildDestinationHref(
  destination: ShareDestinationId,
  shareUrl: string,
  skillName: string,
): string | null {
  const encodedUrl = encodeURIComponent(shareUrl);
  switch (destination) {
    case 'email':
      return `mailto:?subject=${encodeURIComponent(`Skill: ${skillName}`)}&body=${encodedUrl}`;
    case 'text':
      return `sms:?body=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(`Skill: ${skillName}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'replit':
    case 'copy':
      return null;
  }
}
