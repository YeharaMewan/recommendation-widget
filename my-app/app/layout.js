import './globals.css';

export const metadata = {
  title: 'AI-Powered ERP Recommendation Widget',
  description: 'A smart recommendation widget for ERP systems using AI logic',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}