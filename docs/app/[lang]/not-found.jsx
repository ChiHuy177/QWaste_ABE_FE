export default function NotFound() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
      <p style={{ marginTop: '1rem' }}>
        Không tìm thấy trang / Page not found.{' '}
        <a href="/" style={{ textDecoration: 'underline' }}>Về trang chủ / Go home</a>
      </p>
    </div>
  )
}
