import { z } from 'zod';

// Reminder validations
export const createReminderSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  space: z.enum(['projetos', 'pessoal', 'arquivo']).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)').nullable().optional(),
  priority: z.enum(['HIGH', 'MED', 'LOW']).nullable().optional(),
});

export const updateReminderSchema = z.object({
  id: z.string().uuid('ID inválido'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo').optional(),
  description: z.string().max(5000, 'Descrição muito longa').nullable().optional(),
  priority: z.enum(['HIGH', 'MED', 'LOW']).nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)').nullable().optional(),
});

export const toggleReminderSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const deleteReminderSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Subtask validations
export const addSubtaskSchema = z.object({
  reminderId: z.string().uuid('ID do lembrete inválido'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
});

export const toggleSubtaskSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Note validations
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  folder: z.enum(['projetos', 'drafts', 'pessoal', 'arquivo']).optional(),
});

export const updateNoteTitleSchema = z.object({
  id: z.string().uuid('ID inválido'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
});

export const updateNoteContentSchema = z.object({
  id: z.string().uuid('ID inválido'),
  content: z.string().max(50000, 'Conteúdo muito longo'),
});

export const updateNoteCoverSchema = z.object({
  id: z.string().uuid('ID inválido'),
  coverKind: z.enum(['image', 'checklist', 'quote', 'code']).nullable().optional(),
  coverFileId: z.string().uuid('ID do arquivo inválido').nullable().optional(),
});

export const addNoteTagSchema = z.object({
  id: z.string().uuid('ID inválido'),
  tag: z.string().min(1, 'Tag é obrigatória').max(50, 'Tag muito longa'),
});

export const deleteNoteSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const moveNoteToFolderSchema = z.object({
  id: z.string().uuid('ID inválido'),
  folder: z.enum(['projetos', 'drafts', 'pessoal', 'arquivo']),
});

// Event validations
export const createEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  timeLabel: z.string().max(100, 'Horário muito longo').nullable().optional(),
  variant: z.enum(['dark', 'light']).optional(),
});

export const deleteEventSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// File validations
export const createFileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  url: z.string().url('URL inválida'),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório'),
  size: z.number().int().positive('Tamanho deve ser positivo').max(10 * 1024 * 1024, 'Arquivo muito grande (máx. 10MB)'),
  key: z.string().optional(),
});

export const deleteFileSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Auth validations
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});