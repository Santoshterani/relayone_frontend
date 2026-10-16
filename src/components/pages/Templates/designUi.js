// Block types of the email builder: label, starting content and the fields each one shows.
export const BLOCKS = {
  header: { label: 'Header / logo', make: () => ({ type: 'header', brand: '{company}', logoUrl: '', align: 'left' }) },
  heading: { label: 'Heading', make: () => ({ type: 'heading', text: 'Heading', align: 'left' }) },
  text: { label: 'Text', make: () => ({ type: 'text', text: 'Write your message here.', align: 'left' }) },
  button: { label: 'Button', make: () => ({ type: 'button', label: 'Open', url: 'https://', align: 'center' }) },
  image: { label: 'Image', make: () => ({ type: 'image', url: 'https://', alt: '' }) },
  details: { label: 'Details table', make: () => ({ type: 'details', title: 'Summary', rows: [{ label: 'Label', value: 'Value' }] }) },
  divider: { label: 'Divider', make: () => ({ type: 'divider' }) },
  spacer: { label: 'Spacer', make: () => ({ type: 'spacer', height: 16 }) },
  footer: { label: 'Footer', make: () => ({ type: 'footer', text: '{company}' }) }
};
export const FONTS = { sans: 'Sans-serif (Arial)', serif: 'Serif (Georgia)', modern: 'Modern (Verdana)', mono: 'Monospace' };
export const DEFAULT_THEME = { pageBg: '#f4f5f7', cardBg: '#ffffff', text: '#1f2933', accent: '#2563eb', font: 'sans', width: 600, radius: 8 };
export const emptyDesign = () => ({ theme: { ...DEFAULT_THEME }, blocks: [BLOCKS.header.make(), BLOCKS.heading.make(), BLOCKS.text.make(), BLOCKS.button.make(), BLOCKS.footer.make()] });
