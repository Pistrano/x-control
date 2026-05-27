import { Link, useLocation } from "react-router-dom";
import logoXMotors from "../assets/logo-xmotors.png";

function Sidebar() {
  const location = useLocation();

  const links = [
    { rota: "/", label: "Dashboard" },
    { rota: "/clientes", label: "Clientes" },
    { rota: "/servicos", label: "Serviços" },
    { rota: "/lavagem", label: "Lavagem" },
    { rota: "/custos", label: "Custos" },
    { rota: "/estoque", label: "Estoque" },
    { rota: "/relatorios", label: "Relatórios" },
  ];

  const rotaAtiva = (rota) => {
    if (rota === "/") return location.pathname === "/";
    return location.pathname.startsWith(rota);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-wrap">
        <img src={logoXMotors} alt="X Motors" className="sidebar-logo-img" />
      </div>

      <nav className="sidebar-nav">
        {links.map((item) => (
          <Link
            key={item.rota}
            to={item.rota}
            className={`sidebar-link ${rotaAtiva(item.rota) ? "ativo" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;