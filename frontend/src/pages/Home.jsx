function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div>
      <h2>Home</h2>
      <p>Welcome to MediMate.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Home;