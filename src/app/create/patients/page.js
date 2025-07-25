"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import PatientForm from './components/patientform';
import styles from './patient.module.css';

export default function PatientRegistration() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado inicial do formulário
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

  const handleSubmit = async () => {
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Converter para a estrutura esperada pelo backend
      const payload = {
        name: formData.name,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        bloodType: formData.bloodType, // Ajuste conforme necessário
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        zipCode: formData.zipCode.replace(/\D/g, ''),
        complement: formData.complement,
        height: formData.height ? parseFloat(formData.height) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        street: formData.street,
        city: formData.city,
        state: formData.state
      };

      console.log("Dados enviados:", payload);

      const response = await fetch('https://localhost:7236/Patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
    console.log("Resposta completa:", result);

    // Verificação corrigida para o padrão do backend
    if (!result.isSuccess) { // Note o "IsSuccess" com I maiúsculo
      let errorMessage = 'Erro ao cadastrar paciente';
      
      if (result.Message) { // Note o "Message" com M maiúsculo
        errorMessage = result.Message;
      } else if (result.Errors) { // Note o "Errors" com E maiúsculo
        errorMessage = Object.values(result.Errors).flat().join(', ');
      }
      
      throw new Error(errorMessage);
    }

    console.log("Sucesso:", result.Data); // Note o "Data" com D maiúsculo
    
    // Redirecionamento após sucesso
    router.push('/listpatients');
  } catch (error) {
    console.error("Erro completo:", error);
    setError(error.message);
    setTimeout(() => setError(null), 5000);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className={styles.container}>
      <Head>
        <title>Cadastro de Paciente</title>
      </Head>
      
      <PatientForm 
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </div>
  );
}