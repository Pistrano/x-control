import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import ClienteDetalhePage from "./pages/ClienteDetalhePage";
import ServicosPage from "./pages/ServicosPage";
import ServicoDetalhePage from "./pages/ServicoDetalhePage";
import LavagemPage from "./pages/LavagemPage";
import NovaLavagemPage from "./pages/NovaLavagemPage";
import CustosPage from "./pages/CustosPage";
import NovoCustoPage from "./pages/NovoCustoPage";
import CustosCategoriaPage from "./pages/CustosCategoriaPage";
import EstoquePage from "./pages/EstoquePage";
import NovoItemEstoquePage from "./pages/NovoItemEstoquePage";
import EstoqueDetalhePage from "./pages/EstoqueDetalhePage";
import EditarItemEstoquePage from "./pages/EditarItemEstoquePage";
import RelatoriosPage from "./pages/RelatoriosPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import FuncionarioDetalhePage from "./pages/FuncionarioDetalhePage";
import RelatorioFunileirosPage from "./pages/RelatorioFunileirosPage";
import RelatorioFinanceiroPage from "./pages/RelatorioFinanceiroPage";
import RelatorioEstoquePage from "./pages/RelatorioEstoquePage";
import RelatorioServicosPage from "./pages/RelatorioServicosPage";

function App() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [usuarioAtual, setUsuarioAtual] = useState({ nome: "Usuário", funcao: "Usuário" });

  useEffect(() => {
    // Só verifica se há sessão ativa — SEM consultar tabela perfis aqui
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      if (session?.user) {
        const user = session.user;
        setUsuarioAtual({
          nome: user.user_metadata?.nome || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
          funcao: "Usuário",
        });
        // Carrega perfil em background, sem bloquear a tela
        supabase.from("perfis").select("nome, funcao").eq("email", user.email).maybeSingle()
          .then(({ data }) => {
            if (data) setUsuarioAtual({ nome: data.nome || "Usuário", funcao: data.funcao || "Usuário" });
          })
          .catch(() => {});
      }
      setCarregando(false);
    }).catch(() => {
      setCarregando(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      if (session?.user) {
        const user = session.user;
        setUsuarioAtual({
          nome: user.user_metadata?.nome || user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
          funcao: "Usuário",
        });
        supabase.from("perfis").select("nome, funcao").eq("email", user.email).maybeSingle()
          .then(({ data }) => {
            if (data) setUsuarioAtual({ nome: data.nome || "Usuário", funcao: data.funcao || "Usuário" });
          })
          .catch(() => {});
      } else {
        setUsuarioAtual({ nome: "Usuário", funcao: "Usuário" });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    setSessao(null);
    setUsuarioAtual({ nome: "Usuário", funcao: "Usuário" });
  }

  if (carregando) {
    return (
      <div style={{ background: "#0d0d0d", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#e50914", fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>X-Control</div>
      </div>
    );
  }

  if (!sessao) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <main className="layout">
        <Sidebar />
        <section className="conteudo">
          <div className="topbar-sistema">
            <div className="usuario-topbar">
              <span className="usuario-status" aria-label="Online" title="Online" />
              <div className="usuario-topbar-texto">
                <strong>{usuarioAtual.nome}</strong>
                <span>{usuarioAtual.funcao}</span>
              </div>
            </div>
            <button type="button" className="btn-sair" onClick={sair}>Sair</button>
          </div>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetalhePage />} />
            <Route path="/servicos" element={<ServicosPage />} />
            <Route path="/servicos/:clienteId/:veiculoId/novo" element={<ServicoDetalhePage />} />
            <Route path="/servicos/:clienteId/:veiculoId/:servicoId" element={<ServicoDetalhePage />} />
            <Route path="/lavagem" element={<LavagemPage />} />
            <Route path="/lavagem/nova" element={<NovaLavagemPage />} />
            <Route path="/custos" element={<CustosPage />} />
            <Route path="/custos/novo" element={<NovoCustoPage />} />
            <Route path="/custos/categoria/:categoria" element={<CustosCategoriaPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/estoque/novo" element={<NovoItemEstoquePage />} />
            <Route path="/estoque/:id/editar" element={<EditarItemEstoquePage />} />
            <Route path="/estoque/:id" element={<EstoqueDetalhePage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/relatorios/funileiros" element={<RelatorioFunileirosPage />} />
            <Route path="/relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
            <Route path="/relatorios/estoque" element={<RelatorioEstoquePage />} />
            <Route path="/relatorios/servicos" element={<RelatorioServicosPage />} />
            <Route path="/funcionarios" element={<FuncionariosPage />} />
            <Route path="/funcionarios/:id" element={<FuncionarioDetalhePage />} />
            <Route path="*" element={<div style={{ color: "#fff", padding: 40 }}><h1>Página não encontrada</h1></div>} />
          </Routes>
        </section>
      </main>
    </BrowserRouter>
  );
}

export default App;