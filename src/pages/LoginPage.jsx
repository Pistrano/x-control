import { useState } from "react";
import { supabase } from "../lib/supabase";
import logoXMotors from "../assets/logo-xmotors.png";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setCarregando(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

    if (error) {
      alert("Erro ao entrar: " + error.message);
      setCarregando(false);
      return;
    }

    setCarregando(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-box">
          <img
            src={logoXMotors}
            alt="X Motors"
            className="login-logo"
          />
        </div>

        <h1>X-Control</h1>
        <p>Gestão interna da X Motors</p>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={carregando}
          >
            {carregando
              ? "Entrando..."
              : "Entrar no sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;