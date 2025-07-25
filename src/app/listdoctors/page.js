"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './listdoctors.module.css';

export default function Medicos() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [medicos, setMedicos] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [totalMedicos, setTotalMedicos] = useState(0);
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    trigger: 0
  });

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('jwtToken');
        if (!token) {
          throw new Error('Token não encontrado. Faça login novamente.');
        }

        const url = new URL('https://localhost:7236/Doctor');
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
        setTotalMedicos(result.totalPage);
        console.log('Resposta da API:', result);
        console.log('Total médicos', totalMedicos);

        if (!result.isSuccess) {
          if (response.status === 401) {
            throw new Error('Não autorizado. Token inválido ou expirado.');
          }
          throw new Error(result.message || 'Erro ao carregar médicos.');
        }

        setMedicos(result.data);

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

    fetchMedicos();
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

  if (loading && medicos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando médicos...</div>
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

  const handleDeleteDoctor = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');

      if (!token) {
        toast.error('Token não encontrado. Faça login novamente.');
        return;
      }

      const response = await fetch(`https://localhost:7236/Doctor`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir médico');
      }

      setMedicos(prev => prev.filter(m => m.id !== id));
      setTotalMedicos(prev => prev - 1);

      setPagination(prev => ({
        ...prev,
        trigger: prev.trigger + 1
      }));

      toast.success('Médico excluído com sucesso!');

    } catch (error) {
      console.error('Erro ao excluir médico:', error);
      toast.error(error.message);

      setPagination(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    toast.info(
      <div>
        <p>Tem certeza que deseja excluir este médico?</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={() => {
              toast.dismiss();
              handleDeleteDoctor(id);
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
      <h1 className={styles.title}>Lista de Médicos</h1>
      <div className={styles.buttonContainer}>

        <button
          className={styles.addButton}
          onClick={() => router.push('/create/doctors')}
        >
          Adicionar Novo Médico
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
            disabled={loading || (medicos.length < pagination.pageSize)}
            className={styles.pageButton}
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Tabela de médicos */}
      <div className={styles.tableContainer}>
        <table className={styles.doctorTable}>
          <thead>
            <tr className={styles.doctorTableHeader}>
              <th >ID</th>
              <th >Nome</th>
              <th >Email</th>
              <th >Telefone</th>
              <th >CRM</th>
              <th >Especialidade</th>
              <th >Nascimento</th>
              <th >Ações</th>
            </tr>
          </thead>
          <tbody>
            {medicos.map((medico) => (
              <tr key={medico.id} className={styles.doctorTableRow}>
                <td
                  className={`${styles.doctorTableCell} ${styles.idCell} ${styles.hasTooltip}`}
                  onClick={() => toggleId(medico.id)}
                  title={medico.id}
                  data-tooltip={medico.id}
                >
                  {expandedId === medico.id ? medico.id : `${medico.id.substring(0, 6)}...`}
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  <span className={styles.nameHighlight} data-tooltip={medico.name}>
                    {medico.name || 'Não informado'}
                  </span>
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  <span className={styles.longText} data-tooltip={medico.email}>
                    {medico.email || '-'}
                  </span>
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  {medico.phone ? formatPhone(medico.phone) : '-'}
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  {medico.crm}
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  {medico.specialty || '-'}
                </td>
                <td className={`${styles.doctorTableCell} ${styles.hasTooltip}`}>
                  {medico.dateOfBirth}
                </td>
                <td className={`${styles.doctorTableCell} ${styles.actionsCell} ${styles.hasTooltip}`}>
                  <button
                    className={styles.editBtn}
                    onClick={() => router.push(`/edit/doctors/${medico.id}`)}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => confirmDelete(medico.id)}
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
          Total de médicos: {totalMedicos}
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
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}