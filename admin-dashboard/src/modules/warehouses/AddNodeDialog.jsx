import { useForm } from 'react-hook-form';
import { TextField, Stack } from '@mui/material';
import { FormDialog } from '../../components/FormDialog';

export function AddNodeDialog({ open, onClose, title, onSubmit, loading, withCapacity = false }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { code: '', name: '', capacity: '' } });

  const submit = handleSubmit((values) => {
    onSubmit({
      code: values.code,
      name: values.name || undefined,
      ...(withCapacity && values.capacity ? { capacity: Number(values.capacity) } : {}),
    });
    reset();
  });

  return (
    <FormDialog open={open} title={title} onClose={onClose} onSubmit={submit} loading={loading} maxWidth="xs">
      <Stack spacing={2}>
        <TextField label="Code" placeholder="e.g. A, 2, 12" required autoFocus {...register('code', { required: true })} />
        <TextField label="Name (optional)" {...register('name')} />
        {withCapacity && (
          <TextField label="Capacity (bags)" type="number" placeholder="1" {...register('capacity')} />
        )}
      </Stack>
    </FormDialog>
  );
}
