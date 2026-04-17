<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NEXA — School for AI, Robotics & Coding</title>
    <!-- Google Fonts: Montserrat + Tajawal -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Tajawal:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    <!-- CDN Fonts: Conthrax + Riffic -->
    <link href="https://fonts.cdnfonts.com/css/conthrax" rel="stylesheet">
    <link href="https://fonts.cdnfonts.com/css/riffic-free" rel="stylesheet">
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; overflow-x: hidden; background: #020c18; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #020c18; }
      ::-webkit-scrollbar-thumb { background: #23558a; border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: #f2932b; }
      ::selection { background: rgba(242,147,43,0.35); color: #fff; }

      /* ── KEYFRAMES ── */
      @keyframes floatY {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.18; }
        50% { transform: translateY(-22px) rotate(4deg); opacity: 0.32; }
      }
      @keyframes floatX {
        0%, 100% { transform: translateX(0px) rotate(0deg); opacity: 0.14; }
        50% { transform: translateX(18px) rotate(-3deg); opacity: 0.26; }
      }
      @keyframes pulseGlow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.08); }
      }
      @keyframes scanLine {
        0% { transform: translateY(-100%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes circuitTrace {
        0% { stroke-dashoffset: 400; opacity: 0; }
        20% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 0.22; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes glowPulse {
        0%, 100% { box-shadow: 0 0 12px rgba(242,147,43,0.3), 0 0 40px rgba(242,147,43,0.1); }
        50% { box-shadow: 0 0 24px rgba(242,147,43,0.6), 0 0 60px rgba(242,147,43,0.2); }
      }
      @keyframes rotateSlow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes hexPulse {
        0%, 100% { opacity: 0.06; transform: scale(1); }
        50% { opacity: 0.14; transform: scale(1.04); }
      }
      @keyframes dataStream {
        0% { transform: translateY(-100%); opacity: 0; }
        5% { opacity: 1; }
        95% { opacity: 1; }
        100% { transform: translateY(200%); opacity: 0; }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      /* ── TECH UI ── */
      .nexa-logo-text { font-family: 'Conthrax', 'Montserrat', sans-serif !important; }
      .font-conthrax { font-family: 'Conthrax', 'Montserrat', sans-serif !important; }
      .font-riffic { font-family: 'Riffic Free', 'Montserrat', sans-serif !important; }
      .font-tajawal { font-family: 'Tajawal', sans-serif !important; }
      .shimmer-text {
        background: linear-gradient(90deg, #92b9d6 0%, #fff 40%, #f2932b 60%, #92b9d6 100%);
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s linear infinite;
      }
      .letter { display: inline-block; }

      /* ── RESPONSIVE HELPERS ── */
      @media (max-width: 600px) {
        .hide-mobile { display: none !important; }
        .grid-1col { grid-template-columns: 1fr !important; }
        .full-mobile { width: 100% !important; }
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
