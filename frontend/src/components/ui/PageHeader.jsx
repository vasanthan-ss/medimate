function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h1 className="fw-bold text-dark mb-2">{title}</h1>
      {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
    </div>
  );
}

export default PageHeader;