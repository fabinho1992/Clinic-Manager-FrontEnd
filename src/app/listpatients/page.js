"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './listpatients.module.css';

export default function Pacientes() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [pacientes, setPacientes] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    trigger: 0
  });

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('jwtToken');
        if (!token) {
          router.push('/login');
          throw new Error('Token não encontrado. Faça login novamente.');
        }

        const url = new URL('https://localhost:7236/Patient');
        url.searchParams.append('pageNumber', pagination.pageNumber);
        url.searchParams.append('pageSize', pagination.pageSize);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        let result = await response.json();
        setTotalPacientes(result.totalPage);
        console.log('Resposta da API:', result); // Debug
        console.log('Total pacientes', totalPacientes);

        if (!result.isSuccess) {
          if (response.status === 401) {
            localStorage.removeItem('jwtToken'); // Limpa o token inválido
            router.push('/login'); // Redireciona para login
            throw new Error('Não autorizado. Token inválido ou expirado.');
          }
          throw new Error(result.message || 'Erro ao carregar pacientes.');
        }

        setPacientes(result.data);

        // Atualiza a paginação se sua API retornar o total de registros
        // (ajuste conforme a estrutura da sua resposta)
        const isLastPage = result.data.length < pagination.pageSize;

        setPagination(prev => ({
          ...prev,
          totalPages: isLastPage ? pagination.pageNumber : pagination.pageNumber + 1,
          totalCount: isLastPage
            ? (pagination.pageNumber - 1) * pagination.pageSize + result.data.length
            : (pagination.pageNumber + 1) * pagination.pageSize
        }));
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPacientes();
  }, [pagination.pageNumber, pagination.pageSize, pagination.trigger]);

  const toggleId = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPagination(prev => ({ ...prev, pageSize: newSize, pageNumber: 1 }));
  };

  if (loading && pacientes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando pacientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const handleDeletePatient = async (cpf) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');

      if (!token) {
        toast.error('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`https://localhost:7236/Patient`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf })
      });

      // Verifica se a requisição foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir paciente');
      }

      // Atualização otimista
      setPacientes(prev => prev.filter(p => p.cpf !== cpf));
      setTotalPacientes(prev => prev - 1);

      // Forçar recarregamento
      setPagination(prev => ({
        ...prev,
        trigger: prev.trigger + 1
      }));

      toast.success('Paciente excluído com sucesso!');

    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast.error(error.message);

      // Reverter estado em caso de erro
      setPagination(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (cpf) => {
    toast.info(
      <div>
        <p>Tem certeza que deseja excluir este paciente?</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={() => {
              toast.dismiss();
              handleDeletePatient(cpf);
            }}
            style={{ padding: '5px 10px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss()}
            style={{ padding: '5px 10px', background: '#ccc', border: 'none', borderRadius: '4px' }}
          >
            Cancelar
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Lista de Pacientes</h1>
      <div className={styles.buttonContainer}>

        <button
          className={styles.addButton}
          onClick={() => router.push('/create/patients')}
        >
          Adicionar Novo Paciente
        </button>
      </div>

      {/* Controles de paginação no topo */}
      <div className={styles.paginationControls}>
        <div className={styles.pageSizeSelector}>
          Itens por página:
          <select
            value={pagination.pageSize}
            onChange={handlePageSizeChange}
            disabled={loading}
            className={styles.pageSizeSelect}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <div className={styles.pageNavigation}>
          <button
            onClick={() => handlePageChange(pagination.pageNumber - 1)}
            disabled={pagination.pageNumber === 1 || loading}
            className={styles.pageButton}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {pagination.pageNumber} {pagination.totalPages > 0 ? `de ${pagination.totalPages}` : ''}
          </span>

          <button
            onClick={() => handlePageChange(pagination.pageNumber + 1)}
            disabled={loading || (pacientes.length < pagination.pageSize)}
            className={styles.pageButton}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Tabela de pacientes */}
      <div className={styles.tableContainer}>
        <table className={styles.patientTable}>
          <thead>
            <tr className={styles.patientTableHeader}>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Nascimento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map((paciente) => (
              <tr key={paciente.id} className={styles.patientTableRow}>
                <td
                  className={`${styles.patientTableCell} ${styles.idCell} ${styles.hasTooltip}`}
                  onClick={() => toggleId(paciente.id)}
                  title={paciente.id}
                  data-tooltip={paciente.id}
                >
                  {expandedId === paciente.id ? paciente.id : `${paciente.id.substring(0, 6)}...`}
                </td>
                <td className={`${styles.patientTableCell} ${styles.hasTooltip}`}>
                  <span className={styles.nameHighlight} data-tooltip={paciente.name}>
                    {paciente.name || 'Não informado'}
                  </span>
                </td>
                <td className={`${styles.patientTableCell} ${styles.hasTooltip}`}>
                  <span className={styles.longText} data-tooltip={paciente.email}>
                    {paciente.email || '-'}
                  </span>
                </td>
                <td className={`${styles.patientTableCell} ${styles.hasTooltip}`}>
                  {paciente.phone ? formatPhone(paciente.phone) : '-'}
                </td>
                <td className={`${styles.patientTableCell} ${styles.hasTooltip}`}>
                  {paciente.cpf}
                </td>
                <td className={`${styles.patientTableCell} ${styles.hasTooltip}`}>
                  {paciente.dateOfBirth}
                </td>
                <td className={`${styles.patientTableCell} ${styles.actionsCell} ${styles.hasTooltip}`}>
                  <button
                    className={styles.editBtn}
                     onClick={() => router.push(`/edit/patients/${paciente.id}`)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => confirmDelete(paciente.cpf)}
                    disabled={loading}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de paginação no rodapé */}
      <div className={styles.paginationControlsFooter}>
        <div className={styles.totalRecords}>
          Total de pacientes: {totalPacientes}
        </div>

        <div className={styles.pageNavigation}>
          <button
            onClick={() => handlePageChange(pagination.pageNumber - 1)}
            disabled={pagination.pageNumber === 1 || loading}
            className={styles.pageButton}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {pagination.pageNumber} de {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.pageNumber + 1)}
            disabled={pagination.pageNumber === pagination.totalPages || loading}
            className={styles.pageButton}
          >
            Próxima
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );

}

function formatPhone(phone) {
  if (!phone) return '-';
  // Remove qualquer caractere não numérico
  const cleaned = phone.replace(/\D/g, '');
  // Formata o telefone
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}