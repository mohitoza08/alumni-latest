const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const MOBILE_REGEX = /^\d{10}$/;

const CURRENT_YEAR = new Date().getFullYear();

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email too long' };
  }
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain 1 uppercase, 1 lowercase, and 1 number' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' };
  }
  return { valid: true };
};

export const validatePasswordStrength = (password: string): { score: number; level: string; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, level: 'none', feedback: ['Password is required'] };
  }

  if (password.length >= 8) score += 1;
  else feedback.push('At least 8 characters');

  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  let level: string;
  if (score <= 1) level = 'weak';
  else if (score <= 3) level = 'fair';
  else if (score <= 4) level = 'good';
  else level = 'strong';

  return { score, level, feedback: feedback.slice(0, 3) };
};

export const validateMobile = (mobile: string): { valid: boolean; error?: string } => {
  if (!mobile || mobile.trim() === '') {
    return { valid: true }; // Optional field - empty is valid
  }
  const cleaned = mobile.replace(/\D/g, '');
  if (!MOBILE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Mobile must be exactly 10 digits' };
  }
  return { valid: true };
};

export const formatMobile = (mobile: string): string => {
  return mobile.replace(/\D/g, '').slice(0, 10);
};

export const validateGraduationYear = (year: number | string): { valid: boolean; error?: string } => {
  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;
  if (!year || isNaN(yearNum)) {
    return { valid: false, error: 'Graduation year is required' };
  }
  if (yearNum < 1950 || yearNum > CURRENT_YEAR) {
    return { valid: false, error: `Graduation year must be between 1950 and ${CURRENT_YEAR}` };
  }
  return { valid: true };
};

export const validateEventDate = (date: string | Date): { valid: boolean; error?: string } => {
  if (!date) {
    return { valid: false, error: 'Event date is required' };
  }
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  if (isNaN(eventDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  if (eventDate <= now) {
    return { valid: false, error: 'Event date must be in the future' };
  }
  return { valid: true };
};

export const validateCampaignDeadline = (deadline: string | Date): { valid: boolean; error?: string } => {
  if (!deadline) {
    return { valid: false, error: 'Campaign deadline is required' };
  }
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  if (isNaN(deadlineDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  if (deadlineDate <= now) {
    return { valid: false, error: 'Campaign deadline must be in the future' };
  }
  return { valid: true };
};

export const validateDateRange = (
  startDate: string | Date,
  endDate: string | Date
): { valid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Both start and end dates are required' };
  }
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  if (start < now && start < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)) {
    return { valid: false, error: 'Start date cannot be too far in the past' };
  }

  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }

  return { valid: true };
};

export const validateFutureDate = (date: string | Date): { valid: boolean; error?: string } => {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  if (isNaN(eventDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  if (eventDate < now) {
    return { valid: false, error: 'Date must be in the future' };
  }
  return { valid: true };
};

export const validatePastOrPresentDate = (date: string | Date): { valid: boolean; error?: string } => {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  if (isNaN(eventDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  if (eventDate > now) {
    return { valid: false, error: 'Date cannot be in the future' };
  }
  return { valid: true };
};

export const validateName = (name: string, fieldName: string = 'Name'): { valid: boolean; error?: string } => {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (name.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  if (name.length > 100) {
    return { valid: false, error: `${fieldName} too long` };
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }
  return { valid: true };
};

export const validateTitle = (title: string): { valid: boolean; error?: string } => {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  if (title.length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters' };
  }
  if (title.length > 200) {
    return { valid: false, error: 'Title too long' };
  }
  return { valid: true };
};

export const validateContent = (content: string, minLength: number = 10): { valid: boolean; error?: string } => {
  if (!content || !content.trim()) {
    return { valid: false, error: 'Content is required' };
  }
  if (content.length < minLength) {
    return { valid: false, error: `Content must be at least ${minLength} characters` };
  }
  if (content.length > 5000) {
    return { valid: false, error: 'Content too long (max 5000 characters)' };
  }
  return { valid: true };
};

export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) {
    return { valid: true };
  }
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const validatePositiveNumber = (
  value: number,
  fieldName: string = 'Amount',
  min: number = 1,
  max?: number
): { valid: boolean; error?: string } => {
  if (value === undefined || value === null || isNaN(value)) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (value < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (max !== undefined && value > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  return { valid: true };
};

export const generateYearOptions = (startYear: number = 1950): { value: string; label: string }[] => {
  const years: { value: string; label: string }[] = [];
  for (let year = CURRENT_YEAR; year >= startYear; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};