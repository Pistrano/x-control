import { Link, useLocation } from "react-router-dom";
import logoXMotors from "../assets/logo-xmotors.png";

import {
  LayoutDashboard,
  Users,
  Wrench,
  Droplets,
  DollarSign,
  Package,
  FileBarChart,
  UserCog,
  Menu,
  X
} from "lucide-react";

import { useState } from "react";

function Sidebar() {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const links = [
    {
      rota: "/",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />
    },
    {
      rota: "/clientes",
      label: "Clientes",
      icon: <Users size={20} />
    },
    {
      rota: "/servicos",
      label: "Serviços",
      icon: <Wrench size={20} />
    },
    {
      rota: "/lavagem",
      label: "Lavagem",
      icon: <Droplets size={20} />
    },
    {
      rota: "/custos",
      label: "Custos",
      icon: <DollarSign size={20} />
    },
    {
      rota: "/estoque",
      label: "Estoque",
      icon: <Package size={20} />
    },
    {
      rota: "/relatorios",
      label: "Relatórios",
      icon: <FileBarChart size={20} />
    },
    {
      rota: "/funcionarios",
      label: "Funcionários",
      icon: <UserCog size={20} />
    },
  ];

  const rotaAtiva = (rota) => {
    if (rota === "/") return location.pathname === "/";
    return location.pathname.startsWith(rota);
  };

  return (
    <>
      {/* botão menu mobile */}
      <button
        className="menu-mobile-btn"
        onClick={() => setMenuAberto(!menuAberto)}
      >
        {menuAberto ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* overlay */}
      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>
        <div className="sidebar-logo-wrap">
          <img
            src={logoXMotors}
            alt="X Motors"
            className="sidebar-logo-img"
          />
        </div>

        <nav className="sidebar-nav">
          {links.map((item) => (
            <Link
              key={item.rota}
              to={item.rota}
              onClick={() => setMenuAberto(false)}
              className={`sidebar-link ${
                rotaAtiva(item.rota) ? "ativo" : ""
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;