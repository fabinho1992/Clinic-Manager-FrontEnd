"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './consult.module.css';

export default function CreateAppointment() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1 = Selecionar serviço, 2 = Agendar consulta
    const [services, setServices] = useState([]);

    const [selectedService, setSelectedService] = useState(null);
    const [newService, setNewService] = useState({
        name: '',
        description: '',
        value: '',
        duration: ''
    });
    const [appointment, setAppointment] = useState({
        patientId: '',
        doctorId: '',
        serviceId: '',
        convention: '',
        start: '',
        finish: '',
        typeTreatment: 'Default'
    });
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filteredConsults, setFilteredConsults] = useState([]);
    const [showFilteredResults, setShowFilteredResults] = useState(false);

    const [loading, setLoading] = useState(false);

    // Carrega dados iniciais
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const token = localStorage.getItem('jwtToken');

                // Carrega serviços existentes
                const urlService = new URL('https://localhost:7236/Service');
                const responseServices = await fetch(urlService, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const servicesData = await responseServices.json();
                setServices(servicesData.data);

                // Carrega pacientes
                const urlPatient = new URL('https://localhost:7236/Patient');
                const responsePatients = await fetch(urlPatient, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const patientsData = await responsePatients.json();
                setPatients(patientsData.data);

                // Carrega médicos
                const urlDoctors = new URL('https://localhost:7236/Doctor');
                const responseDoctors = await fetch(urlDoctors, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const doctorsData = await responseDoctors.json();
                setDoctors(doctorsData.data);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleCreateService = async () => {
        try {
            const token = localStorage.getItem('jwtToken');
            const res = await fetch('https://localhost:7236/Service', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newService),
            });

            if (res.ok) {
                const responseData = await res.json();

                // Se a API só retorna o ID, recarregue a lista de serviços
                const servicesResponse = await fetch('https://localhost:7236/Service', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const updatedServices = await servicesResponse.json();
                setServices(updatedServices.data); // Atualiza a lista completa

                // Seleciona o novo serviço (opcional)
                setSelectedService(responseData.data); // Aqui, responseData.data é o ID

                // Limpa o formulário
                setNewService({
                    name: '',
                    description: '',
                    value: '',
                    duration: ''
                });
            }
        } catch (error) {
            console.error('Erro ao criar serviço:', error);
        }
    };
    const handleScheduleAppointment = async () => {
        try {
            // Converta as datas para UTC
            const startUtc = new Date(appointment.start).toISOString();
            const finishUtc = calculateFinishTime(appointment.start, services.find(s => s.id === selectedService)?.duration);

            const res = await fetch('https://localhost:7236/Consult', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...appointment,
                    serviceId: selectedService,
                    start: startUtc,
                    finish: finishUtc
                }),
            });

            if (res.ok) {
                router.push('/home');
            }
        } catch (error) {
            console.error('Erro ao agendar consulta:', error);
        }
    };

    const calculateFinishTime = (startTime, durationMinutes) => {
        if (!startTime || !durationMinutes) return '';

        const start = new Date(startTime);
        // Garanta que durationMinutes é um número
        const duration = parseInt(durationMinutes, 10);

        // Adicione os minutos corretamente
        start.setMinutes(start.getMinutes() + duration);

        // Retorne como ISO string mantendo os minutos
        return start.toISOString();
    };

    const handleDateTimeChange = (e) => {
        // O input datetime-local retorna no formato: "YYYY-MM-DDTHH:MM"
        const localDateTime = e.target.value;

        // Converta para um formato ISO que o backend possa interpretar corretamente
        const isoDateTime = new Date(localDateTime).toISOString();

        setAppointment({
            ...appointment,
            start: isoDateTime
        });
    };
    const getLocalDateTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const handleDeleteService = async (serviceId) => {
        try {
            const token = localStorage.getItem('jwtToken');

            const response = await fetch(`https://localhost:7236/Service`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'accept': '*/*',
                    'Content-Type': 'application/json-patch+json'
                },
                body: JSON.stringify({
                    id: serviceId // Envia o ID no body conforme o Swagger
                })
            });

            if (!response.ok) throw new Error('Falha ao excluir');

            setServices(services.filter(s => s.id !== serviceId));
            if (selectedService === serviceId) setSelectedService(null);

        } catch (error) {
            console.error('Erro:', error);
            alert('Falha ao excluir serviço');
        }
    };

    const fetchConsultsByDate = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('jwtToken');

            const userDate = new Date(filterDate);
            const timezoneOffset = userDate.getTimezoneOffset() * 60000;
            const correctedDate = new Date(userDate.getTime() + timezoneOffset);
            const formattedDate = correctedDate.toISOString().split('T')[0];

            const response = await fetch(`https://localhost:7236/Consult/Get-date?date=${formattedDate}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFilteredConsults(data.data || data); // Ajuste conforme a estrutura da resposta
                setShowFilteredResults(true);
            } else {
                console.error('Erro ao buscar consultas');
                alert('Erro ao buscar consultas para esta data');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro na conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    // Formata data para DD/MM/YYYY
    const formatarDataBrasileira = (dataString) => {
        const [year, month, day] = dataString.split('-');
        return `${day}/${month}/${year}`;
    };
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>
                {step === 1 ? 'Selecionar Serviço' : 'Agendar Consulta'}
            </h1>
            <div className={styles.filterSection}>
                <h3>Filtrar Consultas por Data</h3>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={styles.dateInput}
                />
                <button
                    className={styles.filterButton}
                    onClick={fetchConsultsByDate}
                    disabled={!filterDate || loading}
                >
                    {loading ? 'Carregando...' : 'Filtrar'}
                </button>

                {showFilteredResults && (
                    <div className={styles.consultsList}>
                        <h4>Consultas em {formatarDataBrasileira(filterDate)}</h4>

                        {filteredConsults.length > 0 ? (
                            <div className={styles.consultGrid}>
                                {filteredConsults.map(consult => (
                                    <div key={consult.id} className={styles.consultCard}>
                                        <div className={styles.consultHeader}>
                                            <span className={styles.consultPatient}>Paciente: {consult.namePatient}</span>
                                            <span className={styles.consultDoctor}>Doutor: {consult.nameDoctor}</span>
                                        </div>

                                        <div className={styles.consultDetails}>
                                            <div className={styles.consultDetailItem}>
                                                <span className={styles.consultDetailLabel}>Data</span>
                                                <span className={styles.consultDetailValue}>
                                                    {consult.dateConsult}
                                                </span>
                                            </div>

                                            {/* <div className={styles.consultDetailItem}>
                                                <span className={styles.consultDetailLabel}>Horário</span>
                                                <span className={styles.consultDetailValue}>
                                                    {new Date(consult.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div> */}

                                            {/* <div className={styles.consultDetailItem}>
                                                <span className={styles.consultDetailLabel}>Convênio</span>
                                                <span className={styles.consultDetailValue}>
                                                    {consult.convention || 'Particular'}
                                                </span>
                                            </div> */}

                                            {/* <div className={styles.consultDetailItem}>
                                                <span className={styles.consultDetailLabel}>Duração</span>
                                                <span className={styles.consultDetailValue}>
                                                    {consult.duration} minutos
                                                </span>
                                            </div> */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={styles.emptyMessage}>Nenhuma consulta encontrada para esta data.</p>
                        )}
                    </div>
                )}
            </div>

            {step === 1 ? (
                <div className={styles.serviceSelection}>
                    <h2>Serviços Disponíveis</h2>
                    <div className={styles.serviceGrid}>
                        {services.map(service => (
                            <div
                                key={service.id}
                                className={`${styles.serviceCard} ${selectedService === service.id ? styles.selected : ''}`}
                            >
                                <div onClick={() => setSelectedService(service.id)}>  {/* Adicione esta div wrapper */}
                                    <h3>{service.name}</h3>
                                    <p>{service.description}</p>
                                    <div className={styles.serviceDetails}>
                                        <span>Valor: R$ {service.value}</span>
                                        <span>Duração: {service.duration} min</span>
                                    </div>
                                </div>

                                {/* Botão de excluir */}
                                <div className={styles.deleteButtonWrapper}>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={(e) => {
                                            e.stopPropagation();  // Impede que o clique no botão selecione o card
                                            handleDeleteService(service.id);
                                        }}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2>Ou criar novo serviço</h2>
                    <div className={styles.newServiceForm}>
                        <input
                            type="text"
                            placeholder="Nome do serviço"
                            value={newService.name}
                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        />
                        <textarea
                            placeholder="Descrição"
                            value={newService.description}
                            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Valor (R$)"
                            value={newService.value}
                            onChange={(e) => setNewService({ ...newService, value: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Duração (minutos)"
                            value={newService.duration}
                            onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                        />
                        <button
                            className={styles.continueButton}
                            onClick={handleCreateService}
                            disabled={!newService.name || !newService.duration}
                        >
                            Criar Serviço
                        </button>
                    </div>

                    <button
                        className={styles.continueButton}
                        onClick={() => setStep(2)}
                        disabled={!selectedService}
                    >
                        Continuar
                    </button>
                </div>
            ) : (
                <div className={styles.appointmentForm}>
                    <div className={styles.formGroup}>
                        <label>Paciente</label>
                        <select
                            value={appointment.patientId}
                            onChange={(e) => setAppointment({ ...appointment, patientId: e.target.value })}
                        >
                            <option value="">Selecione um paciente</option>
                            {patients.map(patient => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Médico</label>
                        <select
                            value={appointment.doctorId}
                            onChange={(e) => setAppointment({ ...appointment, doctorId: e.target.value })}
                        >
                            <option value="">Selecione um médico</option>
                            {doctors.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.name} - {doctor.specialty}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Convênio</label>
                        <input
                            type="text"
                            value={appointment.convention}
                            onChange={(e) => setAppointment({ ...appointment, convention: e.target.value })}
                            placeholder="Nome do convênio"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Data e Hora</label>
                        <input
                            type="datetime-local"
                            value={getLocalDateTime(appointment.start)}
                            onChange={(e) => {
                                const selectedDate = new Date(e.target.value);
                                setAppointment({
                                    ...appointment,
                                    start: selectedDate.toISOString(),
                                    // Mantém o término sincronizado se não foi modificado manualmente
                                    finish: appointment.finish === '' || appointment.finish === calculateFinishTime(appointment.start, services.find(s => s.id === selectedService)?.duration)
                                        ? calculateFinishTime(e.target.value, services.find(s => s.id === selectedService)?.duration)
                                        : appointment.finish
                                });
                            }}
                        />
                        {appointment.start && selectedService && (
                            <p className={styles.finishTime}>
                                Término previsto: {new Date(calculateFinishTime(appointment.start,
                                    services.find(s => s.id === selectedService)?.duration)).toLocaleString()}
                            </p>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tipo de Tratamento</label>
                        <select
                            value={appointment.typeTreatment}
                            onChange={(e) => setAppointment({ ...appointment, typeTreatment: e.target.value })}
                        >
                            <option value="Default">Normal</option>
                            <option value="Urgent">Urgente</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.backButton}
                            onClick={() => setStep(1)}
                        >
                            Voltar
                        </button>
                        <button
                            className={styles.submitButton}
                            onClick={handleScheduleAppointment}
                            disabled={!appointment.patientId || !appointment.doctorId || !appointment.start}
                        >
                            Agendar Consulta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}