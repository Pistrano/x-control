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
import RelatorioFunileirosPage from "./pages/RelatorioFunileirosPage";
import RelatorioFinanceiroPage from "./pages/RelatorioFinanceiroPage";
import RelatorioEstoquePage from "./pages/RelatorioEstoquePage";
import RelatorioServicosPage from "./pages/RelatorioServicosPage";

function App() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession();
      setSessao(data.session);
      setCarregando(false);
    }

    verificarSessao();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSessao(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  if (carregando) {
    return (
      <div style={{ color: "#fff", padding: 40 }}>
        <h1>Carregando X-Control...</h1>
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
            <span>{sessao.user?.email}</span>

            <button type="button" className="btn-sair" onClick={sair}>
              Sair
            </button>
          </div>

          <Routes>
            <Route path="/" element={<DashboardPage />} />

            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/:id" element={<ClienteDetalhePage />} />

            <Route path="/servicos" element={<ServicosPage />} />
            <Route
              path="/servicos/:clienteId/:veiculoId/novo"
              element={<ServicoDetalhePage />}
            />
            <Route
              path="/servicos/:clienteId/:veiculoId/:servicoId"
              element={<ServicoDetalhePage />}
            />

            <Route path="/lavagem" element={<LavagemPage />} />
            <Route path="/lavagem/nova" element={<NovaLavagemPage />} />

            <Route path="/custos" element={<CustosPage />} />
            <Route path="/custos/novo" element={<NovoCustoPage />} />
            <Route
              path="/custos/categoria/:categoria"
              element={<CustosCategoriaPage />}
            />

            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/estoque/novo" element={<NovoItemEstoquePage />} />
            <Route
              path="/estoque/:id/editar"
              element={<EditarItemEstoquePage />}
            />
            <Route path="/estoque/:id" element={<EstoqueDetalhePage />} />

            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route
              path="/relatorios/funileiros"
              element={<RelatorioFunileirosPage />}
            />
            <Route
              path="/relatorios/financeiro"
              element={<RelatorioFinanceiroPage />}
            />
            <Route
              path="/relatorios/estoque"
              element={<RelatorioEstoquePage />}
            />
            <Route
              path="/relatorios/servicos"
              element={<RelatorioServicosPage />}
            />

            <Route
              path="*"
              element={
                <div style={{ color: "#fff", padding: 40 }}>
                  <h1>Página não encontrada</h1>
                </div>
              }
            />
          </Routes>
        </section>
      </main>
    </BrowserRouter>
  );
}

export default App;