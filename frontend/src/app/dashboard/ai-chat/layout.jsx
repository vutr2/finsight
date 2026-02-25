export default function AiChatLayout({ children }) {
  // Pull the chat out of the parent <main>'s padding (24px on all sides)
  // and make it fill the full available height
  return (
    <div
      style={{
        margin: '-24px',
        height: 'calc(100vh - 52px - 34px)', // full height minus Navbar + TickerBanner
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
