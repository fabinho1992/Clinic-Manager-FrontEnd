"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.css";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://localhost:7236/Auth/Login_User", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (!result.isSuccess) {
        console.log(result.data.message);
        throw new Error(data.message || "Erro ao fazer login");
      }

      console.log(result.data.message);
      console.log(result.data.token);

      // Salva o token JWT no localStorage
      localStorage.setItem("jwtToken", result.data.token);
      
      // Redireciona para home
      router.push("/home");
      
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <h1 className={styles.title}>Bem-vindo</h1>
          <p className={styles.subtitle}>Faça login para continuar</p>
        </div>
        
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={styles.input}
              required
              minLength={6}
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner}></span>
            ) : "Entrar"}
          </button>
          
          <div className={styles.footerLinks}>
            <a href="#" className={styles.link}>Esqueceu a senha?</a>
            <a href="/createuser" className={styles.link}>Criar conta</a>
          </div>
        </form>
      </div>
    </div>
  );
}