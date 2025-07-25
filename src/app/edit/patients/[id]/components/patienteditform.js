'use client';
import { useEffect, useState } from 'react';
import styles from '../editpatients.module.css';

const bloodTypes = ['A', 'B', 'AB', 'O'];

export default function PatientForm({
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
  error,
  isEdit = false // Nova prop para modo de edição
}) {
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState(null);

  // Bloqueia alteração do CPF em modo de edição
  useEffect(() => {
    if (isEdit) {
      setFormData(prev => ({
        ...prev,
        cpf: prev.cpf // Mantém o CPF formatado
      }));
    }
  }, [isEdit, setFormData]);

  // Busca automática do CEP
  useEffect(() => {
    const fetchAddress = async () => {
      const cleanedCep = formData.zipCode.replace(/\D/g, '');

      if (cleanedCep.length === 8) {
        setIsFetchingCep(true);
        setCepError(null);

        try {
          const response = await fetch(`https://localhost:7236/ZipCode?zipCode=${cleanedCep}`);
          const addressData = await response.json();

          setFormData(prev => ({
            ...prev,
            street: addressData.street || prev.street,
            city: addressData.city || prev.city,
            state: addressData.state || prev.state
          }));
        } catch (err) {
          setCepError(err.message);
        } finally {
          setIsFetchingCep(false);
        }
      }
    };

    const timer = setTimeout(fetchAddress, 500);
    return () => clearTimeout(timer);
  }, [formData.zipCode, setFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Bloqueia alteração do CPF em modo de edição
    if (isEdit && name === 'cpf') {
      return;
    }

    let formattedValue = value;

    if (name === 'cpf' && !isEdit) {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else if (name === 'phone') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    } else if (name === 'zipCode') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Editar Paciente</h1>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Nome */}
          <div className={styles.fullWidth}>
            <label htmlFor="name" className={styles.label}>
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Data de Nascimento */}
          <div className={styles.field}>
            <label htmlFor="dateOfBirth" className={styles.label}>
              Data de Nascimento *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Tipo Sanguíneo */}
          <div className={styles.field}>
            <label htmlFor="bloodType" className={styles.label}>
              Tipo Sanguíneo *
            </label>
            <select
              id="bloodType"
              name="bloodType"
              required
              value={formData.bloodType}
              onChange={handleChange}
              className={styles.input}
            >
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* CPF */}
          <div className={styles.field}>
            <label htmlFor="cpf" className={styles.label}>
              CPF *
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              required
              maxLength={14}
              value={formData.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              className={styles.input}
              readOnly={isEdit} // CPF fica readonly em modo de edição
            />
          </div>
          {/* Telefone */}
          <div className={styles.field}>
            <label htmlFor="phone" className={styles.label}>
              Telefone *
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              required
              maxLength={15}
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              className={styles.input}
            />
          </div>

          {/* Email */}
          <div className={styles.fullWidth}>
            <label htmlFor="email" className={styles.label}>
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* CEP */}
          <div className={styles.field}>
            <label htmlFor="zipCode" className={styles.label}>
              CEP *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                required
                maxLength={9}
                value={formData.zipCode}
                onChange={handleChange}
                placeholder="00000-000"
                className={styles.input}
              />
              {isFetchingCep && (
                <div className={styles.loading}></div>
              )}
            </div>
            {cepError && (
              <span className={styles.errorText}>{cepError}</span>
            )}
          </div>

          {/* Rua (readonly) */}
          <div className={styles.fullWidth}>
            <label htmlFor="street" className={styles.label}>
              Rua *
            </label>
            <input
              type="text"
              id="street"
              name="street"
              required
              readOnly
              value={formData.street}
              className={styles.readOnlyInput}
            />
          </div>

          {/* Cidade (readonly) */}
          <div className={styles.field}>
            <label htmlFor="city" className={styles.label}>
              Cidade *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              required
              readOnly
              value={formData.city}
              className={styles.readOnlyInput}
            />
          </div>

          {/* Estado (readonly) */}
          <div className={styles.field}>
            <label htmlFor="state" className={styles.label}>
              Estado *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              required
              readOnly
              value={formData.state}
              className={styles.readOnlyInput}
            />
          </div>

          {/* Complemento */}
          <div className={styles.fullWidth}>
            <label htmlFor="complement" className={styles.label}>
              Complemento (Número, Apt, etc.)
            </label>
            <input
              type="text"
              id="complement"
              name="complement"
              value={formData.complement}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Altura */}
          <div className={styles.field}>
            <label htmlFor="height" className={styles.label}>
              Altura (m) *
            </label>
            <input
              type="number"
              id="height"
              name="height"
              step="0.01"
              min="0"
              required
              value={formData.height || ''}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* Peso */}
          <div className={styles.field}>
            <label htmlFor="weight" className={styles.label}>
              Peso (kg) *
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              step="0.1"
              min="0"
              required
              value={formData.weight || ''}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          {/* ... (restante dos campos permanece igual ao seu código original) ... */}

        </div>

        <div className={styles.submitButtonContainer}>
          <button
            type="submit"
            disabled={isSubmitting || isFetchingCep || cepError}
            className={styles.submitButton}
          >
            {isSubmitting
              ? (isEdit ? 'Atualizando...' : 'Cadastrando...')
              : (isEdit ? 'Atualizar Paciente' : 'Cadastrar Paciente')}
          </button>
        </div>
      </form>
    </div>
  );
}