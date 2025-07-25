"use client";

import Link from 'next/link';
import { useState } from 'react';
import styles from './home.module.css';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
  
  // 2. (Opcional) Remove outros dados do usuário se necessário
  localStorage.removeItem('userData');
  
  // 3. Redireciona para a página de login
  router.push('/login');
  };


  return (
     <div className={styles.container}>
      {/* Header com menu hamburguer e logout */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <button 
            className={`${styles.menuButton} ${isMenuOpen ? styles.open : ''}`} 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className={styles.headerTitles}>
            <h1 className={styles.title}>Sistema de Gerenciamento de Clínica</h1>
            <p className={styles.subtitle}>Controle completo de pacientes, médicos e consultas</p>
          </div>
          
          <button className={styles.logoutButton} onClick={handleLogout}>
            Sair
          </button>
        </div>

        {/* Menu lateral */}
        <nav className={`${styles.sidebar} ${isMenuOpen ? styles.open : ''}`}>
          <div className={styles.sidebarContent}>
            <h3 className={styles.sidebarTitle}>Menu</h3>
            <ul className={styles.menuList}>
              <li>
                <Link href="/create/doctors" className={styles.menuLink}>
                  Cadastrar Médico
                </Link>
              </li>
              <li>
                <Link href="/createp/patients" className={styles.menuLink}>
                  Cadastrar Paciente
                </Link>
              </li>
              <li>
                <Link href="/listdoctors" className={styles.menuLink}>
                  Lista de Médicos
                </Link>
              </li>
              <li>
                <Link href="/listpatients" className={styles.menuLink}>
                  Lista de Pacientes
                </Link>
              </li>
              <li>
                <Link href="/create/consults" className={styles.menuLink}>
                  Agendar Consulta
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* Overlay para fechar o menu ao clicar fora */}
        {isMenuOpen && (
          <div className={styles.overlay} onClick={toggleMenu} />
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Card Médicos */}
          <Link href="/listdoctors" className={styles.card}>
            <h2>Médicos <span>→</span></h2>
            <p>Cadastre e gerencie os profissionais da clínica</p>
          </Link>

          {/* Card Pacientes */}
          <Link href="/listpatients" className={styles.card}>
            <h2>Pacientes <span>→</span></h2>
            <p>Gerencie o cadastro de pacientes e históricos</p>
          </Link>

          {/* Card Consultas */}
          <Link href="/create/consults" className={styles.card}>
            <h2>Consultas <span>→</span></h2>
            <p>Agende e acompanhe as consultas médicas</p>
          </Link>

          {/* Card Relatórios */}
          <Link href="/relatorios" className={styles.card}>
            <h2>Relatórios <span>→</span></h2>
            <p>Gere relatórios e estatísticas da clínica</p>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Clínica Médica. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}