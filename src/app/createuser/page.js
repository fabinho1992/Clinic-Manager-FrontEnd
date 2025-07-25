// app/(home)/page.js
"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './createuser.module.css'; 

export default function Home() {

  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('https://localhost:7236/Auth/Register_User', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        // Ajuste para os nomes de propriedade que seu comando espera
        UserName: formData.name,
        Email: formData.email,
        Password: formData.password
      })
    });

    const result = await response.json();
    if (!result.isSuccess) {
      const errorData = await response.json();
      throw new Error(errorData.data.message || 'Erro ao cadastrar usuário');
    }

    
    console.log(` ${result.data.message}`); 
    router.push('/login');

    alert('Cadastro realizado com sucesso!');
    setFormData({ name: '', email: '', password: '' });
    
  } catch (error) {
    console.error('Erro no cadastro:', error.message);
    console.log(formData.name, formData.email, formData.password);
    alert(`Erro: ${error.message}`);
  }
};

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Gerenciamento de clinica</h1>
          <p className={styles.subtitle}>Cadastro de usuários</p>
        </div>
        
        {/* Formulário */}
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Seu nome"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="seu@email.com"
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className={styles.button}
              >
                Criar Conta
              </button>
            </div>
          </form>
          
          <div className={styles.footer}>
            <p>
              Já tem uma conta? 
              <a href="/login" className={styles.link}>
                Faça login
              </a>
            </p>
          </div>
        </div>
      </div>
      
      {/* Rodapé */}
      <footer className={styles.copyright}>
        <p>© {new Date().getFullYear()} Minha Empresa. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}