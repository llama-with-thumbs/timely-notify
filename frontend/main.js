async function pingBackend() {
  const res = await fetch('https://your-backend-url.onrender.com/ping');
  const data = await res.json();
  document.getElementById('output').innerText = data.message;
}
