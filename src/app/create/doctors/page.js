"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import DoctorForm from './components/doctorform';
import styles from './doctor.module.css';
import { availableSpecialties, specialtiesMap } from './components/specialmap';

export default function DoctorRegistration() {
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
        crm: '',
        specialty: availableSpecialties[0],
    });

    const handleSubmit = async () => {

        setIsSubmitting(true);
        setError(null);

        try {
            // Converter para a estrutura esperada pelo backend
            const payload = {
                name: formData.name,
                dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
                bloodType: formData.bloodType,
                phone: formData.phone.replace(/\D/g, ''),
                email: formData.email,
                cpf: formData.cpf.replace(/\D/g, ''),
                zipCode: formData.zipCode.replace(/\D/g, ''),
                complement: formData.complement,
                crm: formData.crm,
                specialty: specialtiesMap[formData.specialty], // Já está como "CARDIOLOGY" (correto)
                street: formData.street,
                city: formData.city,
                state: formData.state
            };

            console.log("Dados enviados:", payload);

            const response = await fetch('https://localhost:7236/Doctor', {
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

            console.log("Sucesso:", result.Data);

            // Redirecionamento após sucesso
            router.push('/listdoctors');
        } catch (error) {
            console.error("Erro completo:", error);
            console.log("Resposta completa:", result.Data);
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

            <DoctorForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                specialties={availableSpecialties}
            />
        </div>
    );
}