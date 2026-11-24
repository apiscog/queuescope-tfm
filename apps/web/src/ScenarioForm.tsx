import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  GenerateScenarioInputSchema,
  type GenerateScenarioInput,
  type Scenario,
} from '@queuescope/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router';

import { createScenario, previewScenario } from './api';

interface FormValues {
  name: string;
  taskCount: number;
  workerCount: number;
  seed: number;
  arrivalMin: number;
  arrivalMax: number;
  durationMin: number;
  durationMax: number;
  priorityMin: number;
  priorityMax: number;
  taskTypes: string;
}

const numericFields: Array<{
  name: Exclude<keyof FormValues, 'name' | 'taskTypes'>;
  label: string;
  min: number;
  max: number;
}> = [
  { name: 'taskCount', label: 'Nombre de tasques', min: 1, max: 100 },
  { name: 'workerCount', label: 'Nombre de workers', min: 1, max: 16 },
  { name: 'seed', label: 'Llavor aleatòria', min: 0, max: 4_294_967_295 },
  { name: 'arrivalMin', label: 'Arribada mínima (ticks)', min: 0, max: 1000 },
  { name: 'arrivalMax', label: 'Arribada màxima (ticks)', min: 0, max: 1000 },
  { name: 'durationMin', label: 'Durada mínima (ticks)', min: 1, max: 1000 },
  { name: 'durationMax', label: 'Durada màxima (ticks)', min: 1, max: 1000 },
  { name: 'priorityMin', label: 'Prioritat mínima', min: 0, max: 9 },
  { name: 'priorityMax', label: 'Prioritat màxima', min: 0, max: 9 },
];

export function ScenarioForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scenarioId] = useState(() => `scenario-${crypto.randomUUID()}`);
  const [createdAt] = useState(() => new Date().toISOString());
  const [preview, setPreview] = useState<Scenario | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: 'Escenari sintètic',
      taskCount: 5,
      workerCount: 2,
      seed: 12345,
      arrivalMin: 0,
      arrivalMax: 6,
      durationMin: 1,
      durationMax: 4,
      priorityMin: 0,
      priorityMax: 5,
      taskTypes: 'correu, informe',
    },
  });
  const previewRequest = useMutation({
    mutationFn: previewScenario,
    onSuccess: setPreview,
  });
  const saveRequest = useMutation({
    mutationFn: createScenario,
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      navigate(`/scenarios/${encodeURIComponent(saved.id)}`);
    },
  });

  function onSubmit(values: FormValues) {
    setValidationError(null);
    setPreview(null);
    previewRequest.reset();
    saveRequest.reset();

    const ranges: Array<[keyof FormValues, keyof FormValues]> = [
      ['arrivalMin', 'arrivalMax'],
      ['durationMin', 'durationMax'],
      ['priorityMin', 'priorityMax'],
    ];
    for (const [minimum, maximum] of ranges) {
      if (Number(values[minimum]) > Number(values[maximum])) {
        setError(maximum, {
          message: 'El màxim ha de ser igual o superior al mínim',
        });
        return;
      }
    }

    const input: GenerateScenarioInput = {
      id: scenarioId,
      name: values.name.trim(),
      createdAt,
      parameters: {
        taskCount: values.taskCount,
        workerCount: values.workerCount,
        arrivalTimeRange: {
          minimum: values.arrivalMin,
          maximum: values.arrivalMax,
        },
        serviceDurationRange: {
          minimum: values.durationMin,
          maximum: values.durationMax,
        },
        priorityRange: {
          minimum: values.priorityMin,
          maximum: values.priorityMax,
        },
        taskTypes: values.taskTypes.split(',').map((type) => type.trim()),
        seed: values.seed,
      },
    };
    if (!GenerateScenarioInputSchema.safeParse(input).success) {
      setValidationError(
        'Revisa el nom, els tipus i els valors enters dels paràmetres.',
      );
      return;
    }
    previewRequest.mutate(input);
  }

  const nameField = register('name', {
    required: 'Escriu un nom',
    maxLength: { value: 120, message: 'El nom no pot superar 120 caràcters' },
  });
  const typesField = register('taskTypes', {
    required: 'Escriu almenys un tipus',
  });

  return (
    <Stack spacing={3}>
      <Link component={RouterLink} to="/" underline="hover">
        ← Tornar als escenaris
      </Link>
      <Box>
        <Typography component="h1" variant="h4" gutterBottom>
          Crea un escenari sintètic
        </Typography>
        <Typography color="text.secondary">
          Defineix una càrrega reproduïble, revisa les tasques i desa-la quan
          estiguis conforme.
        </Typography>
      </Box>
      <Box
        component="form"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        onChange={() => {
          setPreview(null);
          setValidationError(null);
        }}
        noValidate
      >
        <Stack spacing={2} sx={{ maxWidth: 650 }}>
          <TextField
            label="Nom de l'escenari"
            {...nameField}
            inputRef={nameField.ref}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            fullWidth
          />
          <TextField
            label="Tipus de tasca, separats per comes"
            {...typesField}
            inputRef={typesField.ref}
            error={Boolean(errors.taskTypes)}
            helperText={errors.taskTypes?.message}
            fullWidth
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {numericFields.map((field) => {
              const registered = register(field.name, {
                required: 'Aquest valor és obligatori',
                valueAsNumber: true,
                min: { value: field.min, message: `El mínim és ${field.min}` },
                max: { value: field.max, message: `El màxim és ${field.max}` },
                validate: (value) =>
                  Number.isInteger(value) || 'Escriu un nombre enter',
              });
              return (
                <TextField
                  key={field.name}
                  label={field.label}
                  type="number"
                  {...registered}
                  inputRef={registered.ref}
                  error={Boolean(errors[field.name])}
                  helperText={errors[field.name]?.message}
                  slotProps={{
                    htmlInput: { min: field.min, max: field.max, step: 1 },
                  }}
                />
              );
            })}
          </Box>
          {validationError && <Alert severity="error">{validationError}</Alert>}
          {previewRequest.isError && (
            <Alert severity="error">{previewRequest.error.message}</Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            disabled={previewRequest.isPending}
          >
            {previewRequest.isPending
              ? 'Generant tasques…'
              : 'Previsualitza les tasques'}
          </Button>
        </Stack>
      </Box>
      {preview && (
        <Stack spacing={2}>
          <Typography component="h2" variant="h5">
            Previsualització
          </Typography>
          <Typography>
            {preview.tasks.length}{' '}
            {preview.tasks.length === 1
              ? 'tasca generada'
              : 'tasques generades'}{' '}
            amb {preview.workers.count}{' '}
            {preview.workers.count === 1 ? 'worker' : 'workers'} i llavor{' '}
            {preview.source.kind === 'generated'
              ? preview.source.parameters.seed
              : ''}
            .
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Previsualització de tasques">
              <TableHead>
                <TableRow>
                  <TableCell>Tasca</TableCell>
                  <TableCell>Tipus</TableCell>
                  <TableCell align="right">Arribada (ticks)</TableCell>
                  <TableCell align="right">Durada (ticks)</TableCell>
                  <TableCell align="right">Prioritat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.id}</TableCell>
                    <TableCell>{task.type}</TableCell>
                    <TableCell align="right">{task.arrivalTime}</TableCell>
                    <TableCell align="right">{task.serviceDuration}</TableCell>
                    <TableCell align="right">{task.initialPriority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {saveRequest.isError && (
            <Alert severity="error">{saveRequest.error.message}</Alert>
          )}
          <Button
            variant="contained"
            onClick={() => saveRequest.mutate(preview)}
            disabled={saveRequest.isPending}
          >
            {saveRequest.isPending ? 'Desant…' : 'Desa aquest escenari'}
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
