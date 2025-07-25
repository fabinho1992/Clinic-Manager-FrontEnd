'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import PatientForm from './components/patienteditform';
import styles from './editpatients.module.css';

export default function EditPatient() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    bloodType: 'A',
    phone: '',
    email: '',
    cpf: '',
    zipCode: '',
    street: '',
    city: '',
    state: '',
    complement: '',
    height: '',
    weight: '',
  });

  // Carrega os dados do paciente
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await fetch(`https://localhost:7236/Patient/${patientId}`);
        if (!response.ok) {
          throw new Error('Paciente não encontrado');
        }

        const result = await response.json();
        console.log(result);

        if (!result.isSuccess) {
          throw new Error(result.message || 'Erro ao carregar paciente');
        }

        const patientData = result.data;
        console.log(patientData.name);
        console.log(patientData.height);

        const brDateToInputFormat = (brDate) => {
          if (!brDate) return '';
          const [day, month, year] = brDate.split('/');
          return `${year}-${month}-${day}`; // Formato que o input type="date" entende
        };

        // Formata os dados para o formulário
        setFormData({
          name: patientData.name,
          dateOfBirth: brDateToInputFormat(patientData.dateOfBirth),
          bloodType: patientData.bloodType,
          phone: formatPhone(patientData.phone),
          email: patientData.email,
          cpf: formatCPF(patientData.cpf),
          zipCode: formatCEP(patientData.zipCode),
          street: patientData.address?.street || '',
          city: patientData.address?.city || '',
          state: patientData.address?.state || '',
          complement: patientData.address?.complement || '',
          height: patientData.height?.toString() || '',
          weight: patientData.weight?.toString() || '',
        });

      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  // Funções auxiliares para formatação
  const formatPhone = (phone) => {
    return phone
      ? phone
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
      : '';
  };

  const formatCPF = (cpf) => {
    return cpf
      ? cpf
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
      : '';
  };

  const formatCEP = (cep) => {
    return cep
      ? cep
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1')
      : '';
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  //nova função para data que retorna string
  const parseDateString = (dateStr) => {
  if (!dateStr) return null;

  // Se estiver no formato dd/MM/yyyy (vindo do backend ou input)
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
  }

  // Se já estiver no formato yyyy-MM-dd (vindo do input date)
  if (dateStr.includes('-')) {
    return new Date(`${dateStr}T00:00:00Z`).toISOString();
  }

  return null;
};

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Converter para a estrutura esperada pelo backend
      const payload = {
        id: patientId,
        name: formData.name,
        dateOfBirth: parseDateString(formData.dateOfBirth),
        bloodType: formData.bloodType,
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        zipCode: formData.zipCode.replace(/\D/g, ''),
        complement: formData.complement,
        height: formData.height !== '' ? parseFloat(formData.height) : null,
        weight: formData.weight !== '' ? parseFloat(formData.weight) : null,
        street: formData.street,
        city: formData.city,
        state: formData.state
      };

      const response = await fetch(`https://localhost:7236/Patient`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.isSuccess) {
        let errorMessage = 'Erro ao atualizar paciente';
        console.log(result);

        if (result.message) {
          errorMessage = result.message;
        } else if (result.errors) {
          errorMessage = Object.values(result.errors).flat().join(', ');
        }

        throw new Error(errorMessage);
      }

      // Redirecionamento após sucesso
      router.push('/listpatients');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados do paciente...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Editar Paciente</title>
      </Head>

      <PatientForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        isEdit={true} // Indica que está no modo de edição
      />
    </div>
  );
}