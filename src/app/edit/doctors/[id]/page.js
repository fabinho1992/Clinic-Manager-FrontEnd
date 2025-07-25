'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import DoctorForm from './components/doctoreditform';
import styles from './editdoctors.module.css';

// Arquivo separado com as especialidades
import { availableSpecialties, specialtiesMap, reverseSpecialtiesMap } from './components/specialties';

export default function EditDoctor() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params.id;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    cpf: '',
    zipCode: '',
    street: '',
    city: '',
    state: '',
    complement: '',
    specialty: availableSpecialties[0],
    crm: ''
  });

  // Funções de formatação (iguais às dos pacientes)
  const formatPhone = (phone) => {
    return phone
      ? phone.replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
      : '';
  };

  const formatCPF = (cpf) => {
    return cpf
      ? cpf.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1')
      : '';
  };

  const formatCEP = (cep) => {
    return cep
      ? cep.replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1')
      : '';
  };

  // Formatação da data para o input
  const brDateToInputFormat = (brDate) => {
    if (!brDate) return '';
    
    // Se já estiver no formato ISO (vindo do banco)
    if (brDate.includes('T')) {
      return brDate.split('T')[0];
    }
    
    // Formato brasileiro (dd/MM/yyyy)
    if (brDate.includes('/')) {
      const [day, month, year] = brDate.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return brDate; // Assume que já está no formato yyyy-MM-dd
  };

  // Carrega os dados do médico
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const response = await fetch(`https://localhost:7236/Doctor/${doctorId}`);
        console.log('Resposta da API:', response);
        
        if (!response.ok) {
          throw new Error('Médico não encontrado');
        }

        const result = await response.json();
        console.log('Dados recebidos:', result);

        if (!result.isSuccess) {
          throw new Error(result.message || 'Erro ao carregar médico');
        }

        const doctorData = result.data;
        console.log('Dados do médico:', doctorData);

        setFormData({
          name: doctorData.name || '',
          dateOfBirth: brDateToInputFormat(doctorData.dateOfBirth),
          phone: formatPhone(doctorData.phone || ''),
          email: doctorData.email || '',
          cpf: formatCPF(doctorData.cpf || ''),
          zipCode: formatCEP(doctorData.zipCode || ''),
          street: doctorData.address?.street || '',
          city: doctorData.address?.city || '',
          state: doctorData.address?.state || '',
          complement: doctorData.address?.complement || '',
          specialty: doctorData.specialty ? 
            reverseSpecialtiesMap[doctorData.specialty] || availableSpecialties[0] : 
            availableSpecialties[0],
          crm: doctorData.crm || ''
        });

      } catch (error) {
        console.error('Erro ao carregar:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  // Formata a data para o formato do backend
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}T00:00:00Z`).toISOString();
    }
    
    if (dateStr.includes('-')) {
      return new Date(`${dateStr}T00:00:00Z`).toISOString();
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {

      const payload = {
        id: doctorId,
        name: formData.name,
        dateOfBirth: parseDateString(formData.dateOfBirth),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        address: {
          zipCode: formData.zipCode.replace(/\D/g, ''),
          street: formData.street,
          city: formData.city,
          state: formData.state,
          complement: formData.complement
        },
        specialty: specialtiesMap[formData.specialty],
        crm: formData.crm.toUpperCase()
      };

      console.log('Payload enviado:', payload);

      const response = await fetch(`https://localhost:7236/Doctor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Erro ao atualizar médico';
        
        if (result.errors) {
          errorMessage = Object.values(result.errors).flat().join(', ');
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        throw new Error(errorMessage);
      }

      router.push('/listdoctors');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando dados do médico...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Editar Médico</title>
      </Head>

      <DoctorForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        specialties={availableSpecialties}
        isEdit={true}
      />
    </div>
  );
}