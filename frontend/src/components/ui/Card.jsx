function Card({ children, className = "" }) {
  return (
    <div className={`card border-0 shadow-sm rounded-4 h-100 ${className}`}>
      <div className="card-body p-4">{children}</div>
    </div>
  );
}

export default Card;