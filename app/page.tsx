export default function Home() {
  return (
    <main style={{background:'#0d1117',color:'#e6edf3',minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'monospace'}}>
      <h1 style={{color:'#39d2c0',fontSize:'2rem'}}>Shadow Stack v4.1</h1>
      <p style={{color:'#8b949e',marginTop:'8px'}}>● SYSTEM ONLINE</p>
      <div style={{marginTop:'32px',display:'flex',gap:'16px'}}>
        <a href="http://localhost:3001/health" style={{color:'#3fb950',border:'1px solid #3fb950',padding:'8px 16px',textDecoration:'none'}}>API Health</a>
        <a href="http://localhost:5176" style={{color:'#58a6ff',border:'1px solid #58a6ff',padding:'8px 16px',textDecoration:'none'}}>Dashboard v4.1</a>
        <a href="http://localhost:4000" style={{color:'#bc8cff',border:'1px solid #bc8cff',padding:'8px 16px',textDecoration:'none'}}>Bot Status</a>
      </div>
    </main>
  )
}